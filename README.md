# JSON MCP Server

A Model Context Protocol (MCP) server that provides powerful JSON manipulation tools using `node-jq` with a locally installed `jq` binary, native Node.js fs operations, and `genson-js`.

## Prerequisites

**🚨 Required: Install jq binary on your system**

**Windows:**
```powershell
# Chocolatey (recommended)
choco install jq

# Scoop
scoop install jq

# Manual download
# Download jq.exe from https://stedolan.github.io/jq/download/
# Place in PATH or use --jq-path parameter

# WSL (if using Windows Subsystem for Linux)
wsl -e sudo apt-get install jq
```

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

**Verify installation:**
```bash
# Windows (Command Prompt or PowerShell)
jq --version

# Unix/Linux/macOS
jq --version
# Should output something like: jq-1.6
```

## Features

- **Query JSON**: Use jq notation to query JSON files with complex filters and transformations
- **Generate JSON Schema**: Automatically generate JSON schemas from existing JSON data
- **Validate JSON Schema**: Ensure that JSON schemas are properly formed and valid
- **S3 Sync**: Automatically sync JSON files from AWS S3 at startup with smart caching

## Installation

1. Clone or create the project directory:
```bash
mkdir json-mcp-server
cd json-mcp-server
```

2. Save the provided files (`index.js`, `package.json`) in this directory

3. Clean install dependencies:
```bash
# Clean any existing installations first
npm run clean  # or manually: rm -rf node_modules package-lock.json
npm install
```

4. Make the script executable (Unix/Linux/macOS):
```bash
chmod +x index.js
```

## Claude Desktop Installation

### Basic Configuration

**Mac/Linux**:

```json
{
  "mcpServers": {
    "json-mcp-server": {
      "command": "node",
      "args": [
        "/path/to/index.js",
        "--verbose=true",
        "--file-path=/path/to/file.json",
        "--jq-path=/path/to/jq"
      ]
    }
  }
}
```

**Windows**:

```json
{
  "mcpServers": {
    "json-mcp-server": {
      "command": "node",
      "args": [
        "C:\\path\\to\\index.js",
        "--verbose=true",
        "--file-path=C:\\path\\to\\file.json",
        "--jq-path=C:\\path\\to\\jq.exe"
      ]
    }
  }
}
```

### Configuration with S3 Sync (Optional)

To enable automatic S3 synchronization, add AWS credentials and S3 parameters. **Note**: S3 sync only runs when both `--s3-uri` and `--file-path` arguments are provided:

```json
{
  "mcpServers": {
    "json-mcp-server": {
      "command": "node",
      "args": [
        "/path/to/index.js",
        "--verbose=true",
        "--file-path=/absolute/path/to/local-data.json",
        "--s3-uri=s3://your-bucket-name/path/to/data.json",
        "--aws-region=us-east-1"
      ],
      "env": {
        "AWS_ACCESS_KEY_ID": "your-access-key-id",
        "AWS_SECRET_ACCESS_KEY": "your-secret-access-key",
        "AWS_REGION": "us-east-1"
      }
    }
  }
}
```

## Usage

### Command Line Arguments

- `--verbose=true`: Enable verbose logging (default: false)
- `--file-path=/path/to/file.json`: Set a default file path for operations (optional)
- `--jq-path=/path/to/jq`: Specify custom jq binary path (auto-detected if not provided)
- `--s3-uri=s3://bucket/key`: S3 URI to sync from at startup (optional)
- `--aws-region=region`: AWS region for S3 operations (default: us-east-1)

### Starting the Server

**Windows (Command Prompt):**
```cmd
REM Basic usage (auto-detects jq)
node index.js

REM With verbose logging
node index.js --verbose=true

REM With default file path (use forward slashes or escape backslashes)
node index.js --verbose=true --file-path=C:/Users/username/data.json

REM With custom jq binary path
node index.js --verbose=true --jq-path="C:\Program Files\jq\jq.exe"
```

