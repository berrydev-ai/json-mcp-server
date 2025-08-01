# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-08-01

### Added
- **Docker Deployment Support**: Complete containerization solution for production deployments
  - Official Docker image available on GitHub Container Registry (`ghcr.io/berrydev-ai/json-mcp-server`)
  - Multi-architecture support (amd64, arm64) via GitHub Actions
  - Automated Docker builds triggered on version tags and releases
  - Health check endpoint (`/health`) for container orchestration
  - Optimized Node.js Alpine-based image with pre-installed jq dependency
- **Environment Variable Configuration**: Full ENV variable support for containerized deployments
  - All CLI arguments can now be configured via environment variables
  - Environment variables take precedence over CLI arguments for flexible deployment
  - New variables: `LOG_FILE`, `MCP_VERSION`, `AUTH_TOKEN`
  - Complete mapping from ENV vars to CLI args for all existing options
- **Authentication System**: Bearer token authentication for HTTP transport security
  - `AUTH_TOKEN` environment variable for server-side token configuration
  - Support for both Authorization header (`Bearer <token>`) and query parameter authentication
  - Proper 401 Unauthorized responses for invalid/missing tokens
  - Backward compatible - no authentication required when `AUTH_TOKEN` not set
- **Enhanced Logging**: Improved logging system with file output and session tracking
  - `LOG_FILE` environment variable for redirecting verbose output to files
  - Session ID logging for HTTP transport requests (truncated to 8 characters)
  - Named parameter approach for safe session ID inclusion in logs
  - Structured log format: `[JSON-MCP-SERVER][SESSION-ID] message`
- **CI/CD Pipeline**: Complete automation for Docker image publishing
  - GitHub Actions workflow for multi-platform Docker builds
  - Automated tagging with semantic versioning (major, minor, patch)
  - Security scanning and build attestation
  - Cache optimization for faster builds

### Enhanced
- **Testing Framework**: Extended test suite with Docker and environment variable validation
  - Docker deployment examples and configuration templates
  - Environment variable precedence testing
  - Authentication flow testing scenarios
  - Container-specific examples in test output
- **Documentation**: Comprehensive Docker deployment guide
  - Complete Docker usage examples with various configurations
  - Environment variable reference table
  - Authentication setup instructions
  - Health check endpoint documentation
  - Multi-deployment scenario examples (basic, auth, S3 sync)

### Technical Improvements
- **Server Architecture**: Enhanced HTTP server with authentication middleware
  - Authentication middleware with configurable token validation
  - Improved error handling for authentication failures
  - Health check endpoint for container orchestration
  - Enhanced CORS configuration for authenticated requests
- **Version Management**: Dynamic version configuration via `MCP_VERSION` environment variable
- **Security**: Proper token-based authentication with secure credential handling
- **Deployment**: Production-ready containerization with non-root user execution

### Breaking Changes
- None - All changes are backward compatible with existing configurations

## [1.1.0] - 2025-07-31

### Added
- **HTTP Transport Support**: New HTTP server transport option alongside the default stdio transport
  - Added `--transport=http` command line option
  - HTTP server with session management for remote clients
  - CORS support with configurable origins via `--cors-origin` flag
  - DNS rebinding protection for secure local server deployment
  - Graceful shutdown with proper session cleanup
  - New npm scripts: `start:http`, `dev:http`, and `inspect:http`
- **Enhanced CLI Options**: Extended command line interface with new transport configuration
  - `--host` and `--port` options for HTTP server configuration
  - `--cors-origin` for cross-origin resource sharing settings
- **Development Tooling**: Improved development experience
  - Added MCP Inspector integration for both local and published package testing
  - Enhanced npm scripts for different transport modes
  - Better logging and verbose output options

### Changed
- **Major Refactor**: Complete restructuring of the server architecture
  - Modularized transport layer to support multiple transport types
  - Improved error handling and logging throughout the application
  - Enhanced security measures and input validation
- **Documentation**: Comprehensive updates to project documentation
  - Enhanced README.md with detailed usage examples and architecture overview
  - Added CLAUDE.md with development workflow guidance
  - Improved inline code documentation and comments
- **Configuration**: Updated manifest.json and configuration examples
  - Added HTTP transport configuration examples
  - Improved MCP client configuration templates

### Technical Details
- Maintained backward compatibility with existing stdio transport (default behavior)
- Added Express.js framework for HTTP server functionality
- Enhanced session management for concurrent client connections
- Improved AWS S3 integration with better error reporting
- All three core tools remain unchanged: `query_json`, `generate_json_schema`, `validate_json_schema`

## [1.0.0] - 2025-07-29

### Added
- **Initial Release**: MCP server providing JSON manipulation tools
- **Core Tools**: Three main JSON processing capabilities
  - `query_json`: Execute jq queries on JSON files with support for complex data filtering and transformation
  - `generate_json_schema`: Generate JSON schemas from sample data using genson-js
  - `validate_json_schema`: Validate JSON data against schemas using AJV
- **S3 Integration**: Optional AWS S3 file synchronization
  - Smart sync functionality (only downloads if S3 version is newer)
  - Support for remote JSON datasets with local caching
  - AWS credential management via environment variables
- **Prerequisites Management**: Automatic jq binary detection and validation
  - Auto-detection of jq installation across different operating systems
  - Custom jq path specification via `--jq-path` argument
  - Comprehensive installation instructions for macOS, Ubuntu/Debian, and Windows
- **Testing Framework**: Built-in test utilities
  - `test.js` for creating sample data and validating system requirements
  - Test data generation with `test-data.json` and `test-schema.json`
  - System validation to ensure all dependencies are properly configured
- **Configuration**: Complete MCP client configuration
  - `config.json` with examples for Claude Desktop integration
  - Flexible command line argument parsing with Commander.js
  - Support for absolute file paths with security validation

### Technical Foundation
- Built on `@modelcontextprotocol/sdk` for MCP compliance
- Node.js implementation using ES modules
- Comprehensive dependency management:
  - `node-jq`: Local jq binary wrapper for JSON processing
  - `genson-js`: Schema generation from sample data
  - `ajv`: JSON schema validation
  - `@aws-sdk/client-s3`: Optional cloud storage integration
  - `commander`: CLI argument parsing
  - `which`: System binary detection
- Security-first approach with absolute path requirements and credential obfuscation
- Cross-platform compatibility with automated binary detection

[1.2.0]: https://github.com/berrydev-ai/json-mcp-server/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/berrydev-ai/json-mcp-server/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/berrydev-ai/json-mcp-server/releases/tag/v1.0.0