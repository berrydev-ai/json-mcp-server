#!/usr/bin/env node

/**
 * JSON MCP Server - A Model Context Protocol server for JSON operations
 *
 * This server provides tools for querying JSON files using jq notation,
 * generating JSON schemas, and validating JSON schemas. It also supports
 * syncing JSON files from S3 buckets.
 *
 * @author JSON MCP Server
 * @version 1.0.0
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  isInitializeRequest,
} from '@modelcontextprotocol/sdk/types.js';
import jq from 'node-jq';
import { createSchema } from 'genson-js';
import Ajv from 'ajv';
import fs, { promises as fsPromises } from 'fs';
import path from 'path';
import { program } from 'commander';
import which from 'which';
import {
  S3Client,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3"
import { createWriteStream } from "fs"
import { Readable } from "stream"
import express from "express"
import cors from "cors"
import { randomUUID } from "crypto"

/**
 * Parse command line arguments using commander
 *
 * Supported options:
 * - --verbose: Enable verbose logging
 * - --file-path: Default file path for JSON operations
 * - --jq-path: Path to local jq binary (auto-detected if not provided)
 * - --s3-uri: S3 URI to sync from (e.g., s3://bucket/key)
 * - --aws-region: AWS region for S3 operations
 * - --transport: Transport type (stdio or http)
 * - --port: Port for HTTP transport (default: 3000)
 * - --host: Host for HTTP transport (default: localhost)
 * - --cors-origin: CORS allowed origins for HTTP transport
 */
program
  .option("--verbose <value>", "Enable verbose logging", "false")
  .option("--file-path <path>", "Default file path for JSON operations")
  .option(
    "--jq-path <path>",
    "Path to local jq binary (auto-detected if not provided)"
  )
  .option("--s3-uri <uri>", "S3 URI to sync from (e.g., s3://bucket/key)")
  .option("--aws-region <region>", "AWS region for S3 operations", "us-east-1")
  .option("--transport <type>", "Transport type: stdio or http", "stdio")
  .option("--port <number>", "Port for HTTP transport", "3000")
  .option("--host <string>", "Host for HTTP transport", "localhost")
  .option("--cors-origin <origins>", "CORS allowed origins (comma-separated)", "*")
  .parse()

/** Extract and define configuration constants from command line options and environment variables */
const options = program.opts()

// Environment variables take precedence over CLI arguments
const VERBOSE = (process.env.VERBOSE || options.verbose) === "true"
const DEFAULT_FILE_PATH = process.env.FILE_PATH || options.filePath
const JQ_PATH = process.env.JQ_PATH || options.jqPath
const S3_URI = process.env.S3_URI || options.s3Uri
const AWS_REGION = process.env.AWS_REGION || options.awsRegion
const TRANSPORT_TYPE = process.env.TRANSPORT || options.transport
const HTTP_PORT = parseInt(process.env.PORT || options.port)
const HTTP_HOST = process.env.HOST || options.host
const CORS_ORIGINS_RAW = process.env.CORS_ORIGIN || options.corsOrigin
const CORS_ORIGINS = CORS_ORIGINS_RAW === "*" ? "*" : CORS_ORIGINS_RAW.split(",")
const LOG_FILE = process.env.LOG_FILE
const MCP_VERSION = process.env.MCP_VERSION
const AUTH_TOKEN = process.env.AUTH_TOKEN
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY


/** Global jq configuration object */
let JQ_CONFIG = {}

/**
 * Logging utility function that outputs to stderr or log file when verbose mode is enabled
 *
 * @param {object|string} options - Logging options with sessionId, or first log argument
 * @param {...any} args - Arguments to log
 */
function log(options, ...args) {
  if (VERBOSE) {
    let sessionId = null
    let logArgs = args

    // Check if first argument is options object with sessionId
    if (typeof options === 'object' && options !== null && !Array.isArray(options)) {
      sessionId = options.sessionId
      // If there are additional args, use them; otherwise options might contain message
      if (args.length === 0 && options.message) {
        logArgs = [options.message]
      }
    } else {
      // First argument is part of the log message
      logArgs = [options, ...args]
    }

    const sessionPrefix = sessionId ? `[${sessionId.slice(0, 8)}]` : ''
    const message = `[JSON-MCP-SERVER]${sessionPrefix} ${logArgs.join(' ')}\n`

    if (LOG_FILE) {
      try {
        fs.appendFileSync(LOG_FILE, message)
      } catch (error) {
        console.error(`Failed to write to log file ${LOG_FILE}:`, error.message)
        // Use appropriate console method based on transport type
        if (TRANSPORT_TYPE === "http") {
          console.log(message.trim())
        } else {
          console.error(message.trim())
        }
      }
    } else {
      // Use console.log for HTTP transport, console.error for stdio transport
      if (TRANSPORT_TYPE === "http") {
        console.log(message.trim())
      } else {
        console.error(message.trim())
      }
    }
  }
}

