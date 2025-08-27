import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { ConversionEngine, GifSettings, EstimateResult } from '@/types';
import { VideoAnalyzer } from './video-analyzer';

export class GifEngine implements ConversionEngine {
  name = 'gif' as const;
  private ffmpeg: FFmpeg;
  
  constructor() {
    this.ffmpeg = new FFmpeg();
  }
  
  async initialize() {
    if (!this.ffmpeg.loaded) {
      await this.ffmpeg.load({
        coreURL: '/ffmpeg/ffmpeg-core.js',
        wasmURL: '/ffmpeg/ffmpeg-core.wasm'
      });
    }
  }
  
  async convert(file: File, settings: GifSettings): Promise<Blob> {
    await this.initialize();
    
    // Prepare input file
    const inputName = `input.${file.name.split('.').pop()}`;
    await this.ffmpeg.writeFile(inputName, await fetchFile(file));
    
    // Build conversion command
    const command = this.buildCommand(inputName, 'output.gif', settings);
    
    // Execute conversion
    await this.ffmpeg.exec(command);
    
    // Read result
    const gifData = await this.ffmpeg.readFile('output.gif');
    
    // Cleanup
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile('output.gif');
    
    return new Blob([new Uint8Array(gifData as Uint8Array)], { type: 'image/gif' });
  }
  
  buildCommand(input: string, output: string, settings: GifSettings): string[] {
    const cmd = ['-i', input];
    
    // FPS setting
    let videoFilter = `fps=${settings.fps}`;
    
    // Resolution setting
    if (settings.width && settings.height) {
      videoFilter = `fps=${settings.fps},scale=${settings.width}:${settings.height}:flags=lanczos`;
    }
    
    cmd.push('-vf', videoFilter);
    
    // Quality settings (color palette)
    const colors = {
      low: '128',
      medium: '256',
      high: '256'
    };
    
    if (settings.optimize) {
      // 2-pass optimization for better quality
      videoFilter = `${videoFilter},palettegen`;
      cmd[cmd.indexOf('-vf') + 1] = videoFilter;
    }
    
    cmd.push(output);
    return cmd;
  }
  
  async estimate(file: File, settings: GifSettings): Promise<EstimateResult> {
    const analyzer = new VideoAnalyzer();
    const meta = await analyzer.analyze(file);
    
    // Empirical calculation
    const pixelCount = (settings.width || meta.width) * (settings.height || meta.height);
    const frameCount = meta.duration * (settings.fps || 30);
    const estimatedSize = pixelCount * frameCount * 0.5; // bytes per pixel estimate
    
    const estimatedSizeMB = Math.round(estimatedSize / 1024 / 1024);
    
    return {
      estimatedSize: estimatedSizeMB,
      estimatedTime: Math.round(meta.duration * 2), // roughly 2x duration for processing
      warnings: estimatedSize > 50 * 1024 * 1024 ? 
        ['예상 파일 크기가 50MB를 초과합니다'] : []
    };
  }
}