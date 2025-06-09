"use client";

import React from 'react';
import { OrderStatus } from '@/types/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toUSD } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Order {
  id: string;
  status: OrderStatus;
  created_at: string;
  total_amount: number;
  user: {
    name: string;
    email: string;
  };
}

// 订单状态筛选选项
const orderStatusFilters = [
  { value: 'all', label: '全部状态' },
  { value: OrderStatus.Created, label: '待审核' },
  { value: OrderStatus.Reviewed, label: '已审核' },
  { value: OrderStatus.Unpaid, label: '待支付' },
  { value: OrderStatus.PaymentPending, label: '支付中' },
  { value: OrderStatus.Paid, label: '已支付' },
  { value: OrderStatus.InProduction, label: '生产中' },
  { value: OrderStatus.QualityCheck, label: '质检中' },
  { value: OrderStatus.ReadyForShipment, label: '待发货' },
  { value: OrderStatus.Shipped, label: '已发货' },
  { value: OrderStatus.Delivered, label: '已送达' },
  { value: OrderStatus.Completed, label: '已完成' },
  { value: OrderStatus.Cancelled, label: '已取消' },
  { value: OrderStatus.OnHold, label: '已暂停' },
  { value: OrderStatus.Rejected, label: '已拒绝' },
  { value: OrderStatus.Refunded, label: '已退款' },
  { value: OrderStatus.PartiallyPaid, label: '部分支付' },
  { value: OrderStatus.PaymentFailed, label: '支付失败' },
  { value: OrderStatus.PaymentCancelled, label: '支付取消' }
];

// 订单状态文本映射
const orderStatusText: Record<OrderStatus, string> = {
  [OrderStatus.Draft]: '草稿',
  [OrderStatus.Created]: '待审核',
  [OrderStatus.Reviewed]: '已审核',
  [OrderStatus.Unpaid]: '待支付',
  [OrderStatus.PaymentPending]: '支付中',
  [OrderStatus.Paid]: '已支付',
  [OrderStatus.InProduction]: '生产中',
  [OrderStatus.QualityCheck]: '质检中',
  [OrderStatus.ReadyForShipment]: '待发货',
  [OrderStatus.Shipped]: '已发货',
  [OrderStatus.Delivered]: '已送达',
  [OrderStatus.Completed]: '已完成',
  [OrderStatus.Cancelled]: '已取消',
  [OrderStatus.OnHold]: '已暂停',
  [OrderStatus.Rejected]: '已拒绝',
  [OrderStatus.Refunded]: '已退款',
  [OrderStatus.PartiallyPaid]: '部分支付',
  [OrderStatus.PaymentFailed]: '支付失败',
  [OrderStatus.PaymentCancelled]: '支付取消'
};

// 订单状态样式映射
const orderStatusStyle: Record<OrderStatus, string> = {
  [OrderStatus.Draft]: 'bg-gray-100 text-gray-600',
  [OrderStatus.Created]: 'bg-yellow-100 text-yellow-600',
  [OrderStatus.Reviewed]: 'bg-blue-100 text-blue-600',
  [OrderStatus.Unpaid]: 'bg-orange-100 text-orange-600',
  [OrderStatus.PaymentPending]: 'bg-purple-100 text-purple-600',
  [OrderStatus.Paid]: 'bg-green-100 text-green-600',
  [OrderStatus.InProduction]: 'bg-indigo-100 text-indigo-600',
  [OrderStatus.QualityCheck]: 'bg-pink-100 text-pink-600',
  [OrderStatus.ReadyForShipment]: 'bg-teal-100 text-teal-600',
  [OrderStatus.Shipped]: 'bg-cyan-100 text-cyan-600',
  [OrderStatus.Delivered]: 'bg-emerald-100 text-emerald-600',
  [OrderStatus.Completed]: 'bg-green-100 text-green-600',
  [OrderStatus.Cancelled]: 'bg-red-100 text-red-600',
  [OrderStatus.OnHold]: 'bg-gray-100 text-gray-600',
  [OrderStatus.Rejected]: 'bg-red-100 text-red-600',
  [OrderStatus.Refunded]: 'bg-gray-100 text-gray-600',
  [OrderStatus.PartiallyPaid]: 'bg-yellow-100 text-yellow-600',
  [OrderStatus.PaymentFailed]: 'bg-red-100 text-red-600',
  [OrderStatus.PaymentCancelled]: 'bg-red-100 text-red-600'
};

export default function AdminOrdersPage({
  searchParams = {},
}: {
  searchParams?: { status?: string }
}): React.ReactElement {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState(searchParams?.status || 'all');
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // 获取订单数据
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`/api/orders?page=${page}&status=${statusFilter}`);
        const data = await response.json();
        setOrders(data.orders);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      }
    };

    fetchOrders();
  }, [page, statusFilter]);

  // 根据状态筛选订单
  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  // 更新状态筛选
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    const newParams = new URLSearchParams();
    if (value !== 'all') {
      newParams.set('status', value);
    }
    const newUrl = `${window.location.pathname}${newParams.toString() ? `?${newParams.toString()}` : ''}`;
    router.push(newUrl);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">订单管理</h1>
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="选择状态" />
            </SelectTrigger>
            <SelectContent>
              {orderStatusFilters.map(filter => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 订单列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">订单号</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">用户</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">创建时间</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">金额</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{order.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <div>{order.user.name}</div>
                    <div className="text-xs text-gray-400">{order.user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${orderStatusStyle[order.status]}`}>
                      {orderStatusText[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{toUSD(order.total_amount)}</td>
                  <td className="px-4 py-3 text-sm">
                    <Link
                      href={`/admin/quote/orders/${order.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      查看详情
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分页 */}
      <div className="mt-4 flex justify-center">
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            上一页
          </button>
          <span className="px-3 py-1">第 {page} 页</span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={orders.length < 10}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
} 