function logConfiguration() {
  log('Environment Variables:');
  log(`VERBOSE: ${VERBOSE}`);
  log(`DEFAULT_FILE_PATH: ${DEFAULT_FILE_PATH}`);
  log(`JQ_PATH: ${JQ_PATH}`);
  log(`S3_URI: ${S3_URI}`);
  log(`AWS_REGION: ${AWS_REGION}`);
  log(`TRANSPORT_TYPE: ${TRANSPORT_TYPE}`);
  log(`HTTP_PORT: ${HTTP_PORT}`);
  log(`HTTP_HOST: ${HTTP_HOST}`);
  log(`CORS_ORIGINS: ${CORS_ORIGINS}`);
  log(`LOG_FILE: ${LOG_FILE}`);
  log(`MCP_VERSION: ${MCP_VERSION}`);
  log(`AUTH_TOKEN: ${AUTH_TOKEN}`);
  log(`AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}`);
  log(`AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}`);
}

if (VERBOSE && TRANSPORT_TYPE == 'http') {
  logConfiguration()
}

/**
 * Initialize jq with local binary
 *
 * Detects and configures the jq binary path, either from a custom path
 * or by auto-detecting the system installation. Provides helpful error
 * messages with installation instructions if jq is not found.
 *
 * @returns {Promise<boolean>} - True if initialization successful
 * @throws {Error} - If jq binary cannot be found or accessed
 */
async function initializeJq() {
  try {
    let jqPath

    if (JQ_PATH) {
      // Use custom path if provided
      jqPath = JQ_PATH
      log(`Using custom jq path: ${jqPath}`)
    } else {
      // Auto-detect local jq binary
      try {
        jqPath = await which("jq")
        log(`Auto-detected jq at: ${jqPath}`)
      } catch (whichError) {
        // On Windows, try jq.exe if jq fails
        if (process.platform === "win32") {
          try {
            jqPath = await which("jq.exe")
            log(`Auto-detected jq.exe at: ${jqPath}`)
          } catch (exeError) {
            throw whichError // Throw original error
          }
        } else {
          // Try common Alpine Linux path as fallback
          try {
            const commonPath = "/usr/bin/jq"
            await fsPromises.access(commonPath, fs.constants.F_OK)
            jqPath = commonPath
            log(`Found jq at common path: ${jqPath}`)
          } catch (pathError) {
            throw whichError // Throw original which error
          }
        }
      }
    }

    // Verify the binary exists and is accessible
    try {
      await fsPromises.access(jqPath)
      log(`✅ jq binary found and accessible: ${jqPath}`)
    } catch (accessError) {
      throw new Error(`jq binary not accessible: ${jqPath}`)
    }

    // Configure node-jq to use local binary
    JQ_CONFIG = {
      jqPath: jqPath,
      input: "json",
    }

    log("✅ jq binary configured successfully")
    return true
  } catch (error) {
    console.error("❌ Error: Local jq binary not found or not executable")
    console.error("")

    if (process.platform === "win32") {
      console.error("Please install jq on Windows using:")
      console.error("  • Chocolatey: choco install jq")
      console.error("  • Scoop: scoop install jq")
      console.error(
        "  • Manual: Download from https://stedolan.github.io/jq/download/"
      )
      console.error("  • WSL: wsl -e sudo apt-get install jq")
    } else {
      console.error("Please install jq using:")
      console.error("  • macOS: brew install jq")
      console.error("  • Ubuntu/Debian: sudo apt-get install jq")
      console.error("  • CentOS/RHEL: sudo yum install jq")
    }

    console.error("")
    console.error("Or specify a custom path with --jq-path=/path/to/jq")
    if (process.platform === "win32") {
      console.error('Example: --jq-path="C:\\Program Files\\jq\\jq.exe"')
    }
    console.error("")
    console.error(`Detection error: ${error.message}`)
    process.exit(1)
  }
}

