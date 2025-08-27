# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ConvertAI Pro (FlexiGif)** is a dual-engine video conversion web application that converts videos to both GIF and WebM formats with smart recommendations based on intended use.

### Core Concept
- **SNS는 GIF로** (Maximum compatibility for social media)
- **웹사이트는 WebM으로** (Best quality for websites)  
- **스마트 추천** (Smart recommendations by usage type)

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **Icons**: Lucide React

### Processing Engine
- **Video Engine**: FFmpeg.js (WebAssembly)
- **Workers**: Web Workers (non-blocking processing)
- **File Handling**: Web File API

### Backend
- **API**: Next.js API Routes
- **Database**: Supabase (usage tracking)
- **Storage**: Vercel Blob (temporary files)

### Deployment
- **Hosting**: Vercel
- **CDN**: Vercel Edge Network
- **Analytics**: Vercel Analytics

## Key Architecture Patterns

### Dual Engine Abstraction
```typescript
interface ConversionEngine {
  name: 'gif' | 'webm';
  convert(file: File, settings: ConversionSettings): Promise<Blob>;
  estimate(file: File, settings: ConversionSettings): Promise<EstimateResult>;
}
```

### Factory Pattern for Engine Creation
```typescript
class ConverterFactory {
  static create(format: 'gif' | 'webm'): ConversionEngine {
    return format === 'gif' ? new GifEngine() : new WebMEngine();
  }
}
```

### Smart Recommendation System
```typescript
interface RecommendationEngine {
  analyze(userIntent: UserIntent): FormatRecommendation;
  getOptimalSettings(format: 'gif' | 'webm', file: File): ConversionSettings;
}
```

## Core Components Architecture

### Main Application Flow
1. **FileUploader** - Handles file upload and validation (max 100MB, mp4/mov/avi)
2. **PurposeSelector** - Determines user intent (social/website/both)
3. **RecommendationCard** - Shows smart format recommendations with reasoning
4. **ConversionProgress** - Real-time processing feedback with Web Workers
5. **ResultsDisplay** - Download interface with optimization statistics

### Processing Engines

#### GIF Engine (`lib/gif-engine.ts`)
- Uses FFmpeg.js for WebAssembly-based processing
- Quality settings: low (128 colors) / medium (256) / high (256 optimized)
- 2-pass optimization for better quality
- Configurable FPS and resolution scaling

#### WebM Engine (`lib/webm-engine.ts`)  
- VP8/VP9 codec support with CRF quality control
- Variable bitrate optimization
- Audio removal for GIF replacement use cases
- Lanczos scaling for high-quality resizing

### Video Analysis System (`lib/video-analyzer.ts`)
- Extracts metadata: duration, resolution, FPS, file size
- Provides basis for smart recommendations and size estimation
- Browser-based analysis using HTML5 video element

## Smart Recommendation Logic

### Recommendation Factors
- **Purpose**: social → GIF primary, website → WebM primary, both → dual output
- **Platform Compatibility**: Twitter/Instagram/Facebook prefer GIF, Discord/Reddit support WebM
- **File Size Estimation**: Based on video metadata and empirical formulas
- **Quality Preferences**: Balanced approach with warnings for large files

### Platform-Specific Optimizations
- **SNS Platforms**: GIF with maximum compatibility warnings
- **Web Platforms**: WebM with fallback GIF option
- **Discord**: WebM preferred with quality benefits highlighted

## Development Commands

Since this is a new project in early planning stage, the standard Next.js commands will be:

```bash
# Install dependencies (when package.json exists)
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Linting (when configured)
npm run lint

# Type checking (when configured)  
npm run type-check
```

## Key Development Considerations

### FFmpeg.js Integration
- WebAssembly files must be served from `/public/ffmpeg/`
- Memory management critical - use singleton pattern for FFmpeg instance
- Cleanup temporary files after each conversion to prevent memory leaks

### Performance Optimization
- Use Web Workers for non-blocking video processing
- Implement progress tracking with realistic time estimates
- Cache FFmpeg instance across conversions
- Monitor memory usage during large file processing

### File Size Management
- 100MB maximum input file size
- Size estimation before conversion to set user expectations
- Warning system for potentially large output files (>50MB)
- Compression ratio tracking and display

### Error Handling
- File validation with clear error messages
- FFmpeg processing error recovery
- Memory exhaustion protection
- Browser compatibility checks for WebAssembly support

## Implementation Phases

### Phase 1: Core Engine (Week 1)
- File upload system with drag & drop
- Video metadata analysis
- Smart recommendation engine logic
- Basic GIF/WebM conversion engines
- FFmpeg.js integration

### Phase 2: UI/UX (Week 2)  
- Purpose selector with platform icons
- Recommendation cards with reasoning display
- Progress indicators with realistic timing
- Results display with download options
- Platform compatibility badges

### 25 Rules Development Structure
The PRD defines a comprehensive 25-rule development roadmap. Each rule represents a specific feature or component that builds toward the complete dual-engine conversion system.

## File Structure (Planned)
```
/components/
  - FileUploader.tsx
  - PurposeSelector.tsx  
  - RecommendationCard.tsx
  - ConversionProgress.tsx
  - ResultsDisplay.tsx
  
/lib/
  - gif-engine.ts
  - webm-engine.ts
  - video-analyzer.ts
  - recommendation-engine.ts
  
/app/
  - page.tsx (main conversion flow)
  - api/ (Next.js API routes)
```