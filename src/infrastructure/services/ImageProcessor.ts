import * as fs from 'fs/promises';
import * as path from 'path';
import { readFileSync } from 'fs';
import sharp from 'sharp';
import { IImageProcessor } from '../../domain/interfaces/IImageProcessor.js';
import { ImageSource, ImageMetadata } from '../../domain/entities/ImageAnalysis.js';
import { 
  ImageProcessingError, 
  ImageNotFoundError, 
  InvalidImageError 
} from '../../domain/errors/DomainErrors.js';
import { AppConfig } from '../config/AppConfig.js';
import { Logger } from '../utils/Logger.js';

/**
 * Image processor implementation using Sharp
 */
export class ImageProcessor implements IImageProcessor {
  constructor(
    private readonly config: AppConfig,
    private readonly logger: Logger
  ) {}

  async loadImage(source: string): Promise<ImageSource> {
    try {
      this.logger.debug(`Loading image from source: ${source}`);

      if (this.isUrl(source)) {
        return await this.loadFromUrl(source);
      }

      return await this.loadFromFile(source);

    } catch (error) {
      this.logger.error(`Failed to load image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      if (error instanceof ImageNotFoundError || error instanceof InvalidImageError) {
        throw error;
      }
      
      throw new ImageProcessingError(
        `Failed to load image from source: ${source}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async validateImage(imageData: Buffer): Promise<boolean> {
    try {
      const metadata = await sharp(imageData).metadata();
      
      // Check if it's a valid image format
      if (!metadata.format || !this.config.image.supportedFormats.includes(metadata.format)) {
        return false;
      }

      // Check file size
      if (imageData.length > this.config.image.maxSizeBytes) {
        return false;
      }

      // Check dimensions (basic validation)
      if (!metadata.width || !metadata.height || metadata.width < 1 || metadata.height < 1) {
        return false;
      }

      return true;

    } catch (error) {
      this.logger.debug(`Image validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  async extractMetadata(imageData: Buffer): Promise<ImageMetadata> {
    try {
      const metadata = await sharp(imageData).metadata();
      
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: imageData.length,
        hasAlpha: metadata.hasAlpha || false,
        colorSpace: metadata.space || 'unknown',
        density: metadata.density || undefined,
      };

    } catch (error) {
      throw new ImageProcessingError(
        'Failed to extract image metadata',
        error instanceof Error ? error : undefined
      );
    }
  }

  async convertToBase64(imageData: Buffer, format?: string): Promise<string> {
    try {
      let processedBuffer = imageData;

      if (format && format !== 'original') {
        // Convert to specified format
        const sharpInstance = sharp(imageData);
        
        switch (format.toLowerCase()) {
          case 'jpeg':
          case 'jpg':
            processedBuffer = await sharpInstance
              .jpeg({ quality: this.config.image.quality })
              .toBuffer();
            break;
          case 'png':
            processedBuffer = await sharpInstance.png().toBuffer();
            break;
          case 'webp':
            processedBuffer = await sharpInstance
              .webp({ quality: this.config.image.quality })
              .toBuffer();
            break;
          default:
            // Keep original format
            break;
        }
      }

      return processedBuffer.toString('base64');

    } catch (error) {
      throw new ImageProcessingError(
        'Failed to convert image to base64',
        error instanceof Error ? error : undefined
      );
    }
  }

  async optimizeImage(imageData: Buffer, maxWidth?: number, maxHeight?: number): Promise<Buffer> {
    try {
      let sharpInstance = sharp(imageData);
      
      // Resize if dimensions are specified
      if (maxWidth || maxHeight) {
        sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      // Apply quality optimization
      const metadata = await sharp(imageData).metadata();
      
      switch (metadata.format) {
        case 'jpeg':
          return await sharpInstance
            .jpeg({ quality: this.config.image.quality, progressive: true })
            .toBuffer();
        case 'png':
          return await sharpInstance
            .png({ compressionLevel: 9, progressive: true })
            .toBuffer();
        case 'webp':
          return await sharpInstance
            .webp({ quality: this.config.image.quality })
            .toBuffer();
        default:
          return await sharpInstance.toBuffer();
      }

    } catch (error) {
      throw new ImageProcessingError(
        'Failed to optimize image',
        error instanceof Error ? error : undefined
      );
    }
  }

  private async loadFromFile(filePath: string): Promise<ImageSource> {
    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Read file
      const data = readFileSync(filePath);
      
      // Validate image
      if (!await this.validateImage(data)) {
        throw new InvalidImageError(`Invalid image file: ${filePath}`);
      }

      const metadata = await this.extractMetadata(data);

      return {
        type: 'file',
        path: path.resolve(filePath),
        data,
        metadata,
      };

    } catch (error) {
      if (error instanceof Error && error.message.includes('ENOENT')) {
        throw new ImageNotFoundError(`File not found: ${filePath}`);
      }
      
      if (error instanceof InvalidImageError) {
        throw error;
      }
      
      throw new ImageProcessingError(
        `Failed to load file: ${filePath}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  private async loadFromUrl(url: string): Promise<ImageSource> {
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const data = Buffer.from(arrayBuffer);

      // Validate image
      if (!await this.validateImage(data)) {
        throw new InvalidImageError(`Invalid image from URL: ${url}`);
      }

      const metadata = await this.extractMetadata(data);

      return {
        type: 'url',
        path: url,
        data,
        metadata,
      };

    } catch (error) {
      if (error instanceof InvalidImageError) {
        throw error;
      }
      
      throw new ImageProcessingError(
        `Failed to load image from URL: ${url}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  private isUrl(source: string): boolean {
    try {
      const url = new URL(source);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private isImagePath(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    return this.config.image.supportedFormats.includes(ext);
  }
}