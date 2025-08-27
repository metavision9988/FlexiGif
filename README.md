# FlexiGif - AI-Powered Video Conversion Platform

> 🎯 **스마트한 영상 변환 도구** - AI 추천 시스템과 듀얼 엔진으로 최적의 포맷 제공

## 📋 프로젝트 개요

FlexiGif는 사용자의 목적에 맞는 최적의 영상 포맷을 추천하고 변환하는 웹 애플리케이션입니다. GIF와 WebM 듀얼 엔진을 통해 플랫폼별 최적화된 결과물을 제공합니다.

### 🎯 핵심 기능
- **스마트 추천 시스템**: 사용 목적별 최적 포맷 자동 추천
- **듀얼 엔진**: GIF + WebM 동시 변환
- **실시간 프리뷰**: 변환 전 예상 결과 확인
- **브라우저 기반**: 서버 업로드 없는 로컬 처리
- **반응형 UI**: 모든 디바이스 지원

## 🚀 빠른 시작

### 필수 요구사항
- Node.js 18+ 
- npm 또는 yarn

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/metavision9988/FlexiGif.git
cd FlexiGif

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:3000 접속
```

### 프로덕션 빌드

```bash
# 빌드 실행
npm run build

# 빌드 시작
npm start
```

## 🏗️ 기술 스택

### Frontend Framework
- **Next.js 14** (App Router, Turbopack)
- **React 18** (Hooks, Suspense)
- **TypeScript** (타입 안전성)

### 스타일링 & UI
- **Tailwind CSS** (유틸리티 퍼스트)
- **shadcn/ui** (모던 컴포넌트)
- **Lucide React** (아이콘)

### 비디오 처리
- **FFmpeg.js** (WebAssembly 기반)
- **HTML5 Video API** (메타데이터 분석)

### 테스팅
- **Jest** (단위 테스트)
- **React Testing Library** (컴포넌트 테스트)
- **@testing-library/jest-dom** (DOM 테스트)

### 코드 품질
- **ESLint** (코드 린팅)
- **Prettier** (코드 포맷팅)
- **TypeScript** (타입 체크)

## 📁 프로젝트 구조

```
src/
├── __tests__/              # 테스트 파일
│   ├── file-validator.test.ts
│   ├── gif-engine.test.ts
│   ├── recommendation-engine.test.ts
│   ├── video-analyzer.test.ts
│   └── webm-engine.test.ts
├── app/                    # Next.js App Router
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx           # 메인 페이지
├── components/            # React 컴포넌트
│   ├── ui/               # shadcn/ui 컴포넌트
│   ├── ConversionProgress.tsx
│   ├── FileUploader.tsx
│   ├── PurposeSelector.tsx
│   ├── RecommendationCard.tsx
│   └── ResultsDisplay.tsx
├── lib/                  # 핵심 라이브러리
│   ├── file-validator.ts  # 파일 검증
│   ├── gif-engine.ts     # GIF 변환 엔진
│   ├── recommendation-engine.ts # 추천 시스템
│   ├── video-analyzer.ts # 영상 분석
│   ├── webm-engine.ts   # WebM 변환 엔진
│   └── utils.ts         # 유틸리티
└── types/
    └── index.ts         # TypeScript 타입 정의
```

## 🧠 AI 추천 시스템

### 플랫폼별 최적화
- **소셜 미디어**: GIF 우선 (호환성)
- **웹사이트**: WebM 우선 (품질/용량)
- **범용**: 듀얼 제공 (선택권)

### 스마트 분석
- 영상 해상도, 길이, 용량 분석
- 플랫폼별 제한사항 고려
- 품질/용량 균형 최적화

## 🔄 변환 워크플로

### 1. 파일 업로드 & 검증
- 드래그앤드롭 지원
- 파일 형식/크기 검증
- 실시간 에러 처리

### 2. 영상 메타데이터 분석
- 해상도, 길이, FPS 추출
- 코덱 정보 분석
- 품질 평가

### 3. 사용 목적 선택
- 소셜 미디어 공유
- 웹사이트 임베드
- 범용 사용

### 4. AI 추천 시스템
- 목적별 최적 포맷 추천
- 설정값 자동 조정
- 예상 결과 미리보기

### 5. 변환 실행
- FFmpeg.js 기반 처리
- 실시간 진행상황
- 병렬 변환 지원

## 🧪 테스트 전략

### TDD 접근법
모든 핵심 기능은 테스트 우선 개발로 구현되었습니다.

### 테스트 커버리지
- **파일 검증**: 형식, 크기 검증 로직
- **영상 분석**: 메타데이터 추출 및 파싱
- **추천 엔진**: 플랫폼별 추천 로직
- **변환 엔진**: GIF/WebM 변환 파라미터

### 테스트 실행
```bash
# 전체 테스트 실행
npm test

# 특정 파일 테스트
npm test file-validator

# 커버리지 확인
npm test -- --coverage
```

## 🔧 개발 가이드

### 환경 설정
```bash
# 개발 환경 실행
npm run dev

# 타입 체크
npm run type-check

# 린팅
npm run lint
```

### 코드 컨벤션
- **TypeScript**: 엄격한 타입 체크
- **ESLint**: Airbnb 스타일 가이드
- **Prettier**: 자동 코드 포맷팅

### 컴포넌트 구조
- **컴포넌트**: 순수 UI 컴포넌트
- **라이브러리**: 비즈니스 로직 분리
- **타입**: 중앙화된 타입 정의

## 🚀 배포 전략

### Vercel 배포 (권장)
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포 실행
vercel
```

### Docker 배포
```dockerfile
# Dockerfile (예시)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📈 성능 최적화

### 번들 최적화
- **Turbopack**: 빠른 개발 빌드
- **코드 스플리팅**: 페이지별 분할
- **트리 쉐이킹**: 불필요한 코드 제거

### 런타임 최적화
- **WebAssembly**: FFmpeg 네이티브 성능
- **Web Workers**: 백그라운드 처리
- **메모리 관리**: 대용량 파일 처리

## 🔒 보안 고려사항

### 클라이언트 사이드 처리
- 서버 업로드 없음
- 로컬 파일 처리
- 데이터 유출 방지

### 파일 검증
- MIME 타입 검증
- 파일 크기 제한
- 악성 파일 차단

## 🐛 문제 해결

### 일반적인 문제
1. **FFmpeg 로딩 실패**: CORS 설정 확인
2. **대용량 파일 처리**: 메모리 부족 시 파일 크기 줄이기
3. **브라우저 호환성**: 최신 브라우저 사용 권장

### 디버깅 도구
```bash
# 개발자 도구 활성화
npm run dev -- --inspect

# 상세 로깅 활성화
DEBUG=* npm run dev
```

## 🤝 기여하기

### 개발 프로세스
1. Fork 저장소
2. Feature 브랜치 생성
3. TDD로 기능 개발
4. 테스트 통과 확인
5. Pull Request 생성

### 커밋 메시지 컨벤션
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
test: 테스트 추가/수정
refactor: 코드 리팩토링
```

## 📞 지원 및 문의

- **GitHub Issues**: 버그 리포트 및 기능 요청
- **Discussions**: 일반적인 질문 및 토론
- **Email**: metavision9988@gmail.com

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일 참조

---

**Made with ❤️ by metavision9988**

> 🌟 이 프로젝트가 도움이 되셨다면 스타를 눌러주세요!