**Windows (PowerShell):**
```powershell
# Basic usage
node index.js

# With verbose logging
node index.js --verbose=true

# With default file path
node index.js --verbose=true --file-path="C:\Users\username\data.json"

# With custom jq binary path
node index.js --verbose=true --jq-path="C:\Program Files\jq\jq.exe"
```

**Unix/Linux/macOS:**
```bash
# Basic usage (auto-detects jq)
node index.js

# With verbose logging
node index.js --verbose=true

# With default file path
node index.js --verbose=true --file-path=/home/user/data.json

# With custom jq binary path
node index.js --verbose=true --jq-path=/usr/local/bin/jq

# With S3 sync (requires AWS credentials in environment)
node index.js --verbose=true --file-path=/home/user/data.json --s3-uri=s3://my-bucket/data.json --aws-region=us-west-2
```

**Using npm scripts (all platforms):**
```bash
npm start
npm run dev  # with verbose logging
```

# 🪟 Windows Setup Guide for JSON MCP Server

## Windows-Specific Installation

### Option 1: Chocolatey (Recommended)
```powershell
# Install Chocolatey if not already installed
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install jq
choco install jq

# Verify installation
jq --version
```

### Option 2: Scoop
```powershell
# Install Scoop if not already installed
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install jq
scoop install jq

# Verify installation
jq --version
```

### Option 3: Manual Installation
1. Go to https://stedolan.github.io/jq/download/
2. Download `jq-win64.exe` or `jq-win32.exe`
3. Rename to `jq.exe`
4. Place in a directory in your PATH, or use `--jq-path` parameter

### Option 4: WSL (Windows Subsystem for Linux)
```bash
# In WSL terminal
sudo apt-get update
sudo apt-get install jq

# Then run the MCP server from WSL
```

## Windows-Specific Issues and Solutions

### Issue 1: "jq not found" Error
**Symptoms:**
```
❌ Error: Local jq binary not found or not executable
```

**Solutions:**
1. **Check if jq is installed:**
   ```cmd
   jq --version
   ```

2. **Check PATH:**
   ```cmd
   where jq
   ```

3. **If jq.exe specifically:**
   ```cmd
   jq.exe --version
   where jq.exe
   ```

4. **Use custom path:**
   ```cmd
   node index.js --jq-path="C:\ProgramData\chocolatey\bin\jq.exe"
   ```

### Issue 2: PowerShell Execution Policy
**Symptoms:**
```
cannot be loaded because running scripts is disabled on this system
```

**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue 3: Antivirus Blocking jq.exe
**Symptoms:**
- jq installs but doesn't run
- "Access denied" errors

**Solutions:**
1. Add jq.exe to antivirus exclusions
2. Use Windows Defender exclusions:
   - Settings → Update & Security → Windows Security → Virus & threat protection
   - Add exclusion for jq.exe location

### Issue 4: Path with Spaces
**Symptoms:**
```
Error: ENOENT: no such file or directory
```

**Solution:**
Always quote paths with spaces:
```cmd
node index.js --jq-path="C:\Program Files\jq\jq.exe"
```

## Windows File Path Formats

The MCP server accepts multiple Windows path formats:

```cmd
REM Forward slashes (recommended)
--file-path=C:/Users/username/data.json

REM Backslashes (escape in quotes)
--file-path="C:\Users\username\data.json"

REM UNC paths
--file-path="\\server\share\data.json"
```

## Testing on Windows

1. **Open Command Prompt or PowerShell as regular user** (not Administrator unless needed)

2. **Navigate to your project directory:**
   ```cmd
   cd C:\path\to\json-mcp-server
   ```

3. **Install dependencies:**
   ```cmd
   npm install
   ```

4. **Create test data:**
   ```cmd
   node test.js
   ```

5. **Start the server:**
   ```cmd
   node index.js --verbose=true
   ```

