import React from 'react';
import { Package, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Order, AdminOrder } from '@/app/admin/types/order';

interface PageHeaderProps {
  order: Order;
  adminOrder: AdminOrder | null;
}

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

export function PageHeader({ order, adminOrder }: PageHeaderProps) {
  return (
    <div className="bg-white border rounded p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">订单审核 #{order.id.slice(0, 8)}</h1>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <Badge className={getStatusColor(order.status || 'pending')} variant="outline">
                {order.status || 'pending'}
              </Badge>
              <span>{order.created_at && new Date(order.created_at as string).toLocaleDateString('zh-CN')}</span>
              <span>客户: {order.email || '-'}</span>
            </div>
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {(() => {
            const canAdminEdit = !['completed', 'cancelled', 'delivered'].includes(order.status || '') && 
                               (!adminOrder || !['completed', 'cancelled', 'delivered'].includes(adminOrder.status || ''));
            
            if (canAdminEdit) {
              return (
                <Button 
                  onClick={() => window.open(`/quote2?edit=${order.id}`, '_blank')}
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  编辑
                </Button>
              );
            }
            return null;
          })()}
        </div>
      </div>
    </div>
  );
} 