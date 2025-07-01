"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Clock,
  Info
} from 'lucide-react';
import DownloadButton from '@/app/components/custom-ui/DownloadButton';

// 订单类型定义
interface Order {
  id: string;
  product_type?: string;
  gerber_file_url?: string | null;
  file_metadata?: Record<string, Record<string, unknown>>;
  last_file_update?: string;
  [key: string]: unknown;
}

interface OrderFileManagerProps {
  order: Order;
  onFileStatusUpdate?: (status: 'approved' | 'rejected' | 'pending') => void;
  readonly?: boolean;
}

// 文件状态枚举
enum FileStatus {
  MISSING = 'missing',
  UPLOADED = 'uploaded', 
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PENDING = 'pending'
}

// 文件状态样式配置
const fileStatusConfig = {
  [FileStatus.MISSING]: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    label: 'Missing'
  },
  [FileStatus.UPLOADED]: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Clock,
    label: 'Uploaded'
  },
  [FileStatus.APPROVED]: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle2,
    label: 'Approved'
  },
  [FileStatus.REJECTED]: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    label: 'Rejected'
  },
  [FileStatus.PENDING]: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    label: 'Pending Review'
  }
};

export default function OrderFileManager({ 
  order, 
  onFileStatusUpdate, 
  readonly = false 
}: OrderFileManagerProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  // 简单判断产品类型和文件标签
  const isStencil = order.product_type === 'stencil';
  const fileLabel = isStencil ? 'Stencil Design File' : 'Gerber File';
  const fileType = isStencil ? 'stencil' : 'gerber';

  // 获取文件信息
  const fileUrl = order.gerber_file_url;
  const hasFile = fileUrl && fileUrl.trim() !== '';
  
  // 从文件元数据获取审核状态
  const metadata = order.file_metadata || {};
  const fileMetadata = metadata.gerber || {};
  
  let fileStatus: FileStatus;
  if (!hasFile) {
    fileStatus = FileStatus.MISSING;
  } else if (fileMetadata.reviewStatus === 'approved') {
    fileStatus = FileStatus.APPROVED;
  } else if (fileMetadata.reviewStatus === 'rejected') {
    fileStatus = FileStatus.REJECTED;
  } else if (fileMetadata.reviewStatus === 'pending') {
    fileStatus = FileStatus.PENDING;
  } else {
    fileStatus = FileStatus.UPLOADED;
  }

  // 文件审核操作
  const handleFileReview = async (status: 'approved' | 'rejected' | 'pending') => {
    if (readonly || isUpdating) return;
    
    setIsUpdating(true);
    try {
      if (onFileStatusUpdate) {
        await onFileStatusUpdate(status);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // 提取文件名
  const extractFileName = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      return decodeURIComponent(fileName.replace(/^\d+-[a-z0-9]+-[a-z0-9]+-/, ''));
    } catch {
      return 'Download File';
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 格式化上传时间
  const formatUploadTime = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return '';
    }
  };

  const StatusIcon = fileStatusConfig[fileStatus].icon;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          File Management
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 文件状态概览 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">{fileLabel}</span>
            <Badge 
              variant="outline" 
              className={`${fileStatusConfig[fileStatus].color} flex items-center gap-1`}
            >
              <StatusIcon className="h-3 w-3" />
              {fileStatusConfig[fileStatus].label}
            </Badge>
          </div>
          
          {hasFile && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>File:</span>
                <span className="font-medium">{extractFileName(fileUrl!)}</span>
              </div>
              
              {typeof fileMetadata.size === 'number' && (
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Size:</span>
                  <span>{formatFileSize(fileMetadata.size)}</span>
                </div>
              )}
              
              {typeof fileMetadata.uploadedAt === 'string' && (
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Uploaded:</span>
                  <span>{formatUploadTime(fileMetadata.uploadedAt)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 文件操作区域 */}
        {hasFile ? (
          <div className="space-y-3">
            {/* 下载按钮 */}
            <div className="flex justify-center">
              <DownloadButton 
                filePath={fileUrl!}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                <Download className="h-4 w-4" />
                Download {fileType} File
              </DownloadButton>
            </div>

            {/* 审核操作 */}
            {!readonly && (
              <div className="border-t pt-3">
                <div className="text-sm font-medium text-gray-700 mb-3">File Review Actions:</div>
                <div className="flex gap-2 justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleFileReview('approved')}
                    disabled={isUpdating || fileStatus === FileStatus.APPROVED}
                    className="flex items-center gap-1 text-green-700 border-green-200 hover:bg-green-50"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Approve
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleFileReview('rejected')}
                    disabled={isUpdating || fileStatus === FileStatus.REJECTED}
                    className="flex items-center gap-1 text-red-700 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="h-3 w-3" />
                    Reject
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleFileReview('pending')}
                    disabled={isUpdating || fileStatus === FileStatus.PENDING}
                    className="flex items-center gap-1 text-yellow-700 border-yellow-200 hover:bg-yellow-50"
                  >
                    <Clock className="h-3 w-3" />
                    Pending
                  </Button>
                </div>
                
                {isUpdating && (
                  <div className="text-center text-sm text-gray-500 mt-2">
                    Updating status...
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // 没有文件时的显示
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No {fileLabel.toLowerCase()} has been uploaded for this order. 
              Please ask the customer to upload the required file.
            </AlertDescription>
          </Alert>
        )}

        {/* 文件管理说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <div className="font-medium mb-1">File Management Guidelines:</div>
              <ul className="space-y-1 text-blue-700">
                <li>• <strong>Approve:</strong> File meets quality standards and specifications</li>
                <li>• <strong>Reject:</strong> File has issues, customer needs to re-upload</li>
                <li>• <strong>Pending:</strong> File needs further review or clarification</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 