import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { ConversionEngine, WebMSettings, EstimateResult } from '@/types';

export class WebMEngine implements ConversionEngine {
  name = 'webm' as const;
  private ffmpeg: FFmpeg;
  private progressCallback?: (progress: number) => void;
  
  constructor() {
    this.ffmpeg = new FFmpeg();
  }
  
  setProgressCallback(callback: (progress: number) => void) {
    this.progressCallback = callback;
    this.ffmpeg.on('progress', ({ progress }) => {
      callback(Math.round(progress * 100));
    });
  }
  
  async initialize() {
    if (!this.ffmpeg.loaded) {
      try {
        await this.ffmpeg.load({
          coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
          wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
          workerURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.worker.js'
        });
      } catch (error) {
        throw new Error(`FFmpeg 초기화 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
  
  async convert(file: File, settings: WebMSettings): Promise<Blob> {
    console.log('WebM 변환 시작:', file.name, file.size);
    await this.initialize();
    console.log('WebM FFmpeg 초기화 완료');
    
    const extension = file.name.split('.').pop();
    const inputName = `input.${extension && extension.length > 0 ? extension : 'mp4'}`;
    console.log('WebM 파일 쓰기 시작:', inputName);
    await this.ffmpeg.writeFile(inputName, await fetchFile(file));
    console.log('WebM 파일 쓰기 완료');
    
    const command = this.buildCommand(inputName, 'output.webm', settings);
    console.log('WebM 변환 명령:', command);
    
    console.log('WebM FFmpeg 실행 시작...');
    await this.ffmpeg.exec(command);
    console.log('WebM FFmpeg 실행 완료');
    
    console.log('WebM 파일 읽기 시작');
    const webmData = await this.ffmpeg.readFile('output.webm');
    console.log('WebM 데이터 크기:', (webmData as Uint8Array).length);
    
    // Cleanup
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile('output.webm');
    console.log('WebM 임시 파일 삭제 완료');
    
    return new Blob([new Uint8Array(webmData as Uint8Array)], { type: 'video/webm' });
  }
  
  buildCommand(input: string, output: string, settings: WebMSettings): string[] {
    const cmd = ['-i', input];
    
    // Video codec settings - 품질에 따른 최적화
    if (settings.codec === 'vp9') {
      cmd.push('-c:v', 'libvpx-vp9');
      cmd.push('-crf', settings.crf.toString());
      cmd.push('-b:v', '0'); // VBR mode
      
      // CRF에 따른 인코딩 속도/품질 조절
      if (settings.crf <= 15) {
        // 최고 품질: 느리지만 고품질
        cmd.push('-deadline', 'best');
        cmd.push('-cpu-used', '0'); // 최고 품질
        cmd.push('-threads', '8'); // 더 많은 스레드
      } else if (settings.crf <= 25) {
        // 고품질: 적당한 속도
        cmd.push('-deadline', 'good');
        cmd.push('-cpu-used', '2');
        cmd.push('-threads', '6');
      } else {
        // 빠른 변환: 속도 우선
        cmd.push('-deadline', 'realtime');
        cmd.push('-cpu-used', '8');
        cmd.push('-threads', '4');
      }
    } else {
      cmd.push('-c:v', 'libvpx');
      cmd.push('-crf', settings.crf.toString());
      
      // VP8도 품질에 따른 조절
      if (settings.crf <= 15) {
        cmd.push('-deadline', 'best');
        cmd.push('-cpu-used', '0');
      } else if (settings.crf <= 25) {
        cmd.push('-deadline', 'good');
        cmd.push('-cpu-used', '2');
      } else {
        cmd.push('-deadline', 'realtime');
        cmd.push('-cpu-used', '5');
      }
      
      if (settings.bitrate) {
        cmd.push('-b:v', settings.bitrate);
      }
    }
    
    // Remove audio (for GIF replacement use case)
    cmd.push('-an');
    
    // Build video filters
    const filters = [];
    
    // Resolution settings (고품질일 때는 원본 해상도 유지)
    if (settings.width && settings.height) {
      filters.push(`scale=${settings.width}:${settings.height}:flags=lanczos`);
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