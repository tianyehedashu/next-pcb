"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Order } from '../types/order';
import { OrderTable } from '../components/OrderTable';
import { OrderDetailModal } from '../components/OrderDetailModal';
import { OrderFilterForm, orderFilterSchema } from '../components/OrderFilterForm';
import { Pagination } from '@/app/components/ui/pagination';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  // 批量删除订单
  const handleDeleteSelected = async () => {
    setDeleting(true);
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idList: selectedOrderIds }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete orders');
      }
      toast.success('Orders deleted', {
        className: 'rounded-lg shadow-md text-base font-semibold',
        style: { background: 'var(--primary)', color: 'white' },
      });
      setSelectedOrderIds([]);
      await fetchOrders();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete orders');
    } finally {
      setDeleteDialogOpen(false);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full p-2 md:p-4">
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 flex flex-col items-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-8 text-gray-900 tracking-tight">Order Management</h2>
          <div className="w-full flex justify-center items-center min-h-[120px] text-gray-500 text-lg">Loading orders...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-2 md:p-4">
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 flex flex-col items-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-8 text-gray-900 tracking-tight">Order Management</h2>
          <div className="w-full flex justify-center items-center min-h-[120px] text-red-600 text-lg">Error loading orders: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-2 md:p-4">
      <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-8 text-gray-900 tracking-tight">Order Management</h2>
        <div className="mb-6">
          <OrderFilterForm value={filter} onChange={handleFilterChange} />
        </div>
        <div className="overflow-x-auto rounded-xl shadow-lg bg-white">
          <OrderTable
            data={orders}
            selectedIds={selectedOrderIds}
            onSelectChange={setSelectedOrderIds}
            onDeleteSelected={() => setDeleteDialogOpen(true)}
            deleting={deleting}
          />
        </div>
        <div className="flex justify-center mt-8">
          <Pagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onPageChange={handlePageChange}
          />
        </div>
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      </div>
      {/* 删除确认弹窗 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">Delete Orders</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-gray-700">
            Are you sure you want to delete the selected orders? This action cannot be undone.
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
            <Button
              variant="default"
              className="bg-primary text-white hover:bg-primary/90 rounded-lg font-semibold px-6"
              onClick={handleDeleteSelected}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 