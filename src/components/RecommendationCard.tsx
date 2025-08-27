'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormatRecommendation } from '@/types';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface RecommendationCardProps {
  recommendation: FormatRecommendation;
  onStartConversion: () => void;
}

export function RecommendationCard({ 
  recommendation, 
  onStartConversion 
}: RecommendationCardProps) {
  const getFormatIcon = (format: 'gif' | 'webm') => {
    return format === 'gif' ? '🎬' : '⚡';
  };
  
  const getFormatName = (format: 'gif' | 'webm') => {
    return format.toUpperCase();
  };
  
  const getPlatformList = (format: 'gif' | 'webm') => {
    if (format === 'gif') {
      return ['Twitter', 'Instagram', 'Facebook', 'KakaoTalk'];
    } else {
      return ['웹사이트', 'Discord', 'Reddit', 'WhatsApp'];
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">맞춤 추천 결과</h2>
        <p className="text-gray-600">사용 목적에 맞는 최적 포맷을 추천해드렸어요</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* Primary recommendation */}
        <Card className="p-6 ring-2 ring-blue-500 relative">
          <Badge className="absolute -top-2 -right-2 bg-blue-500 text-white">
            추천
          </Badge>
          
          <div className="text-center space-y-4">
            <div className="text-3xl">{getFormatIcon(recommendation.primary)}</div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                {getFormatName(recommendation.primary)} 포맷
              </h3>
              <p className="text-sm text-gray-600">
                예상 크기: {recommendation.estimated_sizes[recommendation.primary]}
              </p>
            </div>
            
            <div className="space-y-3 text-left">
              <h4 className="font-medium text-center">호환 플랫폼:</h4>
              <div className="flex flex-wrap gap-1 justify-center">
                {getPlatformList(recommendation.primary).map(platform => (
                  <Badge key={platform} variant="secondary" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
        
        {/* Secondary recommendation */}
        {recommendation.secondary && (
          <Card className="p-6 bg-gray-50">
            <div className="text-center space-y-4">
              <div className="text-3xl">{getFormatIcon(recommendation.secondary)}</div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  {getFormatName(recommendation.secondary)} 포맷
                </h3>
                <p className="text-sm text-gray-600">
                  예상 크기: {recommendation.estimated_sizes[recommendation.secondary]}
                </p>
                <p className="text-xs text-gray-500">
                  추가 옵션으로 함께 생성
                </p>
              </div>
              
              <div className="space-y-3 text-left">
                <h4 className="font-medium text-center">호환 플랫폼:</h4>
                <div className="flex flex-wrap gap-1 justify-center">
                  {getPlatformList(recommendation.secondary).map(platform => (
                    <Badge key={platform} variant="outline" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
      
      {/* Recommendation reason and warnings */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                왜 이 포맷인가요?
              </p>
              <p className="text-sm text-blue-800 mt-1">
                {recommendation.reason}
              </p>
            </div>
          </div>
          
          {recommendation.warnings.length > 0 && (
            <div className="space-y-2">
              {recommendation.warnings.map((warning, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-orange-700">
                    {warning}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
      
      {/* Action button */}
      <div className="text-center">
        <Button 
          onClick={onStartConversion}
          size="lg"
          className="px-12 py-3"
        >
          <span className="mr-2">⚡</span>
          변환 시작하기
        </Button>
        <p className="text-xs text-gray-500 mt-2">
          {recommendation.secondary ? '두 포맷 모두 생성됩니다' : '선택된 포맷으로 생성됩니다'}
        </p>
      </div>
    </div>
  );
}