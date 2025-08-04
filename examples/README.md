# Docker Compose Examples

This directory contains Docker Compose configurations for different deployment scenarios of the JSON MCP Server with HTTP transport.

## Available Configurations

### 1. Basic HTTP Server (`docker-compose.basic.yml`)
Simple HTTP server setup for development and testing.

**Features:**
- HTTP transport on port 3000
- No authentication
- Uses built-in test data
- Open CORS policy

**Usage:**
```bash
docker-compose -f examples/docker-compose.basic.yml up -d
```

**Access:**
- Health check: `curl http://localhost:3000/health`
- MCP endpoint: `http://localhost:3000/mcp`

### 2. Authenticated HTTP Server (`docker-compose.auth.yml`)
HTTP server with Bearer token authentication for secure access.

**Features:**
- HTTP transport on port 8080
- Bearer token authentication
- Persistent data and log volumes
- Restricted CORS origins

**Usage:**
```bash
# 1. Create .env file with AUTH_TOKEN
echo "AUTH_TOKEN=your-secret-token-here" > .env

# 2. Start the server
docker-compose -f examples/docker-compose.auth.yml up -d
```

**Access:**
```bash
# Health check (no auth required)
curl http://localhost:8080/health

# MCP endpoint with auth header
curl -H "Authorization: Bearer your-secret-token" http://localhost:8080/mcp

# MCP endpoint with query parameter
curl "http://localhost:8080/mcp?token=your-secret-token"
```

### 3. S3-Enabled HTTP Server (`docker-compose.s3.yml`)
HTTP server with S3 synchronization for remote JSON data.

**Features:**
- HTTP transport on port 3000
- S3 data synchronization at startup
- Smart sync (only downloads if S3 version is newer)
- Persistent local caching

**Usage:**
```bash
# 1. Create .env file with S3 configuration
cat > .env << EOF
S3_URI=s3://your-bucket/data.json
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
EOF

# 2. Start the server
docker-compose -f examples/docker-compose.s3.yml up -d
```

### 4. Production HTTP Server (`docker-compose.production.yml`)
Full-featured production setup with all security and operational features.

**Features:**
- HTTP transport on configurable port (default 8080)
- Bearer token authentication
- S3 synchronization (optional)
- Restricted CORS origins
- Resource limits and logging configuration
- Production restart policies

**Usage:**
```bash
# 1. Create production .env file
cat > .env << EOF
EXTERNAL_PORT=8080
VERBOSE=false
CORS_ORIGIN=https://yourapp.com
AUTH_TOKEN=$(openssl rand -base64 32)
S3_URI=s3://your-production-bucket/data.json
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-production-aws-key
AWS_SECRET_ACCESS_KEY=your-production-aws-secret
MCP_VERSION=1.2.0
EOF

# 2. Start the production server
docker-compose -f examples/docker-compose.production.yml up -d
```

## Environment Variables

All configurations support environment variables through `.env` files. Key variables include:

| Variable | Description | Example |
|----------|-------------|---------|
| `AUTH_TOKEN` | Bearer token for authentication | `your-secret-token-here` |
| `S3_URI` | S3 URI for data synchronization | `s3://bucket/data.json` |
| `AWS_REGION` | AWS region for S3 operations | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key ID | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `CORS_ORIGIN` | Allowed CORS origins | `https://app.com,http://localhost:3000` |
| `EXTERNAL_PORT` | External port mapping | `8080` |
| `VERBOSE` | Enable verbose logging | `true` or `false` |

## Security Best Practices

### Authentication Token Generation
Generate secure tokens for production:
```bash
# Generate a 32-character base64 token
openssl rand -base64 32
```

### CORS Configuration
Restrict CORS origins in production:
```bash
# Single origin
CORS_ORIGIN=https://yourapp.com

# Multiple origins
CORS_ORIGIN=https://app.com,https://dashboard.app.com
```

### AWS Credentials
Use IAM roles when possible instead of hardcoded credentials:
```yaml
# Remove AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from environment
# Mount AWS credentials file instead
volumes:
  - ~/.aws:/root/.aws:ro
```

## Monitoring and Maintenance

### Health Checks
All configurations include health check endpoints:
```bash
curl http://localhost:PORT/health
```

### Logs
Access container logs:
```bash
# Follow logs
docker-compose -f examples/docker-compose.VARIANT.yml logs -f

# View specific service logs
docker logs json-mcp-server-VARIANT
```

### Data Persistence
Data and logs are persisted in local directories:
- `./data/` - JSON data files
- `./logs/` - Server log files

### Resource Monitoring
Monitor container resource usage:
```bash
docker stats json-mcp-server-VARIANT
```

## Troubleshooting

### Common Issues

1. **Permission Denied for Volumes**
   ```bash
   # Fix volume permissions
   sudo chown -R $(id -u):$(id -g) ./data ./logs
   ```

2. **S3 Access Denied**
   - Verify AWS credentials
   - Check S3 bucket permissions
   - Ensure correct AWS region

3. **Authentication Failures**
   - Verify AUTH_TOKEN in .env file
   - Check Authorization header format: `Bearer TOKEN`

4. **CORS Issues**
   - Add your domain to CORS_ORIGIN
   - Use comma-separated list for multiple origins

### Getting Help

For additional support:
- Check the main [README.md](../README.md)
- Review [CLAUDE.md](../CLAUDE.md) for development commands
- Report issues on [GitHub](https://github.com/berrydev-ai/json-mcp-server/issues)