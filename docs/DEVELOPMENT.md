# FlexiGif 개발 가이드

## 개발 환경 구성

### 에디터 설정

#### VS Code (권장)
권장 확장 프로그램:
- **ES7+ React/Redux/React-Native snippets**
- **TypeScript Importer**
- **Tailwind CSS IntelliSense**
- **ESLint**
- **Prettier**
- **Jest**

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

### 개발 워크플로

#### 1. 브랜치 전략
```bash
# 메인 브랜치
main                    # 프로덕션 배포용
develop                # 개발 통합 브랜치

# 기능 브랜치
feature/[기능명]        # 새 기능 개발
fix/[이슈명]           # 버그 수정
docs/[문서명]          # 문서 작성
test/[테스트명]        # 테스트 추가
```

#### 2. 개발 프로세스
```bash
# 1. 기능 브랜치 생성
git checkout -b feature/video-quality-optimizer

# 2. TDD 사이클 진행
npm run test -- --watch

# 3. 개발 및 테스트
npm run dev

# 4. 코드 품질 검사
npm run lint
npm run type-check

# 5. 커밋
git add .
git commit -m "feat: add video quality optimizer"

# 6. Push 및 PR
git push origin feature/video-quality-optimizer
```

## 아키텍처 패턴

### 폴더 구조 설계

```
src/
├── __tests__/                    # 테스트 파일
│   ├── unit/                    # 단위 테스트
│   ├── integration/             # 통합 테스트
│   └── e2e/                     # E2E 테스트
├── app/                         # Next.js App Router
│   ├── (routes)/               # 라우트 그룹
│   ├── api/                    # API 라우트
│   ├── globals.css             # 글로벌 스타일
│   ├── layout.tsx              # 레이아웃
│   └── page.tsx                # 메인 페이지
├── components/                  # React 컴포넌트
│   ├── ui/                     # 재사용 가능한 UI
│   ├── forms/                  # 폼 컴포넌트
│   ├── layout/                 # 레이아웃 컴포넌트
│   └── feature/                # 기능별 컴포넌트
├── lib/                        # 비즈니스 로직
│   ├── engines/                # 변환 엔진
│   ├── analyzers/              # 분석 도구
│   ├── validators/             # 검증 로직
│   ├── utils/                  # 유틸리티
│   └── constants/              # 상수 정의
├── hooks/                      # 커스텀 훅
├── stores/                     # 상태 관리 (향후)
├── types/                      # TypeScript 타입
└── styles/                     # 스타일 파일
```

### 컴포넌트 설계 패턴

#### 1. 컴포넌트 구조
```typescript
// components/FeatureCard.tsx
interface FeatureCardProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  disabled?: boolean;
}

export function FeatureCard({ 
  title, 
  description, 
  icon: Icon, 
  onClick,
  disabled = false 
}: FeatureCardProps) {
  return (
    <div 
      className="p-6 border rounded-lg hover:shadow-md transition-shadow"
      onClick={disabled ? undefined : onClick}
    >
      {Icon && <Icon className="w-8 h-8 mb-4 text-blue-500" />}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
```

#### 2. 커스텀 훅 패턴
```typescript
// hooks/useVideoAnalysis.ts
import { useState, useCallback } from 'react';
import { VideoAnalyzer } from '@/lib/video-analyzer';
import { VideoMetadata } from '@/types';

interface UseVideoAnalysisReturn {
  metadata: VideoMetadata | null;
  analyzing: boolean;
  error: string | null;
  analyzeVideo: (file: File) => Promise<void>;
  reset: () => void;
}

export function useVideoAnalysis(): UseVideoAnalysisReturn {
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeVideo = useCallback(async (file: File) => {
    try {
      setAnalyzing(true);
      setError(null);
      
      const analyzer = new VideoAnalyzer();
      const result = await analyzer.analyze(file);
      
      setMetadata(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.');
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setMetadata(null);
    setAnalyzing(false);
    setError(null);
  }, []);

  return {
    metadata,
    analyzing,
    error,
    analyzeVideo,
    reset,
  };
}
```

## 테스트 전략

### TDD 개발 사이클

#### 1. Red Phase (실패하는 테스트 작성)
```typescript
// __tests__/video-optimizer.test.ts
describe('VideoOptimizer', () => {
  it('should optimize video settings based on target platform', () => {
    const optimizer = new VideoOptimizer();
    const input = {
      width: 1920,
      height: 1080,
      duration: 30,
      platform: 'instagram'
    };
    
    const result = optimizer.optimize(input);
    
    // Instagram 최적화 설정 검증
    expect(result.width).toBeLessThanOrEqual(1080);
    expect(result.duration).toBeLessThanOrEqual(60);
    expect(result.format).toBe('mp4');
  });
});
```

