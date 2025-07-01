import React from 'react';
import { FileText, Download } from "lucide-react";
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

// 简化的产品类型检测
function getProductType(order: Order): 'pcb' | 'stencil' {
  return order.product_type === 'stencil' ? 'stencil' : 'pcb';
}

// 获取产品特定的数据字段
function getProductSpecificData(order: Order, productType: 'pcb' | 'stencil', pcbFormData: QuoteFormData | null) {
  if (productType === 'stencil') {
    return {
      specData: order.stencil_spec,
      productLabel: '钢网',
      layersLabel: '钢网类型',
      layersValue: order.stencil_spec?.stencilType || '-',
      quantityLabel: '钢网数量',
      quantityValue: order.stencil_spec?.quantity ? `${order.stencil_spec.quantity} pcs` : '-',
      dimensionsLabel: '钢网尺寸',
      dimensionsValue: order.stencil_spec?.size ? `${order.stencil_spec.size}mm` : '-'
    };
  } else {
    return {
      specData: order.pcb_spec || pcbFormData,
      productLabel: 'PCB',
      layersLabel: 'PCB层数',
      layersValue: order.pcb_spec?.layers || pcbFormData?.layers || '-',
      quantityLabel: 'PCB数量',
      quantityValue: order.pcb_spec?.singleCount || pcbFormData?.singleCount ? 
        `${order.pcb_spec?.singleCount || pcbFormData?.singleCount} pcs` : '-',
      dimensionsLabel: 'PCB尺寸',
      dimensionsValue: order.pcb_spec?.singleDimensions || pcbFormData?.singleDimensions ? 
        `${(order.pcb_spec?.singleDimensions || pcbFormData?.singleDimensions)?.length}×${(order.pcb_spec?.singleDimensions || pcbFormData?.singleDimensions)?.width}mm` : '-'
    };
  }
}

// 简化的文件列表组件
function FileList({ order, productType }: { order: Order; productType: 'pcb' | 'stencil' }) {
  const fileUrl = order.gerber_file_url;
  
  if (!fileUrl || fileUrl.trim() === '') {
    return <span className="text-red-500 text-xs">No files uploaded</span>;
  }

  const fileLabel = productType === 'stencil' ? 'Stencil Design' : 'Gerber File';

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600 min-w-0 flex-1 truncate">
        {fileLabel}:
      </span>
      <DownloadButton 
        filePath={fileUrl}
        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 h-auto"
      >
        <Download className="w-3 h-3" />
      </DownloadButton>
    </div>
  );
}

export function OrderOverview({ order, pcbFormData, adminOrder }: OrderOverviewProps) {
  const calValues = order.cal_values as CalValues;
  
  // 简化的产品类型检测
  const productType = getProductType(order);
  const productDisplayName = productType === 'stencil' ? '钢网' : 'PCB';
  const productData = getProductSpecificData(order, productType, pcbFormData);
  
  const orderData = [
    { label: '客户邮箱', value: order.email || '-' },
    { label: productData.layersLabel, value: productData.layersValue },
    { label: '询价金额', value: order.cal_values ? formatPrice(calValues?.totalPrice || calValues?.price, 'USD') : '-', highlight: 'text-red-600' },
    { label: '用户名', value: order.user_name || '-' },
    { label: productData.quantityLabel, value: productData.quantityValue },
    { label: '管理价格', value: adminOrder ? formatPrice(adminOrder.admin_price, adminOrder.currency || 'CNY') : '-', highlight: 'text-green-600' },
    { 
      label: '订单状态', 
      value: (
        <Badge className={getStatusColor(order.status || 'pending')} variant="outline">
          {order.status || 'pending'}
        </Badge>
      )
    },
    { label: productData.dimensionsLabel, value: productData.dimensionsValue },
    { label: '单片面积', value: formatNumber(calValues?.singlePcbArea, '㎡') },
    { label: '总面积', value: formatNumber(calValues?.totalArea, '㎡') },
    { label: '运输重量', value: formatNumber(calValues?.shippingWeight, 'kg') },
    { 
      label: 'Files', 
      value: <FileList order={order} productType={productType} />
    }
  ];

  return (
    <div className="bg-white border rounded">
      <div className="bg-gray-50 px-3 py-2 border-b">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          订单概览
          <Badge variant="outline" className="ml-auto bg-blue-100 text-blue-700 border-blue-300 text-xs">
            {productDisplayName}
          </Badge>
        </h3>
      </div>
      
      {/* 桌面端表格布局 */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-6 text-xs">
          {orderData.map((item, index) => (
            <React.Fragment key={index}>
              <div className="border-r border-b p-2 bg-gray-50 font-medium">{item.label}</div>
              <div className={`border-r border-b p-2 ${item.highlight || ''} ${index === orderData.length - 1 ? 'border-b-0' : ''}`}>
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