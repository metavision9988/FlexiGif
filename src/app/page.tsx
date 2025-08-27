'use client';

import { useState } from 'react';
import { FileUploader } from '@/components/FileUploader';
import { PurposeSelector } from '@/components/PurposeSelector';
import { RecommendationCard } from '@/components/RecommendationCard';
import { QualitySelector } from '@/components/QualitySelector';
import { ConversionProgress } from '@/components/ConversionProgress';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { RecommendationEngine } from '@/lib/recommendation-engine';
import { VideoAnalyzer } from '@/lib/video-analyzer';
import { getQualityPreset } from '@/lib/quality-presets';
import { ConversionState, VideoMetadata, QualityPreset } from '@/types';

export default function HomePage() {
  const [state, setState] = useState<ConversionState>({
    file: null,
    userIntent: null,
    recommendation: null,
    selectedQuality: null,
    converting: false,
    results: null
  });
  
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  
  const handleFileSelect = async (file: File) => {
    try {
      // Analyze video metadata
      const analyzer = new VideoAnalyzer();
      const metadata = await analyzer.analyze(file);
      
      setVideoMetadata(metadata);
      setState(prev => ({ ...prev, file }));
    } catch (error) {
      console.error('Error analyzing video:', error);
      // Still allow the file to be processed without metadata
      setState(prev => ({ ...prev, file }));
    }
  };
  
  const handlePurposeSelect = (intent: ConversionState['userIntent']) => {
    if (!videoMetadata) {
      console.error('No video metadata available');
      return;
    }
    
    const engine = new RecommendationEngine();
    const recommendation = engine.analyze(intent!, videoMetadata);
    
    setState(prev => ({
      ...prev,
      userIntent: intent,
      recommendation,
      selectedQuality: getQualityPreset('balanced') // 기본값 설정
    }));
  };

  const handleQualitySelect = (quality: QualityPreset) => {
    setState(prev => ({
      ...prev,
      selectedQuality: quality
    }));
  };
  
  const handleStartConversion = () => {
    setState(prev => ({ ...prev, converting: true }));
  };
  
  const handleConversionComplete = (results: ConversionState['results']) => {
    setState(prev => ({
      ...prev,
      converting: false,
      results
    }));
  };
  
  const handleStartNew = () => {
    setState({
      file: null,
      userIntent: null,
      recommendation: null,
      selectedQuality: null,
      converting: false,
      results: null
    });
    setVideoMetadata(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ConvertAI Pro
            </h1>
            <p className="text-xl text-gray-700 font-medium">
              AI 영상을 어디든 공유하세요
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="text-lg">📱</span>
                <span>SNS는 GIF로</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">🌐</span>
                <span>웹사이트는 WebM으로</span>
              </div>
            </div>
          </div>
        </header>
        
        <div className="space-y-8">
          {/* Step 1: File Upload */}
          {!state.file && (
            <section>
              <FileUploader 
                onFileSelect={handleFileSelect}
                maxSize={100 * 1024 * 1024} // 100MB
                acceptedFormats={['mp4', 'mov', 'avi']}
                dragAndDrop={true}
              />
            </section>
          )}
          
          {/* Step 2: Purpose Selection */}
          {state.file && !state.userIntent && (
            <section>
              <PurposeSelector
                onPurposeSelect={handlePurposeSelect}
              />
            </section>
          )}
          
          {/* Step 3: Recommendation Display */}
          {state.recommendation && !state.selectedQuality && !state.converting && !state.results && (
            <section>
              <RecommendationCard
                recommendation={state.recommendation}
                onStartConversion={() => {
                  // 기본 품질로 바로 진행하거나 품질 선택 단계로 이동
                  setState(prev => ({ ...prev, selectedQuality: getQualityPreset('balanced') }));
                }}
              />
            </section>
          )}

          {/* Step 4: Quality Selection */}
          {state.recommendation && state.selectedQuality && !state.converting && !state.results && (
            <section>
              <QualitySelector
                selectedQuality={state.selectedQuality}
                onQualitySelect={handleQualitySelect}
                estimatedOriginalSize={Math.round((state.file?.size || 0) / (1024 * 1024))}
              />
              <div className="text-center mt-6">
                <button
                  onClick={handleStartConversion}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <span className="mr-2">⚡</span>
                  선택한 품질로 변환 시작
                </button>
              </div>
            </section>
          )}
          
          {/* Step 5: Conversion Progress */}
          {state.converting && !state.results && state.file && state.selectedQuality && (
            <section>
              <ConversionProgress
                formats={[
                  state.recommendation!.primary,
                  ...(state.recommendation!.secondary ? [state.recommendation!.secondary] : [])
                ]}
                file={state.file}
                qualityPreset={state.selectedQuality}
                onComplete={handleConversionComplete}
              />
            </section>
          )}
          
          {/* Step 6: Results Display */}
          {state.results && (
            <section>
              <ResultsDisplay
                results={state.results}
                recommendation={state.recommendation!}
                onStartNew={handleStartNew}
              />
            </section>
          )}
        </div>
        
        {/* Footer */}
        <footer className="text-center mt-16 pt-8 border-t border-gray-200">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              ConvertAI Pro - 스마트한 영상 변환 도구
            </p>
            <div className="flex justify-center space-x-4 text-xs text-gray-400">
              <span>🔒 브라우저에서 안전하게 처리</span>
              <span>⚡ 빠른 변환</span>
              <span>📱 모든 플랫폼 지원</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}