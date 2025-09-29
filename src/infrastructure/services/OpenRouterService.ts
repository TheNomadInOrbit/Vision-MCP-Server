import fetch from 'node-fetch';
import sharp from 'sharp';
import { IImageAnalysisService } from '../../domain/interfaces/IImageAnalysisService.js';
import { ImageAnalysis, ImageAnalysisEntity, ImageSource } from '../../domain/entities/ImageAnalysis.js';
import { ImageAnalysisError } from '../../domain/errors/DomainErrors.js';
import { AppConfig } from '../config/AppConfig.js';
import { Logger } from '../utils/Logger.js';

/**
 * OpenRouter API response interface
 */
interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenRouter service implementation for vision analysis
 */
export class OpenRouterService implements IImageAnalysisService {

  constructor(
    private readonly config: AppConfig,
    private readonly logger: Logger
  ) {}

  async analyzeImage(
    imageSource: ImageSource,
    model?: string,
    prompt?: string
  ): Promise<ImageAnalysis> {
    const selectedModel = model || this.config.openRouter.defaultModel;

    try {
      this.logger.info(`Starting vision analysis with model: ${selectedModel}`);
      
      const base64Image = await this.prepareImageForAPI(imageSource);
      const analysisPrompt = prompt || 'Analyze this image and describe what you see in detail.';
      
      const response = await this.callOpenRouterAPI(base64Image, analysisPrompt, selectedModel);
      
      const analysis = response.choices[0]?.message?.content;
      if (!analysis) {
        throw new ImageAnalysisError('No analysis content received from API');
      }

      this.logger.info(`Vision analysis completed successfully`);
      
      return ImageAnalysisEntity.create(
        imageSource,
        selectedModel,
        analysis
      );

    } catch (error) {
      this.logger.error(`Vision analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      if (error instanceof ImageAnalysisError) {
        throw error;
      }
      
      throw new ImageAnalysisError(
        `OpenRouter API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get the default model
   */
  getDefaultModel(): string {
    return this.config.openRouter.defaultModel;
  }

  private async prepareImageForAPI(imageSource: ImageSource): Promise<string> {
    if (!imageSource.data) {
      throw new ImageAnalysisError('Image data is required for analysis');
    }

    // Get image metadata
    const metadata = await sharp(imageSource.data).metadata();
    
    // Calculate dimensions to keep base64 size reasonable
    const MAX_DIMENSION = 1024; // Increased for better quality
    const JPEG_QUALITY = 80; // Increased quality
    let resizedBuffer = imageSource.data;
    
    if (metadata.width && metadata.height) {
      const largerDimension = Math.max(metadata.width, metadata.height);
      if (largerDimension > MAX_DIMENSION) {
        const resizeOptions = metadata.width > metadata.height
          ? { width: MAX_DIMENSION }
          : { height: MAX_DIMENSION };
        
        resizedBuffer = await sharp(imageSource.data)
          .resize(resizeOptions)
          .jpeg({ quality: JPEG_QUALITY })
          .toBuffer();
      } else {
        resizedBuffer = await sharp(imageSource.data)
          .jpeg({ quality: JPEG_QUALITY })
          .toBuffer();
      }
    }

    const base64String = resizedBuffer.toString('base64');
    
    // OpenRouter expects data URL format for all models
    return `data:image/jpeg;base64,${base64String}`;
  }

  private detectMimeType(buffer: Buffer): string {
    // Check bytes to determine image format
    const header = buffer.subarray(0, 12);
    
    if (header[0] === 0xFF && header[1] === 0xD8) return 'image/jpeg';
    if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) return 'image/png';
    if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46) return 'image/gif';
    if (header[0] === 0x42 && header[1] === 0x4D) return 'image/bmp';
    if (header.includes(Buffer.from('WEBP'))) return 'image/webp';
    
    // Default to JPEG if unknown
    return 'image/jpeg';
  }

  private async callOpenRouterAPI(
    base64Image: string,
    prompt: string,
    model: string
  ): Promise<OpenRouterResponse> {
    // OpenRouter uses a standardized format for all models
    const requestBody = {
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: base64Image,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    };

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.openRouter.timeout);

    try {
      const response = await fetch(`${this.config.openRouter.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.openRouter.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': this.config.openRouter.httpReferer,
          'X-Title': 'Vision MCP Server',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
      }

      const data = await response.json() as OpenRouterResponse;
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No choices returned from OpenRouter API');
      }

      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.openRouter.timeout}ms`);
      }
      throw error;
    }
  }
}