/**
 * Log levels enum
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Log entry interface
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  metadata?: any;
}

/**
 * Logger interface
 */
export interface ILogger {
  debug(message: string, context?: string, metadata?: any): void;
  info(message: string, context?: string, metadata?: any): void;
  warn(message: string, context?: string, metadata?: any): void;
  error(message: string, context?: string, metadata?: any): void;
  setLevel(level: LogLevel): void;
  setContext(context: string): void;
}

/**
 * Console logger implementation
 */
export class Logger implements ILogger {
  private level: LogLevel = LogLevel.INFO;
  private context?: string;
  private enableConsole: boolean = true;

  constructor(
    level: LogLevel = LogLevel.INFO,
    enableConsole: boolean = true,
    context?: string
  ) {
    this.level = level;
    this.enableConsole = enableConsole;
    this.context = context;
  }

  debug(message: string, context?: string, metadata?: any): void {
    this.log(LogLevel.DEBUG, message, context, metadata);
  }

  info(message: string, context?: string, metadata?: any): void {
    this.log(LogLevel.INFO, message, context, metadata);
  }

  warn(message: string, context?: string, metadata?: any): void {
    this.log(LogLevel.WARN, message, context, metadata);
  }

  error(message: string, context?: string, metadata?: any): void {
    this.log(LogLevel.ERROR, message, context, metadata);
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setContext(context: string): void {
    this.context = context;
  }

  private log(level: LogLevel, message: string, context?: string, metadata?: any): void {
    if (level < this.level) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: context || this.context,
      metadata,
    };

    if (this.enableConsole) {
      this.logToConsole(entry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const contextStr = entry.context ? ` [${entry.context}]` : '';
    const metadataStr = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : '';
    
    const logMessage = `${timestamp} ${levelName}${contextStr}: ${entry.message}${metadataStr}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
        console.error(logMessage);
        break;
    }
  }

  /**
   * Create a child logger with a specific context
   */
  child(context: string): Logger {
    return new Logger(this.level, this.enableConsole, context);
  }

  /**
   * Create logger from string level
   */
  static fromLevel(levelStr: string, enableConsole: boolean = true): Logger {
    const level = LogLevel[levelStr.toUpperCase() as keyof typeof LogLevel] ?? LogLevel.INFO;
    return new Logger(level, enableConsole);
  }
}