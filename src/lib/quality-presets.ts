import { QualityPreset } from '@/types';

export const QUALITY_PRESETS: QualityPreset[] = [
  {
    name: 'fast',
    label: '빠른 변환',
    description: '빠른 속도, 작은 파일 크기',
    webmSettings: {
      crf: 35,
      codec: 'vp8',
      fps: 15,
      width: 480,
      height: 360
    },
    gifSettings: {
      fps: 12,
      quality: 'low',
      optimize: false,
      width: 400,
      height: 300
    },
    estimatedSizeMultiplier: 0.3,
    conversionTime: 'fast'
  },
  {
    name: 'balanced',
    label: '균형잡힌 품질',
    description: '적당한 속도와 품질의 균형',
    webmSettings: {
      crf: 25,
      codec: 'vp8',
      fps: 24,
      width: 640,
      height: 480
    },
    gifSettings: {
      fps: 15,
      quality: 'medium',
      optimize: true,
      width: 540,
      height: 405
    },
    estimatedSizeMultiplier: 0.6,
    conversionTime: 'medium'
  },
  {
    name: 'high_quality',
    label: '고품질',
    description: '원본에 가까운 품질, 큰 파일 크기',
    webmSettings: {
      crf: 15,
      codec: 'vp9',
      fps: 30,
      // 원본 해상도 유지 (width, height 없음)
    },
    gifSettings: {
      fps: 20,
      quality: 'high',
      optimize: true,
      // 원본 해상도 유지
    },
    estimatedSizeMultiplier: 1.2,
    conversionTime: 'slow'
  },
  {
    name: 'original',
    label: '원본 품질',
    description: '원본과 동일한 품질, 가장 큰 파일',
    webmSettings: {
      crf: 10,
      codec: 'vp9',
      // 원본 FPS, 해상도 모두 유지
    },
    gifSettings: {
      quality: 'high',
      optimize: true,
      // 원본 설정 유지
    },
    estimatedSizeMultiplier: 1.8,
    conversionTime: 'slow'
  }
];

export function getQualityPreset(name: string): QualityPreset {
  return QUALITY_PRESETS.find(preset => preset.name === name) || QUALITY_PRESETS[1]; // 기본값: balanced
}

export function getConversionTimeIcon(time: QualityPreset['conversionTime']): string {
  switch (time) {
    case 'fast': return '⚡';
    case 'medium': return '⏱️';
    case 'slow': return '🐌';
    default: return '⏱️';
  }
}

export function getEstimatedTime(baseTimeSeconds: number, preset: QualityPreset): number {
  const multipliers = {
    fast: 0.5,
    medium: 1.0,
    slow: 2.5
  };
  
  return Math.round(baseTimeSeconds * multipliers[preset.conversionTime]);
}