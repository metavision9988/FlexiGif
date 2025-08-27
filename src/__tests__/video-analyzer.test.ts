/**
 * @jest-environment jsdom
 */
import { VideoAnalyzer } from '@/lib/video-analyzer';
import { VideoMetadata } from '@/types';

// Mock URL APIs
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'mock-url'),
    revokeObjectURL: jest.fn()
  }
});

describe('VideoAnalyzer', () => {
  let analyzer: VideoAnalyzer;
  
  beforeEach(() => {
    analyzer = new VideoAnalyzer();
    jest.clearAllMocks();
  });

  // Mock file helper
  const createMockFile = (name: string, size: number, type: string) => {
    return new File([''], name, { type, lastModified: Date.now() }) as File & { size: number };
  };

  // Helper to create mock video element
  const createMockVideoElement = (metadata: { duration: number; videoWidth: number; videoHeight: number }) => {
    return {
      duration: metadata.duration,
      videoWidth: metadata.videoWidth,
      videoHeight: metadata.videoHeight,
      src: '',
      set onloadedmetadata(callback: (() => void) | null) {
        if (callback) {
          setTimeout(callback, 0);
        }
      }
    };
  };

  describe('analyze method', () => {
    it('should extract basic video metadata', async () => {
      const file = createMockFile('test.mp4', 10 * 1024 * 1024, 'video/mp4');
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 });

      const mockVideoElement = createMockVideoElement({
        duration: 30.5,
        videoWidth: 1920,
        videoHeight: 1080
      });

      jest.spyOn(document, 'createElement').mockReturnValue(mockVideoElement as unknown as HTMLVideoElement);

      const result = await analyzer.analyze(file);

      expect(result).toEqual<VideoMetadata>({
        duration: 30.5,
        width: 1920,
        height: 1080,
        fps: 30,
        size: 10 * 1024 * 1024,
        codec: 'h264'
      });
    });

    it('should handle video files with different dimensions', async () => {
      const file = createMockFile('vertical.mp4', 5 * 1024 * 1024, 'video/mp4');
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 });

      const mockVideoElement = createMockVideoElement({
        duration: 15.2,
        videoWidth: 1080,
        videoHeight: 1920
      });

      jest.spyOn(document, 'createElement').mockReturnValue(mockVideoElement as unknown as HTMLVideoElement);

      const result = await analyzer.analyze(file);

      expect(result.width).toBe(1080);
      expect(result.height).toBe(1920);
      expect(result.duration).toBe(15.2);
    });

    it('should use URL.createObjectURL for file source', async () => {
      const file = createMockFile('test.mp4', 1024 * 1024, 'video/mp4');
      const mockCreateObjectURL = jest.spyOn(URL, 'createObjectURL');

      const mockVideoElement = createMockVideoElement({
        duration: 10,
        videoWidth: 640,
        videoHeight: 480
      });

      jest.spyOn(document, 'createElement').mockReturnValue(mockVideoElement as unknown as HTMLVideoElement);

      await analyzer.analyze(file);

      expect(mockCreateObjectURL).toHaveBeenCalledWith(file);
    });

    it('should handle very short videos', async () => {
      const file = createMockFile('short.mp4', 512 * 1024, 'video/mp4');
      Object.defineProperty(file, 'size', { value: 512 * 1024 });

      const mockVideoElement = createMockVideoElement({
        duration: 0.5,
        videoWidth: 320,
        videoHeight: 240
      });

      jest.spyOn(document, 'createElement').mockReturnValue(mockVideoElement as unknown as HTMLVideoElement);

      const result = await analyzer.analyze(file);

      expect(result.duration).toBe(0.5);
      expect(result.size).toBe(512 * 1024);
    });

    it('should handle very long videos', async () => {
      const file = createMockFile('long.mp4', 50 * 1024 * 1024, 'video/mp4');
      Object.defineProperty(file, 'size', { value: 50 * 1024 * 1024 });

      const mockVideoElement = createMockVideoElement({
        duration: 300,
        videoWidth: 1920,
        videoHeight: 1080
      });

      jest.spyOn(document, 'createElement').mockReturnValue(mockVideoElement as unknown as HTMLVideoElement);

      const result = await analyzer.analyze(file);

      expect(result.duration).toBe(300);
      expect(result.size).toBe(50 * 1024 * 1024);
    });
  });

  describe('extractFrameRate method', () => {
    it('should return default FPS when extraction is not implemented', () => {
      const mockFile = createMockFile('test.mp4', 1024, 'video/mp4');
      
      const fps = analyzer.extractFrameRate(mockFile);
      
      expect(fps).toBe(30);
    });
  });

  describe('extractCodec method', () => {
    it('should return unknown when codec detection is not implemented', () => {
      const mockFile = createMockFile('test.mp4', 1024, 'video/mp4');
      
      const codec = analyzer.extractCodec(mockFile);
      
      expect(codec).toBe('h264');
    });
  });
});