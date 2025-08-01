# JSON MCP Server

Node.js server implementing Model Context Protocol (MCP) for JSON operations.

## Features

- Query JSON files using jq notation with complex filters and transformations
- Generate JSON schemas automatically from existing JSON data
- Validate JSON schemas to ensure they are properly formed
- S3 sync support for remote JSON file synchronization
- Support for both stdio and HTTP transport protocols

**Note**: The server requires `jq` binary to be installed on your system and will only allow operations on files with absolute paths.

## Prerequisites

**🚨 Required: Install jq binary on your system**

**macOS:**
```bash
brew install jq
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install jq

# CentOS/RHEL/Fedora
sudo yum install jq  # or sudo dnf install jq

# Arch Linux
sudo pacman -S jq
```

**Windows:**

### Winget (recommended)
```powershell

# Winget (recommended)
winget install --id=jqlang.jq

# Chocolatey
choco install jq

# Scoop
scoop instal jq
```

**Verify installation:**
```bash
jq --version
# Should output something like: jq-1.6
```

## API

### Resources

- `file://json`: JSON file operations interface

### Tools

- **query_json**
  - Execute jq queries on JSON files with complex filters and transformations
  - Input:
    - `filePath` (string, optional if default set): Absolute path to JSON file
    - `query` (string): jq query expression
  - Example queries:
    - `"."` - Return entire JSON (not recommended)
    - `".users"` - Get users array
    - `".users[0].name"` - Get first user's name
    - `".users[] | select(.active == true)"` - Filter active users
    - `".[].price | add"` - Sum all prices

- **generate_json_schema**
  - Generate JSON schemas automatically from existing JSON data using genson-js
  - Input: `filePath` (string, optional if default set): Absolute path to JSON file
  - Returns: Complete JSON schema that describes the structure of your data

- **validate_json_schema**
  - Validate that JSON schemas are properly formed using AJV
  - Input:
    - `schema` (object): JSON schema object to validate, OR
    - `schemaFilePath` (string): Path to file containing JSON schema
  - Returns: Validation result with detailed feedback

## Usage with Claude Desktop

Add this to your `claude_desktop_config.json`:

### NPX (Recommended)

**Stdio Transport (Default):**
```json
{
  "mcpServers": {
    "json-mcp-server": {
      "command": "npx",
      "args": [
        "-y",
        "@berrydev-ai/json-mcp-server",
        "--verbose=true",
        "--file-path=/absolute/path/to/your/data.json"
      ]
    }
  }
}
```

**HTTP Transport:**
```json
{
  "mcpServers": {
    "json-mcp-server": {
      "command": "npx",
      "args": [
        "-y",
        "@berrydev-ai/json-mcp-server",
        "--transport=http",
        "--port=3000",
        "--verbose=true",
        "--file-path=/absolute/path/to/your/data.json"
      ]
    }
  }
}
```

### Local Development

**Stdio Transport:**
```json
{
  "mcpServers": {
    "json-mcp-server": {
      "command": "node",
      "args": [
        "/path/to/json-mcp-server/index.js",
        "--verbose=true",
        "--file-path=/absolute/path/to/your/data.json"
      ]
    }
  }
}
```

**HTTP Transport:**
```json
{
  "mcpServers": {
    "json-mcp-server": {
      "command": "node",
      "args": [
        "/path/to/json-mcp-server/index.js",
        "--transport=http",
        "--port=3000",
        "--host=localhost",
        "--verbose=true",
        "--file-path=/absolute/path/to/your/data.json"
      ]
    }
  }
}
```

### With S3 Sync (Optional)

```json
{
  "mcpServers": {
    "json-mcp-server": {
      "command": "npx",
      "args": [
        "-y",
        "@berrydev-ai/json-mcp-server",
        "--s3-uri=s3://your-bucket/data.json",
        "--file-path=/absolute/path/to/local-data.json",
        "--aws-region=us-east-1",
        "--verbose=true"
      ],
      "env": {
        "AWS_ACCESS_KEY_ID": "your-access-key-id",
        "AWS_SECRET_ACCESS_KEY": "your-secret-access-key"
      }
    }
  }
}
```

## Command Line Usage

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

## Build

**NPM Installation:**
```bash
npm install -g @berrydev-ai/json-mcp-server
```

**Local Development:**
```bash
git clone https://github.com/berrydev-ai/json-mcp-server.git
cd json-mcp-server
npm install
```

## Dependencies

- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `node-jq`: Node.js wrapper for jq binary (requires system jq installation)
- `genson-js`: JSON schema generation
- `ajv`: JSON schema validation
- `commander`: Command line argument parsing
- `which`: Binary path detection utility
- `@aws-sdk/client-s3`: AWS S3 client for optional file synchronization
- `express`: HTTP server framework for HTTP transport
- `cors`: Cross-origin resource sharing middleware

## Example JSON Data

Create a test file `test-data.json`:

```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "active": true,
      "roles": ["user", "admin"]
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "active": false,
      "roles": ["user"]
    }
  ],
  "metadata": {
    "version": "1.0",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

## License

This MCP server is licensed under the ISC License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the ISC License. For more details, please see the LICENSE file in the project repository.
