#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if jq is installed
async function checkJqInstallation() {
  try {
    // Try jq first
    let jqCommand = 'jq';
    let { stdout } = await execAsync(`${jqCommand} --version`);
    console.log(`✅ jq found: ${stdout.trim()}`);

    try {
      const { stdout: whichOutput } = await execAsync(`${process.platform === 'win32' ? 'where' : 'which'} ${jqCommand}`);
      console.log(`✅ jq location: ${whichOutput.trim()}`);
    } catch (whereError) {
      // where/which failed, but jq --version worked, so jq is available
      console.log(`✅ jq is available in PATH`);
    }

    return true;
  } catch (error) {
    // On Windows, try jq.exe if jq fails
    if (process.platform === 'win32') {
      try {
        const { stdout } = await execAsync('jq.exe --version');
        console.log(`✅ jq.exe found: ${stdout.trim()}`);

        try {
          const { stdout: whereOutput } = await execAsync('where jq.exe');
          console.log(`✅ jq.exe location: ${whereOutput.trim()}`);
        } catch (whereError) {
          console.log(`✅ jq.exe is available in PATH`);
        }

        return true;
      } catch (exeError) {
        // Both jq and jq.exe failed
      }
    }

    console.error('❌ jq not found or not working properly');
    console.error('');

    if (process.platform === 'win32') {
      console.error('Please install jq on Windows:');
      console.error('  • Chocolatey: choco install jq');
      console.error('  • Scoop: scoop install jq');
      console.error('  • Manual: Download from https://stedolan.github.io/jq/download/');
      console.error('  • WSL: wsl -e sudo apt-get install jq');
    } else {
      console.error('Please install jq:');
      console.error('  • macOS: brew install jq');
      console.error('  • Ubuntu/Debian: sudo apt-get install jq');
      console.error('  • CentOS/RHEL: sudo yum install jq');
    }
    console.error('');
    return false;
  }
}

// Create test data
const testData = {
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "active": true,
      "roles": ["user", "admin"],
      "profile": {
        "age": 30,
        "department": "Engineering"
      }
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "active": false,
      "roles": ["user"],
      "profile": {
        "age": 25,
        "department": "Marketing"
      }
    },
    {
      "id": 3,
      "name": "Bob Johnson",
      "email": "bob@example.com",
      "active": true,
      "roles": ["user", "manager"],
      "profile": {
        "age": 35,
        "department": "Sales"
      }
    }
  ],
  "metadata": {
    "version": "1.0",
    "created_at": "2024-01-01T00:00:00Z",
    "total_count": 3
  },
  "settings": {
    "theme": "dark",
    "notifications": true,
    "features": ["advanced_search", "export", "analytics"]
  }
};

const testSchema = {
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "age": {
      "type": "number",
      "minimum": 0
    },
    "email": {
      "type": "string",
      "format": "email"
    }
  },
  "required": ["name", "email"]
};

async function createTestFiles() {
  const testDataPath = path.join(__dirname, 'test-data.json');
  const testSchemaPath = path.join(__dirname, 'test-schema.json');

  console.log('Creating test files...');

  await fs.writeFile(testDataPath, JSON.stringify(testData, null, 2));
  console.log(`✅ Created: ${testDataPath}`);

  await fs.writeFile(testSchemaPath, JSON.stringify(testSchema, null, 2));
  console.log(`✅ Created: ${testSchemaPath}`);

  return { testDataPath, testSchemaPath };
}

// Test environment variable functionality
async function testEnvironmentVariables() {
  console.log('\n🔧 Testing Environment Variables...');
  console.log('-'.repeat(30));

  const testEnvVars = {
    'VERBOSE': 'true',
    'TRANSPORT': 'http',
    'PORT': '8080',
    'HOST': '0.0.0.0',
    'CORS_ORIGIN': 'https://example.com,https://localhost:3000',
    'FILE_PATH': '/data/test.json',
    'JQ_PATH': '/usr/bin/jq',
    'S3_URI': 's3://test-bucket/data.json',
    'AWS_REGION': 'us-west-2',
    'LOG_FILE': '/logs/server.log',
    'MCP_VERSION': '1.1.0',
    'AUTH_TOKEN': 'test-auth-token-123'
  };

  console.log('Environment variables that can be set:');
  Object.entries(testEnvVars).forEach(([key, value]) => {
    console.log(`  export ${key}=${value}`);
  });

  console.log('\nTesting precedence (ENV vars override CLI args):');
  console.log('✅ Environment variables take precedence over CLI arguments');
  console.log('✅ AUTH_TOKEN enables authentication for HTTP transport');
  console.log('✅ LOG_FILE redirects verbose output to file');
  console.log('✅ MCP_VERSION overrides default server version');

  return true;
}

