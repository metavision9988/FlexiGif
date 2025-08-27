import { WebMEngine } from '@/lib/webm-engine';
import { WebMSettings } from '@/types';

// Mock FFmpeg
const mockFFmpeg = {
  loaded: false,
  on: jest.fn(),
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

describe('WebMEngine', () => {
  let engine: WebMEngine;
  
  beforeEach(() => {
    engine = new WebMEngine();
    jest.clearAllMocks();
    mockFFmpeg.loaded = false;
  });

  describe('constructor', () => {
    it('should create engine with correct name', () => {
      expect(engine.name).toBe('webm');
    });
  });

  describe('buildCommand method', () => {
    it('should build correct FFmpeg command for VP9 codec', () => {
      const settings: WebMSettings = {
        crf: 30,
        codec: 'vp9',
        fps: 30
      };

      const command = engine.buildCommand('input.mp4', 'output.webm', settings);

      expect(command).toContain('-i');
      expect(command).toContain('input.mp4');
      expect(command).toContain('-c:v');
      expect(command).toContain('libvpx-vp9');
      expect(command).toContain('-crf');
      expect(command).toContain('30');
      expect(command).toContain('-b:v');
      expect(command).toContain('0'); // VBR mode
      expect(command).toContain('-an'); // no audio
      expect(command).toContain('output.webm');
    });

    it('should build correct FFmpeg command for VP8 codec', () => {
      const settings: WebMSettings = {
        crf: 25,
        codec: 'vp8',
        bitrate: '1M'
      };

      const command = engine.buildCommand('input.mp4', 'output.webm', settings);

      expect(command).toContain('-c:v');
      expect(command).toContain('libvpx');
      expect(command).not.toContain('libvpx-vp9');
      expect(command).toContain('-b:v');
      expect(command).toContain('1M');
    });

    it('should include scale parameters when dimensions provided', () => {
      const settings: WebMSettings = {
        crf: 28,
        codec: 'vp9',
        width: 1280,
        height: 720
      };

      const command = engine.buildCommand('input.mp4', 'output.webm', settings);

      expect(command).toContain('-vf');
      const vfIndex = command.indexOf('-vf');
      const filterValue = command[vfIndex + 1];
      expect(filterValue).toContain('scale=1280:720');
    });

    it('should include FPS setting when provided', () => {
      const settings: WebMSettings = {
        crf: 30,
        codec: 'vp9',
        fps: 24
      };

      const command = engine.buildCommand('input.mp4', 'output.webm', settings);

      expect(command).toContain('-vf');
      const vfIndex = command.indexOf('-vf');
      const filterValue = command[vfIndex + 1];
      expect(filterValue).toContain('fps=24');
    });

    it('should combine scale and fps filters correctly', () => {
      const settings: WebMSettings = {
        crf: 28,
        codec: 'vp9',
        width: 800,
        height: 600,
        fps: 25
      };

      const command = engine.buildCommand('input.mp4', 'output.webm', settings);

      expect(command).toContain('-vf');
      const vfIndex = command.indexOf('-vf');
      const filterValue = command[vfIndex + 1];
      expect(filterValue).toContain('scale=800:600');
      expect(filterValue).toContain('fps=25');
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