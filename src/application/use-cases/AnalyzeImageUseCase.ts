import { IImageProcessor } from '../../domain/interfaces/IImageProcessor.js';
import { IImageAnalysisService } from '../../domain/interfaces/IImageAnalysisService.js';
import { ImageAnalysis } from '../../domain/entities/ImageAnalysis.js';
import { AppConfig } from '../../infrastructure/config/AppConfig.js';
import { 
  ImageProcessingError, 
  ImageAnalysisError 
} from '../../domain/errors/DomainErrors.js';

/**
 * Use case for analyzing images
 * Orchestrates the vision analysis workflow
 */
export class AnalyzeImageUseCase {
  constructor(
    private readonly imageProcessor: IImageProcessor,
    private readonly imageAnalysisService: IImageAnalysisService,
    private readonly config: AppConfig
  ) {}

  /**
   * Execute vision analysis
   */
  async execute(
    source: string,
    model?: string,
    prompt?: string
  ): Promise<ImageAnalysis> {
    try {
      // Load and validate image
      const imageSource = await this.imageProcessor.loadImage(source);
      
      if (!imageSource.data) {
        throw new ImageProcessingError('Failed to load image data');
      }

      // Validate image format and size
      const isValid = await this.imageProcessor.validateImage(imageSource.data);
      if (!isValid) {
        throw new ImageProcessingError('Invalid image format or size');
      }

      // Perform analysis
      const analysis = await this.imageAnalysisService.analyzeImage(
        imageSource,
        model,
        prompt
      );

      return analysis;

    } catch (error) {
      if (error instanceof ImageProcessingError || 
          error instanceof ImageAnalysisError) {
        throw error;
      }

      throw new ImageAnalysisError(
        'Unexpected error during vision analysis',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get default model
   */
  getDefaultModel(): string {
    return this.config.openRouter.defaultModel;
  }
}