# 🚀 **ConvertAI Pro - 듀얼 엔진 개발용 PRD**
*Claude Code 초기 개발 전용 문서*

---

## 🎯 **프로젝트 개요**

### **제품명**: ConvertAI Pro
### **핵심 컨셉**: "AI 영상을 어디든 공유하세요"
- **SNS는 GIF로** (최대 호환성)
- **웹사이트는 WebM으로** (최고 품질)
- **스마트 추천** (용도별 최적 포맷)

### **MVP 목표**
```yaml
핵심 가치: 
  - 한 번 업로드로 GIF + WebM 둘 다 생성
  - 용도별 스마트 추천 시스템
  - 플랫폼 호환성 완벽 가이드
  
타겟: AI 크리에이터, 소셜미디어 마케터
출시: 4주 내 MVP 완성
```

---

## 🏗️ **시스템 아키텍처**

### **기술 스택**
```yaml
Frontend:
  Framework: Next.js 14 (App Router)
  UI: Tailwind CSS + shadcn/ui
  State: Zustand
  Icons: Lucide React

Processing:
  Video Engine: FFmpeg.js (WebAssembly)
  Worker: Web Workers (논블로킹)
  File Handling: Web File API

Backend:
  API: Next.js API Routes
  Database: Supabase (사용량 추적)
  Storage: Vercel Blob (임시 파일)

Deployment:
  Hosting: Vercel
  CDN: Vercel Edge Network
  Analytics: Vercel Analytics
```

### **핵심 아키텍처 패턴**
```typescript
// 듀얼 엔진 추상화
interface ConversionEngine {
  name: 'gif' | 'webm';
  convert(file: File, settings: ConversionSettings): Promise<Blob>;
  estimate(file: File, settings: ConversionSettings): Promise<EstimateResult>;
}

// 팩토리 패턴
class ConverterFactory {
  static create(format: 'gif' | 'webm'): ConversionEngine {
    return format === 'gif' ? new GifEngine() : new WebMEngine();
  }
}

// 추천 엔진
interface RecommendationEngine {
  analyze(userIntent: UserIntent): FormatRecommendation;
  getOptimalSettings(format: 'gif' | 'webm', file: File): ConversionSettings;
}
```

---

## 📊 **25 Rules 개발 로드맵**

### **Phase 1: 기초 엔진 (Rule 1-5) - Week 1**

#### **Rule 1: 파일 업로드 시스템**
```typescript
// components/FileUploader.tsx
interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  maxSize: number; // 100MB
  acceptedFormats: string[]; // ['mp4', 'mov', 'avi']
  dragAndDrop: boolean;
}

// 검증 로직
const validateFile = (file: File): ValidationResult => {
  if (file.size > 100 * 1024 * 1024) {
    return { valid: false, error: '파일이 100MB를 초과합니다' };
  }
  
  if (!['video/mp4', 'video/mov', 'video/avi'].includes(file.type)) {
    return { valid: false, error: '지원하지 않는 파일 형식입니다' };
  }
  
  return { valid: true };
};
```

#### **Rule 2: 비디오 분석 시스템**
```typescript
// lib/video-analyzer.ts
interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  size: number;
  codec: string;
}

class VideoAnalyzer {
  async analyze(file: File): Promise<VideoMetadata> {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    
    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          fps: 30, // 기본값, 나중에 정확히 추출
          size: file.size,
          codec: 'unknown' // 나중에 FFmpeg로 정확히 분석
        });
      };
    });
  }
}
```

