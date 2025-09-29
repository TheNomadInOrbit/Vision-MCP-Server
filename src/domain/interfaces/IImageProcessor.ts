import { ImageSource, ImageMetadata } from '../entities/ImageAnalysis.js';

/**
 * Interface for image processing operations
 */
export interface IImageProcessor {
  /**
   * Load image from various sources (file path, URL)
   */
  loadImage(source: string): Promise<ImageSource>;

  /**
   * Validate if the buffer contains a valid image
   */
  validateImage(buffer: Buffer): Promise<boolean>;

  /**
   * Extract metadata from image buffer
   */
  extractMetadata(buffer: Buffer): Promise<ImageMetadata>;

  /**
   * Convert image to base64 string
   */
  convertToBase64(buffer: Buffer, format?: string): Promise<string>;

  /**
   * Optimize image for processing (resize, compress)
   */
  optimizeImage(buffer: Buffer, maxWidth?: number, maxHeight?: number): Promise<Buffer>;
}