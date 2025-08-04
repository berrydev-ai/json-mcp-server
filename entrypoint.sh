#!/bin/bash

AUTH_TOKEN=${AUTH_TOKEN:-$(cat /run/secrets/auth_token)}
DEFAULT_FILE_PATH=${DEFAULT_FILE_PATH:-$(cat /run/secrets/default_file_path)}
S3_URI=${S3_URI:-$(cat /run/secrets/s3_uri)}
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-$(cat /run/secrets/aws_access_key_id)}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-$(cat /run/secrets/aws_secret_access_key)}
AWS_REGION=${AWS_REGION:-$(cat /run/secrets/aws_region)}
VERBOSE=${VERBOSE:-$(cat /run/secrets/verbose)}
CORS_ORIGINS=${CORS_ORIGINS:-$(cat /run/secrets/cors_origins)}
CORS_ORIGINS_RAW=${CORS_ORIGINS_RAW:-$(cat /run/secrets/cors_origins_raw)}
CORS_ORIGINS_RAW=${CORS_ORIGINS_RAW:-$(cat /run/secrets/cors_origin)}

echo "Starting server..."
node index.js

echo "Server started"
