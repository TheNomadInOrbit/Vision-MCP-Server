/**
 * Base domain error class
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = this.constructor.name;
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when image processing fails
 */
export class ImageProcessingError extends DomainError {
  readonly code = 'IMAGE_PROCESSING_ERROR';
  
  constructor(message: string, cause?: Error) {
    super(`Image processing failed: ${message}`, cause);
  }
}

/**
 * Error thrown when vision analysis fails
 */
export class ImageAnalysisError extends DomainError {
  readonly code = 'IMAGE_ANALYSIS_ERROR';
  
  constructor(message: string, cause?: Error) {
    super(`Vision analysis failed: ${message}`, cause);
  }
}

/**
 * Error thrown when an unsupported model is requested
 */
export class UnsupportedModelError extends DomainError {
  readonly code = 'UNSUPPORTED_MODEL_ERROR';
  
  constructor(model: string) {
    super(`Model '${model}' is not supported`);
  }
}

/**
 * Error thrown when image validation fails
 */
export class InvalidImageError extends DomainError {
  readonly code = 'INVALID_IMAGE_ERROR';
  
  constructor(reason: string) {
    super(`Invalid image: ${reason}`);
  }
}

/**
 * Error thrown when image source is not found or accessible
 */
export class ImageNotFoundError extends DomainError {
  readonly code = 'IMAGE_NOT_FOUND_ERROR';
  
  constructor(source: string) {
    super(`Image not found: ${source}`);
  }
}