6. **Expected output:**
   ```
   [JSON-MCP-SERVER] Starting JSON MCP Server...
   [JSON-MCP-SERVER] Auto-detected jq at: C:\ProgramData\chocolatey\bin\jq.exe
   [JSON-MCP-SERVER] ✅ jq binary found and accessible: C:\ProgramData\chocolatey\bin\jq.exe
   [JSON-MCP-SERVER] ✅ jq binary configured successfully
   [JSON-MCP-SERVER] Server connected and ready
   ```

## Windows Development Tips

### Use Windows Terminal
- Better than Command Prompt
- Supports Unicode output
- Multiple tabs

### PowerShell vs Command Prompt
- Both should work
- PowerShell has better error messages
- Command Prompt is more compatible with older systems

### Long Path Support
If you encounter path length issues:
```cmd
REM Enable long path support (requires Admin)
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

## Environment Variables

You can set default paths using environment variables:

**Command Prompt:**
```cmd
set JQ_PATH=C:\tools\jq\jq.exe
set DEFAULT_JSON_PATH=C:\data\default.json
node index.js --verbose=true
```

**PowerShell:**
```powershell
$env:JQ_PATH = "C:\tools\jq\jq.exe"
$env:DEFAULT_JSON_PATH = "C:\data\default.json"
node index.js --verbose=true
```

## Common Windows jq Installation Paths

After installation, jq is typically found at:

- **Chocolatey:** `C:\ProgramData\chocolatey\bin\jq.exe`
- **Scoop:** `C:\Users\{username}\scoop\apps\jq\current\jq.exe`
- **Manual:** Wherever you placed it
- **WSL:** `/usr/bin/jq` (inside WSL)

The MCP server will auto-detect these common locations! 🎉

## Tools

### 1. query_json

Query JSON data using jq notation.

**Parameters:**
- `filePath` (string, optional if default set): Absolute path to JSON file
- `query` (string, required): jq query expression

**Example queries:**
- `"."` - Return entire JSON
- `".users"` - Get users array
- `".users[0].name"` - Get first user's name
- `".users[] | select(.active == true)"` - Filter active users
- `".[].price | add"` - Sum all prices

### 2. generate_json_schema

Generate a JSON schema from a JSON file using genson-js.

**Parameters:**
- `filePath` (string, optional if default set): Absolute path to JSON file

**Output:** Complete JSON schema that describes the structure of your data.

### 3. validate_json_schema

Validate that a JSON schema is properly formed.

**Parameters:**
- `schema` (object): JSON schema object to validate, OR
- `schemaFilePath` (string): Path to file containing JSON schema

**Output:** Validation result with detailed feedback.

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

## Example Usage with MCP Client

Once connected to an MCP client, you can use the tools like this:

### Query Examples
```javascript
// Get all active users
query_json({
  filePath: "/absolute/path/to/test-data.json",
  query: ".users[] | select(.active == true)"
})

// Get user emails
query_json({
  filePath: "/absolute/path/to/test-data.json",
  query: ".users[].email"
})

// Count total users
query_json({
  filePath: "/absolute/path/to/test-data.json",
  query: ".users | length"
})
```

### Schema Generation
```javascript
generate_json_schema({
  filePath: "/absolute/path/to/test-data.json"
})
```

### Schema Validation
```javascript
validate_json_schema({
  schema: {
    "type": "object",
    "properties": {
      "name": {"type": "string"}
    },
    "required": ["name"]
  }
})
```

## Error Handling

The server provides detailed error messages for:
- Invalid file paths
- Malformed jq queries
- Invalid JSON data
- Schema validation errors
- File access issues

## Requirements

- Node.js >= 18.0.0
- Access to the file system for reading JSON files
- Files must use absolute paths for security

## S3 Sync Feature (Optional)

The server can automatically synchronize JSON files from AWS S3 at startup when the `--s3-uri` argument is provided. This feature:

- **Smart Sync**: Only downloads if S3 file is newer than local file or local file doesn't exist
- **Startup Integration**: Sync happens before server connection, ensuring fresh data
- **Error Recovery**: Server continues startup even if S3 sync fails
- **Progress Reporting**: Shows download progress in verbose mode

### AWS Credentials Configuration

The server supports multiple AWS credential methods:

1. **Environment Variables** (recommended for Claude Desktop):
   ```bash
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   AWS_REGION=us-east-1
   ```

2. **AWS Profile**: Uses default AWS profile or AWS CLI configuration
3. **IAM Roles**: For EC2 instances or containerized environments
4. **AWS SSO**: Single sign-on credentials

### S3 Usage Examples

```bash
# Basic S3 sync
node index.js --s3-uri="s3://my-bucket/data.json" --file-path="/absolute/path/to/data.json"

