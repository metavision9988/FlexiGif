import { UserIntent, VideoMetadata, FormatRecommendation } from '@/types';

export class RecommendationEngine {
  analyze(intent: UserIntent, videoMeta: VideoMetadata): FormatRecommendation {
    // Social media focused
    if (intent.purpose === 'social') {
      return {
        primary: 'gif',
        secondary: 'webm',
        reason: 'SNS 최대 호환성을 위해 GIF를 추천합니다',
        warnings: this.getDiscordWarnings(intent.platforms),
        estimated_sizes: {
          gif: this.estimateGifSize(videoMeta),
          webm: this.estimateWebMSize(videoMeta)
        }
      };
    }
    
    // Website focused
    if (intent.purpose === 'website') {
      return {
        primary: 'webm',
        secondary: 'gif',
        reason: '웹사이트 최적화를 위해 WebM을 추천합니다',
        warnings: this.getLongVideoWarnings(videoMeta),
        estimated_sizes: {
          webm: this.estimateWebMSize(videoMeta),
          gif: this.estimateGifSize(videoMeta)
        }
      };
    }
    
    // Both formats needed (both or unknown)
    return {
      primary: 'gif',
      secondary: 'webm',
      reason: '용도별 최적화를 위해 두 포맷 모두 생성을 추천합니다',
      warnings: [],
      estimated_sizes: {
        gif: this.estimateGifSize(videoMeta),
        webm: this.estimateWebMSize(videoMeta)
      }
    };
  }
  
  private getDiscordWarnings(platforms: Array<{ name: string; maxFileSize: number; supportedFormats: string[] }>): string[] {
    const hasDiscord = platforms.some(platform => 
      platform.name.toLowerCase().includes('discord')
    );
    
    return hasDiscord ? ['Discord에서는 WebM이 더 좋은 품질을 제공합니다'] : [];
  }
  
  private getLongVideoWarnings(videoMeta: VideoMetadata): string[] {
    return videoMeta.duration > 10 
      ? ['10초 이상 영상은 파일이 클 수 있습니다']
      : [];
  }
  
  estimateGifSize(meta: VideoMetadata): string {
    // Empirical formula based on pixels per second
    const pixelsPerSecond = meta.width * meta.height * meta.fps;
    const estimatedBytes = pixelsPerSecond * meta.duration * 0.1; // rough estimate
    return `${Math.round(estimatedBytes / 1024 / 1024)}MB`;
  }
  
  estimateWebMSize(meta: VideoMetadata): string {
    // WebM is roughly 50-80% of original depending on duration
    const ratio = meta.duration > 10 ? 0.8 : 0.6;
    const estimatedBytes = meta.size * ratio;
    return `${Math.round(estimatedBytes / 1024 / 1024)}MB`;
  }
}