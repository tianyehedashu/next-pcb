import React from 'react';
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DownloadButton from '@/app/components/custom-ui/DownloadButton';
import { Order } from '@/app/admin/types/order';
import { QuoteFormData } from '@/app/quote2/schema/quoteSchema';

interface CalValues {
  totalPrice?: number;
  price?: number;
  singlePcbArea?: number;
  totalArea?: number;
  shippingWeight?: number;
}

interface OrderOverviewProps {
  order: Order;
  pcbFormData: QuoteFormData | null;
  adminOrder: {
    admin_price: number;
    currency?: string;
  } | null;
}

// 价格格式化
const formatPrice = (price: number | string | null | undefined, currency = 'CNY') => {
  if (!price) return '¥0.00';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '¥0.00';
  
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '¥';
  return `${symbol}${num.toFixed(2)}`;
};

// 格式化数值，保留4位小数
const formatNumber = (value: number | string | null | undefined, unit: string) => {
  if (!value) return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  return `${num.toFixed(4)}${unit}`;
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
  const calValues = order.cal_values as CalValues;
  
  const orderData = [
    { label: '客户邮箱', value: order.email || '-' },
    { label: 'PCB层数', value: pcbFormData?.layers || '-' },
    { label: '询价金额', value: order.cal_values ? formatPrice(calValues?.totalPrice || calValues?.price, 'USD') : '-', highlight: 'text-red-600' },
    { label: '用户名', value: order.user_name || '-' },
    { label: 'PCB数量', value: pcbFormData?.singleCount ? `${pcbFormData.singleCount} pcs` : '-' },
    { label: '管理价格', value: adminOrder ? formatPrice(adminOrder.admin_price, adminOrder.currency || 'CNY') : '-', highlight: 'text-green-600' },
    { 
      label: '订单状态', 
      value: (
        <Badge className={getStatusColor(order.status || 'pending')} variant="outline">
          {order.status || 'pending'}
        </Badge>
      )
    },
    { 
      label: 'PCB尺寸', 
      value: pcbFormData?.singleDimensions ? 
        `${pcbFormData.singleDimensions.length}×${pcbFormData.singleDimensions.width}mm` : '-'
    },
    { label: '单片面积', value: formatNumber(calValues?.singlePcbArea, '㎡') },
    { label: '总面积', value: formatNumber(calValues?.totalArea, '㎡') },
    { label: '运输重量', value: formatNumber(calValues?.shippingWeight, 'kg') },
    { 
      label: 'Gerber文件', 
      value: (() => {
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
      })()
    }
  ];

  return (
    <div className="bg-white border rounded">
      <div className="bg-gray-50 px-3 py-2 border-b">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          订单概览
        </h3>
      </div>
      
      {/* 桌面端表格布局 */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-6 text-xs">
          {orderData.map((item, index) => (
            <React.Fragment key={index}>
              <div className="border-r border-b p-2 bg-gray-50 font-medium">{item.label}</div>
              <div className={`border-r border-b p-2 text-center ${item.highlight || ''} ${index === orderData.length - 1 ? 'border-b-0' : ''}`}>
                {typeof item.value === 'string' ? item.value : item.value}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 移动端卡片布局 */}
      <div className="lg:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
          {orderData.map((item, index) => (
            <div key={index} className="bg-gray-50 rounded p-2">
              <div className="text-xs text-gray-600 mb-1">{item.label}</div>
              <div className={`text-sm font-medium ${item.highlight || ''}`}>
                {typeof item.value === 'string' ? item.value : item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 