# With verbose logging
node index.js --s3-uri="s3://my-bucket/data.json" --file-path="/path/to/data.json" --verbose=true

# Custom AWS region
node index.js --s3-uri="s3://my-bucket/data.json" --file-path="/path/to/data.json" --aws-region="eu-west-1"
```

## Dependencies

- `@modelcontextprotocol/sdk`: MCP protocol implementation (latest v1.x)
- `node-jq`: Node.js wrapper for jq binary (uses your local jq installation)
- `genson-js`: JSON schema generation
- `ajv`: JSON schema validation
- `commander`: Command line argument parsing
- `which`: Binary path detection utility
- `@aws-sdk/client-s3`: AWS S3 client for file synchronization

## Troubleshooting

### jq Binary Issues

If you get "jq binary not found" errors:

**Windows:**
1. **Install jq**: Follow the prerequisites section above
2. **Check PATH**: Ensure jq is in your system PATH
   ```cmd
   where jq
   REM Should show path like: C:\ProgramData\chocolatey\bin\jq.exe
   ```
3. **Try jq.exe**: Some Windows installations use `jq.exe`
   ```cmd
   jq.exe --version
   ```
4. **Custom path**: Use `--jq-path` if jq is in a non-standard location
   ```cmd
   node index.js --jq-path="C:\tools\jq\jq.exe"
   ```

**Unix/Linux/macOS:**
1. **Install jq**: Follow the prerequisites section above
2. **Check PATH**: Ensure jq is in your system PATH
   ```bash
   which jq  # Should show path like /usr/local/bin/jq
   ```
3. **Custom path**: Use `--jq-path` if jq is in a non-standard location
   ```bash
   node index.js --jq-path=/custom/path/to/jq
   ```

### Dependency Issues

If you encounter dependency issues:

1. **Clean install**:
   ```bash
   npm run clean
   npm install
   ```

2. **Node version**: Ensure you're using Node.js >= 18.0.0
   ```bash
   node --version
   ```

3. **Clear npm cache**:
   ```bash
   npm cache clean --force
   ```

### S3 Sync Issues

If you encounter S3 sync errors:

1. **Check AWS credentials**: Ensure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set
2. **Verify bucket name**: Ensure the S3 bucket name is correct and accessible
3. **Check permissions**: Ensure your AWS credentials have read access to the S3 bucket
4. **Verify region**: Ensure the AWS region matches your bucket's region
5. **Check file path**: Ensure the local file path is absolute and the directory exists

Common S3 errors:
- `NoSuchBucket`: The bucket name is incorrect or doesn't exist
- `AccessDenied`: Your AWS credentials lack permission to access the bucket
- `NotFound`: The specified S3 key (file path) doesn't exist in the bucket

### Permission Issues

**Windows:**
- Usually no permission changes needed
- If you get access denied errors, run Command Prompt or PowerShell as Administrator
- Ensure jq.exe is not blocked by antivirus software

**Unix/Linux/macOS:**
If you get permission errors:
```bash
chmod +x index.js
# And ensure jq binary is executable
chmod +x $(which jq)
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request