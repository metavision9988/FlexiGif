import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { ConversionEngine, GifSettings, EstimateResult } from '@/types';
import { VideoAnalyzer } from './video-analyzer';
import { getFileExtension } from './file-validator';

export class GifEngine implements ConversionEngine {
  name = 'gif' as const;
  private ffmpeg: FFmpeg;
  private progressCallback?: (progress: number) => void;
  private isInitialized = false;
  private initializationPromise?: Promise<void>;
  
  constructor() {
    this.ffmpeg = new FFmpeg();
  }
  
  setProgressCallback(callback: (progress: number) => void) {
    this.progressCallback = callback;
    this.ffmpeg.on('progress', ({ progress }) => {
      callback(Math.round(progress * 100));
    });
  }
  
  async initialize(): Promise<void> {
    // Return existing initialization promise if already initializing
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    // Return immediately if already initialized
    if (this.isInitialized) {
      return;
    }
    
    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }
  
  private async performInitialization(): Promise<void> {
    if (this.ffmpeg.loaded) {
      this.isInitialized = true;
      return;
    }
    
    try {
      console.log('FFmpeg 로딩 시작...');
      
      // Environment checks
      this.validateEnvironment();
      
      const config = {
        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
        wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
        workerURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.worker.js'
      };
      
      console.log('FFmpeg 설정:', config);
      await this.ffmpeg.load(config);
      console.log('FFmpeg 로딩 성공!');
      
      this.isInitialized = true;
    } catch (error) {
      console.error('FFmpeg 로딩 실패:', error);
      this.isInitialized = false;
      this.initializationPromise = undefined;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`FFmpeg 초기화 실패: ${errorMessage}`);
    }
  }
  
  private validateEnvironment(): void {
    if (typeof SharedArrayBuffer === 'undefined') {
      throw new Error('SharedArrayBuffer가 지원되지 않습니다. HTTPS 환경이 필요합니다.');
    }
    
    if (typeof WebAssembly === 'undefined') {
      throw new Error('WebAssembly가 지원되지 않습니다.');
    }
    
    if (!crossOriginIsolated) {
      console.warn('CrossOriginIsolated가 false입니다. 성능에 영향을 줄 수 있습니다.');
    }
  }
  
  async convert(file: File, settings: GifSettings): Promise<Blob> {
    console.log('GIF 변환 시작:', file.name, file.size);
    await this.initialize();
    console.log('FFmpeg 초기화 완료');
    
    const inputName = `input.${getFileExtension(file.type)}`;
    console.log('파일 쓰기 시작:', inputName);
    await this.ffmpeg.writeFile(inputName, await fetchFile(file));
    console.log('파일 쓰기 완료');

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
      console.log('1단계 팔레트 생성 실행:', paletteGenCommand);
      await this.ffmpeg.exec(paletteGenCommand);
      console.log('1단계 완료');

      // 2. Second Pass: Use palette to create GIF
      const gifCommand = [
        '-i', inputName,
        '-i', paletteName,
        '-filter_complex', `[0:v]${filters.join(',')}[v];[v][1:v]paletteuse`,
        'output.gif'
      ];
      console.log('2단계 GIF 생성 실행:', gifCommand);
      await this.ffmpeg.exec(gifCommand);
      console.log('2단계 완료');

      // 3. Cleanup
      console.log('GIF 파일 읽기 시작');
      const gifData = await this.ffmpeg.readFile('output.gif');
      console.log('GIF 데이터 크기:', (gifData as Uint8Array).length);
      
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(paletteName);
      await this.ffmpeg.deleteFile('output.gif');
      console.log('임시 파일 삭제 완료');

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