#### **Rule 3: 스마트 추천 엔진**
```typescript
// lib/recommendation-engine.ts
interface UserIntent {
  purpose: 'social' | 'website' | 'both' | 'unknown';
  platforms: Platform[];
  quality_preference: 'size' | 'quality' | 'balanced';
}

interface FormatRecommendation {
  primary: 'gif' | 'webm';
  secondary?: 'gif' | 'webm';
  reason: string;
  warnings: string[];
  estimated_sizes: {
    gif?: string;
    webm?: string;
  };
}

class RecommendationEngine {
  analyze(intent: UserIntent, videoMeta: VideoMetadata): FormatRecommendation {
    // 소셜미디어 중심
    if (intent.purpose === 'social') {
      return {
        primary: 'gif',
        secondary: 'webm',
        reason: 'SNS 최대 호환성을 위해 GIF를 추천합니다',
        warnings: intent.platforms.includes('discord') ? 
          ['Discord에서는 WebM이 더 좋은 품질을 제공합니다'] : [],
        estimated_sizes: {
          gif: this.estimateGifSize(videoMeta),
          webm: this.estimateWebMSize(videoMeta)
        }
      };
    }
    
    // 웹사이트 중심
    if (intent.purpose === 'website') {
      return {
        primary: 'webm',
        secondary: 'gif',
        reason: '웹사이트 최적화를 위해 WebM을 추천합니다',
        warnings: videoMeta.duration > 10 ? 
          ['10초 이상 영상은 파일이 클 수 있습니다'] : [],
        estimated_sizes: {
          webm: this.estimateWebMSize(videoMeta),
          gif: this.estimateGifSize(videoMeta)
        }
      };
    }
    
    // 둘 다 필요
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
  
  private estimateGifSize(meta: VideoMetadata): string {
    // 경험적 공식 (실제로는 더 정교하게)
    const pixelsPerSecond = meta.width * meta.height * meta.fps;
    const estimatedBytes = pixelsPerSecond * meta.duration * 0.1; // 대략적
    return `${Math.round(estimatedBytes / 1024 / 1024)}MB`;
  }
  
  private estimateWebMSize(meta: VideoMetadata): string {
    // WebM은 대략 원본의 50-80%
    const ratio = meta.duration > 10 ? 0.8 : 0.6;
    const estimatedBytes = meta.size * ratio;
    return `${Math.round(estimatedBytes / 1024 / 1024)}MB`;
  }
}
```

#### **Rule 4: GIF 변환 엔진**
```typescript
// lib/gif-engine.ts
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

interface GifSettings {
  fps: number;
  width?: number;
  height?: number;
  quality: 'low' | 'medium' | 'high';
  optimize: boolean;
}

class GifEngine implements ConversionEngine {
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
    
    // 입력 파일 준비
    const inputName = `input.${file.name.split('.').pop()}`;
    await this.ffmpeg.writeFile(inputName, await fetchFile(file));
    
    // 변환 명령어 생성
    const command = this.buildCommand(inputName, 'output.gif', settings);
    
    // 변환 실행
    await this.ffmpeg.exec(command);
    
    // 결과 읽기
    const gifData = await this.ffmpeg.readFile('output.gif');
    
    // 메모리 정리
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile('output.gif');
    
    return new Blob([gifData], { type: 'image/gif' });
  }
  
  private buildCommand(input: string, output: string, settings: GifSettings): string[] {
    const cmd = ['-i', input];
    
    // FPS 설정
    cmd.push('-vf', `fps=${settings.fps}`);
    
    // 해상도 설정
    if (settings.width && settings.height) {
      cmd.push('-vf', `fps=${settings.fps},scale=${settings.width}:${settings.height}:flags=lanczos`);
    }
    
    // 품질 설정 (색상 수)
    const colors = {
      low: '128',
      medium: '256',
      high: '256'
    };
    
    if (settings.optimize) {
      // 2-pass 최적화 (더 좋은 품질)
      cmd.push('-vf', `${cmd[cmd.indexOf('-vf') + 1]},palettegen`);
    }
    
    cmd.push(output);
    return cmd;
  }
  
  async estimate(file: File, settings: GifSettings): Promise<EstimateResult> {
    const analyzer = new VideoAnalyzer();
    const meta = await analyzer.analyze(file);
    
    // 경험적 계산
    const pixelCount = (settings.width || meta.width) * (settings.height || meta.height);
    const frameCount = meta.duration * settings.fps;
    const estimatedSize = pixelCount * frameCount * 0.5; // bytes per pixel
    
    return {
      estimatedSize: Math.round(estimatedSize / 1024 / 1024), // MB
      estimatedTime: Math.round(meta.duration * 2), // seconds
      warnings: estimatedSize > 50 * 1024 * 1024 ? 
        ['예상 파일 크기가 50MB를 초과합니다'] : []
    };
  }
}
```

