import { UserIntent, VideoMetadata, FormatRecommendation } from '@/types';
import { PLATFORM_LIMITS, PERFORMANCE_THRESHOLDS } from './constants';
import { formatFileSize } from './file-validator';

export class RecommendationEngine {
  // Cache for repeated calculations
  private static readonly sizeEstimationCache = new Map<string, string>();
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
    const warnings: string[] = [];
    
    const discordPlatform = platforms.find(platform => 
      platform.name.toLowerCase().includes('discord')
    );
    
    if (discordPlatform) {
      warnings.push('Discord에서는 WebM이 더 좋은 품질을 제공합니다');
      
      // Check Discord file size limits
      if (discordPlatform.maxFileSize <= PLATFORM_LIMITS.DISCORD.MAX_FILE_SIZE) {
        warnings.push('Discord 기본 계정은 25MB 제한이 있습니다');
      }
    }
    
    return warnings;
  }
  
  private getLongVideoWarnings(videoMeta: VideoMetadata): string[] {
    const warnings: string[] = [];
    
    // Duration warnings
    if (videoMeta.duration > PERFORMANCE_THRESHOLDS.CONVERSION_TIME.MEDIUM) {
      warnings.push('긴 영상은 변환 시간이 오래 걸릴 수 있습니다');
    }
    
    if (videoMeta.duration > 60) {
      warnings.push('1분 이상 영상은 파일이 매우 클 수 있습니다');
    }
    
    // Resolution warnings
    const pixels = videoMeta.width * videoMeta.height;
    if (pixels > 1920 * 1080) {
      warnings.push('고해상도 영상은 변환 시간이 오래 걸립니다');
    }
    
    // File size warnings
    if (videoMeta.size > PERFORMANCE_THRESHOLDS.FILE_SIZE_WARNING) {
      warnings.push('큰 원본 파일은 변환 결과도 클 수 있습니다');
    }
    
    return warnings;
  }
  
  estimateGifSize(meta: VideoMetadata): string {
    // Create cache key
    const cacheKey = `gif-${meta.width}-${meta.height}-${meta.duration}-${meta.fps}`;
    
    // Check cache first
    if (RecommendationEngine.sizeEstimationCache.has(cacheKey)) {
      return RecommendationEngine.sizeEstimationCache.get(cacheKey)!;
    }
    
    // Enhanced GIF size calculation
    // Base calculation: pixels per frame * frames * color depth factor
    const pixelsPerFrame = meta.width * meta.height;
    const totalFrames = Math.round(meta.duration * meta.fps);
    const colorDepthFactor = 0.8; // GIF 256 colors vs 24-bit
    const compressionFactor = 0.3; // GIF compression efficiency
    
    // Quality degradation for large files
    const sizePenalty = pixelsPerFrame > (1920 * 1080) ? 0.7 : 1.0;
    
    const estimatedBytes = pixelsPerFrame * totalFrames * colorDepthFactor * compressionFactor * sizePenalty;
    const result = formatFileSize(estimatedBytes);
    
    // Cache result
    RecommendationEngine.sizeEstimationCache.set(cacheKey, result);
    return result;
  }
  
  estimateWebMSize(meta: VideoMetadata): string {
    // Create cache key
    const cacheKey = `webm-${meta.size}-${meta.duration}-${meta.width}-${meta.height}`;
    
    // Check cache first  
    if (RecommendationEngine.sizeEstimationCache.has(cacheKey)) {
      return RecommendationEngine.sizeEstimationCache.get(cacheKey)!;
    }
    
    // Enhanced WebM size calculation based on complexity
    const complexity = this.calculateComplexity(meta);
    
    // Base compression ratio varies with complexity and duration
    let ratio = 0.6; // base 60%
    
    // Adjust for duration (longer videos compress better)
    if (meta.duration > 30) ratio *= 0.8;
    else if (meta.duration < 5) ratio *= 1.2;
    
    // Adjust for complexity
    ratio *= (1 + complexity * 0.3);
    
    // Resolution adjustment
    const pixels = meta.width * meta.height;
    if (pixels > 1920 * 1080) ratio *= 1.1; // 4K needs higher bitrate
    else if (pixels < 720 * 480) ratio *= 0.8; // SD compresses better
    
    const estimatedBytes = meta.size * Math.min(1.0, ratio);
    const result = formatFileSize(estimatedBytes);
    
    // Cache result
    RecommendationEngine.sizeEstimationCache.set(cacheKey, result);
    return result;
  }
  
  /**
   * Calculate video complexity factor (0.0 to 1.0)
   */
  private calculateComplexity(meta: VideoMetadata): number {
    const pixels = meta.width * meta.height;
    const pixelComplexity = Math.min(1.0, pixels / (1920 * 1080));
    const durationComplexity = Math.min(1.0, meta.duration / 60); // normalized to 1 minute
    const fpsComplexity = Math.min(1.0, meta.fps / 60); // normalized to 60fps
    
    return (pixelComplexity * 0.5 + durationComplexity * 0.3 + fpsComplexity * 0.2);
  }
  
  /**
   * Clear estimation cache (useful for memory management)
   */
  static clearCache(): void {
    this.sizeEstimationCache.clear();
  }
}