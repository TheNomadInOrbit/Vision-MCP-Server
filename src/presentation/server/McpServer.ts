import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { ImageAnalysisController } from '../controllers/ImageAnalysisController.js';
import { AnalyzeImageRequest } from '../../application/dto/ImageAnalysisDto.js';
import { Logger } from '../../infrastructure/utils/Logger.js';
import { AppConfig } from '../../infrastructure/config/AppConfig.js';

/**
 * MCP Server for vision analysis
 */
export class McpServer {
  private server: Server;

  constructor(
    private readonly imageAnalysisController: ImageAnalysisController,
    private readonly config: AppConfig,
    private readonly logger: Logger
  ) {
    this.server = new Server(
      {
        name: this.config.server.name,
        version: this.config.server.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * Setup MCP server handlers
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getAvailableTools(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      this.logger.info(`Tool called: ${name}`, 'McpServer');

      switch (name) {
        case 'analyze_image':
          return await this.handleAnalyzeImage(args);

        case 'list_models':
          return await this.handleListModels();

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  /**
   * Get available tools definition
   */
  private getAvailableTools(): Tool[] {
    return [
      {
        name: 'analyze_image',
        description: 'Analyze an image using AI vision models. Supports file paths and URLs.',
        inputSchema: {
          type: 'object',
          properties: {
            source: {
              type: 'string',
              description: 'Image source: file path or URL',
            },
            model: {
                type: 'string',
                description: 'AI model to use for analysis (optional, uses Claude 3.5 Sonnet if not specified). You can use any model available on OpenRouter.',
              },
            prompt: {
              type: 'string',
              description: 'Custom analysis prompt (optional, uses default if not specified)',
            },
          },
          required: ['source'],
        },
      },
      {
        name: 'list_models',
        description: 'Get list of available AI vision models for vision analysis',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  /**
   * Handle analyze_image tool call
   */
  private async handleAnalyzeImage(args: any) {
    try {
      // Validate arguments
      if (!args || typeof args !== 'object') {
        throw new Error('Invalid arguments provided');
      }

      if (!args.source || typeof args.source !== 'string') {
        throw new Error('Source parameter is required and must be a string');
      }

      // Create request object
      const request: AnalyzeImageRequest = {
        source: args.source,
        model: args.model,
        prompt: args.prompt,
      };

      // Execute analysis
      const result = await this.imageAnalysisController.analyzeImage(request);

      if (result.success) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                analysis: result.data.analysis,
                model: result.data.model,
                timestamp: result.data.timestamp,
                metadata: result.data.metadata,
                source: result.data.source,
              }, null, 2),
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${result.error.message}`,
            },
          ],
          isError: true,
        };
      }

    } catch (error) {
      this.logger.error(`Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'McpServer');
      
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle list_models tool call
   */
  private async handleListModels() {
    try {
      const modelsResponse = await this.imageAnalysisController.getAvailableModels();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              available_models: modelsResponse.models,
              default_model: modelsResponse.default,
              total_count: modelsResponse.models.length,
            }, null, 2),
          },
        ],
      };

    } catch (error) {
      this.logger.error(`Failed to list models: ${error instanceof Error ? error.message : 'Unknown error'}`, 'McpServer');
      
      return {
        content: [
          {
            type: 'text',
            text: `Error: Failed to retrieve available models`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    this.logger.info('Starting MCP server...', 'McpServer');

    // Create and connect using stdio transport
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    this.logger.info('MCP server started successfully', 'McpServer');
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    this.logger.info('Stopping MCP server...', 'McpServer');
    await this.server.close();
    this.logger.info('MCP server stopped', 'McpServer');
  }

  /**
   * Get server instance for testing
   */
  getServer(): Server {
    return this.server;
  }
}