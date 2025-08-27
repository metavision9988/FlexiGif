/**
 * @jest-environment jsdom
 */
import { GifEngine } from '@/lib/gif-engine';
import { GifSettings, EstimateResult } from '@/types';

// Mock FFmpeg
const mockFFmpeg = {
  loaded: false,
  load: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  exec: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
  deleteFile: jest.fn().mockResolvedValue(undefined)
};

jest.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: jest.fn(() => mockFFmpeg)
}));

jest.mock('@ffmpeg/util', () => ({
  fetchFile: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4]))
}));

// Mock URL for video analyzer
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'mock-url'),
    revokeObjectURL: jest.fn()
  }
});

// Mock VideoAnalyzer
jest.mock('@/lib/video-analyzer', () => ({
  VideoAnalyzer: jest.fn().mockImplementation(() => ({
    analyze: jest.fn().mockResolvedValue({
      duration: 10,
      width: 1920,
      height: 1080,
      fps: 30,
      size: 10 * 1024 * 1024,
      codec: 'h264'
    })
  }))
}));

describe('GifEngine', () => {
  let engine: GifEngine;
  
  beforeEach(() => {
    engine = new GifEngine();
    jest.clearAllMocks();
    mockFFmpeg.loaded = false;
  });

  const createMockFile = (name: string, size: number, type: string) => {
    return new File([''], name, { type, lastModified: Date.now() }) as File & { size: number };
  };

  describe('constructor', () => {
    it('should create engine with correct name', () => {
      expect(engine.name).toBe('gif');
    });
  });

  describe('initialize method', () => {
    it('should load FFmpeg if not already loaded', async () => {
      mockFFmpeg.loaded = false;

      await engine.initialize();

      expect(mockFFmpeg.load).toHaveBeenCalledWith({
        coreURL: '/ffmpeg/ffmpeg-core.js',
        wasmURL: '/ffmpeg/ffmpeg-core.wasm'
      });
    });

    it('should not load FFmpeg if already loaded', async () => {
      mockFFmpeg.loaded = true;

      await engine.initialize();

      expect(mockFFmpeg.load).not.toHaveBeenCalled();
    });
  });

  describe('convert method', () => {
    it('should convert file to GIF blob', async () => {
      const file = createMockFile('test.mp4', 1024 * 1024, 'video/mp4');
      const settings: GifSettings = {
        fps: 15,
        quality: 'medium',
        optimize: true
      };

      const result = await engine.convert(file, settings);

      expect(mockFFmpeg.writeFile).toHaveBeenCalled();
      expect(mockFFmpeg.exec).toHaveBeenCalled();
      expect(mockFFmpeg.readFile).toHaveBeenCalledWith('output.gif');
      expect(mockFFmpeg.deleteFile).toHaveBeenCalledTimes(2);
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('image/gif');
    });

    it('should handle different quality settings', async () => {
      const file = createMockFile('test.mp4', 1024 * 1024, 'video/mp4');
      const settings: GifSettings = {
        fps: 30,
        quality: 'high',
        optimize: false
      };

      await engine.convert(file, settings);

      expect(mockFFmpeg.exec).toHaveBeenCalled();
    });

    it('should handle custom dimensions', async () => {
      const file = createMockFile('test.mp4', 1024 * 1024, 'video/mp4');
      const settings: GifSettings = {
        fps: 24,
        width: 800,
        height: 600,
        quality: 'medium',
        optimize: true
      };

      await engine.convert(file, settings);

      expect(mockFFmpeg.exec).toHaveBeenCalled();
      // Command should include scale parameters
      const execCall = mockFFmpeg.exec.mock.calls[0][0];
      expect(execCall).toEqual(expect.arrayContaining(['-vf']));
    });
  });

  describe('buildCommand method', () => {
    it('should build correct FFmpeg command for basic settings', () => {
      const settings: GifSettings = {
        fps: 15,
        quality: 'medium',
        optimize: false
      };

      const command = engine.buildCommand('input.mp4', 'output.gif', settings);

      expect(command).toContain('-i');
      expect(command).toContain('input.mp4');
      expect(command).toContain('-vf');
      expect(command).toContain('fps=15');
      expect(command).toContain('output.gif');
    });

    it('should include scale parameters when dimensions provided', () => {
      const settings: GifSettings = {
        fps: 30,
        width: 640,
        height: 480,
        quality: 'high',
        optimize: false
      };

      const command = engine.buildCommand('input.mp4', 'output.gif', settings);

      expect(command).toContain('-vf');
      const vfIndex = command.indexOf('-vf');
      const filterValue = command[vfIndex + 1];
      expect(filterValue).toContain('scale=640:480');
    });

    it('should handle optimization flag', () => {
      const settings: GifSettings = {
        fps: 24,
        quality: 'medium',
        optimize: true
      };

      const command = engine.buildCommand('input.mp4', 'output.gif', settings);

      expect(command).toContain('-vf');
      const vfIndex = command.indexOf('-vf');
      const filterValue = command[vfIndex + 1];
      expect(filterValue).toContain('palettegen');
    });
  });

  describe('estimate method', () => {
    it('should return estimation result with size and time', async () => {
      const file = createMockFile('test.mp4', 10 * 1024 * 1024, 'video/mp4');
      const settings: GifSettings = {
        fps: 15,
        quality: 'medium',
        optimize: false
      };

      // VideoAnalyzer is already mocked globally

      const result = await engine.estimate(file, settings);

      expect(result.estimatedSize).toBeGreaterThan(0);
      expect(result.estimatedTime).toBeGreaterThan(0);
      expect(result.warnings).toBeInstanceOf(Array);
    });

    it('should warn about large file sizes', async () => {
      const file = createMockFile('large.mp4', 100 * 1024 * 1024, 'video/mp4');
      const settings: GifSettings = {
        fps: 30,
        width: 1920,
        height: 1080,
        quality: 'high',
        optimize: false
      };

      // Create a large file scenario that would result in >50MB GIF
      const result = await engine.estimate(file, settings);

      if (result.estimatedSize > 50) {
        expect(result.warnings).toContain('예상 파일 크기가 50MB를 초과합니다');
      }
    });
  });
});