'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserIntent } from '@/types';

interface PurposeSelectorProps {
  onPurposeSelect: (intent: UserIntent) => void;
}

interface PurposeOption {
  id: 'social' | 'website' | 'both';
  title: string;
  description: string;
  icon: string;
  popular?: boolean;
  recommended?: boolean;
  premium?: boolean;
}

export function PurposeSelector({ onPurposeSelect }: PurposeSelectorProps) {
  const purposes: PurposeOption[] = [
    {
      id: 'social',
      title: '📱 SNS에 업로드',
      description: 'Twitter, Instagram, Facebook, 카카오톡',
      icon: '📲',
      popular: true
    },
    {
      id: 'website',
      title: '🌐 웹사이트/블로그',
      description: '내 사이트, Discord, Reddit',
      icon: '💻',
      recommended: true
    },
    {
      id: 'both',
      title: '🎯 둘 다 필요해요',
      description: '용도별로 다르게 사용 예정',
      icon: '⚡',
      premium: true
    }
  ];
  
  const handlePurposeClick = (purpose: PurposeOption) => {
    const intent: UserIntent = {
      purpose: purpose.id,
      platforms: [],
      quality_preference: 'balanced'
    };
    onPurposeSelect(intent);
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">어디에 사용하실 건가요?</h2>
        <p className="text-gray-600">용도에 맞는 최적 포맷을 추천해드릴게요</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-4">
        {purposes.map((purpose) => (
          <Card 
            key={purpose.id}
            className={`p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
              purpose.recommended ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
            }`}
            onClick={() => handlePurposeClick(purpose)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePurposeClick(purpose);
              }
            }}
          >
            <div className="text-center space-y-4">
              <div className="text-4xl mb-3">{purpose.icon}</div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{purpose.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {purpose.description}
                </p>
              </div>
              
              <div className="flex justify-center">
                {purpose.popular && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                    인기
                  </Badge>
                )}
                {purpose.recommended && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                    추천
                  </Badge>
                )}
                {purpose.premium && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                    완벽
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="text-center text-xs text-gray-500">
        <p>선택하신 용도에 따라 GIF 또는 WebM 포맷을 우선 추천합니다</p>
      </div>
    </div>
  );
}