'use client';

import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConversionResults } from '@/types';

interface ConversionProgressProps {
  formats: ('gif' | 'webm')[];
  onComplete: (results: ConversionResults) => void;
}

interface ProcessStep {
  step: number;
  message: string;
  duration: number;
}

export function ConversionProgress({ 
  formats, 
  onComplete 
}: ConversionProgressProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [cancelled, setCancelled] = useState(false);
  
  const steps: ProcessStep[] = [
    { step: 0, message: '영상 분석 중...', duration: 2000 },
    { step: 20, message: '프레임 추출 중...', duration: 3000 },
    { step: 40, message: 'GIF 생성 중...', duration: 5000 },
    { step: 65, message: 'WebM 최적화 중...', duration: 3000 },
    { step: 85, message: '후처리 중...', duration: 2000 },
    { step: 95, message: '마무리 중...', duration: 1000 },
    { step: 100, message: '완료!', duration: 500 }
  ];
  
  useEffect(() => {
    if (cancelled) return;
    
    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;
    
    const processStep = () => {
      if (currentIndex >= steps.length || cancelled) {
        if (!cancelled && currentIndex >= steps.length) {
          // Simulate conversion completion
          const mockResults: ConversionResults = {
            gif: formats.includes('gif') ? new Blob(['fake gif data'], { type: 'image/gif' }) : undefined,
            webm: formats.includes('webm') ? new Blob(['fake webm data'], { type: 'video/webm' }) : undefined,
            metadata: {
              originalSize: 15 * 1024 * 1024, // 15MB
              gifSize: 45 * 1024 * 1024, // 45MB
              webmSize: 8 * 1024 * 1024, // 8MB
              compressionRatio: {
                gif: 3.0,
                webm: 0.53
              }
            }
          };
          onComplete(mockResults);
        }
        return;
      }
      
      const step = steps[currentIndex];
      setCurrentStep(step.message);
      setProgress(step.step);
      
      timeoutId = setTimeout(() => {
        currentIndex++;
        processStep();
      }, step.duration);
    };
    
    processStep();
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [cancelled, onComplete, formats]);
  
  const handleCancel = () => {
    setCancelled(true);
  };
  
  const getProcessingMessage = () => {
    if (formats.includes('gif') && formats.includes('webm')) {
      return 'GIF와 WebM 모두 생성 중...';
    } else if (formats.includes('gif')) {
      return 'GIF 생성 중...';
    } else if (formats.includes('webm')) {
      return 'WebM 생성 중...';
    }
    return '처리 중...';
  };

  return (
    <Card className="p-8 max-w-md mx-auto">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">변환 중...</h2>
          <p className="text-sm text-gray-600">잠시만 기다려주세요</p>
        </div>
        
        <div className="space-y-6">
          {/* Animated spinner */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="text-6xl animate-pulse">⚡</div>
              <div className="absolute inset-0 animate-spin">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full"></div>
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="space-y-2">
            <Progress value={progress} className="w-full h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0%</span>
              <span className="font-medium">{progress}%</span>
              <span>100%</span>
            </div>
          </div>
          
          {/* Current step */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">{currentStep}</p>
            <p className="text-xs text-gray-500">{getProcessingMessage()}</p>
          </div>
          
          {/* Format indicators */}
          <div className="flex justify-center space-x-4">
            {formats.map((format) => (
              <div
                key={format}
                className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs ${
                  progress > 50
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <span>{format === 'gif' ? '🎬' : '⚡'}</span>
                <span>{format.toUpperCase()}</span>
                {progress > 50 && <span>✓</span>}
              </div>
            ))}
          </div>
        </div>
        
        {/* Cancel button */}
        <div className="pt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleCancel}
            disabled={progress >= 95 || cancelled}
            className="text-xs"
          >
            {cancelled ? '취소됨' : '취소'}
          </Button>
        </div>
        
        {/* Processing tips */}
        <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
          <p>💡 팁: 고품질 변환을 위해 시간이 걸릴 수 있습니다</p>
          <p>📱 변환 중에도 다른 작업을 계속하세요</p>
        </div>
      </div>
    </Card>
  );
}