#### 2. Green Phase (최소한의 구현)
```typescript
// lib/video-optimizer.ts
export class VideoOptimizer {
  optimize(input: VideoInput): OptimizationResult {
    if (input.platform === 'instagram') {
      return {
        width: Math.min(input.width, 1080),
        height: Math.min(input.height, 1080),
        duration: Math.min(input.duration, 60),
        format: 'mp4'
      };
    }
    
    return input;
  }
}
```

#### 3. Refactor Phase (코드 개선)
```typescript
// lib/video-optimizer.ts
interface PlatformConfig {
  maxWidth: number;
  maxHeight: number;
  maxDuration: number;
  preferredFormat: string;
}

const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  instagram: {
    maxWidth: 1080,
    maxHeight: 1080,
    maxDuration: 60,
    preferredFormat: 'mp4'
  },
  youtube: {
    maxWidth: 1920,
    maxHeight: 1080,
    maxDuration: 0, // 무제한
    preferredFormat: 'mp4'
  }
};

export class VideoOptimizer {
  optimize(input: VideoInput): OptimizationResult {
    const config = PLATFORM_CONFIGS[input.platform];
    if (!config) return input;
    
    return {
      width: Math.min(input.width, config.maxWidth),
      height: Math.min(input.height, config.maxHeight),
      duration: config.maxDuration ? Math.min(input.duration, config.maxDuration) : input.duration,
      format: config.preferredFormat
    };
  }
}
```

### 테스트 유형별 가이드

#### 1. 단위 테스트
```typescript
// 순수 함수 테스트
describe('calculateFileSize', () => {
  it('should calculate GIF file size correctly', () => {
    const settings = { width: 480, height: 360, fps: 24, duration: 5 };
    const expectedSize = 480 * 360 * 24 * 5 * 0.5; // bytes per pixel
    
    expect(calculateFileSize('gif', settings)).toBeCloseTo(expectedSize, 0);
  });
});

// 클래스 메서드 테스트
describe('RecommendationEngine', () => {
  let engine: RecommendationEngine;
  
  beforeEach(() => {
    engine = new RecommendationEngine();
  });
  
  it('should recommend GIF for social media use', () => {
    const intent = { purpose: 'social', platforms: ['instagram', 'twitter'] };
    const metadata = { width: 1080, height: 1080, duration: 10, fps: 30 };
    
    const recommendation = engine.analyze(intent, metadata);
    
    expect(recommendation.primary).toBe('gif');
    expect(recommendation.reason).toContain('호환성');
  });
});
```

#### 2. 컴포넌트 테스트
```typescript
// __tests__/components/FileUploader.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUploader } from '@/components/FileUploader';

describe('FileUploader', () => {
  const mockOnFileSelect = jest.fn();
  
  beforeEach(() => {
    mockOnFileSelect.mockClear();
  });
  
  it('should accept valid video files', async () => {
    render(
      <FileUploader 
        onFileSelect={mockOnFileSelect}
        acceptedFormats={['mp4', 'mov']}
      />
    );
    
    const file = new File(['video content'], 'test.mp4', { type: 'video/mp4' });
    const input = screen.getByLabelText(/파일 선택/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(mockOnFileSelect).toHaveBeenCalledWith(file);
    });
  });
  
  it('should reject invalid file formats', async () => {
    render(
      <FileUploader 
        onFileSelect={mockOnFileSelect}
        acceptedFormats={['mp4']}
      />
    );
    
    const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/파일 선택/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(screen.getByText(/지원하지 않는 파일 형식/)).toBeInTheDocument();
    expect(mockOnFileSelect).not.toHaveBeenCalled();
  });
});
```

#### 3. 통합 테스트
```typescript
// __tests__/integration/conversion-flow.test.ts
describe('Video Conversion Flow', () => {
  it('should complete full conversion process', async () => {
    // 1. 파일 업로드
    const file = new File(['mock video'], 'test.mp4', { type: 'video/mp4' });
    
    // 2. 비디오 분석
    const analyzer = new VideoAnalyzer();
    const metadata = await analyzer.analyze(file);
    
    // 3. 추천 생성
    const engine = new RecommendationEngine();
    const recommendation = engine.analyze(
      { purpose: 'social', platforms: ['instagram'] }, 
      metadata
    );
    
    // 4. 변환 실행
    const converter = recommendation.primary === 'gif' 
      ? new GifEngine() 
      : new WebMEngine();
    
    await converter.initialize();
    const result = await converter.convert(file, recommendation.settings);
    
    // 5. 결과 검증
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toContain(recommendation.primary);
  });
});
```

