# Use Node.js LTS Alpine for smaller image size
FROM node:20-alpine

# Install jq for JSON processing
RUN apk add --no-cache jq

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
  adduser -S mcpserver -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install pnpm and dependencies
RUN npm install -g pnpm@latest && \
  pnpm install --frozen-lockfile --prod || \
  (echo "Lockfile incompatible, recreating..." && pnpm install --prod)

# Copy application files
COPY index.js ./
COPY test.js ./
COPY entrypoint.sh ./

# Create data directory for file operations
RUN mkdir -p /data && chown -R mcpserver:nodejs /data

# Create logs directory
RUN mkdir -p /logs && chown -R mcpserver:nodejs /logs

# Switch to non-root user
USER mcpserver

# Expose the default HTTP port
EXPOSE 3000

# Set default environment variables
ENV CORS_ORIGIN=*
ENV HOST=0.0.0.0
ENV JQ_PATH=/usr/bin/jq
ENV LOG_FILE=/logs/server.log
ENV PORT=3000
ENV TRANSPORT=http
ENV VERBOSE=false
ENV FILE_PATH=/data/data.json

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Default command
CMD ["bash", "entrypoint.sh"]
