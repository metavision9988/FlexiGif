import { GifEngine } from '@/lib/gif-engine';
import { GifSettings } from '@/types';

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

describe('GifEngine', () => {
  let engine: GifEngine;
  
  beforeEach(() => {
    engine = new GifEngine();
    jest.clearAllMocks();
    mockFFmpeg.loaded = false;
  });

  describe('constructor', () => {
    it('should create engine with correct name', () => {
      expect(engine.name).toBe('gif');
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
      expect(command).toContain('output.gif');
      
      const vfIndex = command.indexOf('-vf');
      const filterValue = command[vfIndex + 1];
      expect(filterValue).toContain('fps=15');
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

      const vfIndex = command.indexOf('-vf');
      const filterValue = command[vfIndex + 1];
      expect(filterValue).toContain('fps=30');
      expect(filterValue).toContain('scale=640:480');
      expect(filterValue).toContain('flags=lanczos');
    });

    it('should handle optimization flag', () => {
      const settings: GifSettings = {
        fps: 24,
        quality: 'medium',
        optimize: true
      };

      const command = engine.buildCommand('input.mp4', 'output.gif', settings);

      const vfIndex = command.indexOf('-vf');
      const filterValue = command[vfIndex + 1];
      expect(filterValue).toContain('fps=24');
      expect(filterValue).toContain('palettegen');
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
});