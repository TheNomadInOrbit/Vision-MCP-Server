# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-XX

### Added
- Initial release of Vision MCP Server
- Support for image analysis through OpenRouter's vision models
- `analyze_image` tool for analyzing images from URLs, file paths, or base64 data
- `list_models` tool for retrieving available vision models
- Support for multiple image formats (JPEG, PNG, WebP, GIF, TIFF, BMP)
- Automatic image optimization and resizing for API compatibility
- Comprehensive error handling with domain-specific errors
- Environment-based configuration management
- TypeScript implementation with strict type checking
- Clean architecture with domain-driven design
- Dependency injection container for better testability
- Comprehensive logging system with configurable levels
- Security-focused implementation with proper input validation
- MIT license for open source usage

### Security
- All sensitive configuration externalized to environment variables
- Input validation for image size, format, and dimensions
- Proper error handling without exposing sensitive information
- Comprehensive `.gitignore` to prevent accidental secret commits

### Documentation
- Comprehensive README with installation and usage instructions
- Environment configuration examples
- Troubleshooting guide
- Contributing guidelines
- Security policy