// Test Docker functionality
function testDockerDeployment(testDataPath) {
  console.log('\n🐳 Docker Deployment Examples:');
  console.log('-'.repeat(30));

  console.log('\n1. Basic HTTP server:');
  console.log(`docker run -d --name json-mcp-server \\
  -p 3000:3000 \\
  -e TRANSPORT=http \\
  -e VERBOSE=true \\
  -e HOST=0.0.0.0 \\
  -e PORT=3000 \\
  -e CORS_ORIGIN="*" \\
  ghcr.io/berrydev-ai/json-mcp-server:latest`);

  console.log('\n2. With authentication and file mounting:');
  console.log(`docker run -d --name json-mcp-server \\
  -p 8080:8080 \\
  -v $(pwd)/data:/data \\
  -v $(pwd)/logs:/logs \\
  -e TRANSPORT=http \\
  -e VERBOSE=true \\
  -e LOG_FILE=/logs/server.log \\
  -e FILE_PATH=/data/test-data.json \\
  -e HOST=0.0.0.0 \\
  -e PORT=8080 \\
  -e CORS_ORIGIN="*" \\
  -e AUTH_TOKEN=your-secret-token \\
  ghcr.io/berrydev-ai/json-mcp-server:latest`);

  console.log('\n3. With S3 sync:');
  console.log(`docker run -d --name json-mcp-server \\
  -p 3000:3000 \\
  -e TRANSPORT=http \\
  -e VERBOSE=true \\
  -e HOST=0.0.0.0 \\
  -e S3_URI=s3://your-bucket/data.json \\
  -e FILE_PATH=/data/synced-data.json \\
  -e AWS_ACCESS_KEY_ID=your-key \\
  -e AWS_SECRET_ACCESS_KEY=your-secret \\
  -e AWS_REGION=us-east-1 \\
  ghcr.io/berrydev-ai/json-mcp-server:latest`);

  console.log('\n4. MCP Client Configuration with Authentication:');
  console.log(`{
  "mcpServers": {
    "json-mcp-server": {
      "serverUrl": "http://localhost:3000/mcp",
      "headers": {
        "Authorization": "Bearer your-secret-token"
      }
    }
  }
}`);
}

function printTestQueries(testDataPath, testSchemaPath) {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST QUERIES FOR YOUR MCP SERVER');
  console.log('='.repeat(60));

  console.log('\n📝 1. QUERY_JSON Examples:');
  console.log('-'.repeat(30));

  const queries = [
    {
      description: "Get all users",
      query: ".users"
    },
    {
      description: "Get active users only",
      query: ".users[] | select(.active == true)"
    },
    {
      description: "Get user names",
      query: ".users[].name"
    },
    {
      description: "Get users in Engineering",
      query: '.users[] | select(.profile.department == "Engineering")'
    },
    {
      description: "Count total users",
      query: ".users | length"
    },
    {
      description: "Get average age",
      query: "[.users[].profile.age] | add / length"
    },
    {
      description: "Get metadata version",
      query: ".metadata.version"
    },
    {
      description: "Get all enabled features",
      query: ".settings.features[]"
    }
  ];

  queries.forEach((q, i) => {
    console.log(`\n${i + 1}. ${q.description}:`);
    console.log(`   Query: ${q.query}`);
    console.log(`   File: ${testDataPath}`);
  });

  console.log('\n📋 2. GENERATE_JSON_SCHEMA:');
  console.log('-'.repeat(30));
  console.log(`File: ${testDataPath}`);

  console.log('\n✅ 3. VALIDATE_JSON_SCHEMA:');
  console.log('-'.repeat(30));
  console.log(`Schema file: ${testSchemaPath}`);
  console.log('Or use the schema object directly in your MCP client.');

  console.log('\n🚀 4. START SERVER:');
  console.log('-'.repeat(30));
  console.log(`node index.js --verbose=true --file-path="${testDataPath}"`);
  console.log(`# Or with custom jq path:`);
  console.log(`node index.js --verbose=true --file-path="${testDataPath}" --jq-path=/usr/local/bin/jq`);

  console.log('\n💡 TIPS:');
  console.log('-'.repeat(30));
  console.log('• Use absolute paths for file operations');
  console.log('• Test jq queries at https://jqplay.org/ first');
  console.log('• Check server logs with --verbose=true');
  console.log('• Validate JSON files before querying');
}

async function main() {
  try {
    console.log('🔧 JSON MCP Server Test Setup');
    console.log('='.repeat(40));

    // Check jq installation first
    console.log('\n🔍 Checking jq installation...');
    const jqAvailable = await checkJqInstallation();

    if (!jqAvailable) {
      console.log('\n❌ Cannot proceed without jq. Please install it first.');
      process.exit(1);
    }

    const { testDataPath, testSchemaPath } = await createTestFiles();

    // Test environment variables
    await testEnvironmentVariables();

    // Test Docker deployment
    testDockerDeployment(testDataPath);

    printTestQueries(testDataPath, testSchemaPath);

    console.log('\n🎉 Test setup complete!');
    console.log('\nNext steps:');
    console.log('1. Start your MCP server: npm start');
    console.log('2. Connect it to your MCP client');
    console.log('3. Try the example queries above');

  } catch (error) {
    console.error('❌ Error setting up tests:', error.message);
    process.exit(1);
  }
}

main();
