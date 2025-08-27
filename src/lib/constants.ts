/**
 * Application constants for FlexiGif
 * Centralized configuration management
 */

// File validation constants
export const FILE_LIMITS = {
  MAX_SIZE: 100 * 1024 * 1024, // 100MB
  MIN_SIZE: 1024, // 1KB
  MAX_DURATION: 300, // 5 minutes
  MIN_DURATION: 0.1, // 0.1 second
} as const;

// Supported formats
export const SUPPORTED_FORMATS = {
  INPUT: ['video/mp4', 'video/mov', 'video/avi'] as const,
  OUTPUT: ['gif', 'webm'] as const,
} as const;

// File extensions mapping
export const FILE_EXTENSIONS = {
  'video/mp4': 'mp4',
  'video/mov': 'mov', 
  'video/avi': 'avi',
} as const;

// Conversion settings
export const CONVERSION_DEFAULTS = {
  GIF: {
    FPS: 15,
    QUALITY: 'medium' as const,
    OPTIMIZE: true,
  },
  WEBM: {
    CRF: 25,
    CODEC: 'vp8' as const,
  },
  TIMEOUT: {
    MIN: 60, // 1 minute
    MAX: 900, // 15 minutes
    MULTIPLIER: 2.5,
  },
} as const;

// UI constants
export const UI_CONSTANTS = {
  PROGRESS: {
    UPDATE_INTERVAL: 100, // ms
    SMOOTH_ANIMATION: 300, // ms
  },
  DEBOUNCE: {
    FILE_VALIDATION: 300, // ms
    SEARCH: 500, // ms
  },
} as const;

// Error messages
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: '파일이 100MB를 초과합니다',
  FILE_TOO_SMALL: '파일이 너무 작습니다',
  UNSUPPORTED_FORMAT: '지원하지 않는 파일 형식입니다',
  CONVERSION_TIMEOUT: '변환 시간이 초과되었습니다',
  MEMORY_ERROR: '메모리 부족으로 변환에 실패했습니다',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다',
} as const;

// Platform specific limits
export const PLATFORM_LIMITS = {
  DISCORD: {
    MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB (Nitro: 100MB)
    SUPPORTED_FORMATS: ['gif', 'webm', 'mp4'],
  },
  TWITTER: {
    MAX_FILE_SIZE: 512 * 1024 * 1024, // 512MB
    SUPPORTED_FORMATS: ['gif', 'mp4'],
  },
  INSTAGRAM: {
    MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
    SUPPORTED_FORMATS: ['gif', 'mp4'],
  },
  FACEBOOK: {
    MAX_FILE_SIZE: 4 * 1024 * 1024 * 1024, // 4GB
    SUPPORTED_FORMATS: ['gif', 'mp4', 'webm'],
  },
} as const;

// Performance monitoring
export const PERFORMANCE_THRESHOLDS = {
  CONVERSION_TIME: {
    FAST: 30, // seconds
    MEDIUM: 120, // seconds
    SLOW: 300, // seconds
  },
  FILE_SIZE_WARNING: 50 * 1024 * 1024, // 50MB
  MEMORY_WARNING: 100 * 1024 * 1024, // 100MB
} as const;