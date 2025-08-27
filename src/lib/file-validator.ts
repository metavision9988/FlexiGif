import { ValidationResult } from '@/types';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const SUPPORTED_MIME_TYPES = ['video/mp4', 'video/mov', 'video/avi'];

export function validateFile(file: File): ValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: '파일이 100MB를 초과합니다'
    };
  }

  // Check file type
  if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: '지원하지 않는 파일 형식입니다'
    };
  }

  return { valid: true };
}