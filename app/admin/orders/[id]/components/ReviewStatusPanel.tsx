import React from 'react';
import { CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { QuoteFormData } from '@/app/quote2/schema/quoteSchema';

interface ReviewStatusPanelProps {
  pcbFormData: QuoteFormData | null;
}

export function ReviewStatusPanel({ pcbFormData }: ReviewStatusPanelProps) {
  return (
    <div className="bg-white border rounded">
      <div className="bg-green-50 px-3 py-2 border-b">
        <h3 className="text-sm font-semibold text-green-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          审核状态
        </h3>
      </div>
      {pcbFormData ? (
        <div className="grid grid-cols-1 text-xs">
          <div className="flex justify-between p-2 border-b bg-gray-50">
            <span>基本参数</span>
            <Badge className="bg-green-100 text-green-700 text-xs">✓ 通过</Badge>
          </div>
          <div className="flex justify-between p-2 border-b">
            <span>材料工艺</span>
            <Badge className={pcbFormData.surfaceFinish === 'HASL' ? 'bg-green-100 text-green-700 text-xs' : 'bg-yellow-100 text-yellow-700 text-xs'}>
              {pcbFormData.surfaceFinish === 'HASL' ? '✓ 通过' : '⚠ 注意'}
            </Badge>
          </div>
          <div className="flex justify-between p-2 border-b bg-gray-50">
            <span>特殊工艺</span>
            <Badge className={pcbFormData.goldFingers || pcbFormData.edgePlating ? 'bg-orange-100 text-orange-700 text-xs' : 'bg-green-100 text-green-700 text-xs'}>
              {pcbFormData.goldFingers || pcbFormData.edgePlating ? '⚠ 特殊' : '✓ 标准'}
            </Badge>
          </div>
          <div className="flex justify-between p-2">
            <span>文件完整</span>
            <Badge className={pcbFormData.gerberUrl ? 'bg-green-100 text-green-700 text-xs' : 'bg-red-100 text-red-700 text-xs'}>
              {pcbFormData.gerberUrl ? '✓ 完整' : '✗ 缺失'}
            </Badge>
          </div>
        </div>
      ) : (
        <div className="p-3 text-center text-red-600 text-xs">
          <AlertCircle className="w-4 h-4 mx-auto mb-1" />
          <p>PCB规格缺失</p>
        </div>
      )}
    </div>
  );
} 