#### **Rule 5: WebM 변환 엔진**
```typescript
// lib/webm-engine.ts
interface WebMSettings {
  crf: number; // 0-63, 낮을수록 고품질
  bitrate?: string; // '1M', '500k' 등
  fps?: number;
  width?: number;
  height?: number;
  codec: 'vp8' | 'vp9';
}

class WebMEngine implements ConversionEngine {
  name = 'webm' as const;
  private ffmpeg: FFmpeg;
  
  constructor() {
    this.ffmpeg = new FFmpeg();
  }
  
  async convert(file: File, settings: WebMSettings): Promise<Blob> {
    await this.initialize();
    
    const inputName = `input.${file.name.split('.').pop()}`;
    await this.ffmpeg.writeFile(inputName, await fetchFile(file));
    
    const command = this.buildCommand(inputName, 'output.webm', settings);
    
    await this.ffmpeg.exec(command);
    
    const webmData = await this.ffmpeg.readFile('output.webm');
    
    // 정리
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile('output.webm');
    
    return new Blob([webmData], { type: 'video/webm' });
  }
  
  private buildCommand(input: string, output: string, settings: WebMSettings): string[] {
    const cmd = ['-i', input];
    
    // 비디오 코덱 설정
    if (settings.codec === 'vp9') {
      cmd.push('-c:v', 'libvpx-vp9');
      cmd.push('-crf', settings.crf.toString());
      cmd.push('-b:v', '0'); // VBR 모드
    } else {
      cmd.push('-c:v', 'libvpx');
      if (settings.bitrate) {
        cmd.push('-b:v', settings.bitrate);
      }
    }
    
    // 오디오 제거 (GIF 대체용)
    cmd.push('-an');
    
    // 해상도 설정
    if (settings.width && settings.height) {
      cmd.push('-vf', `scale=${settings.width}:${settings.height}`);
    }
    
    // FPS 설정
    if (settings.fps) {
      const vf = cmd.includes('-vf') ? 
        cmd[cmd.indexOf('-vf') + 1] + `,fps=${settings.fps}` :
        `fps=${settings.fps}`;
      cmd[cmd.indexOf('-vf') + 1] = vf;
    }
    
    cmd.push(output);
    return cmd;
  }
}
```

---

### **Phase 2: UI/UX 구축 (Rule 6-10) - Week 2**

#### **Rule 6: 메인 페이지 컴포넌트**
```typescript
// app/page.tsx
'use client';

import { useState } from 'react';
import { FileUploader } from '@/components/FileUploader';
import { PurposeSelector } from '@/components/PurposeSelector';
import { RecommendationCard } from '@/components/RecommendationCard';
import { ConversionProgress } from '@/components/ConversionProgress';
import { ResultsDisplay } from '@/components/ResultsDisplay';

interface ConversionState {
  file: File | null;
  userIntent: UserIntent | null;
  recommendation: FormatRecommendation | null;
  converting: boolean;
  results: ConversionResults | null;
}

export default function HomePage() {
  const [state, setState] = useState<ConversionState>({
    file: null,
    userIntent: null,
    recommendation: null,
    converting: false,
    results: null
  });
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">ConvertAI Pro</h1>
        <p className="text-xl text-gray-600">
          AI 영상을 어디든 공유하세요
        </p>
        <p className="text-sm text-gray-500 mt-1">
          SNS는 GIF로, 웹사이트는 WebM으로
        </p>
      </header>
      
      {/* Step 1: File Upload */}
      {!state.file && (
        <FileUploader 
          onFileSelect={(file) => setState({...state, file})}
          maxSize={100 * 1024 * 1024}
          acceptedFormats={['mp4', 'mov', 'avi']}
          dragAndDrop={true}
        />
      )}
      
      {/* Step 2: Purpose Selection */}
      {state.file && !state.userIntent && (
        <PurposeSelector
          onPurposeSelect={(intent) => {
            const recommendation = new RecommendationEngine()
              .analyze(intent, state.videoMeta);
            setState({...state, userIntent: intent, recommendation});
          }}
        />
      )}
      
      {/* Step 3: Recommendation Display */}
      {state.recommendation && !state.converting && (
        <RecommendationCard
          recommendation={state.recommendation}
          onStartConversion={() => setState({...state, converting: true})}
        />
      )}
      
      {/* Step 4: Conversion Progress */}
      {state.converting && !state.results && (
        <ConversionProgress
          formats={[state.recommendation!.primary, state.recommendation!.secondary].filter(Boolean)}
          onComplete={(results) => setState({...state, converting: false, results})}
        />
      )}
      
      {/* Step 5: Results */}
      {state.results && (
        <ResultsDisplay
          results={state.results}
          recommendation={state.recommendation!}
          onStartNew={() => setState({
            file: null,
            userIntent: null,
            recommendation: null,
            converting: false,
            results: null
          })}
        />
      )}
    </div>
  );
}
```

