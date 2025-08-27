# FlexiGif 설치 가이드

## 시스템 요구사항

### 최소 요구사항
- **Node.js**: 18.0.0 이상
- **npm**: 8.0.0 이상 (또는 yarn, pnpm)
- **메모리**: 최소 4GB RAM
- **브라우저**: Chrome 88+, Firefox 87+, Safari 14+

### 권장 사양
- **Node.js**: 20.0.0 이상
- **npm**: 10.0.0 이상
- **메모리**: 8GB 이상 RAM
- **스토리지**: 1GB 여유 공간

## 설치 방법

### 1. 저장소 클론

```bash
# HTTPS 방식
git clone https://github.com/metavision9988/FlexiGif.git

# SSH 방식 (SSH 키 설정 필요)
git clone git@github.com:metavision9988/FlexiGif.git

# 프로젝트 디렉토리 이동
cd FlexiGif
```

### 2. 의존성 설치

#### npm 사용 시
```bash
# 의존성 설치
npm install

# 개발 환경 확인
npm run dev
```

#### yarn 사용 시
```bash
# yarn 설치 (미설치 시)
npm install -g yarn

# 의존성 설치
yarn install

# 개발 환경 확인
yarn dev
```

#### pnpm 사용 시
```bash
# pnpm 설치 (미설치 시)
npm install -g pnpm

# 의존성 설치
pnpm install

# 개발 환경 확인
pnpm dev
```

### 3. 환경 설정

#### 환경 변수 (선택사항)
```bash
# .env.local 파일 생성
touch .env.local

# 환경 변수 설정 (필요시)
echo "NEXT_PUBLIC_APP_NAME=FlexiGif" >> .env.local
```

#### FFmpeg 파일 설정
프로젝트는 FFmpeg WebAssembly 파일을 CDN에서 로드합니다. 로컬 서빙을 원할 경우:

```bash
# public 디렉토리에 FFmpeg 파일 복사
mkdir -p public/ffmpeg
cp node_modules/@ffmpeg/core/dist/* public/ffmpeg/
```

## 개발 환경 실행

### 개발 서버 시작
```bash
npm run dev
# 또는
yarn dev
# 또는
pnpm dev
```

### 접속 확인
브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 개발 도구
```bash
# TypeScript 타입 체크
npm run type-check

# ESLint 코드 품질 검사
npm run lint

# Jest 단위 테스트 실행
npm run test

# 테스트 커버리지 확인
npm run test -- --coverage
```

## 프로덕션 빌드

### 빌드 실행
```bash
# 프로덕션 빌드 생성
npm run build

# 빌드 결과 확인
npm run start
```

### 빌드 최적화 확인
```bash
# 번들 분석 (선택사항)
npm run build -- --analyze
```

## Docker 설치

### Dockerfile 기반 설치
```bash
# Docker 이미지 빌드
docker build -t flexigif .

# 컨테이너 실행
docker run -p 3000:3000 flexigif
```

### Docker Compose 사용
```yaml
# docker-compose.yml
version: '3.8'
services:
  flexigif:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
```

```bash
# Docker Compose로 실행
docker-compose up
```

## 배포 설정

### Vercel 배포
```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 배포 실행
vercel

# 프로덕션 배포
vercel --prod
```

### Netlify 배포
```bash
# Netlify CLI 설치
npm install -g netlify-cli

# 로그인
netlify login

# 배포 실행
netlify deploy

# 프로덕션 배포
netlify deploy --prod
```

## 문제 해결

### 일반적인 설치 오류

#### 1. Node.js 버전 오류
```bash
# 현재 Node.js 버전 확인
node --version

# nvm을 통한 Node.js 버전 관리
nvm install 18
nvm use 18
```

#### 2. 패키지 설치 오류
```bash
# 캐시 정리
npm cache clean --force

# node_modules 재설치
rm -rf node_modules package-lock.json
npm install
```

#### 3. 포트 충돌 오류
```bash
# 다른 포트로 실행
npm run dev -- --port 3001
```

#### 4. 메모리 부족 오류
```bash
# Node.js 메모리 한계 증가
NODE_OPTIONS="--max-old-space-size=8192" npm run build
```

### FFmpeg 관련 오류

#### CORS 오류 해결
```javascript
// next.config.js에서 헤더 설정
module.exports = {
  async headers() {
    return [
      {
        source: '/ffmpeg/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ]
  },
}
```

#### SharedArrayBuffer 지원
최신 브라우저에서만 지원됩니다. 필요시 polyfill 추가:

```bash
npm install --save-dev @ffmpeg/core-st
```

## 성능 최적화

### 개발 환경 최적화
```bash
# Turbopack 활성화 (Next.js 14+)
npm run dev --turbo

# 파일 변경 감시 최적화
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 프로덕션 최적화
```bash
# 번들 크기 분석
npm run build -- --analyze

# 불필요한 파일 제거
npm run build -- --no-lint
```

## 추가 도구 설치

### 개발 도구
```bash
# Git 훅 설정
npm install -g husky
npx husky install

# 코드 포맷팅
npm install -g prettier
```

### 디버깅 도구
```bash
# React Developer Tools
# Chrome 확장 프로그램 설치

# Redux DevTools (상태 관리 사용시)
# Chrome 확장 프로그램 설치
```

## 보안 설정

### 의존성 보안 검사
```bash
# npm 보안 감사
npm audit

# 취약점 자동 수정
npm audit fix

# 심각한 취약점 강제 수정
npm audit fix --force
```

### 환경 변수 보안
```bash
# .env 파일을 .gitignore에 추가
echo ".env*" >> .gitignore

# 민감한 정보는 환경 변수로 관리
# 절대 코드에 하드코딩하지 않기
```

## 지원 및 문의

설치 과정에서 문제가 발생하면:

1. **GitHub Issues**: [프로젝트 이슈 페이지](https://github.com/metavision9988/FlexiGif/issues)
2. **이메일**: metavision9988@gmail.com
3. **문서**: [공식 문서](https://github.com/metavision9988/FlexiGif/docs)

---

> 💡 **팁**: 설치 후 `npm run test`를 실행하여 모든 기능이 정상 작동하는지 확인하세요!