## 코드 품질 관리

### ESLint 설정

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### TypeScript 엄격 모드

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 커밋 훅 설정

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm test"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ]
  }
}
```

## 성능 최적화

### 번들 분석

```bash
# 번들 크기 분석
npm run build -- --analyze

# 중복 패키지 확인
npx bundle-analyzer .next/static/chunks/*.js
```

### 코드 스플리팅

```typescript
// 지연 로딩
import dynamic from 'next/dynamic';

const VideoEditor = dynamic(() => import('@/components/VideoEditor'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

// Route 기반 스플리팅
const ConversionPage = dynamic(() => import('@/pages/conversion'));
```

### 메모리 최적화

```typescript
// 대용량 파일 처리 시 메모리 정리
useEffect(() => {
  return () => {
    // 컴포넌트 언마운트 시 정리
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
  };
}, [videoUrl]);
```

## 디버깅 가이드

### 개발 도구 활용

```javascript
// 브라우저 디버깅
console.time('video-analysis');
const metadata = await analyzer.analyze(file);
console.timeEnd('video-analysis');

// React DevTools Profiler
import { Profiler } from 'react';

function onRenderCallback(id, phase, actualDuration) {
  console.log('Render:', { id, phase, actualDuration });
}

<Profiler id="ConversionFlow" onRender={onRenderCallback}>
  <ConversionProgress />
</Profiler>
```

### 로깅 시스템

```typescript
// lib/logger.ts
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private level: LogLevel = process.env.NODE_ENV === 'development' 
    ? LogLevel.DEBUG 
    : LogLevel.INFO;

  debug(message: string, data?: any): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, data);
    }
  }

  info(message: string, data?: any): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, data);
    }
  }

  warn(message: string, data?: any): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, data);
    }
  }

  error(message: string, error?: Error): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, error);
    }
  }
}

export const logger = new Logger();
```

## 문서화 가이드

### JSDoc 작성 규칙

```typescript
/**
 * 비디오 파일을 분석하여 메타데이터를 추출합니다.
 * 
 * @param file - 분석할 비디오 파일
 * @param options - 분석 옵션 설정
 * @returns 비디오 메타데이터 정보
 * 
 * @example
 * ```typescript
 * const analyzer = new VideoAnalyzer();
 * const metadata = await analyzer.analyze(videoFile);
 * console.log(`Duration: ${metadata.duration}s`);
 * ```
 */
async analyze(
  file: File, 
  options?: AnalysisOptions
): Promise<VideoMetadata> {
  // 구현...
}
```

### README 업데이트 가이드

```markdown
## 새 기능 추가 시 업데이트 항목

1. **기능 목록** - 핵심 기능 섹션 업데이트
2. **기술 스택** - 새로운 의존성 추가 시
3. **API 문서** - 새 API 엔드포인트 추가 시
4. **설치 가이드** - 새로운 요구사항 발생 시
5. **사용 예제** - 새 기능 사용법 추가
```

## 배포 전 체크리스트

### 코드 품질 검증
- [ ] 모든 테스트 통과 (`npm test`)
- [ ] ESLint 경고 없음 (`npm run lint`)
- [ ] TypeScript 컴파일 성공 (`npm run type-check`)
- [ ] 빌드 성공 (`npm run build`)

### 기능 검증
- [ ] 파일 업로드 정상 작동
- [ ] 비디오 분석 정상 작동
- [ ] 추천 시스템 정상 작동
- [ ] GIF/WebM 변환 정상 작동
- [ ] 다운로드 정상 작동

### 성능 검증
- [ ] Lighthouse 스코어 90+ 점
- [ ] 번들 크기 500KB 이하
- [ ] First Load JS 130KB 이하
- [ ] 대용량 파일 (50MB) 처리 가능

### 호환성 검증
- [ ] Chrome 최신 버전
- [ ] Firefox 최신 버전
- [ ] Safari 최신 버전
- [ ] 모바일 브라우저

---

> 🔧 **개발 팁**: 각 기능 개발 시 TDD 사이클을 준수하고, 코드 리뷰를 통해 품질을 관리하세요!