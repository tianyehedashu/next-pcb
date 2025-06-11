"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock, AlertCircle, XCircle, ArrowRight } from 'lucide-react';
import { OrderStatus } from '@/types/form';

interface StatusChange {
  id: string;
  order_id: string;
  from_status: string;
  to_status: string;
  changed_by: string;
  changed_by_role: 'admin' | 'user' | 'system';
  changed_by_name?: string;
  reason?: string;
  created_at: string;
}

interface OrderStatusHistoryProps {
  statusHistory: StatusChange[];
  currentStatus: string;
}

// 状态图标映射
const statusIcons: Record<string, React.ElementType> = {
  [OrderStatus.Created]: Clock,
  [OrderStatus.Reviewed]: CheckCircle2,
  [OrderStatus.Paid]: CheckCircle2,
  [OrderStatus.InProduction]: Clock,
  [OrderStatus.Shipped]: CheckCircle2,
  [OrderStatus.Delivered]: CheckCircle2,
  [OrderStatus.Completed]: CheckCircle2,
  [OrderStatus.Cancelled]: XCircle,
  [OrderStatus.Rejected]: XCircle,
  [OrderStatus.Refunded]: AlertCircle,
};

// 状态颜色映射
const statusColors: Record<string, string> = {
  [OrderStatus.Created]: 'text-blue-600 bg-blue-50',
  [OrderStatus.Reviewed]: 'text-green-600 bg-green-50',
  [OrderStatus.Paid]: 'text-emerald-600 bg-emerald-50',
  [OrderStatus.InProduction]: 'text-orange-600 bg-orange-50',
  [OrderStatus.Shipped]: 'text-indigo-600 bg-indigo-50',
  [OrderStatus.Delivered]: 'text-purple-600 bg-purple-50',
  [OrderStatus.Completed]: 'text-green-700 bg-green-100',
  [OrderStatus.Cancelled]: 'text-red-600 bg-red-50',
  [OrderStatus.Rejected]: 'text-red-700 bg-red-100',
  [OrderStatus.Refunded]: 'text-gray-600 bg-gray-50',
};

// 角色显示映射
const roleLabels: Record<string, string> = {
  admin: 'Admin',
  user: 'Customer',
  system: 'System',
};

export function OrderStatusHistory({ statusHistory, currentStatus }: OrderStatusHistoryProps) {
  if (!statusHistory || statusHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">No status history available</p>
        </CardContent>
      </Card>
    );
  }

  // 按时间倒序排列
  const sortedHistory = [...statusHistory].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Status History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 当前状态 */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className={`p-2 rounded-full ${statusColors[currentStatus] || 'bg-gray-100'}`}>
            {React.createElement(statusIcons[currentStatus] || Clock, { className: 'w-5 h-5' })}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Current Status</p>
            <p className="text-sm text-gray-600">{currentStatus}</p>
          </div>
        </div>

        {/* 历史记录 */}
        <div className="space-y-3">
          {sortedHistory.map((change, index) => {
            const Icon = statusIcons[change.to_status] || Clock;
            const colorClass = statusColors[change.to_status] || 'text-gray-600 bg-gray-50';
            
            return (
              <div key={change.id} className="relative">
                {/* 连接线 */}
                {index < sortedHistory.length - 1 && (
                  <div className="absolute left-5 top-10 w-0.5 h-full bg-gray-200" />
                )}
                
                <div className="flex items-start gap-3">
                  {/* 图标 */}
                  <div className={`p-2 rounded-full ${colorClass} relative z-10`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  {/* 内容 */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {change.from_status}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className={`font-medium ${colorClass.split(' ')[0]}`}>
                        {change.to_status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>by {change.changed_by_name || change.changed_by}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        change.changed_by_role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        change.changed_by_role === 'user' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {roleLabels[change.changed_by_role]}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span>{new Date(change.created_at).toLocaleString()}</span>
                    </div>
                    
                    {change.reason && (
                      <p className="mt-1 text-sm text-gray-600 bg-gray-50 rounded p-2">
                        {change.reason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
