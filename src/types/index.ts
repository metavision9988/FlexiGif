export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  size: number;
  codec: string;
}

export interface UserIntent {
  purpose: 'social' | 'website' | 'both' | 'unknown';
  platforms: Platform[];
  quality_preference: 'size' | 'quality' | 'balanced';
}

export interface Platform {
  name: string;
  maxFileSize: number;
  supportedFormats: string[];
}

export interface FormatRecommendation {
  primary: 'gif' | 'webm';
  secondary?: 'gif' | 'webm';
  reason: string;
  warnings: string[];
  estimated_sizes: {
    gif?: string;
    webm?: string;
  };
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface ConversionSettings {
  fps?: number;
  width?: number;
  height?: number;
  quality?: 'low' | 'medium' | 'high';
  optimize?: boolean;
}

export interface GifSettings extends ConversionSettings {
  quality: 'low' | 'medium' | 'high';
  optimize: boolean;
}

export interface WebMSettings extends ConversionSettings {
  crf: number;
  bitrate?: string;
  codec: 'vp8' | 'vp9';
}

export interface EstimateResult {
  estimatedSize: number;
  estimatedTime: number;
  warnings: string[];
}

export interface ConversionResults {
  gif?: Blob;
  webm?: Blob;
  metadata: {
    originalSize: number;
    gifSize: number;
    webmSize: number;
    compressionRatio: {
      gif: number;
      webm: number;
    };
  };
}

export interface ConversionEngine {
  name: 'gif' | 'webm';
  convert(file: File, settings: ConversionSettings): Promise<Blob>;
  estimate(file: File, settings: ConversionSettings): Promise<EstimateResult>;
}

export interface ConversionState {
  file: File | null;
  userIntent: UserIntent | null;
  recommendation: FormatRecommendation | null;
  converting: boolean;
  results: ConversionResults | null;
}