/**
 * Load and parse a JSON file from the filesystem
 *
 * @param {string} filePath - Absolute path to the JSON file
 * @returns {Promise<any>} - Parsed JSON data
 * @throws {Error} - If file not found or contains invalid JSON
 */
async function loadJsonFile(filePath) {
  try {
    const fileContent = await fsPromises.readFile(filePath, "utf8")
    return JSON.parse(fileContent)
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`File not found: ${filePath}`)
    } else if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in file: ${filePath} - ${error.message}`)
    }
    throw error
  }
}

/**
 * Validate that a file path is absolute and points to an existing file
 *
 * @param {string} filePath - Path to validate
 * @returns {Promise<string>} - The validated file path
 * @throws {Error} - If path is invalid, not absolute, or file doesn't exist
 */
async function validateFilePath(filePath) {
  if (!filePath) {
    throw new Error("File path is required")
  }

  if (!path.isAbsolute(filePath)) {
    throw new Error("File path must be absolute")
  }

  try {
    await fs.access(filePath)
    const stats = await fsPromises.stat(filePath)
    if (!stats.isFile()) {
      throw new Error("Path must point to a file")
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`File does not exist: ${filePath}`)
    }
    throw error
  }

  return filePath
}

/**
 * Parse an S3 URI into bucket and key components
 *
 * @param {string} s3Uri - S3 URI in format s3://bucket/key
 * @returns {{bucket: string, key: string}} - Parsed bucket and key
 * @throws {Error} - If URI format is invalid
 */
function parseS3Uri(s3Uri) {
  if (!s3Uri.startsWith("s3://")) {
    throw new Error(`Invalid S3 URI format: ${s3Uri}. Must start with 's3://'`)
  }

  const withoutProtocol = s3Uri.slice(5) // Remove 's3://'
  const slashIndex = withoutProtocol.indexOf("/")

  if (slashIndex === -1) {
    throw new Error(
      `Invalid S3 URI format: ${s3Uri}. Must include bucket and key`
    )
  }

  const bucket = withoutProtocol.slice(0, slashIndex)
  const key = withoutProtocol.slice(slashIndex + 1)

  if (!bucket || !key) {
    throw new Error(
      `Invalid S3 URI format: ${s3Uri}. Both bucket and key are required`
    )
  }

  return { bucket, key }
}

/**
 * Get file information from S3 (metadata, existence, last modified, etc.)
 *
 * @param {S3Client} s3Client - Configured S3 client
 * @param {string} bucket - S3 bucket name
 * @param {string} key - S3 object key
 * @returns {Promise<{exists: boolean, lastModified?: Date, etag?: string, size?: number}>} - File info
 * @throws {Error} - If S3 operation fails (excluding NotFound)
 */
async function getS3FileInfo(s3Client, bucket, key) {
  try {
    log(`s3FileConfig bucket: ${bucket}`)
    log(`s3FileConfig key: ${key}`)
    const command = new HeadObjectCommand({ Bucket: bucket, Key: key })
    log(`command: ${command}`)
    const response = await s3Client.send(command)

    return {
      exists: true,
      lastModified: response.LastModified,
      etag: response.ETag,
      size: response.ContentLength,
    }
  } catch (error) {
    log(`Error running getS3FileInfo: ${error.message}`)
    log(`Error name: ${error.name}`)
    log(`HTTP status: ${error.$metadata?.httpStatusCode}`)

    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      return { exists: false }
    }

    // Add more specific error messaging
    if (
      error.name === "NoSuchBucket" ||
      error.$metadata?.httpStatusCode === 404
    ) {
      throw new Error(
        `S3 bucket '${bucket}' does not exist or is not accessible. Please check the bucket name and your AWS permissions.`
      )
    }

    if (
      error.name === "AccessDenied" ||
      error.$metadata?.httpStatusCode === 403
    ) {
      throw new Error(
        `Access denied to S3 bucket '${bucket}' or key '${key}'. Please check your AWS credentials and permissions.`
      )
    }

    throw new Error(`S3 error: ${error.message} (${error.name})`)
  }
}

/**
 * Get file information from local filesystem
 *
 * @param {string} filePath - Path to local file
 * @returns {Promise<{exists: boolean, lastModified?: Date, size?: number}>} - File info
 */
async function getLocalFileInfo(filePath) {
  try {
    const stats = await fsPromises.stat(filePath)
    return {
      exists: true,
      lastModified: stats.mtime,
      size: stats.size,
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      return { exists: false }
    }
    throw error
  }
}

/**
 * Compare S3 and local file information to determine if S3 file is newer
 *
 * @param {object} s3Info - S3 file information
 * @param {object} localInfo - Local file information
 * @returns {boolean} - True if S3 file is newer or local doesn't exist
 */
function isS3FileNewer(s3Info, localInfo) {
  if (!localInfo.exists) {
    return true // Local file doesn't exist, so S3 is "newer"
  }

  if (!s3Info.exists || !s3Info.lastModified || !localInfo.lastModified) {
    return false // Can't compare, assume local is current
  }

  return s3Info.lastModified > localInfo.lastModified
}

/**
 * Download a file from S3 to local filesystem with progress tracking
 *
 * @param {S3Client} s3Client - Configured S3 client
 * @param {string} bucket - S3 bucket name
 * @param {string} key - S3 object key
 * @param {string} localPath - Local file path to save to
 * @returns {Promise<void>}
 * @throws {Error} - If download fails
 */
async function downloadFromS3(s3Client, bucket, key, localPath) {
  try {
    // Ensure local directory exists
    const dir = path.dirname(localPath)
    await fsPromises.mkdir(dir, { recursive: true })

    const command = new GetObjectCommand({ Bucket: bucket, Key: key })
    const response = await s3Client.send(command)

    if (!response.Body) {
      throw new Error("No body in S3 response")
    }

    const writeStream = createWriteStream(localPath)
    const readableStream = response.Body

    return new Promise((resolve, reject) => {
      let downloadedBytes = 0
      const totalBytes = response.ContentLength || 0

      readableStream.on("data", (chunk) => {
        downloadedBytes += chunk.length
        if (VERBOSE && totalBytes > 0) {
          const progress = Math.round((downloadedBytes / totalBytes) * 100)
          log(
            `Downloading: ${progress}% (${downloadedBytes}/${totalBytes} bytes)`
          )
        }
      })

      readableStream.pipe(writeStream)

      writeStream.on("finish", () => {
        log(`✅ Successfully downloaded ${key} to ${localPath}`)
        resolve()
      })

      writeStream.on("error", reject)
      readableStream.on("error", reject)
    })
  } catch (error) {
    throw new Error(`Failed to download from S3: ${error.message}`)
  }
}

/**
 * Sync a file from S3 to local filesystem if S3 version is newer
 *
 * @param {string} s3Uri - S3 URI in format s3://bucket/key
 * @param {string} localPath - Local file path to sync to
 * @returns {Promise<boolean>} - True if file was downloaded, false if already up to date
 * @throws {Error} - If sync operation fails
 */
async function syncFromS3(s3Uri, localPath) {
  try {
    const { bucket, key } = parseS3Uri(s3Uri)

    log(`S3_BUCKET: ${bucket}\n`)
    log(`S3 File Key: ${key}\n`)
    log(`S3 URI: ${S3_URI || "not set"}\n`)
    log(`AWS Region: ${AWS_REGION}\n`)
    log(`AWS Access Key: ${obfuscate(AWS_ACCESS_KEY_ID)}\n`)
    log(`AWS Secret Access Key: ${obfuscate(AWS_SECRET_ACCESS_KEY)}\n`)

    // Initialize S3 client
    const s3Client = new S3Client({
      region: AWS_REGION,
      credentials:
        AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
          ? {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY,
          }
          : undefined, // Let SDK handle credentials (IAM roles, profiles, etc.)
    })

    log(`🔍 Checking sync status for ${s3Uri} -> ${localPath}`)

    // Get file information from both sources
    const [s3Info, localInfo] = await Promise.all([
      getS3FileInfo(s3Client, bucket, key),
      getLocalFileInfo(localPath),
    ])

    if (!s3Info.exists) {
      throw new Error(`S3 file does not exist: ${s3Uri}`)
    }

    // Check if sync is needed
    const needsSync = isS3FileNewer(s3Info, localInfo)

    if (!needsSync) {
      log(`✅ Local file is up to date: ${localPath}`)
      return false
    }

    // Perform sync
    if (localInfo.exists) {
      log(`📥 S3 file is newer, syncing: ${s3Uri} -> ${localPath}`)
    } else {
      log(`📥 Local file does not exist, downloading: ${s3Uri} -> ${localPath}`)
    }

    await downloadFromS3(s3Client, bucket, key, localPath)
    return true
  } catch (error) {
    log(`Message: ${error.message}`)
    log(`Stack trace: ${error.stack}`)
    log(`Name: ${error.name}`)

    throw new Error(`S3 sync failed: ${error.message}`)
  }
}

/**
 * Create the MCP (Model Context Protocol) server instance
 *
 * Configured with tools capability to provide JSON manipulation tools
 */
const server = new Server(
  {
    name: "json-mcp-server",
    version: MCP_VERSION || "1.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

/**
 * Handle ListTools requests
 *
 * Returns the list of available tools with their schemas:
 * - query_json: Query JSON data using jq notation
 * - generate_json_schema: Generate JSON schema from JSON data
 * - validate_json_schema: Validate JSON schema structure
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  log("Listing available tools")

  return {
    tools: [
      {
        name: "query_json",
        description:
          "Query JSON data using jq notation from a specified file path",
        inputSchema: {
          type: "object",
          properties: {
            filePath: {
              type: "string",
              description: "Absolute path to the JSON file to query",
            },
            query: {
              type: "string",
              description:
                'jq query string (e.g., ".key", ".[0].name", ".[] | select(.status == \\"active\\")")',
            },
          },
          required: ["query"],
          additionalProperties: false,
        },
      },
      {
        name: "generate_json_schema",
        description: "Generate a JSON schema from a JSON file",
        inputSchema: {
          type: "object",
          properties: {
            filePath: {
              type: "string",
              description: "Absolute path to the JSON file to analyze",
            },
          },
          required: [],
          additionalProperties: false,
        },
      },
      {
        name: "validate_json_schema",
        description: "Validate that a JSON schema is properly formed and valid",
        inputSchema: {
          type: "object",
          properties: {
            schema: {
              type: "object",
              description: "The JSON schema object to validate",
            },
            schemaFilePath: {
              type: "string",
              description:
                "Path to a JSON file containing the schema to validate",
            },
          },
          additionalProperties: false,
        },
      },
    ],
  }
})

/**
 * Handle CallTool requests
 *
 * Executes the requested tool with provided arguments and returns results.
 * Supports query_json, generate_json_schema, and validate_json_schema tools.
 *
 * @param {object} request - The tool call request
 * @returns {Promise<object>} - Tool execution result
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  log(`Tool called: ${name}`, args)

  try {
    switch (name) {
      case "query_json": {
        const filePath = await validateFilePath(
          args.filePath || DEFAULT_FILE_PATH
        )
        const { query } = args

        if (!query) {
          throw new Error("Query parameter is required")
        }

        log(`Querying JSON file: ${filePath} with query: ${query}`)

        try {
          // Load JSON data
          const jsonData = await loadJsonFile(filePath)
          log("JSON file loaded successfully")

          // Execute jq query using local binary
          const result = await jq.run(query, jsonData, JQ_CONFIG)
          log("jq query executed successfully")

          return {
            content: [
              {
                type: "text",
                text: `Query result:\n${JSON.stringify(result, null, 2)}`,
              },
            ],
          }
        } catch (jqError) {
          log("jq query error:", jqError.message)
          throw new Error(`jq query failed: ${jqError.message}`)
        }
      }

      case "generate_json_schema": {
        const filePath = await validateFilePath(
          args.filePath || DEFAULT_FILE_PATH
        )

        log(`Generating schema for: ${filePath}`)

        try {
          // Load JSON data
          const jsonData = await loadJsonFile(filePath)
          log("JSON file loaded for schema generation")

          // Generate schema using genson
          const schema = createSchema(jsonData)
          log("Schema generated successfully")

          return {
            content: [
              {
                type: "text",
                text: `Generated JSON Schema:\n${JSON.stringify(
                  schema,
                  null,
                  2
                )}`,
              },
            ],
          }
        } catch (error) {
          log("Schema generation error:", error.message)
          throw new Error(`Schema generation failed: ${error.message}`)
        }
      }

      case "validate_json_schema": {
        let schema

        if (args.schema) {
          schema = args.schema
          log("Using provided schema object")
        } else if (args.schemaFilePath) {
          const schemaPath = await validateFilePath(args.schemaFilePath)
          log(`Loading schema from file: ${schemaPath}`)
          schema = await loadJsonFile(schemaPath)
        } else {
          throw new Error(
            'Either "schema" object or "schemaFilePath" must be provided'
          )
        }

        log("Validating JSON schema")

        try {
          // Create AJV instance for validation
          const ajv = new Ajv({ strict: false })

          // Try to compile the schema - this validates it
          const validate = ajv.compile(schema)
          log("Schema validation successful")

          return {
            content: [
              {
                type: "text",
                text: `✅ JSON Schema is valid!\n\nSchema summary:\n- Type: ${schema.type || "not specified"
                  }\n- Properties: ${schema.properties
                    ? Object.keys(schema.properties).length
                    : "none"
                  }\n- Required fields: ${schema.required ? schema.required.length : 0
                  }\n\nFull validated schema:\n${JSON.stringify(
                    schema,
                    null,
                    2
                  )}`,
              },
            ],
          }
        } catch (validationError) {
          log("Schema validation error:", validationError.message)

          return {
            content: [
              {
                type: "text",
                text: `❌ JSON Schema is invalid!\n\nError: ${validationError.message
                  }\n\nProvided schema:\n${JSON.stringify(schema, null, 2)}`,
              },
            ],
          }
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (error) {
    log("Tool execution error:", error.message)

    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    }
  }
})

/**
 * Obfuscate sensitive strings for logging (shows first 3 and last 3 characters)
 *
 * @param {string} str - String to obfuscate
 * @returns {string} - Obfuscated string or "not set" if empty
 */
const obfuscate = (str) => {
  if (!str) return "not set"
  if (str.length <= 6) return str
  return str.slice(0, 3) + "..." + str.slice(-3)
}

/**
 * Setup and start HTTP server with streamable HTTP transport
 *
 * @param {Server} mcpServer - The MCP server instance
 * @returns {Promise<void>}
 */
async function startHttpServer(mcpServer) {
  const app = express()

  // Configure CORS
  app.use(cors({
    origin: CORS_ORIGINS,
    exposedHeaders: ['Mcp-Session-Id'],
    allowedHeaders: ['Content-Type', 'mcp-session-id'],
  }))

  app.use(express.json())

  // Health check endpoint for Docker
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      service: 'json-mcp-server',
      version: MCP_VERSION || "1.1.0",
      transport: 'http'
    })
  })

  // Map to store transports by session ID
  const transports = {}

  // Authentication middleware for AUTH_TOKEN
  const authenticate = (req, res, next) => {
    if (!AUTH_TOKEN) {
      // No authentication required if AUTH_TOKEN not set
      return next()
    }

    const authHeader = req.headers.authorization
    const tokenParam = req.query.token

    let providedToken = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      providedToken = authHeader.slice(7)
    } else if (tokenParam) {
      providedToken = tokenParam
    }

    if (providedToken !== AUTH_TOKEN) {
      log('Authentication failed - invalid or missing token')
      return res.status(401).json({
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: 'Authentication required. Provide valid Bearer token in Authorization header or token query parameter.',
        },
        id: null,
      })
    }

    next()
  }

  // Handle POST requests for client-to-server communication
  app.post('/mcp', authenticate, async (req, res) => {
    try {
      // Check for existing session ID
      const sessionId = req.headers['mcp-session-id']
      let transport

      if (sessionId && transports[sessionId]) {
        // Reuse existing transport
        transport = transports[sessionId]
      } else if (!sessionId && isInitializeRequest(req.body)) {
        // New initialization request
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sessionId) => {
            // Store the transport by session ID
            transports[sessionId] = transport
          },
          // Enable DNS rebinding protection for local servers
          enableDnsRebindingProtection: true,
          allowedHosts: [HTTP_HOST, '127.0.0.1', 'localhost', `${HTTP_HOST}:${HTTP_PORT}`, `127.0.0.1:${HTTP_PORT}`, `localhost:${HTTP_PORT}`],
        })

        // Clean up transport when closed
        transport.onclose = () => {
          if (transport.sessionId) {
            delete transports[transport.sessionId]
            log({ sessionId: transport.sessionId }, `Session cleaned up`)
          }
        }

        // Connect to the MCP server
        await mcpServer.connect(transport)
      } else {
        // Invalid request
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: No valid session ID provided',
          },
          id: null,
        })
        return
      }

      // Handle the request
      await transport.handleRequest(req, res, req.body)
    } catch (error) {
      log('Error handling MCP request:', error)
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        })
      }
    }
  })

  // Reusable handler for GET and DELETE requests
  const handleSessionRequest = async (req, res) => {
    const sessionId = req.headers['mcp-session-id']
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID')
      return
    }

    const transport = transports[sessionId]
    await transport.handleRequest(req, res)
  }

  // Handle GET requests for server-to-client notifications via SSE
  app.get('/mcp', authenticate, handleSessionRequest)

  // Handle DELETE requests for session termination
  app.delete('/mcp', authenticate, handleSessionRequest)

  // Start the HTTP server
  return new Promise((resolve, reject) => {
    const httpServer = app.listen(HTTP_PORT, HTTP_HOST, (error) => {
      if (error) {
        reject(new Error(`Failed to start HTTP server: ${error.message}`))
      } else {
        console.error(`✅ JSON MCP Server (HTTP) listening on http://${HTTP_HOST}:${HTTP_PORT}/mcp`)
        log(`Server started with ${Object.keys(transports).length} active sessions`)
        resolve()
      }
    })

    // Handle server shutdown gracefully
    process.on('SIGINT', () => {
      log('Shutting down HTTP server...')
      // Close all active transports
      Object.values(transports).forEach(transport => {
        if (transport && typeof transport.close === 'function') {
          transport.close()
        }
      })
      httpServer.close(() => {
        process.exit(0)
      })
    })
  })
}