#### **Rule 7: 용도 선택 컴포넌트**
```tsx
// components/PurposeSelector.tsx
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PurposeSelectorProps {
  onPurposeSelect: (intent: UserIntent) => void;
}

export function PurposeSelector({ onPurposeSelect }: PurposeSelectorProps) {
  const purposes = [
    {
      id: 'social',
      title: '📱 SNS에 업로드',
      description: 'Twitter, Instagram, Facebook, 카카오톡',
      icon: '📲',
      popular: true
    },
    {
      id: 'website',
      title: '🌐 웹사이트/블로그',
      description: '내 사이트, Discord, Reddit',
      icon: '💻',
      recommended: true
    },
    {
      id: 'both',
      title: '🎯 둘 다 필요해요',
      description: '용도별로 다르게 사용 예정',
      icon: '⚡',
      premium: true
    }
  ];
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-center">
        어디에 사용하실 건가요?
      </h2>
      
      <div className="grid md:grid-cols-3 gap-4">
        {purposes.map((purpose) => (
          <Card 
            key={purpose.id}
            className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
              purpose.recommended ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => onPurposeSelect({
              purpose: purpose.id as 'social' | 'website' | 'both',
              platforms: [],
              quality_preference: 'balanced'
            })}
          >
            <div className="text-center">
              <div className="text-4xl mb-3">{purpose.icon}</div>
              <h3 className="font-semibold mb-2">{purpose.title}</h3>
              <p className="text-sm text-gray-600 mb-4">
                {purpose.description}
              </p>
              
              {purpose.popular && (
                <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                  인기
                </span>
              )}
              {purpose.recommended && (
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  추천
                </span>
              )}
              {purpose.premium && (
                <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                  완벽
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

#### **Rule 8: 추천 카드 컴포넌트**
```tsx
// components/RecommendationCard.tsx
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface RecommendationCardProps {
  recommendation: FormatRecommendation;
  onStartConversion: () => void;
}

export function RecommendationCard({ 
  recommendation, 
  onStartConversion 
}: RecommendationCardProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-center">
        맞춤 추천 결과
      </h2>
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* 주 추천 */}
        <Card className="p-6 ring-2 ring-blue-500 relative">
          <Badge className="absolute -top-2 -right-2 bg-blue-500">
            추천
          </Badge>
          
          <div className="text-center">
            <div className="text-3xl mb-3">
              {recommendation.primary === 'gif' ? '🎬' : '⚡'}
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {recommendation.primary.toUpperCase()} 포맷
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              예상 크기: {recommendation.estimated_sizes[recommendation.primary]}
            </p>
            
            <div className="space-y-2 text-left">
              <h4 className="font-medium">호환성:</h4>
              <div className="flex flex-wrap gap-1">
                {recommendation.primary === 'gif' ? 
                  ['Twitter', 'Instagram', 'Facebook', 'KakaoTalk'].map(platform => (
                    <Badge key={platform} variant="secondary" className="text-xs">
                      ✅ {platform}
                    </Badge>
                  )) :
                  ['웹사이트', 'Discord', 'Reddit', 'WhatsApp'].map(platform => (
                    <Badge key={platform} variant="secondary" className="text-xs">
                      ✅ {platform}
                    </Badge>
                  ))
                }
              </div>
            </div>
          </div>
        </Card>
        
        {/* 부 추천 (있는 경우) */}
        {recommendation.secondary && (
          <Card className="p-6 bg-gray-50">
            <div className="text-center">
              <div className="text-3xl mb-3">
                {recommendation.secondary === 'gif' ? '🎬' : '⚡'}
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {recommendation.secondary.toUpperCase()} 포맷
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                예상 크기: {recommendation.estimated_sizes[recommendation.secondary]}
              </p>
              <p className="text-xs text-gray-500">
                추가 옵션으로 함께 생성
              </p>
            </div>
          </Card>
        )}
      </div>
      
      {/* 추천 이유 */}
      <Card className="p-4 bg-blue-50">
        <p className="text-sm">
          <strong>왜 이 포맷인가요?</strong> {recommendation.reason}
        </p>
        {recommendation.warnings.length > 0 && (
          <div className="mt-2">
            {recommendation.warnings.map((warning, index) => (
              <p key={index} className="text-xs text-orange-600">
                ⚠️ {warning}
              </p>
            ))}
          </div>
        )}
      </Card>
      
      <div className="text-center">
        <Button 
          onClick={onStartConversion}
          size="lg"
          className="px-8"
        >
          변환 시작하기
        </Button>
      </div>
    </div>
  );
}
```

#### **Rule 9: 변환 진행률 컴포넌트**
```tsx
// components/ConversionProgress.tsx
import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ConversionProgressProps {
  formats: ('gif' | 'webm')[];
  onComplete: (results: ConversionResults) => void;
}

