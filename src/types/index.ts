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
  warnings?: string[];
}

// Enhanced error types for better error handling
export type ConversionError = 
  | 'TIMEOUT_ERROR'
  | 'MEMORY_ERROR'
  | 'CODEC_ERROR'
  | 'FILE_SIZE_ERROR'
  | 'INVALID_FORMAT_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface ConversionErrorDetails {
  type: ConversionError;
  message: string;
  context?: Record<string, unknown>;
  timestamp: number;
}

// Quality levels as const for type safety
export const QUALITY_LEVELS = ['low', 'medium', 'high'] as const;
export type QualityLevel = typeof QUALITY_LEVELS[number];

// Conversion time levels as const
export const CONVERSION_TIME_LEVELS = ['fast', 'medium', 'slow'] as const;
export type ConversionTimeLevel = typeof CONVERSION_TIME_LEVELS[number];

export interface ConversionSettings {
  fps?: number;
  width?: number;
  height?: number;
  quality?: QualityLevel;
  optimize?: boolean;
}

export interface GifSettings extends ConversionSettings {
  quality: QualityLevel;
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

export interface QualityPreset {
  name: string;
  label: string;
  description: string;
  webmSettings: Partial<WebMSettings>;
  gifSettings: Partial<GifSettings>;
  estimatedSizeMultiplier: number;
  conversionTime: ConversionTimeLevel;
}

export interface ConversionState {
  file: File | null;
  userIntent: UserIntent | null;
  recommendation: FormatRecommendation | null;
  selectedQuality: QualityPreset | null;
  converting: boolean;
  results: ConversionResults | null;
}