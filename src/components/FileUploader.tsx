'use client';

import React, { useCallback, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileVideo, AlertCircle, Info } from 'lucide-react';
import { validateFile, formatFileSize } from '@/lib/file-validator';
import { ValidationResult } from '@/types';
import { SUPPORTED_FORMATS, FILE_LIMITS } from '@/lib/constants';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  maxSize: number;
  acceptedFormats: string[];
  dragAndDrop?: boolean;
}

export function FileUploader({ 
  onFileSelect, 
  acceptedFormats,
  dragAndDrop = true 
}: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileValidation = useCallback(async (file: File) => {
    setIsValidating(true);
    setError(null);
    setWarnings([]);
    
    try {
      // Add small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const validation: ValidationResult = validateFile(file);
      
      if (!validation.valid) {
        setError(validation.error || '파일 검증에 실패했습니다');
        setIsValidating(false);
        return false;
      }
      
      // Set warnings if any
      if (validation.warnings && validation.warnings.length > 0) {
        setWarnings(validation.warnings);
      }
      
      setIsValidating(false);
      return true;
    } catch (validationError) {
      console.error('File validation error:', validationError);
      setError('파일 검증 중 오류가 발생했습니다');
      setIsValidating(false);
      return false;
    }
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    const isValid = await handleFileValidation(file);
    if (isValid) {
      onFileSelect(file);
    }
  }, [handleFileValidation, onFileSelect]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const getAcceptAttribute = (): string => {
    return SUPPORTED_FORMATS.INPUT.join(',');
  };
  
  const getSupportedFormatsText = (): string => {
    return acceptedFormats.map(f => f.toUpperCase()).join(', ');
  };

  return (
    <Card className="p-8">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">영상 파일을 업로드하세요</h2>
          <p className="text-gray-600">
            {dragAndDrop ? '파일을 드래그하거나 클릭해서 선택하세요' : '파일을 선택하세요'}
          </p>
        </div>

        {dragAndDrop ? (
          <div
            className={`border-2 border-dashed rounded-lg p-12 transition-colors cursor-pointer ${
              dragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleButtonClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleButtonClick();
              }
            }}
          >
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className={`rounded-full p-6 ${
                  dragOver ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Upload className={`w-12 h-12 ${
                    dragOver ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-700">
                  파일을 여기에 드롭하거나 클릭하세요
                </p>
                <p className="text-sm text-gray-500">
                  최대 {formatFileSize(FILE_LIMITS.MAX_SIZE)} | {getSupportedFormatsText()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <Button 
            onClick={handleButtonClick}
            size="lg" 
            className="px-8"
          >
            <FileVideo className="w-5 h-5 mr-2" />
            파일 선택
          </Button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptAttribute()}
          onChange={handleInputChange}
          className="hidden"
        />

        {/* Validation Status */}
        {isValidating && (
          <div className="flex items-center justify-center space-x-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-sm">파일 검증 중...</span>
          </div>
        )}
        
        {error && (
          <div className="flex items-center justify-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        {warnings.length > 0 && !error && (
          <div className="space-y-2">
            {warnings.map((warning, index) => (
              <div key={index} className="flex items-center justify-center space-x-2 text-amber-600 bg-amber-50 p-2 rounded-lg">
                <Info className="w-4 h-4" />
                <span className="text-sm">{warning}</span>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>지원 형식: {getSupportedFormatsText()}</p>
          <p>최대 파일 크기: {formatFileSize(FILE_LIMITS.MAX_SIZE)}</p>
          <p>최대 영상 길이: {FILE_LIMITS.MAX_DURATION / 60}분</p>
        </div>
      </div>
    </Card>
  );
}