export function ConversionProgress({ 
  formats, 
  onComplete 
}: ConversionProgressProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [cancelled, setCancelled] = useState(false);
  
  const steps = [
    { step: 0, message: '비디오 분석 중...', duration: 2000 },
    { step: 20, message: '프레임 추출 중...', duration: 3000 },
    { step: 50, message: 'GIF 생성 중...', duration: 5000 },
    { step: 75, message: 'WebM 최적화 중...', duration: 3000 },
    { step: 95, message: '마무리 중...', duration: 1000 },
    { step: 100, message: '완료!', duration: 500 }
  ];
  
  useEffect(() => {
    if (cancelled) return;
    
    let currentIndex = 0;
    
    const processStep = () => {
      if (currentIndex >= steps.length || cancelled) {
        if (!cancelled && currentIndex >= steps.length) {
          // 실제 변환 완료 시뮬레이션
          onComplete({
            gif: new Blob(['fake gif'], { type: 'image/gif' }),
            webm: new Blob(['fake webm'], { type: 'video/webm' }),
            metadata: {
              originalSize: 15 * 1024 * 1024,
              gifSize: 45 * 1024 * 1024,
              webmSize: 8 * 1024 * 1024,
              compressionRatio: {
                gif: 3.0,
                webm: 0.53
              }
            }
          });
        }
        return;
      }
      
      const step = steps[currentIndex];
      setCurrentStep(step.message);
      setProgress(step.step);
      
      setTimeout(() => {
        currentIndex++;
        processStep();
      }, step.duration);
    };
    
    processStep();
  }, [cancelled, onComplete]);
  
  return (
    <Card className="p-8 max-w-md mx-auto">
      <div className="text-center space-y-6">
        <h2 className="text-xl font-semibold">변환 중...</h2>
        
        <div className="space-y-4">
          <div className="text-4xl animate-spin">⚡</div>
          
          <Progress value={progress} className="w-full" />
          
          <p className="text-sm text-gray-600">{currentStep}</p>
          
          <div className="text-xs text-gray-500">
            {formats.includes('gif') && formats.includes('webm') ? 
              'GIF와 WebM 모두 생성 중...' :
              `${formats[0].toUpperCase()} 생성 중...`
            }
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setCancelled(true)}
          disabled={progress >= 95}
        >
          취소
        </Button>
      </div>
    </Card>
  );
}
```

#### **Rule 10: 결과 표시 컴포넌트**
```tsx
// components/ResultsDisplay.tsx
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ResultsDisplayProps {
  results: ConversionResults;
  recommendation: FormatRecommendation;
  onStartNew: () => void;
}

