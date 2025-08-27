import { RecommendationEngine } from '@/lib/recommendation-engine';
import { UserIntent, VideoMetadata, FormatRecommendation } from '@/types';

describe('RecommendationEngine', () => {
  let engine: RecommendationEngine;
  
  beforeEach(() => {
    engine = new RecommendationEngine();
  });

  const createMockVideoMeta = (overrides: Partial<VideoMetadata> = {}): VideoMetadata => ({
    duration: 10,
    width: 1920,
    height: 1080,
    fps: 30,
    size: 10 * 1024 * 1024,
    codec: 'h264',
    ...overrides
  });

  describe('analyze method - social media focus', () => {
    it('should recommend GIF as primary for social media', () => {
      const intent: UserIntent = {
        purpose: 'social',
        platforms: [],
        quality_preference: 'balanced'
      };
      const videoMeta = createMockVideoMeta();

      const result = engine.analyze(intent, videoMeta);

      expect(result.primary).toBe('gif');
      expect(result.secondary).toBe('webm');
      expect(result.reason).toContain('SNS 최대 호환성');
    });

    it('should warn about Discord when Discord is in platforms for social', () => {
      const intent: UserIntent = {
        purpose: 'social',
        platforms: [{ name: 'discord', maxFileSize: 8 * 1024 * 1024, supportedFormats: ['gif', 'webm'] }],
        quality_preference: 'balanced'
      };
      const videoMeta = createMockVideoMeta();

      const result = engine.analyze(intent, videoMeta);

      expect(result.warnings).toContain('Discord에서는 WebM이 더 좋은 품질을 제공합니다');
    });

    it('should not warn about Discord when Discord is not in platforms', () => {
      const intent: UserIntent = {
        purpose: 'social',
        platforms: [{ name: 'twitter', maxFileSize: 15 * 1024 * 1024, supportedFormats: ['gif'] }],
        quality_preference: 'balanced'
      };
      const videoMeta = createMockVideoMeta();

      const result = engine.analyze(intent, videoMeta);

      expect(result.warnings).not.toContain('Discord에서는 WebM이 더 좋은 품질을 제공합니다');
    });
  });

  describe('analyze method - website focus', () => {
    it('should recommend WebM as primary for website', () => {
      const intent: UserIntent = {
        purpose: 'website',
        platforms: [],
        quality_preference: 'balanced'
      };
      const videoMeta = createMockVideoMeta();

      const result = engine.analyze(intent, videoMeta);

      expect(result.primary).toBe('webm');
      expect(result.secondary).toBe('gif');
      expect(result.reason).toContain('웹사이트 최적화');
    });

    it('should warn about long videos for website purpose', () => {
      const intent: UserIntent = {
        purpose: 'website',
        platforms: [],
        quality_preference: 'balanced'
      };
      const videoMeta = createMockVideoMeta({ duration: 15 }); // 15 seconds

      const result = engine.analyze(intent, videoMeta);

      expect(result.warnings).toContain('10초 이상 영상은 파일이 클 수 있습니다');
    });

    it('should not warn about short videos for website purpose', () => {
      const intent: UserIntent = {
        purpose: 'website',
        platforms: [],
        quality_preference: 'balanced'
      };
      const videoMeta = createMockVideoMeta({ duration: 5 }); // 5 seconds

      const result = engine.analyze(intent, videoMeta);

      expect(result.warnings).not.toContain('10초 이상 영상은 파일이 클 수 있습니다');
    });
  });

  describe('analyze method - both formats needed', () => {
    it('should recommend both formats when purpose is both', () => {
      const intent: UserIntent = {
        purpose: 'both',
        platforms: [],
        quality_preference: 'balanced'
      };
      const videoMeta = createMockVideoMeta();

      const result = engine.analyze(intent, videoMeta);

      expect(result.primary).toBe('gif');
      expect(result.secondary).toBe('webm');
      expect(result.reason).toContain('두 포맷 모두 생성을 추천합니다');
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle unknown purpose by defaulting to both formats', () => {
      const intent: UserIntent = {
        purpose: 'unknown',
        platforms: [],
        quality_preference: 'balanced'
      };
      const videoMeta = createMockVideoMeta();

      const result = engine.analyze(intent, videoMeta);

      expect(result.primary).toBe('gif');
      expect(result.secondary).toBe('webm');
    });
  });

  describe('size estimation', () => {
    it('should include estimated sizes for both formats', () => {
      const intent: UserIntent = {
        purpose: 'both',
        platforms: [],
        quality_preference: 'balanced'
      };
      const videoMeta = createMockVideoMeta({
        duration: 20,
        width: 1920,
        height: 1080,
        fps: 30,
        size: 50 * 1024 * 1024
      });

      const result = engine.analyze(intent, videoMeta);

      expect(result.estimated_sizes.gif).toBeDefined();
      expect(result.estimated_sizes.webm).toBeDefined();
      expect(result.estimated_sizes.gif).toMatch(/\d+MB/);
      expect(result.estimated_sizes.webm).toMatch(/\d+MB/);
    });
  });

  describe('estimateGifSize method', () => {
    it('should calculate GIF size based on video metadata', () => {
      const videoMeta = createMockVideoMeta({
        duration: 10,
        width: 1920,
        height: 1080,
        fps: 30
      });

      const result = engine.estimateGifSize(videoMeta);

      expect(result).toMatch(/^\d+MB$/);
      // For 1920x1080x30fps x 10sec, should be significant size
      const sizeNumber = parseInt(result);
      expect(sizeNumber).toBeGreaterThan(0);
    });

    it('should scale with video duration', () => {
      const shortVideo = createMockVideoMeta({ duration: 5 });
      const longVideo = createMockVideoMeta({ duration: 20 });

      const shortSize = engine.estimateGifSize(shortVideo);
      const longSize = engine.estimateGifSize(longVideo);

      const shortSizeNum = parseInt(shortSize);
      const longSizeNum = parseInt(longSize);

      expect(longSizeNum).toBeGreaterThan(shortSizeNum);
    });
  });

  describe('estimateWebMSize method', () => {
    it('should estimate WebM as percentage of original size', () => {
      const videoMeta = createMockVideoMeta({
        duration: 10, // 10 seconds
        size: 100 * 1024 * 1024 // 100MB
      });

      const result = engine.estimateWebMSize(videoMeta);

      const sizeNumber = parseInt(result);
      expect(sizeNumber).toBeGreaterThan(0);
      expect(sizeNumber).toBeLessThan(100); // Should be less than original
    });

    it('should use different ratios for long vs short videos', () => {
      const shortVideo = createMockVideoMeta({ 
        duration: 5,
        size: 100 * 1024 * 1024 
      });
      const longVideo = createMockVideoMeta({ 
        duration: 15,
        size: 100 * 1024 * 1024 
      });

      const shortSize = engine.estimateWebMSize(shortVideo);
      const longSize = engine.estimateWebMSize(longVideo);

      const shortSizeNum = parseInt(shortSize);
      const longSizeNum = parseInt(longSize);

      // Long videos should have higher compression ratio (larger size)
      expect(longSizeNum).toBeGreaterThan(shortSizeNum);
    });
  });
});