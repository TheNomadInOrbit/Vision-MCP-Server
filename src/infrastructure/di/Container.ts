import { IImageAnalysisService } from '../../domain/interfaces/IImageAnalysisService.js';
import { IImageProcessor } from '../../domain/interfaces/IImageProcessor.js';
import { AnalyzeImageUseCase } from '../../application/use-cases/AnalyzeImageUseCase.js';
import { OpenRouterService } from '../services/OpenRouterService.js';
import { ImageProcessor } from '../services/ImageProcessor.js';
import { ImageAnalysisController } from '../../presentation/controllers/ImageAnalysisController.js';
import { McpServer } from '../../presentation/server/McpServer.js';
import { AppConfig, ConfigManager } from '../config/AppConfig.js';
import { Logger, LogLevel } from '../utils/Logger.js';

/**
 * Dependency Injection Container
 * Manages all service dependencies and their lifecycle
 */
export class Container {
  private static instance: Container;
  private services: Map<string, any> = new Map();

  private constructor() {}

  /**
   * Get singleton instance of the container
   */
  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Register a service in the container
   */
  register<T>(key: string, factory: () => T): void {
    this.services.set(key, factory);
  }

  /**
   * Resolve a service from the container
   */
  resolve<T>(key: string): T {
    const factory = this.services.get(key);
    if (!factory) {
      throw new Error(`Service ${key} not found in container`);
    }
    return factory();
  }

  /**
   * Initialize all services and their dependencies
   */
  initialize(): void {
    // Register configuration
    this.register('config', () => ConfigManager.getInstance().getConfig());

    // Register logger
    this.register('logger', () => {
      const config = this.resolve<AppConfig>('config');
      const logLevel = this.mapLogLevel(config.logging.level);
      return new Logger(logLevel, config.logging.enableConsole);
    });

    // Register infrastructure services
    this.register('imageProcessor', () => {
      const config = this.resolve<AppConfig>('config');
      const logger = this.resolve<Logger>('logger');
      return new ImageProcessor(config, logger);
    });

    this.register('imageAnalysisService', () => {
      const config = this.resolve<AppConfig>('config');
      const logger = this.resolve<Logger>('logger');
      return new OpenRouterService(config, logger);
    });

    // Register use cases
    this.register('analyzeImageUseCase', () => {
      const imageProcessor = this.resolve<IImageProcessor>('imageProcessor');
      const imageAnalysisService = this.resolve<IImageAnalysisService>('imageAnalysisService');
      const config = this.resolve<AppConfig>('config');
      return new AnalyzeImageUseCase(imageProcessor, imageAnalysisService, config);
    });

    // Register controllers
    this.register('imageAnalysisController', () => {
      const analyzeImageUseCase = this.resolve<AnalyzeImageUseCase>('analyzeImageUseCase');
      const logger = this.resolve<Logger>('logger');
      return new ImageAnalysisController(analyzeImageUseCase, logger);
    });

    // Register MCP server
    this.register('mcpServer', () => {
      const controller = this.resolve<ImageAnalysisController>('imageAnalysisController');
      const config = this.resolve<AppConfig>('config');
      const logger = this.resolve<Logger>('logger');
      return new McpServer(controller, config, logger);
    });
  }

  /**
   * Map string log level to LogLevel enum
   */
  private mapLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'debug': return LogLevel.DEBUG;
      case 'info': return LogLevel.INFO;
      case 'warn': return LogLevel.WARN;
      case 'error': return LogLevel.ERROR;
      default: return LogLevel.INFO;
    }
  }

  /**
   * Clear all registered services (useful for testing)
   */
  clear(): void {
    this.services.clear();
  }
}