# Vision MCP Server

Ever wanted to use a model like GLM-4.5 or other great AI models that just don't have vision capabilities? This MCP server solves that problem by adding vision capabilities to any model through OpenRouter's vision models.

## The Problem

Some really good AI models don't support vision. You're stuck choosing between your preferred model or vision capabilities. This server bridges that gap by providing seamless vision capabilities through OpenRouter's vision models.

## The Solution

This MCP server provides a simple `analyze_image` tool that can:
- Analyze images from URLs, file paths, or base64 data
- Use any vision model available on OpenRouter (Claude 3.5 Sonnet, GPT-4 Vision, etc.)
- Return detailed analysis results
- Handle errors gracefully with proper validation

## System Requirements

Before installing, make sure you have:

- **Node.js 18.0.0 or higher** (recommended: Node.js 20+)
- **npm 8.0.0 or higher** (comes with Node.js)

### Check Your Versions

```bash
node --version    # Should show v18.0.0 or higher
npm --version     # Should show 8.0.0 or higher
```

### Install/Update Node.js

If you need to install or update Node.js:

1. **Download from official site**: [nodejs.org](https://nodejs.org/) (recommended for beginners)
2. **Using Node Version Manager (nvm)**: 
   ```bash
   # Install nvm first, then:
   nvm install 20
   nvm use 20
   ```
3. **Using package managers**:
   - macOS: `brew install node`
   - Windows: `winget install OpenJS.NodeJS`
   - Ubuntu/Debian: `sudo apt install nodejs npm`

> **Important**: This server is written in TypeScript and uses dependencies (like `node-fetch` v3) that require Node.js 18+. Older versions (like Node.js 16 or below) will not work.

## Quick Start

### Step 1: Get Your OpenRouter API Key

1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up or log in to your account
3. Navigate to "Keys" in your dashboard
4. Click "Create Key" 
5. Copy your API key (starts with `sk-or-v1-...`)
6. Keep this key safe - you'll need it in Step 3

### Step 2: Install the MCP Server

#### Option A: Install from npm (Recommended)

```bash
npm install -g @thenomadinorbit/vision-mcp-server
```

> **Success!** The package is now globally available as `vision-mcp` command.

#### Option B: Install from Source (Development)

```bash
git clone https://github.com/TheNomadInOrbit/vision-mcp-server.git
cd vision-mcp-server
npm install
npm run build
npm install -g .
```

> **Note:** Use this method if you want to modify the source code or contribute to the project.

### Step 3: Configure Your MCP Client

Add this server configuration to your MCP client:

```json
{
  "mcpServers": {
    "vision-analyzer": {
      "command": "vision-mcp",
      "type": "stdio",
      "timeout": 60,
      "disabled": false,
      "autoApprove": [],
      "env": {
        "OPENROUTER_API_KEY": "your_api_key_here",
        "OPENROUTER_MODEL": "anthropic/claude-3-5-sonnet"
      }
    }
  }
}
```

### Step 4: Test Your Installation

Run this command to verify everything is working:

```bash
vision-mcp
```

You should see the server start up with logs like:
```
Application initialized successfully
Starting Vision MCP Server...
MCP server started successfully
Vision MCP Server is running on stdio
```

Press `Ctrl+C` to stop the test.

## 🔧 Configuration Options

### Basic Configuration
- `"vision-analyzer"` - Server name (you can change this to anything you like)
- `"command": "vision-mcp"` - **Required**: The global command to run the server
- `"type": "stdio"` - **Required**: Communication protocol for MCP
- `"timeout": 60` - **Optional**: Timeout in seconds (default: 60)
- `"disabled": false` - **Optional**: Set to `true` to disable the server

### Auto-Approve Settings
Configure which tools can run without asking for permission:

```json
"autoApprove": []
```

**Options:**
- `[]` (empty) - Requires approval for all tools (safest)
- `["list_models"]` - Auto-approve listing available models only
- `["analyze_image"]` - Auto-approve vision analysis (convenient but less safe)
- `["analyze_image", "list_models"]` - Auto-approve all tools (most convenient)

### Model Configuration
You can use any vision model from OpenRouter:

```json
"env": {
  "OPENROUTER_API_KEY": "your_api_key_here",
  "OPENROUTER_MODEL": "anthropic/claude-3-5-sonnet"
}
```

**Popular Models:**
- `anthropic/claude-3.5-sonnet` (recommended - best for vision)
- `openai/gpt-4o-2024-08-06` (excellent vision capabilities)
- `google/gemini-2.0-flash-001` (fast and cost-effective)
- `anthropic/claude-3-opus` (most powerful for complex analysis)

### Complete Example Configuration

```json
{
  "mcpServers": {
    "vision-analyzer": {
      "command": "vision-mcp",
      "type": "stdio",
      "timeout": 60,
      "disabled": false,
      "autoApprove": ["list_models"],
      "env": {
        "OPENROUTER_API_KEY": "sk-or-v1-your-actual-key-here",
        "OPENROUTER_MODEL": "anthropic/claude-3.5-sonnet",
        "MAX_IMAGE_SIZE": "10485760"
      }
    }
  }
}
```

## Available Tools

Once configured, your AI assistant can use these tools:

### `analyze_image`
Analyze images with AI vision models
- **Input**: Image URL, file path, or base64 data
- **Output**: Detailed analysis of the image content

### `list_models`
List all available vision models from OpenRouter
- **Input**: None
- **Output**: Array of available models with their capabilities

## Usage Examples

Once configured, you can ask your AI assistant to analyze images like this:

**Analyze an image from URL:**
> "Can you analyze this image: https://example.com/image.jpg"

**Analyze a local image:**
> "Please analyze the image at /Users/username/Pictures/photo.png"

**Get available models:**
> "What vision models are available?"

**Detailed analysis:**
> "Analyze this image and tell me about the objects, colors, and mood: https://example.com/artwork.jpg"

## Environment Variables

You can customize the server with these environment variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key | - | Yes |
| `OPENROUTER_MODEL` | AI model to use | `anthropic/claude-3.5-sonnet` | No |
| `MAX_IMAGE_SIZE` | Max image size in bytes | `10485760` (10MB) | No |

## Troubleshooting


### Command not found: `vision-mcp`

1. **For npm installation**: Make sure you ran `npm install -g @thenomadinorbit/vision-mcp-server`
2. **For source installation**: Make sure you ran `npm install -g .` after building
3. Try running `npm list -g @thenomadinorbit/vision-mcp-server` to verify installation
4. Restart your terminal

### "Server not found" or "Connection failed"

1. Verify the command is `vision-mcp` (not a file path)
2. Make sure you ran `npm run build` 
3. Check that the global installation worked: `which vision-mcp`
4. Restart your MCP client

### "API key invalid"

1. Double-check your OpenRouter API key
2. Make sure it starts with `sk-or-v1-`
3. Verify you have credits in your OpenRouter account

### "Vision analysis failed"

1. Try with a smaller image (under 10MB)
2. Make sure the image format is supported (JPG, PNG, WebP)
3. Check your OpenRouter account has sufficient credits

### Still not working?

1. Check your MCP client logs for error messages
2. Make sure your configuration file has valid JSON syntax
3. Try restarting your computer

### Reporting Issues

Found a bug or have a suggestion? Feel free to [open an issue](https://github.com/TheNomadInOrbit/vision-mcp-server/issues) with:
- Clear description of the problem
- Steps to reproduce  
- Expected vs actual behavior
- Your environment details (Node.js version, OS, etc.)

### Development Setup

If you want to fork and modify for your own use:

```bash
git clone https://github.com/TheNomadInOrbit/vision-mcp-server.git
cd vision-mcp-server
npm install
npm run build
```

## Security

If you discover a security vulnerability, please [open a security issue](https://github.com/TheNomadInOrbit/vision-mcp-server/issues) with the "security" label.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

## License

MIT - Use it however you want.