export function ResultsDisplay({ 
  results, 
  recommendation, 
  onStartNew 
}: ResultsDisplayProps) {
  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const downloadAll = () => {
    if (results.gif) downloadFile(results.gif, 'sns-optimized.gif');
    if (results.webm) downloadFile(results.webm, 'web-optimized.webm');
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-green-600 mb-2">
          ✅ 변환 완료!
        </h2>
        <p className="text-gray-600">
          최적화된 파일이 준비되었습니다
        </p>
      </div>
      
      {/* 통계 카드 */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="font-semibold mb-4">📊 변환 결과</h3>
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(results.metadata.originalSize / 1024 / 1024)}MB
            </div>
            <div className="text-xs text-gray-600">원본 크기</div>
          </div>
          
          {results.gif && (
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(results.metadata.gifSize / 1024 / 1024)}MB
              </div>
              <div className="text-xs text-gray-600">GIF 크기</div>
            </div>
          )}
          
          {results.webm && (
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(results.metadata.webmSize / 1024 / 1024)}MB
              </div>
              <div className="text-xs text-gray-600">WebM 크기</div>
            </div>
          )}
        </div>
      </Card>
      
      {/* 다운로드 카드들 */}
      <div className="grid md:grid-cols-2 gap-4">
        {results.gif && (
          <Card className="p-6">
            <div className="text-center space-y-4">
              <div className="text-3xl">🎬</div>
              <h3 className="text-lg font-semibold">SNS용 GIF</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>파일 크기:</span>
                  <span>{Math.round(results.metadata.gifSize / 1024 / 1024)}MB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>압축률:</span>
                  <span>{results.metadata.compressionRatio.gif}x</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs font-medium">최적 플랫폼:</div>
                <div className="flex flex-wrap gap-1 justify-center">
                  {['Twitter', 'Instagram', 'Facebook'].map(platform => (
                    <Badge key={platform} variant="secondary" className="text-xs">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <Button 
                className="w-full"
                onClick={() => downloadFile(results.gif!, 'sns-optimized.gif')}
              >
                GIF 다운로드
              </Button>
            </div>
          </Card>
        )}
        
        {results.webm && (
          <Card className="p-6 ring-2 ring-green-500">
            <div className="text-center space-y-4">
              <div className="text-3xl">⚡</div>
              <h3 className="text-lg font-semibold">
                웹용 WebM 
                <Badge className="ml-2" variant="default">최고 품질</Badge>
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>파일 크기:</span>
                  <span className="text-green-600 font-medium">
                    {Math.round(results.metadata.webmSize / 1024 / 1024)}MB
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>압축률:</span>
                  <span className="text-green-600 font-medium">
                    {results.metadata.compressionRatio.webm}x
                  </span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs font-medium">최적 플랫폼:</div>
                <div className="flex flex-wrap gap-1 justify-center">
                  {['웹사이트', 'Discord', 'Reddit'].map(platform => (
                    <Badge key={platform} variant="secondary" className="text-xs">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => downloadFile(results.webm!, 'web-optimized.webm')}
              >
                WebM 다운로드
              </Button>
            </div>
          </Card>
        )}
      </div>
      
      {/* 전체 다운로드 & 새 변환 */}
      <div className="text-center space-y-3">
        {results.gif && results.webm && (
          <Button 
            variant="outline" 
            size="lg"
            onClick={downloadAll}
          >
            📦 전체 다운로드
          </Button>
        )}
        
        <div>
          <Button 
            variant="ghost"
            onClick={onStartNew}
          >
            🆕 새로운 파일 변환하기
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🚀 **즉시 시작 가이드**

### **개발 환경 설정**
```bash
# 1. 프로젝트 생성
npx create-next-app@latest convert-ai-pro --typescript --tailwind --eslint --app
cd convert-ai-pro

# 2. 필수 패키지 설치
npm install @ffmpeg/ffmpeg @ffmpeg/util zustand lucide-react

# 3. shadcn/ui 설정
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card progress badge input label

# 4. FFmpeg WASM 파일 설정
mkdir -p public/ffmpeg
# FFmpeg 파일들을 public/ffmpeg/에 복사 (build 후 처리)

# 5. 개발 서버 시작
npm run dev
```

### **Week 1 개발 체크리스트**
```bash
☐ Next.js 기본 설정 완료
☐ 파일 업로더 컴포넌트 구현
☐ 비디오 분석 시스템 구현
☐ 스마트 추천 엔진 구현  
☐ GIF 변환 엔진 기본 구현
☐ WebM 변환 엔진 기본 구현
☐ 기본 UI 플로우 완성
☐ 로컬 테스트 완료
```

### **핵심 구현 우선순위**
1. **파일 업로드 + 검증** (첫째 날)
2. **추천 엔진 로직** (둘째 날)  
3. **FFmpeg.js 통합** (셋째-넷째 날)
4. **기본 UI 연결** (다섯째 날)
5. **전체 플로우 테스트** (주말)

---

## 💡 **개발 팁 & 주의사항**

### **FFmpeg.js 최적화**
```typescript
// 메모리 누수 방지
class FFmpegManager {
  private static instance: FFmpeg;
  
  static async getInstance() {
    if (!this.instance) {
      this.instance = new FFmpeg();
      await this.instance.load();
    }
    return this.instance;
  }
  
  static async cleanup() {
    if (this.instance) {
      // 임시 파일 정리
      await this.instance.terminate();
      this.instance = null;
    }
  }
}
```

### **성능 모니터링**
```typescript
// 변환 성능 추적
const performanceTracker = {
  startTime: Date.now(),
  
  track(step: string) {
    console.log(`${step}: ${Date.now() - this.startTime}ms`);
  }
};
```

**이제 Claude Code에서 바로 시작하세요!** 🚀

어떤 부분부터 구현하고 싶으신가요?