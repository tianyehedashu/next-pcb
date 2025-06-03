"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuoteStore, useQuoteFormData } from '@/lib/stores/quote-store';
import { Upload, File, CheckCircle, XCircle, RotateCcw, Trash2 } from 'lucide-react';

interface FileUploadState {
  file: File | null;
  fileName: string;
  fileSize: number;
  uploadProgress: number;
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error';
  uploadError: string | null;
  uploadUrl: string | null;
}

const createInitialState = (): FileUploadState => ({
  file: null,
  fileName: '',
  fileSize: 0,
  uploadProgress: 0,
  uploadStatus: 'idle',
  uploadError: null,
  uploadUrl: null,
});

// 模拟文件上传API
async function uploadFileToServer(
  file: File,
  onProgress: (progress: number) => void
): Promise<{ success: boolean; url?: string; error?: string }> {
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5; // 5-20% 每次
      if (progress > 100) progress = 100;
      
      onProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        // 模拟成功上传，返回URL
        resolve({
          success: true,
          url: `https://storage.nextpcb.com/gerber/${Date.now()}-${file.name}`
        });
      }
    }, 150);
  });
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function FileUploadSection() {
  const [uploadState, setUploadState] = useState<FileUploadState>(createInitialState());
  const [isClient, setIsClient] = useState(false);
  const { updateFormData } = useQuoteStore();
  const formData = useQuoteFormData();

  // 确保组件只在客户端渲染后显示完整内容
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return;

    // 验证文件类型和大小
    const allowedTypes = ['.zip', '.rar', '.7z', '.tar', '.gz', '.gerber', '.gbr'];
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      setUploadState(prev => ({
        ...prev,
        uploadStatus: 'error',
        uploadError: 'Please upload a valid archive file (.zip, .rar, .7z, .tar, .gz, .gerber, .gbr)'
      }));
      return;
    }

    if (file.size > maxSize) {
      setUploadState(prev => ({
        ...prev,
        uploadStatus: 'error',
        uploadError: 'File size must be less than 50MB'
      }));
      return;
    }

    // 设置文件信息并开始上传
    setUploadState(prev => ({
      ...prev,
      file,
      fileName: file.name,
      fileSize: file.size,
      uploadStatus: 'uploading',
      uploadError: null,
      uploadProgress: 0
    }));

    try {
      const result = await uploadFileToServer(file, (progress) => {
        setUploadState(prev => ({
          ...prev,
          uploadProgress: progress
        }));
      });

      if (result.success && result.url) {
        setUploadState(prev => ({
          ...prev,
          uploadStatus: 'success',
          uploadUrl: result.url || null,
          uploadProgress: 100
        }));

        // 自动更新表单中的URL字段
        updateFormData({ gerberUrl: result.url });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        uploadStatus: 'error',
        uploadError: error instanceof Error ? error.message : 'Upload failed',
        uploadProgress: 0
      }));
    }
  }, [updateFormData]);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // 清空input值，允许重新选择同一文件
    event.target.value = '';
  }, [handleFileSelect]);

  const clearFile = useCallback(() => {
    setUploadState(createInitialState());
    // 清除表单中的URL
    updateFormData({ gerberUrl: '' });
  }, [updateFormData]);

  const retryUpload = useCallback(() => {
    if (uploadState.file) {
      handleFileSelect(uploadState.file);
    }
  }, [uploadState.file, handleFileSelect]);

  const { uploadStatus, uploadProgress, uploadError, fileName, fileSize } = uploadState;
  const isUploading = uploadStatus === 'uploading';
  const isSuccess = uploadStatus === 'success';
  const isError = uploadStatus === 'error';
  const hasFile = uploadStatus !== 'idle';

  return (
    <Card className="border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-200/60">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">
            <Upload className="h-4 w-4" />
          </div>
          Gerber File Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* 文件选择区域 */}
        {!hasFile && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">Upload your Gerber files</p>
              <p className="text-xs text-gray-500">
                Supported formats: .zip, .rar, .7z, .tar, .gz, .gerber, .gbr
              </p>
              <p className="text-xs text-gray-500">Maximum file size: 50MB</p>
            </div>
            <input
              type="file"
              accept=".zip,.rar,.7z,.tar,.gz,.gerber,.gbr"
              onChange={handleFileInputChange}
              className="hidden"
              id="gerber-upload"
            />
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => document.getElementById('gerber-upload')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          </div>
        )}

        {/* 文件信息和状态 */}
        {hasFile && (
          <div className="space-y-4">
            {/* 文件信息 */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <File className="h-5 w-5 text-blue-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
                <p className="text-xs text-gray-500">{formatFileSize(fileSize)}</p>
              </div>
              <div className="flex items-center gap-2">
                {isSuccess && <CheckCircle className="h-5 w-5 text-green-600" />}
                {isError && <XCircle className="h-5 w-5 text-red-600" />}
                {isUploading && (
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>

            {/* 上传进度 */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* 成功状态 */}
            {isSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Upload successful!</span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  File URL has been automatically added to the form.
                </p>
              </div>
            )}

            {/* 错误状态 */}
            {isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Upload failed</span>
                </div>
                <p className="text-xs text-red-600 mt-1">{uploadError}</p>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-2">
              {isError && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={retryUpload}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearFile}
                className="text-gray-600 hover:text-gray-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
              <input
                type="file"
                accept=".zip,.rar,.7z,.tar,.gz,.gerber,.gbr"
                onChange={handleFileInputChange}
                className="hidden"
                id="gerber-upload-replace"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('gerber-upload-replace')?.click()}
                className="text-blue-600 hover:text-blue-700"
              >
                <Upload className="h-4 w-4 mr-1" />
                Replace
              </Button>
            </div>
          </div>
        )}

        {/* 当前URL显示 - 只在客户端渲染后显示 */}
        {isClient && formData.gerberUrl && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-medium text-blue-800 mb-1">Current Gerber URL:</p>
            <p className="text-xs text-blue-600 break-all font-mono">{formData.gerberUrl}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 