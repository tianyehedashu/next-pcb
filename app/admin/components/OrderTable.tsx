"use client";

import React from 'react';
import { Order } from '../types/order';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { ChevronUp, ChevronDown, ChevronsUpDown, Eye } from 'lucide-react';
import { RefundStatusBadge } from '@/app/components/custom-ui/RefundStatusBadge';
import { toast } from 'sonner';
import { 
  isStencilOrder, 
  isPcbOrder, 
  isSmtOrder, 
  isComboOrder, 
  getOrderSpec 
} from '../types/order';

interface OrderTableProps {
  data: Order[];
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
  onDeleteSelected: () => void;
  deleting?: boolean;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

export function OrderTable({
  data,
  selectedIds,
  onSelectChange,
  onDeleteSelected,
  deleting = false,
  sortField,
  sortDirection,
  onSort,
}: OrderTableProps) {
  const router = useRouter();
  const allIds = data.map(order => order.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.includes(id));
  
  const toggleAll = () => {
    if (allSelected) {
      onSelectChange([]);
    } else {
      onSelectChange(allIds);
    }
  };
  
  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectChange([...selectedIds, id]);
    }
  };

  // 渲染排序图标
  const renderSortIcon = (field: string) => {
    if (!onSort) return null;
    
    if (sortField === field) {
      return sortDirection === 'asc' ? (
        <ChevronUp className="w-4 h-4" />
      ) : (
        <ChevronDown className="w-4 h-4" />
      );
    }
    return <ChevronsUpDown className="w-4 h-4 opacity-50" />;
  };

  // 处理排序点击
  const handleSort = (field: string) => {
    if (onSort) {
      onSort(field);
    }
  };

  // 获取产品类型标识和颜色
  const getProductTypeBadge = (order: Order) => {
    // 根据产品类型返回不同的徽章样式
    if (isStencilOrder(order)) {
      return <Badge className="bg-purple-100 text-purple-700 border-purple-300">🔧 Stencil</Badge>;
    } else if (isSmtOrder(order)) {
      return <Badge className="bg-orange-100 text-orange-700 border-orange-300">⚡ SMT</Badge>;
    } else if (isComboOrder(order)) {
      return <Badge className="bg-green-100 text-green-700 border-green-300">🔗 Combo</Badge>;
    } else {
      return <Badge className="bg-blue-100 text-blue-700 border-blue-300">📱 PCB</Badge>;
    }
  };

  // 获取规格信息摘要
  const getSpecificationsSummary = (order: Order) => {
    const spec = getOrderSpec(order);
    
    if (isStencilOrder(order) && spec) {
      // 钢网规格摘要
      const size = spec.size || 'N/A';
      const quantity = spec.quantity || 0;
      const borderType = spec.borderType === 'framework' ? 'Frame' : 'No Frame';
      return `${size}mm | ${quantity}pcs | ${borderType}`;
    } else if (isPcbOrder(order) && spec) {
      // PCB规格摘要
      const layers = spec.layers || 'N/A';
      const dimensions = spec.singleDimensions ? 
        `${spec.singleDimensions.length}×${spec.singleDimensions.width}mm` : 'N/A';
      const quantity = spec.singleCount || spec.quantity || 0;
      return `${layers}L | ${dimensions} | ${quantity}pcs`;
    } else if (isSmtOrder(order)) {
      // SMT规格摘要（预留）
      return 'SMT Assembly';
    } else if (isComboOrder(order)) {
      // 组合订单摘要（预留）
      const types = order.product_types?.join(' + ') || 'Multi-Product';
      return types;
    }
    
    return 'N/A';
  };

  // 获取报价价格
  const getQuotePrice = (order: Order) => {
    // 优先显示管理员价格
    if (order.admin_orders?.admin_price) {
      const currency = order.admin_orders.currency || 'USD';
      const symbol = currency === 'USD' ? '$' : '¥';
      return `${symbol}${order.admin_orders.admin_price.toFixed(2)}`;
    }
    
    // 其次显示系统计算价格
    if (order.cal_values?.totalPrice) {
      return `¥${order.cal_values.totalPrice.toFixed(2)}`;
    }
    
    return '-';
  };

  // 获取订单状态徽章
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
      'quoted': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
      'confirmed': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
      'production': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
      'completed': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
      'cancelled': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge className={`${config.bg} ${config.text} ${config.border} border`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // 获取管理员状态徽章
  const getAdminStatusBadge = (order: Order) => {
    const adminStatus = order.admin_orders?.status;
    if (!adminStatus) return <span className="text-gray-400">-</span>;
    
    const statusConfig = {
      'pending': { bg: 'bg-gray-100', text: 'text-gray-700' },
      'reviewed': { bg: 'bg-blue-100', text: 'text-blue-700' },
      'quoted': { bg: 'bg-indigo-100', text: 'text-indigo-700' },
      'confirmed': { bg: 'bg-green-100', text: 'text-green-700' },
      'production': { bg: 'bg-orange-100', text: 'text-orange-700' },
      'shipped': { bg: 'bg-purple-100', text: 'text-purple-700' },
      'completed': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    };
    
    const config = statusConfig[adminStatus as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant="outline" className={`${config.bg} ${config.text}`}>
        {adminStatus.charAt(0).toUpperCase() + adminStatus.slice(1)}
      </Badge>
    );
  };

  // 获取支付状态信息
  const getPaymentInfo = (order: Order) => {
    const paymentStatus = order.admin_orders?.payment_status;
    const refundStatus = order.admin_orders?.refund_status;
    
    if (refundStatus && refundStatus !== 'none') {
      return (
        <RefundStatusBadge 
          refundStatus={refundStatus}
          paymentStatus={paymentStatus}
          requestedAmount={order.admin_orders?.requested_refund_amount}
          approvedAmount={order.admin_orders?.approved_refund_amount}
          showDetails={false}
        />
      );
    }
    
    if (paymentStatus) {
      const statusConfig = {
        'paid': { bg: 'bg-green-100', text: 'text-green-800' },
        'unpaid': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
        'failed': { bg: 'bg-red-100', text: 'text-red-800' },
        'refunded': { bg: 'bg-purple-100', text: 'text-purple-800' },
      };
      
      const config = statusConfig[paymentStatus as keyof typeof statusConfig] || statusConfig.unpaid;
      
      return (
        <Badge className={`${config.bg} ${config.text}`}>
          {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
        </Badge>
      );
    }
    
    return <span className="text-gray-400">-</span>;
  };

  // 移动端卡片视图组件
  const MobileOrderCard = ({ order }: { order: Order }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedIds.includes(order.id)}
              onChange={() => toggleOne(order.id)}
              className="rounded"
            />
            <div className="flex flex-col">
              <span 
                className="font-mono text-sm text-blue-600 hover:underline cursor-pointer"
                onClick={() => router.push(`/admin/orders/${order.id}`)}
              >
                #{order.id.slice(0, 8)}...
              </span>
              <span className="text-xs text-gray-500">
                {order.created_at ? format(new Date(order.created_at), 'MM-dd HH:mm') : '-'}
              </span>
            </div>
          </div>
          {getProductTypeBadge(order)}
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback>{(order.email?.[0] || 'U').toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="truncate text-gray-800 flex-1">{order.email || '-'}</span>
        </div>
        
        <div className="space-y-2 mb-3">
          <div className="text-sm text-gray-600">{getSpecificationsSummary(order)}</div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-lg">{getQuotePrice(order)}</span>
            <div className="flex gap-2">
              {getStatusBadge(order.status)}
              {getAdminStatusBadge(order)}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Payment:</span>
            {getPaymentInfo(order)}
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push(`/admin/orders/${order.id}`)}
            className="text-xs"
          >
            <Eye className="w-3 h-3 mr-1" />
            Detail
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 pt-4 pb-2 gap-4">
        <span className="text-base font-semibold text-gray-700">
          All Orders ({data.length})
        </span>
        <Button
          variant="default"
          className="bg-primary text-white hover:bg-primary/90 rounded-lg font-semibold px-6 w-full sm:w-auto"
          size="sm"
          disabled={selectedIds.length === 0 || deleting}
          onClick={onDeleteSelected}
        >
          Delete Selected ({selectedIds.length})
        </Button>
      </div>
      
      {/* 移动端视图 (< 768px) */}
      <div className="block md:hidden px-4 pb-4">
        {data.length === 0 ? (
          <div className="py-8 text-center text-gray-400">No orders found.</div>
        ) : (
          <div className="space-y-3">
            {data.map(order => (
              <MobileOrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      {/* 桌面端表格视图 (>= 768px) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-3 px-2 text-left font-semibold text-gray-700">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th 
                className={`py-3 px-2 text-left font-semibold text-gray-700 ${onSort ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`}
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center gap-1">
                  Order ID
                  {renderSortIcon('id')}
                </div>
              </th>
              <th 
                className={`py-3 px-2 text-left font-semibold text-gray-700 ${onSort ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`}
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center gap-1">
                  Customer
                  {renderSortIcon('email')}
                </div>
              </th>
              <th className="py-3 px-2 text-left font-semibold text-gray-700">
                Type
              </th>
              {/* 平板端隐藏规格列 */}
              <th className="py-3 px-2 text-left font-semibold text-gray-700 hidden lg:table-cell">
                Specifications
              </th>
              <th className="py-3 px-2 text-left font-semibold text-gray-700">Price</th>
              <th 
                className={`py-3 px-2 text-left font-semibold text-gray-700 ${onSort ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`}
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status
                  {renderSortIcon('status')}
                </div>
              </th>
              {/* 平板端隐藏管理员状态列 */}
              <th className="py-3 px-2 text-left font-semibold text-gray-700 hidden lg:table-cell">
                Admin Status
              </th>
              <th className="py-3 px-2 text-left font-semibold text-gray-700">Payment</th>
              {/* 平板端隐藏创建时间列 */}
              <th 
                className={`py-3 px-2 text-left font-semibold text-gray-700 hidden lg:table-cell ${onSort ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`}
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center gap-1">
                  Created
                  {renderSortIcon('created_at')}
                </div>
              </th>
              <th className="py-3 px-2 text-left font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-gray-400">No orders found.</td>
              </tr>
            ) : data.map(order => (
              <tr key={order.id} className="hover:bg-gray-50 transition-all border-b border-gray-100">
                <td className="py-2 px-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(order.id)}
                    onChange={() => toggleOne(order.id)}
                  />
                </td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-2">
                    <span 
                      className="font-mono text-sm text-blue-600 hover:underline cursor-pointer"
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                      title={`Full ID: ${order.id}`}
                    >
                      #{order.id.slice(0, 8)}...
                    </span>
                    <button
                      className="text-gray-400 hover:text-gray-600 text-xs hidden lg:inline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(order.id);
                        toast.success('Order ID copied to clipboard');
                      }}
                      title="Copy full UUID"
                    >
                      📋
                    </button>
                  </div>
                </td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6 md:w-8 md:h-8">
                      <AvatarFallback className="text-xs">{(order.email?.[0] || 'U').toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="truncate max-w-[80px] md:max-w-[120px] text-gray-800 text-sm">{order.email || '-'}</span>
                  </div>
                </td>
                <td className="py-2 px-2">{getProductTypeBadge(order)}</td>
                <td className="py-2 px-2 hidden lg:table-cell">
                  <span className="text-sm text-gray-600">{getSpecificationsSummary(order)}</span>
                </td>
                <td className="py-2 px-2">
                  <span className="font-medium text-sm">{getQuotePrice(order)}</span>
                </td>
                <td className="py-2 px-2">{getStatusBadge(order.status)}</td>
                <td className="py-2 px-2 hidden lg:table-cell">{getAdminStatusBadge(order)}</td>
                <td className="py-2 px-2">{getPaymentInfo(order)}</td>
                <td className="py-2 px-2 text-gray-500 text-sm hidden lg:table-cell">
                  {order.created_at ? format(new Date(order.created_at), 'MM-dd HH:mm') : '-'}
                </td>
                <td className="py-2 px-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                    className="text-xs"
                  >
                    <span className="hidden md:inline">Detail</span>
                    <Eye className="w-3 h-3 md:hidden" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 