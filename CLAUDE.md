# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start server locally (stdio transport - default):**
```bash
npm start                    # Basic start with stdio transport
npm run dev                  # Start with verbose logging and stdio transport
node index.js --verbose=true --file-path=/absolute/path/to/data.json
```

**Start server with HTTP transport:**
```bash
npm run start:http           # Start HTTP server with verbose logging
npm run dev:http             # Start HTTP server on port 3000 with verbose logging
node index.js --transport=http --verbose=true --port=3000 --host=localhost
```

**Transport options:**
```bash
--transport=stdio            # Default: stdin/stdout communication
--transport=http             # HTTP server with session management
--port=3000                  # HTTP server port (default: 3000)
--host=localhost             # HTTP server host (default: localhost)
--cors-origin=*              # CORS allowed origins (default: *)
```

**Testing:**
```bash
npm test                     # Run test setup (creates test files and validates jq)
node test.js                 # Same as above
```

**MCP Inspector (for debugging):**
```bash
npm run inspect:local       # Test local development version
npm run inspect:published   # Test published npm package
```

**Release commands:**
```bash
npm run release:patch       # Increment patch version
npm run release:minor       # Increment minor version
npm run release:major       # Increment major version
```

## Prerequisites

This project requires `jq` binary to be installed on the system:
- **macOS:** `brew install jq`
- **Ubuntu/Debian:** `sudo apt-get install jq`
- **Windows:** `winget install --id=jqlang.jq` or `choco install jq` or `scoop install jq`

The server will auto-detect jq location or you can specify with `--jq-path` argument.

## Architecture Overview

This is a **Model Context Protocol (MCP) server** that provides JSON manipulation tools. Key architectural components:

### Core Files
- `index.js` - Main MCP server implementation with 3 tools: query_json, generate_json_schema, validate_json_schema
- `test.js` - Test setup utility that creates sample data and validates jq installation
- `config.json` - MCP client configuration examples for Claude Desktop

### MCP Server Architecture
The server uses `@modelcontextprotocol/sdk` and supports two transport types:
- **StdioServerTransport** - Communication via stdin/stdout (default)
- **StreamableHTTPServerTransport** - HTTP server with session management for remote clients
- **Three main tools:**
  1. `query_json` - Execute jq queries on JSON files
  2. `generate_json_schema` - Generate JSON schemas using genson-js
  3. `validate_json_schema` - Validate JSON schemas using AJV

### HTTP Transport Features
- **Session Management** - Each client gets a unique session with proper cleanup
- **CORS Support** - Configurable cross-origin resource sharing
- **DNS Rebinding Protection** - Security measures for local server deployment
- **Graceful Shutdown** - Proper cleanup of active sessions on server termination

### Key Dependencies & Their Purpose
- `node-jq` - Wrapper for local jq binary (requires system jq installation)
- `genson-js` - JSON schema generation from sample data
- `ajv` - JSON schema validation
- `@aws-sdk/client-s3` - Optional S3 file synchronization at startup
- `commander` - CLI argument parsing
- `which` - Detect jq binary location
- `express` - HTTP server framework for HTTP transport
- `cors` - Cross-origin resource sharing middleware

### S3 Integration (Optional)
The server supports syncing JSON files from S3 at startup when both `--s3-uri` and `--file-path` are provided. This enables working with remote JSON datasets that get cached locally with smart sync (only downloads if S3 version is newer).

### Security Considerations
- All file paths must be absolute (no relative paths allowed)
- AWS credentials handled via environment variables or standard AWS credential chain
- Sensitive credentials are obfuscated in logs

## Common Development Workflows

**Creating test data:**
```bash
node test.js  # Creates test-data.json and test-schema.json
```

**Testing with MCP Inspector:**
```bash
npm run inspect:local  # Opens web interface to test tools interactively
```

**Debugging server startup:**
```bash
node index.js --verbose=true  # Shows detailed initialization logs (stdio transport)
node index.js --transport=http --verbose=true  # Shows HTTP server startup logs
```

**Working with HTTP transport:**
```bash
# Start HTTP server for remote clients
npm run start:http

# Start with custom port and CORS settings
node index.js --transport=http --port=8080 --cors-origin="https://myapp.com,https://localhost:3000"

# HTTP server runs at: http://localhost:3000/mcp (or your specified host:port)
```

**Working with S3 sync:**
```bash
# Environment variables for AWS credentials
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret

# Works with both transports
node index.js --s3-uri=s3://bucket/file.json --file-path=/local/path.json --aws-region=us-east-1
node index.js --transport=http --s3-uri=s3://bucket/file.json --file-path=/local/path.json
```

## Package Manager
This project uses **pnpm** as specified in package.json (`"packageManager": "pnpm@10.13.1"`).
