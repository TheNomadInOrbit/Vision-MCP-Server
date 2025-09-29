import { AnalyzeImageUseCase } from '../../application/use-cases/AnalyzeImageUseCase.js';
import { 
  AnalyzeImageRequest, 
  ImageAnalysisResult, 
  AvailableModelsResponse 
} from '../../application/dto/ImageAnalysisDto.js';
import { 
  ImageAnalysisError, 
  ImageProcessingError, 
  ImageNotFoundError,
  InvalidImageError
} from '../../domain/errors/DomainErrors.js';
import { Logger } from '../../infrastructure/utils/Logger.js';

/**
 * Controller for handling vision requests
 */
export class ImageAnalysisController {
  constructor(
    private readonly analyzeImageUseCase: AnalyzeImageUseCase,
    private readonly logger: Logger
  ) {}

  /**
   * Handle analyze image tool request
   */
  async analyzeImage(request: AnalyzeImageRequest): Promise<ImageAnalysisResult> {
    try {
      this.logger.info('Processing vision request', 'ImageAnalysisController');

      // Validate request
      if (!request.source) {
        return this.createErrorResponse('INVALID_REQUEST', 'Image source is required');
      }

      // Execute use case
      const result = await this.analyzeImageUseCase.execute(
        request.source,
        request.model,
        request.prompt
      );

      this.logger.info('Vision analysis completed successfully', 'ImageAnalysisController');

      return {
        success: true,
        data: {
          id: result.id,
          analysis: result.analysis,
          model: result.model,
          timestamp: result.timestamp,
          metadata: result.imageSource.metadata,
          source: {
            type: result.imageSource.type,
            path: result.imageSource.path,
          },
        },
      };

    } catch (error) {
      this.logger.error(
        `Vision analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ImageAnalysisController'
      );

      return this.handleError(error);
    }
  }

  /**
   * Get default model (any OpenRouter model can be used)
   */
  async getAvailableModels(): Promise<AvailableModelsResponse> {
    try {
      const defaultModel = this.analyzeImageUseCase.getDefaultModel();

      return {
        models: [], // Empty array since any OpenRouter model can be used
        default: defaultModel,
      };

    } catch (error) {
      this.logger.error(
        `Failed to get available models: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ImageAnalysisController'
      );

      throw error;
    }
  }

  /**
   * Handle errors and convert to appropriate response format
   */
  private handleError(error: unknown): ImageAnalysisResult {
    if (error instanceof ImageNotFoundError) {
      return this.createErrorResponse('IMAGE_NOT_FOUND', error.message);
    }

    if (error instanceof InvalidImageError) {
      return this.createErrorResponse('INVALID_IMAGE', error.message);
    }



    if (error instanceof ImageProcessingError) {
      return this.createErrorResponse('IMAGE_PROCESSING_ERROR', error.message, {
        cause: error.cause?.message,
      });
    }

    if (error instanceof ImageAnalysisError) {
      return this.createErrorResponse('ANALYSIS_ERROR', error.message, {
        cause: error.cause?.message,
      });
    }

    // Generic error
    return this.createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred during vision analysis',
      {
        originalError: error instanceof Error ? error.message : 'Unknown error',
      }
    );
  }

  /**
   * Create standardized error response
   */
  private createErrorResponse(
    code: string, 
    message: string, 
    details?: any
  ): ImageAnalysisResult {
    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
    };
  }
}