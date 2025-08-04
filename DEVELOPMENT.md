# Development Guide

This guide covers local development, testing, and release processes for the JSON MCP Server.

## Prerequisites

### Required Dependencies
- **Node.js** (v16 or higher)
- **pnpm** (v10.13.1+ - specified in package.json)
- **jq** binary for JSON processing:
  - **macOS:** `brew install jq`
  - **Ubuntu/Debian:** `sudo apt-get install jq`
  - **Windows:** `winget install --id=jqlang.jq`
- **Docker** (for containerized development and testing)

### Optional Dependencies
- **AWS CLI** (for S3 integration testing)
- **MCP Inspector** (automatically available via npm scripts)

## Local Development Setup

### 1. Clone and Install
```bash
git clone https://github.com/berrydev-ai/json-mcp-server.git
cd json-mcp-server
pnpm install
```

### 2. Create Test Data
```bash
# Creates test-data.json and test-schema.json
npm test
# or
node test.js
```

### 3. Verify Installation
```bash
# Check jq installation
jq --version

# Verify server can start
npm start -- --help
```

## Development Workflows

### Running the Server Locally

#### StdIO Transport (Default)
```bash
# Basic start with stdio transport
npm start

# With verbose logging
npm run dev

# With custom file path
node index.js --verbose=true --file-path=/absolute/path/to/data.json

# With S3 sync
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
node index.js --s3-uri=s3://bucket/file.json --file-path=/local/path.json
```

#### HTTP Transport
```bash
# Start HTTP server
npm run start:http

# Development mode with hot restart
npm run dev:http

# Custom configuration
node index.js --transport=http --verbose=true --port=8080 --host=localhost
```

### Testing and Debugging

#### MCP Inspector
Interactive web interface for testing MCP tools:
```bash
# Test local development version
npm run inspect:local

# Test published npm package  
npm run inspect:published
```

#### Manual Testing
```bash
# Health check (HTTP transport only)
curl http://localhost:3000/health

# Test with authentication
curl -H "Authorization: Bearer your-token" http://localhost:3000/mcp
```

#### Logging and Debugging
```bash
# Enable verbose logging
node index.js --verbose=true

# Log to file (HTTP transport)
node index.js --transport=http --verbose=true > server.log 2>&1

# Debug S3 operations
AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE=1 \
node index.js --verbose=true --s3-uri=s3://bucket/file.json
```

## Docker Development

### Local Multi-Variant Testing
The project includes a `docker-compose.yml` for testing all HTTP transport variants locally:

```bash
# Build local image
docker build -t json-mcp-server-local .

# Start all variants
docker-compose up -d

# Start specific variant
docker-compose up -d basic     # Port 3000
docker-compose up -d auth      # Port 8080
docker-compose up -d s3        # Port 3001
docker-compose up -d production # Port 8081

# View logs
docker-compose logs -f basic
docker-compose logs -f auth

# Stop all services
docker-compose down
```

### Environment Configuration
Create `.env` file for Docker development:
```bash
# Authentication
AUTH_TOKEN=dev-test-token-12345

# S3 Configuration (optional)
S3_URI=s3://your-dev-bucket/test-data.json
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-dev-key
AWS_SECRET_ACCESS_KEY=your-dev-secret

# Debug settings
VERBOSE=true
CORS_ORIGIN=http://localhost:3000,http://localhost:8080
```

### Production-like Testing
Use the examples in `examples/` directory for production-like testing:
```bash
# Test with published image
docker-compose -f examples/docker-compose.production.yml up -d

# Monitor resource usage
docker stats json-mcp-server-production
```

## Code Structure and Architecture

### Core Files
- `index.js` - Main MCP server implementation
- `test.js` - Test data generation and validation
- `package.json` - Dependencies and npm scripts
- `Dockerfile` - Container image definition

### Key Components
1. **Transport Layer** - StdIO and HTTP transport implementations
2. **MCP Tools** - `query_json`, `generate_json_schema`, `validate_json_schema`
3. **S3 Integration** - Optional remote data synchronization
4. **Authentication** - Bearer token support for HTTP transport
5. **Logging** - Transport-aware logging system

### Development Patterns
- Environment variables override CLI arguments
- Graceful error handling with detailed logging
- Security-first approach (no relative paths, credential obfuscation)
- Health check endpoints for monitoring
- Session management for HTTP transport

## Testing Strategies

### Unit Testing
```bash
# Run basic functionality tests
node test.js

# Validate jq integration
echo '{"test": "data"}' | jq '.test'
```

