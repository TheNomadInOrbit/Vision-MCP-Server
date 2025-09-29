#!/usr/bin/env node

/**
 * Vision MCP Server - Main Entry Point
 * 
 * This server brings AI vision capabilities to any model through OpenRouter's vision models.
 * Built with clean architecture and dependency injection to keep things maintainable.
 */

import 'dotenv/config';
import { Container } from './infrastructure/di/Container.js';
import { McpServer } from './presentation/server/McpServer.js';
import { Logger } from './infrastructure/utils/Logger.js';

/**
 * Main application class that handles startup and shutdown
 */
class Application {
  private container: Container;
  private mcpServer!: McpServer;
  private logger!: Logger;

  constructor() {
    this.container = Container.getInstance();
  }

  /**
   * Set up all the services and dependencies
   */
  async initialize(): Promise<void> {
    try {
      // Initialize dependency injection container
      this.container.initialize();

      // Resolve core services
      this.logger = this.container.resolve<Logger>('logger');
      this.mcpServer = this.container.resolve<McpServer>('mcpServer');

      this.logger.info('Application initialized successfully', 'Application');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      process.exit(1);
    }
  }

  /**
   * Fire up the server and get it running
   */
  async start(): Promise<void> {
    try {
      this.logger.info('Starting Vision MCP Server...', 'Application');
      
      // Setup shutdown handlers
      this.setupGracefulShutdown();
      
      // Start the MCP server
      await this.mcpServer.start();
      
      this.logger.info('Vision MCP Server is running on stdio', 'Application');
    } catch (error) {
      this.logger.error('Failed to start MCP server', 'Application', error);
      process.exit(1);
    }
  }

  /**
   * Shut everything down gracefully
   */
  async stop(): Promise<void> {
    try {
      this.logger.info('Shutting down Vision MCP Server...', 'Application');
      
      if (this.mcpServer) {
        await this.mcpServer.stop();
      }
      
      this.logger.info('Server shutdown complete', 'Application');
    } catch (error) {
      this.logger.error('Error during shutdown', 'Application', error);
    }
  }

  /**
   * Handle shutdown signals and cleanup properly
   */
  private setupGracefulShutdown(): void {
    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        this.logger.info(`Received ${signal}, initiating graceful shutdown...`, 'Application');
        await this.stop();
        process.exit(0);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception', 'Application', error);
      this.stop().finally(() => process.exit(1));
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled promise rejection', 'Application', { reason, promise });
      this.stop().finally(() => process.exit(1));
    });
  }
}

/**
 * Start everything up - this is where it all begins
 */
async function main(): Promise<void> {
  const app = new Application();
  
  try {
    await app.initialize();
    await app.start();
  } catch (error) {
    console.error('Application startup failed:', error);
    process.exit(1);
  }
}

// Let's get this party started!
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});