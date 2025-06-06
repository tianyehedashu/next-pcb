"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Order, OrderStatus } from '../types/order';
import { OrderTable } from '../components/OrderTable';
import { OrderDetailModal } from '../components/OrderDetailModal';
import { OrderFilterForm, orderFilterSchema } from '../components/OrderFilterForm';
import { Pagination } from '@/app/components/ui/pagination';
import { toast } from 'sonner';

interface OrderFilter {
  keyword?: string;
  status?: string;
  dateRange?: [string, string];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<OrderFilter>({});
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });

  // 获取订单
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pagination.page),
        pageSize: String(pagination.pageSize),
        ...(filter.keyword ? { keyword: filter.keyword } : {}),
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.dateRange ? { start: filter.dateRange[0], end: filter.dateRange[1] } : {}),
      });
      const response = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch orders');
      }
      const data = await response.json();
      const ordersWithType = (data.items || []).map((item: Order) => ({
        ...item,
        type: item.user_id ? 'Order' : 'Inquiry',
      }));
      setOrders(ordersWithType);
      setPagination(p => ({ ...p, total: data.total || 0 }));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filter, pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 订单状态修改
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order');
      }
      toast.success('Order status updated');
      fetchOrders();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  // 筛选表单提交
  const handleFilterChange = (values: unknown) => {
    const parsed = orderFilterSchema.safeParse(values);
    if (parsed.success) {
      setFilter(parsed.data);
      setPagination(p => ({ ...p, page: 1 }));
    } else {
      toast.error('Invalid filter');
    }
  };

  // 分页切换
  const handlePageChange = (page: number) => {
    setPagination(p => ({ ...p, page }));
  };

  // 详情弹窗
  const handleOrderClick = (order: Order) => setSelectedOrder(order);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-2 sm:px-4 md:px-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">Order Management</h2>
        <div className="bg-white rounded-lg shadow p-6 text-gray-500 text-center">Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-2 sm:px-4 md:px-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">Order Management</h2>
        <div className="bg-white rounded-lg shadow p-6 text-red-600 text-center">Error loading orders: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-2 sm:px-4 md:px-8">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">Order Management</h2>
      <div className="mb-4">
        <OrderFilterForm value={filter} onChange={handleFilterChange} />
      </div>
      <div className="overflow-x-auto rounded-xl shadow-lg bg-white">
        <OrderTable
          data={orders}
          onOrderClick={handleOrderClick}
          onStatusChange={handleStatusChange}
        />
      </div>
      <Pagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.total}
        onPageChange={handlePageChange}
      />
      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
} 