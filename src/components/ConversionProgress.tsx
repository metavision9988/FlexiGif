'use client';

import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConversionResults, GifSettings, WebMSettings, QualityPreset, VideoMetadata } from '@/types';
import { GifEngine } from '@/lib/gif-engine';
import { WebMEngine } from '@/lib/webm-engine';
import { VideoAnalyzer } from '@/lib/video-analyzer';
import { 
  Film, 
  Zap, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Settings
} from 'lucide-react';

interface ConversionProgressProps {
  formats: ('gif' | 'webm')[];
  file: File;
  qualityPreset: QualityPreset;
  onComplete: (results: ConversionResults) => void;
}

interface ConversionStep {
  format: 'gif' | 'webm';
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  startTime?: number;
  endTime?: number;
  estimatedTime?: number;
  timeoutSeconds?: number;
}

export function ConversionProgress({ 
  formats, 
  file,
  qualityPreset,
  onComplete 
}: ConversionProgressProps) {
  const [steps, setSteps] = useState<ConversionStep[]>([]);
  const [currentFormat, setCurrentFormat] = useState<'gif' | 'webm' | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const [cancelled, setCancelled] = useState(false);
  const [startTime] = useState(Date.now());
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  const updateStepProgress = (format: 'gif' | 'webm', progress: number, message?: string) => {
    setSteps(prev => prev.map(step => 
      step.format === format 
        ? { 
            ...step, 
            progress, 
            message: message || step.message,
            status: progress >= 100 ? 'completed' : 'processing' as const
          }
        : step
    ));
    
    // 전체 진행률 업데이트
    setSteps(prev => {
      const totalProgress = prev.reduce((sum, step) => sum + step.progress, 0);
      setOverallProgress(Math.round(totalProgress / prev.length));
      return prev;
    });
  };

  const updateStepStatus = (format: 'gif' | 'webm', status: ConversionStep['status'], message?: string) => {
    setSteps(prev => prev.map(step => 
      step.format === format 
        ? { 
            ...step, 
            status,
            message: message || step.message,
            ...(status === 'processing' ? { startTime: Date.now() } : {}),
            ...(status === 'completed' ? { endTime: Date.now() } : {})
          }
        : step
    ));
  };
  
  // 비디오 분석 및 예상 시간 계산
  useEffect(() => {
    const analyzeVideo = async () => {
      try {
        const analyzer = new VideoAnalyzer();
        const metadata = await analyzer.analyze(file);
        setVideoMetadata(metadata);
        
        // 각 포맷별 예상 시간 계산
        const initialSteps = formats.map(format => {
          const qualityLevel = qualityPreset.conversionTime;
          const estimatedTime = analyzer.estimateConversionTime(metadata, format, qualityLevel);
          const timeoutSeconds = analyzer.calculateTimeout(estimatedTime);
          
          return {
            format,
            status: 'pending' as const,
            progress: 0,
            message: `예상 시간: ${Math.round(estimatedTime)}초`,
            estimatedTime,
            timeoutSeconds
          };
        });
        
        setSteps(initialSteps);
        setIsAnalyzing(false);
        
        console.log('비디오 분석 완료:', metadata);
        console.log('예상 변환 시간:', initialSteps.map(s => `${s.format}: ${s.estimatedTime}초`));
      } catch (error) {
        console.error('비디오 분석 실패:', error);
        // 분석 실패해도 기본값으로 진행
        const fallbackSteps = formats.map(format => ({
          format,
          status: 'pending' as const,
          progress: 0,
          message: '대기 중...',
          estimatedTime: 60, // 기본 60초
          timeoutSeconds: 180 // 기본 3분
        }));
        setSteps(fallbackSteps);
        setIsAnalyzing(false);
      }
    };
    
    analyzeVideo();
  }, [file, formats, qualityPreset]);

  useEffect(() => {
    if (cancelled || isAnalyzing || steps.length === 0) return;
    
    const performConversion = async () => {
      try {
        console.log('실제 변환 시작:', file.name, formats);
        
        const results: ConversionResults = {
          gif: undefined,
          webm: undefined,
          metadata: {
            originalSize: file.size,
            gifSize: 0,
            webmSize: 0,
            compressionRatio: { gif: 0, webm: 0 }
          }
        };
        
        // GIF 변환
        if (formats.includes('gif')) {
          updateStepStatus('gif', 'processing', 'GIF 변환 중...');
          setCurrentFormat('gif');
          
          const gifEngine = new GifEngine();
          gifEngine.setProgressCallback((progress) => {
            updateStepProgress('gif', progress, `GIF 변환 중... ${progress}%`);
          });
          
          const gifSettings: GifSettings = {
            fps: qualityPreset.gifSettings.fps || 15,
            quality: qualityPreset.gifSettings.quality || 'medium',
            optimize: qualityPreset.gifSettings.optimize ?? true,
            width: qualityPreset.gifSettings.width,
            height: qualityPreset.gifSettings.height
          };
          
          console.log('GIF 엔진 호출 시작, 품질:', qualityPreset.label);
          console.log('GIF 설정:', gifSettings);
          const gifBlob = await gifEngine.convert(file, gifSettings);
          results.gif = gifBlob;
          results.metadata.gifSize = gifBlob.size;
          results.metadata.compressionRatio.gif = gifBlob.size / file.size;
          console.log('GIF 변환 완료:', gifBlob.size);
          
          updateStepProgress('gif', 100, 'GIF 변환 완료');
          updateStepStatus('gif', 'completed', 'GIF 변환 완료');
        }
        
        // WebM 변환
        if (formats.includes('webm')) {
          updateStepStatus('webm', 'processing', 'WebM 변환 중...');
          setCurrentFormat('webm');
          
          const webmEngine = new WebMEngine();
          webmEngine.setProgressCallback((progress) => {
            updateStepProgress('webm', progress, `WebM 변환 중... ${progress}%`);
          });
          
          const webmSettings: WebMSettings = {
            crf: qualityPreset.webmSettings.crf || 25,
            codec: qualityPreset.webmSettings.codec || 'vp8',
            fps: qualityPreset.webmSettings.fps,
            width: qualityPreset.webmSettings.width,
            height: qualityPreset.webmSettings.height
          };
          
          console.log('WebM 엔진 호출 시작, 품질:', qualityPreset.label);
          console.log('WebM 설정:', webmSettings);
          
          // 분석된 데이터 기반 적응형 타임아웃
          const webmStep = steps.find(s => s.format === 'webm');
          const timeoutSeconds = webmStep?.timeoutSeconds || 180;
          
          console.log(`WebM 변환 시작 - 예상 시간: ${webmStep?.estimatedTime}초, 타임아웃: ${timeoutSeconds}초`);
          
          const webmPromise = webmEngine.convert(file, webmSettings);
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`WebM 변환 타임아웃 (${timeoutSeconds}초 초과)`)), timeoutSeconds * 1000);
          });
          
          const webmBlob = await Promise.race([webmPromise, timeoutPromise]);
          results.webm = webmBlob;
          results.metadata.webmSize = webmBlob.size;
          results.metadata.compressionRatio.webm = webmBlob.size / file.size;
          console.log('WebM 변환 완료:', webmBlob.size);
          
          updateStepProgress('webm', 100, 'WebM 변환 완료');
          updateStepStatus('webm', 'completed', 'WebM 변환 완료');
        }
        
        setCurrentFormat(null);
        console.log('전체 변환 완료:', results);
        onComplete(results);
        
      } catch (error) {
        console.error('변환 중 오류 발생:', error);
        
        // 현재 처리 중인 포맷에 대해 에러 표시
        if (currentFormat) {
          updateStepStatus(currentFormat, 'error', `${currentFormat.toUpperCase()} 변환 실패`);
        }
        
        // 에러 상황에서도 결과 반환 (빈 결과)
        onComplete({
          gif: undefined,
          webm: undefined,
          metadata: {
            originalSize: file.size,
            gifSize: 0,
            webmSize: 0,
            compressionRatio: { gif: 0, webm: 0 }
          }
        });
      }
    };
    
    performConversion();
  }, [cancelled, onComplete, formats, file, qualityPreset, currentFormat, isAnalyzing, steps]);
  
  const handleCancel = () => {
    setCancelled(true);
  };
  
  const getStatusIcon = (status: ConversionStep['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-gray-400" />;
      case 'processing': return <Zap className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: ConversionStep['status']) => {
    switch (status) {
      case 'pending': return 'border-gray-200 bg-gray-50';
      case 'processing': return 'border-blue-300 bg-blue-50';
      case 'completed': return 'border-green-300 bg-green-50';
      case 'error': return 'border-red-300 bg-red-50';
    }
  };

  const getEstimatedTime = () => {
    if (isAnalyzing) {
      return '비디오 분석 중...';
    }
    const processingSteps = steps.filter(s => s.status === 'processing');
    const completedSteps = steps.filter(s => s.status === 'completed');
    const pendingSteps = steps.filter(s => s.status === 'pending');
    
    if (completedSteps.length === steps.length) {
      return '변환 완료!';
    }
    
    if (processingSteps.length > 0 && processingSteps[0].estimatedTime) {
      const currentStep = processingSteps[0];
      const progressRatio = currentStep.progress / 100;
      const expectedTotal = currentStep.estimatedTime || 60;
      const remaining = Math.round(expectedTotal * (1 - progressRatio));
      
      // 나머지 대기 중인 스텝 시간 추가
      const pendingTime = pendingSteps.reduce((sum, step) => sum + (step.estimatedTime || 60), 0);
      const totalRemaining = remaining + pendingTime;
      
      if (totalRemaining < 60) {
        return `약 ${totalRemaining}초 남음`;
      }
      return `약 ${Math.round(totalRemaining / 60)}분 남음`;
    }
    
    // 초기 예상 시간
    const totalEstimated = steps.reduce((sum, step) => sum + (step.estimatedTime || 60), 0);
    if (totalEstimated < 60) {
      return `예상 ${totalEstimated}초`;
    }
    return `예상 ${Math.round(totalEstimated / 60)}분`;
  };

  return (
    <Card className="p-8 max-w-2xl mx-auto">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                {isAnalyzing ? (
                  <Settings className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <Sparkles className="w-8 h-8 text-white animate-pulse" />
                )}
              </div>
              <div className="absolute -inset-2">
                <div className="w-24 h-24 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin opacity-20"></div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-800">
              {isAnalyzing ? '비디오 분석 중' : 'AI 영상 변환 중'}
            </h2>
            <p className="text-gray-600">
              {isAnalyzing 
                ? '최적의 변환 설정을 계산하고 있습니다' 
                : '고품질 변환을 위해 잠시만 기다려주세요'
              }
            </p>
            {videoMetadata && !isAnalyzing && (
              <div className="text-sm text-gray-500 space-x-4 flex justify-center">
                <span>해상도: {videoMetadata.width}x{videoMetadata.height}</span>
                <span>시간: {Math.round(videoMetadata.duration)}초</span>
                <span>크기: {Math.round(videoMetadata.size / 1024 / 1024)}MB</span>
                <span>경과: {Math.round((Date.now() - startTime) / 1000)}초</span>
              </div>
            )}
          </div>
        </div>

        {/* Overall Progress */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">전체 진행률</span>
            <span className="text-sm text-gray-500">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="w-full h-3" />
          <div className="text-center text-xs text-gray-500">
            {getEstimatedTime()}
          </div>
        </div>

        {/* Step-by-step Progress */}
        {!isAnalyzing && steps.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>변환 단계</span>
            </h3>
            
            <div className="space-y-3">
              {steps.map((step) => (
              <div 
                key={step.format}
                className={`border-2 rounded-lg p-4 transition-all duration-300 ${getStatusColor(step.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(step.status)}
                    <div>
                      <div className="font-medium text-gray-800">
                        {step.format === 'gif' ? '🎬 GIF' : '⚡ WebM'} 변환
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {step.message}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-800">
                      {step.progress}%
                    </div>
                    {step.status === 'processing' && step.progress > 0 && (
                      <div className="text-xs text-gray-500">
                        처리 중...
                      </div>
                    )}
                  </div>
                </div>
                
                {step.status === 'processing' && (
                  <div className="mt-3">
                    <Progress value={step.progress} className="w-full h-2" />
                  </div>
                )}
              </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleCancel}
            disabled={overallProgress >= 95 || cancelled}
          >
            {cancelled ? '취소됨' : '변환 취소'}
          </Button>
        </div>
        
        {/* Processing Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-800 space-y-2">
            <div className="flex items-center space-x-2 font-medium">
              <Film className="w-4 h-4" />
              <span>변환 팁</span>
            </div>
            <div className="text-xs space-y-1 ml-6">
              <p>• 고품질 설정일수록 시간이 더 걸립니다</p>
              <p>• 변환 중에도 다른 탭에서 작업 가능합니다</p>
              <p>• 브라우저를 닫지 마세요</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}