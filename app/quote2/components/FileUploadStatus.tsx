import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  File,
  X, 
  CheckCircle, 
  RotateCcw, 
  Trash2,
  Loader2,
  Link as LinkIcon,
  Copy
} from 'lucide-react';
import { formatFileSize } from '../lib/file-utils';

// FrontendAnalysisResult 类型定义
interface FrontendAnalysisResult {
  dimensions?: {
    width: number; // in mm
    height: number; // in mm
  };
  layers?: number;
  hasGoldFingers?: boolean;
  // Add other parsed properties as needed
}

// 使用新定义的 UploadState 类型
interface UploadState {
  file: File | null;
  fileName: string | null;
  fileSize: number | null;
  uploadStatus: 'idle' | 'selecting' | 'parsing' | 'uploading-supabase' | 'success' | 'error';
  uploadProgress: number; // 0-100 (primarily for Supabase upload)
  uploadError: string | null;
  analysisResult: FrontendAnalysisResult | null; // Result from frontend parsing
  uploadUrl: string | null; // URL after uploading to Supabase
  isAnalyzing?: boolean; // 保留此字段以兼容现有组件
}

interface FileUploadStatusProps {
  uploadState: UploadState;
  onRetry: () => void;
  onClear: () => void;
  onReplace: () => void;
}

export function FileUploadStatus({ uploadState, onRetry, onClear, onReplace }: FileUploadStatusProps) {
  const { uploadStatus, uploadProgress, uploadError, fileName, fileSize, uploadUrl } = uploadState;
  
  // 调试：记录状态变化
  React.useEffect(() => {
    console.log('=== FileUploadStatus received state update ===');
    console.log('Upload Status:', uploadStatus);
    console.log('Upload URL:', uploadUrl);
    console.log('File Name:', fileName);
  }, [uploadStatus, uploadUrl, fileName]);
  
  const isUploading = uploadStatus === 'uploading-supabase';
  const isParsing = uploadStatus === 'parsing';
  const isSuccess = uploadStatus === 'success';
  const isError = uploadStatus === 'error';
  const isIdle = uploadStatus === 'idle';

  // 复制URL到剪贴板
  const copyUrlToClipboard = () => {
    if (uploadUrl) {
      navigator.clipboard.writeText(uploadUrl)
        .then(() => {
          alert('URL已复制到剪贴板');
        })
        .catch(err => {
          console.error('复制失败:', err);
        });
    }
  };

  if (!fileName) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* 文件信息 */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
        <File className="h-5 w-5 text-gray-500" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {fileName}
          </div>
          <div className="text-xs text-gray-500">
            {formatFileSize(fileSize || 0)}
          </div>
        </div>
      </div>

      {/* 解析状态 */}
      {isParsing && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 mb-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Analyzing file...</span>
          </div>
          <div className="text-xs text-blue-600 mt-1">Extracting PCB dimensions and layer count</div>
        </div>
      )}

      {/* 上传进度 */}
      {isUploading && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 mb-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Uploading file...</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <div className="text-xs text-blue-600 mt-1">{uploadProgress}%</div>
        </div>
      )}

      {/* 成功状态 */}
      {isSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">File uploaded successfully!</span>
          </div>
          
          {/* 显示URL */}
          {uploadUrl && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mt-2">
                <LinkIcon className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-700 font-medium">File URL:</span>
              </div>
              <div className="flex items-center mt-1">
                <div className="bg-white p-2 rounded border border-green-200 text-xs text-gray-600 flex-1 truncate">
                  {uploadUrl}
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={copyUrlToClipboard}
                  className="ml-1 text-green-600"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 解析成功但尚未上传 */}
      {isIdle && uploadState.analysisResult && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Analysis successful!</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            File will be uploaded when you submit the form
          </p>
        </div>
      )}

      {/* 错误状态 */}
      {isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <X className="h-4 w-4" />
            <span className="text-sm font-medium">
              {uploadStatus === 'error' && uploadState.isAnalyzing ? 'Analysis failed' : 'Upload failed'}
            </span>
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
            onClick={onRetry}
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
          onClick={onClear}
          className="text-gray-600 hover:text-gray-700"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Remove
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReplace}
          className="text-blue-600 hover:text-blue-700"
        >
          <Upload className="h-4 w-4 mr-1" />
          Replace
        </Button>
      </div>
    </div>
  );
} 