import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { ConversionEngine, WebMSettings, EstimateResult } from '@/types';

export class WebMEngine implements ConversionEngine {
  name = 'webm' as const;
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
  
  async convert(file: File, settings: WebMSettings): Promise<Blob> {
    await this.initialize();

    this.ffmpeg.on('log', ({ message }) => {
      console.log('[FFMPEG-WEBM]:', message);
    });
    
    const inputName = `input.${file.name.split('.').pop()}`;
    await this.ffmpeg.writeFile(inputName, await fetchFile(file));
    
    const command = this.buildCommand(inputName, 'output.webm', settings);
    
    await this.ffmpeg.exec(command);
    
    const webmData = await this.ffmpeg.readFile('output.webm');
    
    // Cleanup
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile('output.webm');
    
    return new Blob([new Uint8Array(webmData as Uint8Array)], { type: 'video/webm' });
  }
  
  buildCommand(input: string, output: string, settings: WebMSettings): string[] {
    const cmd = ['-i', input];
    
    // Video codec settings
    if (settings.codec === 'vp9') {
      cmd.push('-c:v', 'libvpx-vp9');
      cmd.push('-crf', settings.crf.toString());
      cmd.push('-b:v', '0'); // VBR mode
    } else {
      cmd.push('-c:v', 'libvpx');
      if (settings.bitrate) {
        cmd.push('-b:v', settings.bitrate);
      }
    }
    
    // Remove audio (for GIF replacement use case)
    cmd.push('-an');
    
    // Build video filters
    const filters = [];
    
    // Resolution settings
    if (settings.width && settings.height) {
      filters.push(`scale=${settings.width}:${settings.height}`);
    }
    
    // FPS settings  
    if (settings.fps) {
      filters.push(`fps=${settings.fps}`);
    }
    
    // Add video filter if any filters exist
    if (filters.length > 0) {
      cmd.push('-vf', filters.join(','));
    }
    
    cmd.push(output);
    return cmd;
  }
  
  async estimate(file: File, settings: WebMSettings): Promise<EstimateResult> {
    // Simplified estimation - WebM is typically 40-70% of original size
    const compressionRatio = settings.crf > 35 ? 0.4 : settings.crf > 25 ? 0.6 : 0.7;
    const estimatedSize = Math.round((file.size * compressionRatio) / 1024 / 1024);
    
    // Processing time estimate based on file size and codec
    const baseTime = Math.round(file.size / (1024 * 1024)); // 1 second per MB base
    const codecMultiplier = settings.codec === 'vp9' ? 2 : 1.5; // VP9 is slower
    const estimatedTime = Math.round(baseTime * codecMultiplier);
    
    return {
      estimatedSize,
      estimatedTime,
      warnings: estimatedSize > 100 ? ['WebM 파일이 100MB를 초과할 수 있습니다'] : []
    };
  }
}