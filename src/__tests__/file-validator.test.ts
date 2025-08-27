import { validateFile } from '@/lib/file-validator';

describe('File Validator', () => {
  // Create mock file helper
  const createMockFile = (name: string, size: number, type: string) => {
    return new File([''], name, { type }) as File & { size: number };
  };

  describe('file size validation', () => {
    it('should accept files under 100MB', () => {
      const file = createMockFile('test.mp4', 50 * 1024 * 1024, 'video/mp4');
      Object.defineProperty(file, 'size', { value: 50 * 1024 * 1024 });
      
      const result = validateFile(file);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject files over 100MB', () => {
      const file = createMockFile('large.mp4', 150 * 1024 * 1024, 'video/mp4');
      Object.defineProperty(file, 'size', { value: 150 * 1024 * 1024 });
      
      const result = validateFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('파일이 100MB를 초과합니다');
    });

    it('should accept files exactly at 100MB limit', () => {
      const file = createMockFile('limit.mp4', 100 * 1024 * 1024, 'video/mp4');
      Object.defineProperty(file, 'size', { value: 100 * 1024 * 1024 });
      
      const result = validateFile(file);
      
      expect(result.valid).toBe(true);
    });
  });

  describe('file type validation', () => {
    const validTypes = ['video/mp4', 'video/mov', 'video/avi'];
    const validSize = 50 * 1024 * 1024;

    it.each(validTypes)('should accept %s files', (type) => {
      const file = createMockFile(`test.${type.split('/')[1]}`, validSize, type);
      Object.defineProperty(file, 'size', { value: validSize });
      
      const result = validateFile(file);
      
      expect(result.valid).toBe(true);
    });

    it('should reject unsupported file types', () => {
      const file = createMockFile('test.txt', validSize, 'text/plain');
      Object.defineProperty(file, 'size', { value: validSize });
      
      const result = validateFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('지원하지 않는 파일 형식입니다');
    });

    it('should reject video files with unsupported mime types', () => {
      const file = createMockFile('test.mkv', validSize, 'video/x-matroska');
      Object.defineProperty(file, 'size', { value: validSize });
      
      const result = validateFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('지원하지 않는 파일 형식입니다');
    });
  });

  describe('edge cases', () => {
    it('should handle empty files', () => {
      const file = createMockFile('empty.mp4', 0, 'video/mp4');
      Object.defineProperty(file, 'size', { value: 0 });
      
      const result = validateFile(file);
      
      expect(result.valid).toBe(false); // 0 size files are invalid now
    });

    it('should handle files with no extension but valid mime type', () => {
      const file = createMockFile('video', 50 * 1024 * 1024, 'video/mp4');
      Object.defineProperty(file, 'size', { value: 50 * 1024 * 1024 });
      
      const result = validateFile(file);
      
      expect(result.valid).toBe(true);
    });
  });
});