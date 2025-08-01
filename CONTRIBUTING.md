# Contributing to JSON MCP Server

Thank you for your interest in contributing to the JSON MCP Server! This document provides guidelines and information for contributors.

## Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow:

- **Be respectful** - Treat everyone with respect and kindness
- **Be inclusive** - Welcome people of all backgrounds and experience levels
- **Be constructive** - Focus on what is best for the community and project
- **Be collaborative** - Work together and help each other succeed
- **Be professional** - Maintain a professional tone in all interactions

## Ways to Contribute

### 🐛 Bug Reports
Help us improve by reporting bugs you encounter:
- Use the GitHub issue tracker
- Check existing issues before creating new ones
- Provide detailed reproduction steps
- Include environment information (OS, Node.js version, etc.)

### 💡 Feature Requests
Suggest new features or improvements:
- Open a GitHub issue with the "enhancement" label
- Describe the use case and expected behavior
- Consider implementation complexity and project scope

### 📖 Documentation
Improve documentation:
- Fix typos and grammatical errors
- Add missing information or examples
- Improve clarity and organization
- Update outdated information

### 🔧 Code Contributions
Submit code changes via pull requests:
- Bug fixes
- Feature implementations
- Performance improvements
- Code refactoring

## Development Setup

### Prerequisites
- Node.js v16 or higher
- pnpm v10.13.1+ (specified in package.json)
- jq binary installed on your system
- Docker (for containerized testing)

### Getting Started
```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/json-mcp-server.git
cd json-mcp-server

# 3. Add upstream remote
git remote add upstream https://github.com/berrydev-ai/json-mcp-server.git

# 4. Install dependencies
pnpm install

# 5. Create test data
npm test

# 6. Verify setup
npm start -- --help
```

### Development Workflow
```bash
# 1. Create feature branch from main
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name

# 2. Make your changes
# ... code changes ...

# 3. Test your changes
npm test
npm run dev
npm run inspect:local

# 4. Test Docker builds
docker-compose up -d
docker-compose logs
docker-compose down

# 5. Commit changes
git add .
git commit -m "Add feature: description of changes"

# 6. Push to your fork
git push origin feature/your-feature-name

# 7. Create pull request on GitHub
```

## Pull Request Process

### Before Submitting
- [ ] Code follows project conventions and style
- [ ] All tests pass locally
- [ ] Documentation is updated if needed
- [ ] Commit messages are clear and descriptive
- [ ] Changes are focused and atomic

### Pull Request Guidelines

#### Title Format
Use clear, descriptive titles:
- `Fix: resolve S3 connection timeout issue`
- `Feature: add support for nested JSON queries`
- `Docs: update Docker deployment examples`
- `Refactor: improve error handling in HTTP transport`

#### Description Template
```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Code refactoring

## Testing
Describe the tests you ran and how to reproduce them:
- [ ] Local testing with `npm test`
- [ ] MCP Inspector testing with `npm run inspect:local`
- [ ] Docker testing with `docker-compose up -d`
- [ ] Manual testing steps: ...

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] Any dependent changes have been merged and published
```

### Review Process
1. **Automated Checks** - CI/CD pipeline runs tests and builds
2. **Code Review** - Maintainers review code for quality and compatibility
3. **Testing** - Reviewers may test changes in different environments
4. **Approval** - Once approved, changes are merged to main

## Coding Standards

### JavaScript Style
- Use modern JavaScript (ES6+) features
- Follow existing code formatting and conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Handle errors gracefully with detailed logging

### File Organization
```
├── index.js           # Main server implementation
├── test.js           # Test utilities
├── package.json      # Dependencies and scripts
├── Dockerfile        # Container definition
├── examples/         # Docker Compose examples
└── docs/            # Additional documentation
```

### Environment Variables
- Use environment variables for configuration
- Provide sensible defaults
- Document all variables in CLAUDE.md
- Obfuscate sensitive values in logs

### Error Handling
```javascript
// Good: Detailed error handling
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error(`Operation failed: ${error.message}`, {
    operation: 'riskyOperation',
    timestamp: new Date().toISOString(),
    details: error.stack
  });
  throw new Error(`Failed to complete operation: ${error.message}`);
}
```

### Logging
- Use transport-aware logging (console.log for HTTP, console.error for stdio)
- Include timestamps and context
- Obfuscate sensitive information
- Use appropriate log levels

## Testing Requirements

### Local Testing
```bash
# Basic functionality
npm test

# Server startup
npm start -- --verbose=true

# HTTP transport
npm run start:http

# MCP Inspector
npm run inspect:local
```

### Docker Testing
```bash
# Test all variants
docker-compose up -d
docker-compose ps
docker-compose logs

# Health checks
curl http://localhost:3000/health
curl http://localhost:8080/health
curl http://localhost:3001/health
curl http://localhost:8081/health

# Cleanup
docker-compose down
```

### Integration Testing
When adding new features, ensure they work with:
- Both stdio and HTTP transports
- Various authentication configurations
- S3 synchronization (if applicable)
- Different environment variable combinations

## Documentation Standards

### Code Documentation
- Document public APIs and complex functions
- Include usage examples
- Explain non-obvious business logic
- Update CLAUDE.md for new development commands

### README Updates
Update README.md when adding:
- New features or tools
- Configuration options
- Usage examples
- Installation requirements

### Changelog
Update CHANGELOG.md for all user-facing changes:
- New features
- Bug fixes
- Breaking changes
- Deprecations

## Issue Reporting

### Bug Reports
Use this template for bug reports:

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Run command '...'
2. Set environment variable '...'
3. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Environment:**
- OS: [e.g. macOS 12.0, Ubuntu 20.04]
- Node.js version: [e.g. 18.17.0]
- pnpm version: [e.g. 10.13.1]
- jq version: [e.g. 1.6]
- Docker version: [e.g. 20.10.17]

**Additional context**
Add any other context about the problem here.
```

### Feature Requests
Use this template for feature requests:

```markdown
**Is your feature request related to a problem?**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions.

**Additional context**
Add any other context or screenshots about the feature request.
```

## Security

### Reporting Vulnerabilities
- **DO NOT** create public issues for security vulnerabilities
- Email security concerns to the maintainers
- Include detailed information about the vulnerability
- Allow time for the issue to be addressed before public disclosure

### Security Best Practices
- Never commit secrets or credentials
- Use environment variables for sensitive configuration
- Validate all user inputs
- Follow principle of least privilege
- Keep dependencies updated

## Release Process

Contributors can suggest releases, but only maintainers can create them:

1. **Version Bumping** - Follow semantic versioning
2. **Changelog Updates** - Document all changes
3. **Testing** - Comprehensive testing before release
4. **Tagging** - Create git tags for versions
5. **Publishing** - Automated via CI/CD pipeline

## Questions and Support

### Getting Help
- Check existing documentation (README.md, CLAUDE.md, DEVELOPMENT.md)
- Search existing GitHub issues
- Create a new issue with the "question" label
- Join community discussions

### Contact Information
- **GitHub Issues** - Primary communication channel
- **Maintainers** - Available via GitHub mentions
- **Documentation** - Keep all project documentation up to date

## Recognition

Contributors will be recognized in:
- GitHub contributor list
- Release notes for significant contributions
- Project documentation credits

Thank you for contributing to JSON MCP Server! 🚀