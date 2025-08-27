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
    const inputName = `input.${file.name.split('.').pop() || 'mp4'}`;
    await this.ffmpeg.writeFile(inputName, await fetchFile(file));

    if (settings.optimize) {
      // --- 2-Pass Conversion for Higher Quality ---
      const paletteName = 'palette.png';

      // 1. First Pass: Generate color palette
      const filters: string[] = [];
      filters.push(`fps=${settings.fps}`);
      if (settings.width && settings.height) {
        filters.push(`scale=${settings.width}:${settings.height}:flags=lanczos`);
      }

      const paletteGenCommand = [
        '-i', inputName,
        '-vf', `${filters.join(',')},palettegen`,
        paletteName
      ];
      await this.ffmpeg.exec(paletteGenCommand);

      // 2. Second Pass: Use palette to create GIF
      const gifCommand = [
        '-i', inputName,
        '-i', paletteName,
        '-filter_complex', `[0:v]${filters.join(',')}[v];[v][1:v]paletteuse`,
        'output.gif'
      ];
      await this.ffmpeg.exec(gifCommand);

      // 3. Cleanup
      const gifData = await this.ffmpeg.readFile('output.gif');
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(paletteName);
      await this.ffmpeg.deleteFile('output.gif');

      return new Blob([new Uint8Array(gifData as Uint8Array)], { type: 'image/gif' });

    } else {
      // --- 1-Pass Conversion for Speed ---
      const filters: string[] = [];
      filters.push(`fps=${settings.fps}`);
      if (settings.width && settings.height) {
        filters.push(`scale=${settings.width}:${settings.height}:flags=lanczos`);
      }

      const command = ['-i', inputName];
      if (filters.length > 0) {
        command.push('-vf', filters.join(','));
      }
      command.push('output.gif');

      await this.ffmpeg.exec(command);

      const gifData = await this.ffmpeg.readFile('output.gif');
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile('output.gif');

      return new Blob([new Uint8Array(gifData as Uint8Array)], { type: 'image/gif' });
    }
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