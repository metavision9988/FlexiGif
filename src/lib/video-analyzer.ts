import { VideoMetadata } from '@/types';
import { validateVideoMetadata } from './file-validator';

export class VideoAnalyzer {
  private static readonly ANALYSIS_TIMEOUT = 10000; // 10 seconds

  async analyze(file: File): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      let objectUrl = '';
      
      // Timeout handling
      const timeoutId = setTimeout(() => {
        this.cleanup(video, objectUrl);
        reject(new Error('비디오 분석 시간이 초과되었습니다'));
      }, VideoAnalyzer.ANALYSIS_TIMEOUT);
      
      try {
        objectUrl = URL.createObjectURL(file);
        video.src = objectUrl;
        video.preload = 'metadata';
        
        video.onloadedmetadata = () => {
          clearTimeout(timeoutId);
          
          try {
            const metadata: VideoMetadata = {
              duration: video.duration,
              width: video.videoWidth,
              height: video.videoHeight,
              fps: this.extractFrameRate(file),
              size: file.size,
              codec: this.extractCodec(file)
            };
            
            // Validate metadata
            const validation = validateVideoMetadata(metadata);
            if (!validation.valid) {
              this.cleanup(video, objectUrl);
              reject(new Error(validation.error || '비디오 메타데이터 검증 실패'));
              return;
            }
            
            this.cleanup(video, objectUrl);
            resolve(metadata);
          } catch (error) {
            this.cleanup(video, objectUrl);
            reject(error);
          }
        };
        
        video.onerror = () => {
          clearTimeout(timeoutId);
          this.cleanup(video, objectUrl);
          reject(new Error('비디오 파일을 로드할 수 없습니다'));
        };
        
      } catch (error) {
        clearTimeout(timeoutId);
        this.cleanup(video, objectUrl);
        reject(error);
      }
    });
  }
  
  private cleanup(video: HTMLVideoElement, objectUrl: string): void {
    try {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      // Remove video element references
      video.onloadedmetadata = null;
      video.onerror = null;
      video.src = '';
    } catch (error) {
      console.warn('정리 중 오류:', error);
    }
  }
  
  // 변환 시간 예측 (파일 크기와 해상도 기반)
  estimateConversionTime(metadata: VideoMetadata, format: 'gif' | 'webm', quality: 'fast' | 'medium' | 'slow'): number {
    const { duration, width, height, size } = metadata;
    
    // 기본 복잡도 계산
    const sizeMB = size / (1024 * 1024);
    const pixelCount = width * height;
    const totalFrames = duration * 30; // 30fps 기준
    
    // 복잡도 팩터 (0.1 ~ 2.0)
    const complexityFactor = Math.min(2.0, Math.max(0.1, 
      (pixelCount / (1920 * 1080)) * (totalFrames / 900) * (sizeMB / 50)
    ));
    
    let baseTimePerMB: number;
    
    if (format === 'gif') {
      // GIF: 2-pass 처리로 인해 더 오래 걸림
      baseTimePerMB = quality === 'fast' ? 8 : quality === 'medium' ? 12 : 20;
    } else {
      // WebM: CRF 품질에 따라
      baseTimePerMB = quality === 'fast' ? 4 : quality === 'medium' ? 8 : 15;
    }
    
    // 최종 예상 시간 (초)
    const estimatedSeconds = Math.round(sizeMB * baseTimePerMB * complexityFactor);
    
    // 최소 10초, 최대 10분 제한
    return Math.min(600, Math.max(10, estimatedSeconds));
  }
  
  // 적응형 타임아웃 계산
  calculateTimeout(estimatedTime: number): number {
    // 예상 시간의 2.5배를 타임아웃으로 설정 (최소 60초, 최대 15분)
    const timeoutSeconds = Math.round(estimatedTime * 2.5);
    return Math.min(900, Math.max(60, timeoutSeconds));
  }

  extractFrameRate(file: File): number {
    // 파일 확장자 기반 추정
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'mp4':
      case 'mov': return 30; // 일반적으로 30fps
      case 'avi': return 25; // PAL 기준 25fps
      default: return 30;
    }
  }

  extractCodec(file: File): string {
    // 파일 확장자 기반 추정
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'mp4': return 'h264';
      case 'mov': return 'h264';
      case 'avi': return 'xvid';
      default: return 'unknown';
    }
  }
}