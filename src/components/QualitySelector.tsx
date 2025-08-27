'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QualityPreset } from '@/types';
import { QUALITY_PRESETS, getConversionTimeIcon } from '@/lib/quality-presets';
import { Clock, HardDrive, Zap } from 'lucide-react';

interface QualitySelectorProps {
  selectedQuality: QualityPreset | null;
  onQualitySelect: (quality: QualityPreset) => void;
  estimatedOriginalSize: number; // in MB
}

export function QualitySelector({ 
  selectedQuality, 
  onQualitySelect,
  estimatedOriginalSize 
}: QualitySelectorProps) {
  const formatFileSize = (sizeMultiplier: number): string => {
    const estimated = Math.round(estimatedOriginalSize * sizeMultiplier);
    if (estimated < 1) return '<1MB';
    return `~${estimated}MB`;
  };

  const getTimeEstimate = (preset: QualityPreset): string => {
    const baseTime = Math.max(10, estimatedOriginalSize * 2); // 기본 2초/MB
    const multipliers = { fast: 0.5, medium: 1.0, slow: 2.5 };
    const estimated = Math.round(baseTime * multipliers[preset.conversionTime]);
    
    if (estimated < 60) return `~${estimated}초`;
    return `~${Math.round(estimated / 60)}분`;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">변환 품질 선택</h3>
          <p className="text-sm text-gray-600">
            원하는 품질과 파일 크기를 선택해주세요
          </p>
        </div>

        <div className="grid gap-3">
          {QUALITY_PRESETS.map((preset) => (
            <Button
              key={preset.name}
              variant={selectedQuality?.name === preset.name ? "default" : "outline"}
              className="h-auto p-4 justify-start"
              onClick={() => onQualitySelect(preset)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {getConversionTimeIcon(preset.conversionTime)}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{preset.label}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {preset.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    <HardDrive className="w-3 h-3 mr-1" />
                    {formatFileSize(preset.estimatedSizeMultiplier)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {getTimeEstimate(preset)}
                  </Badge>
                  {preset.name === 'original' && (
                    <Badge className="text-xs bg-blue-500">
                      <Zap className="w-3 h-3 mr-1" />
                      최고품질
                    </Badge>
                  )}
                </div>
              </div>
            </Button>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-xs text-blue-800 space-y-1">
            <p><strong>💡 선택 가이드:</strong></p>
            <p>• <strong>빠른 변환</strong>: SNS 공유용, 빠른 미리보기</p>
            <p>• <strong>균형잡힌 품질</strong>: 일반적인 용도에 권장</p>
            <p>• <strong>고품질</strong>: 웹사이트, 프레젠테이션용</p>
            <p>• <strong>원본 품질</strong>: 아카이브, 전문 용도</p>
          </div>
        </div>
      </div>
    </Card>
  );
}