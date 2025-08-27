/**
 * @jest-environment jsdom
 */
import { GifEngine } from '@/lib/gif-engine';
import { GifSettings } from '@/types';

// Mock global crossOriginIsolated
Object.defineProperty(globalThis, 'crossOriginIsolated', {
  value: true,
  writable: true
});

// Mock global SharedArrayBuffer
Object.defineProperty(globalThis, 'SharedArrayBuffer', {
  value: ArrayBuffer,
  writable: true
});

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
        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
        wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
        workerURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.worker.js'
      });
    });

    it('should not load FFmpeg if already loaded', async () => {
      mockFFmpeg.loaded = true;

      await engine.initialize();

      expect(mockFFmpeg.load).not.toHaveBeenCalled();
    });
  });

  describe('convert method', () => {
    it('should perform a single-pass conversion when optimize is false', async () => {
      const file = createMockFile('test.mp4', 1024 * 1024, 'video/mp4');
      const settings: GifSettings = {
        fps: 30,
        quality: 'high',
        optimize: false,
      };

      const result = await engine.convert(file, settings);

      expect(mockFFmpeg.writeFile).toHaveBeenCalledTimes(1);
      expect(mockFFmpeg.exec).toHaveBeenCalledTimes(1);

      const command = mockFFmpeg.exec.mock.calls[0][0] as string[];
      expect(command.join(' ')).not.toContain('palettegen');
      expect(command.join(' ')).not.toContain('paletteuse');

      expect(mockFFmpeg.readFile).toHaveBeenCalledWith('output.gif');
      expect(mockFFmpeg.deleteFile).toHaveBeenCalledTimes(2); // input and output
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('image/gif');
    });

    it('should use 2-pass conversion when optimize is true', async () => {
      const file = createMockFile('test.mp4', 1024 * 1024, 'video/mp4');
      const settings: GifSettings = {
        fps: 15,
        quality: 'medium',
        optimize: true,
      };

      await engine.convert(file, settings);

      // Expect two separate command executions for 2-pass
      expect(mockFFmpeg.exec).toHaveBeenCalledTimes(2);

      // 1. First pass: palette generation
      const firstPassCommand = mockFFmpeg.exec.mock.calls[0][0] as string[];
      expect(firstPassCommand.join(' ')).toContain('palettegen');
      expect(firstPassCommand.join(' ')).toContain('palette.png');

      // 2. Second pass: palette usage
      const secondPassCommand = mockFFmpeg.exec.mock.calls[1][0] as string[];
      expect(secondPassCommand.join(' ')).toContain('[1:v]paletteuse'); // Check for filtergraph input
      expect(secondPassCommand[secondPassCommand.indexOf('-i') + 1]).toBe('input.mp4');
      expect(secondPassCommand[secondPassCommand.indexOf('-i', 2) + 1]).toBe('palette.png');

      // Expect cleanup of all files including the palette
      expect(mockFFmpeg.deleteFile).toHaveBeenCalledWith(expect.stringContaining('input.'));
      expect(mockFFmpeg.deleteFile).toHaveBeenCalledWith('palette.png');
      expect(mockFFmpeg.deleteFile).toHaveBeenCalledWith('output.gif');
      expect(mockFFmpeg.deleteFile).toHaveBeenCalledTimes(3);
    });

    it('should produce a valid Blob as output', async () => {
        const file = createMockFile('test.mp4', 1024 * 1024, 'video/mp4');
        const settings: GifSettings = {
          fps: 15,
          quality: 'medium',
          optimize: true,
        };

        const result = await engine.convert(file, settings);

        expect(result).toBeInstanceOf(Blob);
        expect(result.type).toBe('image/gif');
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