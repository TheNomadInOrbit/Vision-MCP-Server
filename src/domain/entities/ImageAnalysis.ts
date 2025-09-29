/**
 * Core domain entity representing a vision analysis result
 * This is pure business logic with no external dependencies
 */
export interface ImageAnalysis {
  readonly id: string;
  readonly imageSource: ImageSource;
  readonly model: string;
  readonly analysis: string;
  readonly timestamp: Date;
  readonly metadata?: ImageMetadata;
}

export interface ImageSource {
  readonly type: 'file' | 'url';
  readonly path?: string;
  readonly data?: Buffer;
  readonly url?: string;
  readonly metadata?: ImageMetadata;
}

export interface ImageMetadata {
  readonly width?: number;
  readonly height?: number;
  readonly format?: string;
  readonly size?: number;
  readonly hasAlpha?: boolean;
  readonly colorSpace?: string;
  readonly density?: number;
}

export class ImageAnalysisEntity implements ImageAnalysis {
  constructor(
    public readonly id: string,
    public readonly imageSource: ImageSource,
    public readonly model: string,
    public readonly analysis: string,
    public readonly timestamp: Date,
    public readonly metadata?: ImageMetadata
  ) {}

  static create(
    imageSource: ImageSource,
    model: string,
    analysis: string,
    metadata?: ImageMetadata
  ): ImageAnalysisEntity {
    return new ImageAnalysisEntity(
      crypto.randomUUID(),
      imageSource,
      model,
      analysis,
      new Date(),
      metadata
    );
  }

  isFromFile(): boolean {
    return this.imageSource.type === 'file';
  }

  isFromUrl(): boolean {
    return this.imageSource.type === 'url';
  }
}