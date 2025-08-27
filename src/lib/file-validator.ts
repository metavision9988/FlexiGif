import { ValidationResult } from '@/types';
import { FILE_LIMITS, SUPPORTED_FORMATS, ERROR_MESSAGES } from './constants';

/**
 * Enhanced file validation with comprehensive checks
 */
export function validateFile(file: File): ValidationResult {
  const warnings: string[] = [];

  // Check file size - minimum
  if (file.size < FILE_LIMITS.MIN_SIZE) {
    return {
      valid: false,
      error: ERROR_MESSAGES.FILE_TOO_SMALL
    };
  }

  // Check file size - maximum
  if (file.size > FILE_LIMITS.MAX_SIZE) {
    return {
      valid: false,
      error: ERROR_MESSAGES.FILE_TOO_LARGE
    };
  }

  // Check file type
  if (!SUPPORTED_FORMATS.INPUT.includes(file.type as typeof SUPPORTED_FORMATS.INPUT[number])) {
    return {
      valid: false,
      error: ERROR_MESSAGES.UNSUPPORTED_FORMAT
    };
  }

  // Warning for large files
  if (file.size > 50 * 1024 * 1024) { // 50MB
    warnings.push('큰 파일은 변환 시간이 오래 걸릴 수 있습니다');
  }

  // Warning for very small files
  if (file.size < 100 * 1024) { // 100KB
    warnings.push('작은 파일은 품질이 제한될 수 있습니다');
  }

  return { 
    valid: true, 
    warnings: warnings.length > 0 ? warnings : undefined 
  };
}

/**
 * Validate video metadata after analysis
 */
export function validateVideoMetadata(metadata: {
  duration: number;
  width: number;
  height: number;
}): ValidationResult {
  const warnings: string[] = [];

  // Duration checks
  if (metadata.duration > FILE_LIMITS.MAX_DURATION) {
    return {
      valid: false,
      error: `영상이 ${FILE_LIMITS.MAX_DURATION / 60}분을 초과합니다`
    };
  }

  if (metadata.duration < FILE_LIMITS.MIN_DURATION) {
    return {
      valid: false,
      error: '영상이 너무 짧습니다'
    };
  }

  // Resolution warnings
  if (metadata.width > 1920 || metadata.height > 1080) {
    warnings.push('고해상도 영상은 변환 시간이 오래 걸릴 수 있습니다');
  }

  if (metadata.width < 320 || metadata.height < 240) {
    warnings.push('저해상도 영상은 품질이 제한될 수 있습니다');
  }

  // Long video warning
  if (metadata.duration > 60) { // 1 minute
    warnings.push('긴 영상은 큰 파일이 생성될 수 있습니다');
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Format file size with appropriate units
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${units[i]}`;
}

/**
 * Get file extension from MIME type
 */
export function getFileExtension(mimeType: string): string {
  const extensionMap: Record<string, string> = {
    'video/mp4': 'mp4',
    'video/mov': 'mov',
    'video/avi': 'avi',
  };
  
  return extensionMap[mimeType] || 'mp4';
}