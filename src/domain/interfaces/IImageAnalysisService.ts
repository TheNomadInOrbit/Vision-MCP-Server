import { ImageAnalysis, ImageSource } from '../entities/ImageAnalysis.js';

/**
 * Domain interface for vision analysis service
 * Defines the contract for analyzing images without implementation details
 */
export interface IImageAnalysisService {
  /**
   * Analyzes an image and returns the analysis result
   * @param imageSource The source of the image to analyze
   * @param model The AI model to use for analysis (optional)
   * @param prompt Custom prompt for analysis (optional)
   * @returns Promise resolving to vision analysis result
   */
  analyzeImage(
    imageSource: ImageSource,
    model?: string,
    prompt?: string
  ): Promise<ImageAnalysis>;

  /**
   * Gets the default model for analysis
   * @returns The default model name
   */
  getDefaultModel(): string;
}