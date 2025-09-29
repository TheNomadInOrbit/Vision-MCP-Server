import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Application configuration interface
 */
export interface AppConfig {
  openRouter: {
    apiKey: string;
    baseUrl: string;
    defaultModel: string;
    timeout: number;
    maxTokens: number;
    httpReferer: string;
  };
  server: {
    name: string;
    version: string;
    description: string;
  };
  image: {
    maxSizeBytes: number;
    supportedFormats: string[];
    quality: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
  };
}

/**
 * Default configuration values
 */
const defaultConfig: AppConfig = {
  openRouter: {
      apiKey: process.env.OPENROUTER_API_KEY || '',
      baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      defaultModel: process.env.OPENROUTER_DEFAULT_MODEL || 'anthropic/claude-3.5-sonnet',
      timeout: parseInt(process.env.OPENROUTER_TIMEOUT || '30000'),
      maxTokens: parseInt(process.env.OPENROUTER_MAX_TOKENS || '1000'),
      httpReferer: process.env.OPENROUTER_HTTP_REFERER || 'https://github.com/TheNomadInOrbit/vision-mcp-server',
    },
  server: {
    name: 'vision-mcp-server',
    version: '2.0.0',
    description: 'Advanced MCP server for AI-powered vision using OpenRouter vision models',
  },
  image: {
    maxSizeBytes: parseInt(process.env.MAX_IMAGE_SIZE || '10485760', 10), // 10MB default
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
    quality: parseInt(process.env.IMAGE_QUALITY || '85', 10),
  },
  logging: {
    level: (process.env.LOG_LEVEL as any) || 'info',
    enableConsole: process.env.NODE_ENV !== 'production',
  },
};

/**
 * Configuration manager class
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }

  private loadConfig(): AppConfig {
    return {
      ...defaultConfig,
      // Override with environment-specific values if needed
    };
  }

  private validateConfig(): void {
    if (!this.config.openRouter.apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }

    if (this.config.image.maxSizeBytes <= 0) {
      throw new Error('MAX_IMAGE_SIZE must be a positive number');
    }

    if (!['debug', 'info', 'warn', 'error'].includes(this.config.logging.level)) {
      throw new Error('LOG_LEVEL must be one of: debug, info, warn, error');
    }
  }

  updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates };
    this.validateConfig();
  }
}

// Export singleton instance
export const appConfig = ConfigManager.getInstance();