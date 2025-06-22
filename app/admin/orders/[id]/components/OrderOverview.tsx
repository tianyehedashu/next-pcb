import React from 'react';
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DownloadButton from '@/app/components/custom-ui/DownloadButton';
import { Order } from '@/app/admin/types/order';
import { QuoteFormData } from '@/app/quote2/schema/quoteSchema';

interface OrderOverviewProps {
  order: Order;
  pcbFormData: QuoteFormData | null;
  adminOrder: any;
}

// 价格格式化
const formatPrice = (price: number | string | null | undefined, currency = 'CNY') => {
  if (!price) return '¥0.00';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '¥0.00';
  
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '¥';
  return `${symbol}${num.toFixed(2)}`;
};

// 状态颜色映射
const getStatusColor = (status: string) => {
  const statusColors: Record<string, string> = {
    'created': 'bg-blue-100 text-blue-800',
    'reviewed': 'bg-yellow-100 text-yellow-800',
    'paid': 'bg-green-100 text-green-800',
    'in_production': 'bg-purple-100 text-purple-800',
    'shipped': 'bg-indigo-100 text-indigo-800',
    'completed': 'bg-emerald-100 text-emerald-800',
    'cancelled': 'bg-red-100 text-red-800',
    'pending': 'bg-orange-100 text-orange-800',
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800';
};

export function OrderOverview({ order, pcbFormData, adminOrder }: OrderOverviewProps) {
  return (
    <div className="bg-white border rounded">
      <div className="bg-gray-50 px-3 py-2 border-b">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          订单概览
        </h3>
      </div>
      <div className="grid grid-cols-6 text-xs">
        <div className="border-r border-b p-2 bg-gray-50 font-medium">客户邮箱</div>
        <div className="border-r border-b p-2 text-center">{order.email || '-'}</div>
        <div className="border-r border-b p-2 bg-gray-50 font-medium">PCB层数</div>
        <div className="border-r border-b p-2 text-center">{pcbFormData?.layers || '-'}</div>
        <div className="border-r border-b p-2 bg-gray-50 font-medium">询价金额</div>
        <div className="border-b p-2 text-center font-semibold text-red-600">
          {order.cal_values ? formatPrice((order.cal_values as any)?.totalPrice || (order.cal_values as any)?.price, 'USD') : '-'}
        </div>
        
        <div className="border-r border-b p-2 bg-gray-50 font-medium">用户名</div>
        <div className="border-r border-b p-2 text-center">{order.user_name || '-'}</div>
        <div className="border-r border-b p-2 bg-gray-50 font-medium">PCB数量</div>
        <div className="border-r border-b p-2 text-center">{pcbFormData?.singleCount || '-'} pcs</div>
        <div className="border-r border-b p-2 bg-gray-50 font-medium">管理价格</div>
        <div className="border-b p-2 text-center font-semibold text-green-600">
          {adminOrder ? formatPrice(adminOrder.admin_price, adminOrder.currency || 'CNY') : '-'}
        </div>
        
        <div className="border-r p-2 bg-gray-50 font-medium">订单状态</div>
        <div className="border-r p-2 text-center">
          <Badge className={getStatusColor(order.status || 'pending')} variant="outline">
            {order.status || 'pending'}
          </Badge>
        </div>
        <div className="border-r p-2 bg-gray-50 font-medium">PCB尺寸</div>
        <div className="border-r p-2 text-center">
          {pcbFormData?.singleDimensions ? 
            `${pcbFormData.singleDimensions.length}×${pcbFormData.singleDimensions.width}mm` : '-'}
        </div>
        <div className="border-r p-2 bg-gray-50 font-medium">Gerber文件</div>
        <div className="p-2 text-center">
          {(() => {
            const gerberUrl = pcbFormData?.gerberUrl || order.gerber_file_url;
            const hasGerberFile = gerberUrl && typeof gerberUrl === 'string';
            return hasGerberFile ? (
              <DownloadButton 
                filePath={gerberUrl}
                bucket="gerber"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1"
              >
                下载
              </DownloadButton>
            ) : (
              <span className="text-red-500">缺失</span>
            );
          })()}
        </div>
      </div>
    </div>
  );
} 