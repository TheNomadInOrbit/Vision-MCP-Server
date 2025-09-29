import { ImageMetadata } from '../../domain/entities/ImageAnalysis.js';

/**
 * Request DTO for vision analysis
 */
export interface AnalyzeImageRequest {
  source: string;
  model?: string;
  prompt?: string;
}

/**
 * Response DTO for successful vision analysis
 */
export interface AnalyzeImageResponse {
  success: true;
  data: {
    id: string;
    analysis: string;
    model: string;
    timestamp: Date;
    metadata?: ImageMetadata;
    source: {
      type: 'file' | 'url';
      path?: string;
    };
  };
}

/**
 * Response DTO for failed vision analysis
 */
export interface AnalyzeImageErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Union type for all possible responses
 */
export type ImageAnalysisResult = AnalyzeImageResponse | AnalyzeImageErrorResponse;

/**
 * DTO for available models response
 */
export interface AvailableModelsResponse {
  models: string[];
  default: string;
}