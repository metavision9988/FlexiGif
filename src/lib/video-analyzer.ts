import { VideoMetadata } from '@/types';

export class VideoAnalyzer {
  async analyze(file: File): Promise<VideoMetadata> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          fps: this.extractFrameRate(file),
          size: file.size,
          codec: this.extractCodec(file)
        });
        
        // Clean up object URL
        URL.revokeObjectURL(video.src);
      };
    });
  }

  extractFrameRate(_file: File): number {
    // TODO: Implement proper FPS extraction using FFmpeg analysis
    // For now, return standard 30fps default
    return 30;
  }

  extractCodec(_file: File): string {
    // TODO: Implement codec detection using FFmpeg probe
    // For now, return unknown placeholder
    return 'unknown';
  }
}