'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConversionResults, FormatRecommendation } from '@/types';
import { Download, RotateCcw, CheckCircle, TrendingDown } from 'lucide-react';

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
    if (results.gif) {
      downloadFile(results.gif, 'sns-optimized.gif');
    }
    if (results.webm) {
      downloadFile(results.webm, 'web-optimized.webm');
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    return `${Math.round(bytes / 1024 / 1024)}MB`;
  };

  return (
    <div className="space-y-6">
      {/* Success header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-green-600">
          ✅ 변환 완료!
        </h2>
        <p className="text-gray-600">
          최적화된 파일이 준비되었습니다
        </p>
        <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg inline-block">
          💡 {recommendation.reason}
        </div>
      </div>
      
      {/* Statistics card */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <h3 className="font-semibold mb-4 flex items-center">
          <TrendingDown className="w-5 h-5 mr-2" />
          📊 변환 결과
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-blue-600">
              {formatFileSize(results.metadata.originalSize)}
            </div>
            <div className="text-xs text-gray-600">원본 크기</div>
          </div>
          
          {results.gif && (
            <div className="space-y-1">
              <div className="text-2xl font-bold text-orange-600">
                {formatFileSize(results.metadata.gifSize)}
              </div>
              <div className="text-xs text-gray-600">GIF 크기</div>
              <div className="text-xs text-orange-600 font-medium">
                {results.metadata.compressionRatio.gif}x 증가
              </div>
            </div>
          )}
          
          {results.webm && (
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-600">
                {formatFileSize(results.metadata.webmSize)}
              </div>
              <div className="text-xs text-gray-600">WebM 크기</div>
              <div className="text-xs text-green-600 font-medium">
                {Math.round((1 - results.metadata.compressionRatio.webm) * 100)}% 절약
              </div>
            </div>
          )}
        </div>
      </Card>
      
      {/* Download cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {results.gif && (
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-center space-y-4">
              <div className="text-4xl">🎬</div>
              <h3 className="text-lg font-semibold">SNS용 GIF</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>파일 크기:</span>
                  <span className="font-medium">
                    {formatFileSize(results.metadata.gifSize)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>압축률:</span>
                  <span className="font-medium text-orange-600">
                    {results.metadata.compressionRatio.gif}x
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
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
                <Download className="w-4 h-4 mr-2" />
                GIF 다운로드
              </Button>
            </div>
          </Card>
        )}
        
        {results.webm && (
          <Card className="p-6 ring-2 ring-green-500 hover:shadow-lg transition-shadow">
            <div className="text-center space-y-4">
              <div className="flex justify-center items-center space-x-2">
                <span className="text-4xl">⚡</span>
                <Badge className="bg-green-500 text-white text-xs">최고 품질</Badge>
              </div>
              <h3 className="text-lg font-semibold">웹용 WebM</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>파일 크기:</span>
                  <span className="font-medium text-green-600">
                    {formatFileSize(results.metadata.webmSize)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>압축률:</span>
                  <span className="font-medium text-green-600">
                    {Math.round((1 - results.metadata.compressionRatio.webm) * 100)}% 절약
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
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
                <Download className="w-4 h-4 mr-2" />
                WebM 다운로드
              </Button>
            </div>
          </Card>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="space-y-4">
        {results.gif && results.webm && (
          <div className="text-center">
            <Button 
              variant="outline" 
              size="lg"
              onClick={downloadAll}
              className="px-8"
            >
              📦 전체 다운로드
            </Button>
          </div>
        )}
        
        <div className="text-center space-y-2">
          <Button 
            variant="ghost"
            onClick={onStartNew}
            className="px-6"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            🆕 새로운 파일 변환하기
          </Button>
          
          <p className="text-xs text-gray-500">
            다른 영상도 변환해보세요!
          </p>
        </div>
      </div>
    </div>
  );
}