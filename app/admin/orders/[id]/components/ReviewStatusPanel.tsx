import React from 'react';
import { CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { QuoteFormData } from '@/app/quote2/schema/quoteSchema';

interface ReviewStatusPanelProps {
  pcbFormData: QuoteFormData | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order?: any; // 添加订单数据以检测产品类型
}

export function ReviewStatusPanel({ pcbFormData, order }: ReviewStatusPanelProps) {
  // 简化的产品类型检测
  const isStencil = order?.product_type === 'stencil' || (!order?.pcb_spec && order?.stencil_spec);
  const productName = isStencil ? '钢网' : 'PCB';
  
  // 获取规格数据
  const specData = isStencil ? order?.stencil_spec : pcbFormData;
  const hasValidSpec = Boolean(specData);
  
  // 检查文件完整性
  const hasFile = Boolean(order?.gerber_file_url);
  
  return (
    <div className="bg-white border rounded">
      <div className="bg-green-50 px-3 py-2 border-b">
        <h3 className="text-sm font-semibold text-green-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          审核状态
        </h3>
      </div>
      {hasValidSpec ? (
        <div className="grid grid-cols-1 text-xs">
          <div className="flex justify-between p-2 border-b bg-gray-50">
            <span>基本参数</span>
            <Badge className="bg-green-100 text-green-700 text-xs">✓ 通过</Badge>
          </div>
          
          {isStencil ? (
            // 钢网审核项目
            <>
              <div className="flex justify-between p-2 border-b">
                <span>钢网类型</span>
                <Badge className="bg-green-100 text-green-700 text-xs">✓ 通过</Badge>
              </div>
              <div className="flex justify-between p-2 border-b bg-gray-50">
                <span>尺寸规格</span>
                <Badge className={specData?.size ? 'bg-green-100 text-green-700 text-xs' : 'bg-yellow-100 text-yellow-700 text-xs'}>
                  {specData?.size ? '✓ 通过' : '⚠ 待确认'}
                </Badge>
              </div>
              <div className="flex justify-between p-2 border-b">
                <span>工艺要求</span>
                <Badge className="bg-green-100 text-green-700 text-xs">✓ 标准</Badge>
              </div>
            </>
          ) : (
            // PCB审核项目
            <>
              <div className="flex justify-between p-2 border-b">
                <span>材料工艺</span>
                <Badge className={pcbFormData?.surfaceFinish === 'HASL' ? 'bg-green-100 text-green-700 text-xs' : 'bg-yellow-100 text-yellow-700 text-xs'}>
                  {pcbFormData?.surfaceFinish === 'HASL' ? '✓ 通过' : '⚠ 注意'}
                </Badge>
              </div>
              <div className="flex justify-between p-2 border-b bg-gray-50">
                <span>特殊工艺</span>
                <Badge className={pcbFormData?.goldFingers || pcbFormData?.edgePlating ? 'bg-orange-100 text-orange-700 text-xs' : 'bg-green-100 text-green-700 text-xs'}>
                  {pcbFormData?.goldFingers || pcbFormData?.edgePlating ? '⚠ 特殊' : '✓ 标准'}
                </Badge>
              </div>
            </>
          )}
          
          <div className="flex justify-between p-2">
            <span>设计文件</span>
            <Badge className={hasFile ? 'bg-green-100 text-green-700 text-xs' : 'bg-red-100 text-red-700 text-xs'}>
              {hasFile ? '✓ 完整' : '✗ 缺失'}
            </Badge>
          </div>
        </div>
      ) : (
        <div className="p-3 text-center text-red-600 text-xs">
          <AlertCircle className="w-4 h-4 mx-auto mb-1" />
          <p>{productName}规格缺失</p>
          <p className="text-gray-500 mt-1">产品类型: {order?.product_type || '未设置'}</p>
        </div>
      )}
    </div>
  );
} 