/**
 * Main function to start the JSON MCP Server
 *
 * Initializes jq, performs S3 sync if configured, and starts the MCP server
 * with either stdio or HTTP transport for communication.
 *
 * @returns {Promise<void>}
 */
async function main() {
  log("Starting JSON MCP Server...")
  log("Verbose mode:", VERBOSE)
  log("Transport type:", TRANSPORT_TYPE)
  log("Default file path:", DEFAULT_FILE_PATH || "not set")

  if (TRANSPORT_TYPE === "http") {
    log("HTTP Host:", HTTP_HOST)
    log("HTTP Port:", HTTP_PORT)
    log("CORS Origins:", Array.isArray(CORS_ORIGINS) ? CORS_ORIGINS.join(", ") : CORS_ORIGINS)
  }

  // Initialize jq with local binary
  await initializeJq()

  // Perform S3 sync if S3_URI is provided
  if (S3_URI && DEFAULT_FILE_PATH) {
    try {
      log(`🌊 Starting S3 sync process for ${S3_URI}`)
      const wasDownloaded = await syncFromS3(S3_URI, DEFAULT_FILE_PATH)

      if (wasDownloaded) {
        console.error(
          `✅ File synchronized from S3: ${path.basename(DEFAULT_FILE_PATH)}`
        )
      } else {
        console.error(
          `✅ Local file is already up to date: ${path.basename(
            DEFAULT_FILE_PATH
          )}`
        )
      }
    } catch (error) {
      console.error(`❌ S3 sync failed: ${error.message}`)
      console.error(
        "⚠️  Continuing with server startup - will use existing local files if available"
      )
    }
  } else if (S3_URI && !DEFAULT_FILE_PATH) {
    console.error(
      "⚠️  S3 URI provided but no --file-path specified. Skipping S3 sync."
    )
  }

  // Start server with appropriate transport
  if (TRANSPORT_TYPE === "http") {
    log(`Starting HTTP transport on ${HTTP_HOST}:${HTTP_PORT}`)
    await startHttpServer(server)
  } else if (TRANSPORT_TYPE === "stdio") {
    log("Starting stdio transport")
    const transport = new StdioServerTransport()
    await server.connect(transport)
    log("Server connected and ready")
  } else {
    throw new Error(`Unknown transport type: ${TRANSPORT_TYPE}. Use "stdio" or "http"`)
  }
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