### Integration Testing
```bash
# Test S3 integration (requires AWS credentials)
node index.js --verbose=true --s3-uri=s3://test-bucket/data.json --file-path=/tmp/test.json

# Test HTTP authentication
curl -H "Authorization: Bearer test-token" http://localhost:3000/mcp
```

### Container Testing
```bash
# Test all variants
docker-compose up -d
docker-compose ps
docker-compose logs

# Health checks
curl http://localhost:3000/health  # basic
curl http://localhost:8080/health  # auth
curl http://localhost:3001/health  # s3
curl http://localhost:8081/health  # production
```

## Troubleshooting

### Common Issues

1. **jq not found**
   ```bash
   # Install jq
   brew install jq  # macOS
   sudo apt-get install jq  # Ubuntu
   ```

2. **Permission denied on volumes**
   ```bash
   sudo chown -R $(id -u):$(id -g) ./test-data ./logs
   ```

3. **S3 access denied**
   - Verify AWS credentials
   - Check bucket permissions
   - Ensure correct region

4. **Port conflicts**
   - Use different ports in docker-compose.yml
   - Check for running processes: `lsof -i :3000`

### Debug Commands
```bash
# Check environment
node -e "console.log(process.env)"

# Verify file access
ls -la /path/to/your/file.json

# Test jq directly
echo '{"test": true}' | jq '.test'

# Docker debug
docker exec -it json-mcp-server-basic-local sh
```

## Release Instructions

### Pre-Release Checklist
1. **Update Version Numbers**
   ```bash
   # Update package.json version
   npm version patch|minor|major --no-git-tag-version
   
   # Update version in CLAUDE.md if needed
   # Update version in docker-compose examples
   ```

2. **Update Documentation**
   ```bash
   # Update CHANGELOG.md with new features/fixes
   # Update README.md if API changes
   # Update CLAUDE.md with new commands
   ```

3. **Test All Variants**
   ```bash
   # Test local builds
   docker-compose up -d
   docker-compose logs
   
   # Test MCP Inspector
   npm run inspect:local
   
   # Test published package
   npm run inspect:published
   ```

### Release Process

#### 1. Automated Release (Recommended)
```bash
# Patch release (1.2.0 -> 1.2.1)
npm run release:patch

# Minor release (1.2.0 -> 1.3.0)  
npm run release:minor

# Major release (1.2.0 -> 2.0.0)
npm run release:major
```

#### 2. Manual Release Process
```bash
# 1. Create release branch
git checkout -b release/v1.2.1
git push -u origin release/v1.2.1

# 2. Update version
npm version patch --no-git-tag-version

# 3. Update CHANGELOG.md
# Add release notes and date

# 4. Commit changes
git add .
git commit -m "Prepare release v1.2.1"

# 5. Create pull request to main
# Wait for CI/CD to pass

# 6. Merge to main
git checkout main
git pull origin main

# 7. Create and push tag
git tag v1.2.1
git push origin v1.2.1

# 8. Create GitHub release
gh release create v1.2.1 --title "v1.2.1" --notes-file CHANGELOG.md
```

### Post-Release Verification

1. **Docker Image Published**
   ```bash
   # Verify image is available
   docker pull ghcr.io/berrydev-ai/json-mcp-server:latest
   docker pull ghcr.io/berrydev-ai/json-mcp-server:v1.2.1
   ```

2. **NPM Package Published**
   ```bash
   # Check npm registry
   npm view @berrydev-ai/json-mcp-server
   ```

3. **Test Production Examples**
   ```bash
   # Test with new version
   docker-compose -f examples/docker-compose.production.yml pull
   docker-compose -f examples/docker-compose.production.yml up -d
   ```

### Release Notes Template
```markdown
## v1.2.1 - YYYY-MM-DD

### Features
- New feature description

### Improvements  
- Enhancement description

### Bug Fixes
- Fix description

### Documentation
- Documentation updates

### Docker
- Image: `ghcr.io/berrydev-ai/json-mcp-server:v1.2.1`
- Size: XX MB
- Platforms: linux/amd64, linux/arm64

### Breaking Changes
- None / Description of breaking changes
```

### Rollback Process
```bash
# If issues found after release
git revert <commit-hash>
git push origin main

# Rollback Docker image
docker tag ghcr.io/berrydev-ai/json-mcp-server:v1.2.0 ghcr.io/berrydev-ai/json-mcp-server:latest
docker push ghcr.io/berrydev-ai/json-mcp-server:latest
```