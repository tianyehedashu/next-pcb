"use client";

import React from 'react';
import { Order } from '../types/order';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface OrderTableProps {
  data: Order[];
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
  onDeleteSelected: () => void;
  deleting?: boolean;
}

export function OrderTable({
  data,
  selectedIds,
  onSelectChange,
  onDeleteSelected,
  deleting = false,
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

  return (
    <div className="bg-white rounded-xl shadow-lg">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="text-base font-semibold text-gray-700">Orders</span>
        <Button
          variant="default"
          className="bg-primary text-white hover:bg-primary/90 rounded-lg font-semibold px-6"
          size="sm"
          disabled={selectedIds.length === 0 || deleting}
          onClick={onDeleteSelected}
        >
          Delete Selected
        </Button>
      </div>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="py-3 px-2 text-left font-semibold text-gray-700">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
            </th>
            <th className="py-3 px-2 text-left font-semibold text-gray-700">User</th>
            <th className="py-3 px-2 text-left font-semibold text-gray-700">Type</th>
            <th className="py-3 px-2 text-left font-semibold text-gray-700">Status</th>
            <th className="py-3 px-2 text-left font-semibold text-gray-700">PCB Price</th>
            <th className="py-3 px-2 text-left font-semibold text-gray-700">PCB Lead Time</th>
            <th className="py-3 px-2 text-left font-semibold text-gray-700">PCB Status</th>
            <th className="py-3 px-2 text-left font-semibold text-gray-700">Admin Order Status</th>
            <th className="py-3 px-2 text-left font-semibold text-gray-700">Admin Order Price</th>
            <th className="py-3 px-2 text-left font-semibold text-gray-700">Admin Order Lead Time</th>
            <th className="py-3 px-2 text-left font-semibold text-gray-700">Created</th>
            <th className="py-3 px-2 text-left font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={12} className="py-8 text-center text-gray-400">No orders found.</td>
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
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>{(order.email?.[0] || 'U').toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="truncate max-w-[120px] text-gray-800">{order.email || '-'}</span>
                </div>
              </td>
              <td className="py-2 px-2">{order.type === 'Order' ? 'Order' : 'Inquiry'}</td>
              <td className="py-2 px-2">{order.status}</td>
              <td className="py-2 px-2">{order.pcb_price ?? '-'}</td>
              <td className="py-2 px-2">{order.pcb_lead_time ?? '-'}</td>
              <td className="py-2 px-2">{order.pcb_status ?? '-'}</td>
              <td className="py-2 px-2">{order.admin_order_status ?? '-'}</td>
              <td className="py-2 px-2">{order.admin_order_price ?? '-'}</td>
              <td className="py-2 px-2">{order.admin_order_lead_time ?? '-'}</td>
              <td className="py-2 px-2 text-gray-500">{order.created_at ? format(new Date(order.created_at), 'yyyy-MM-dd HH:mm:ss') : '-'}</td>
              <td className="py-2 px-2 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push(`/admin/orders/${order.id}`)}>Detail</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* 分页 */}
      {/* <Pagination ... /> */}
    </div>
  );
} 