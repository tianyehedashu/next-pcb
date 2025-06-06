"use client";

import React from 'react';
import { Order, OrderStatus } from '../types/order';
import { Button } from '@/components/ui/button';

export function OrderTable({
  data,
  onOrderClick,
  onStatusChange,
}: {
  data: Order[];
  onOrderClick: (order: Order) => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
}) {
  // ...渲染表格，支持多选、操作、分页
  return (
    <div className="bg-white rounded-lg shadow">
      {/* 表头 */}
      <table className="min-w-full">
        <thead>
          <tr>
            <th><input type="checkbox" /></th>
            <th>User</th>
            <th>Type</th>
            <th>Status</th>
            <th>PCB Price</th>
            <th>PCB Lead Time</th>
            <th>PCB Status</th>
            <th>Admin Order Status</th>
            <th>Admin Order Price</th>
            <th>Admin Order Lead Time</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(order => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td><input type="checkbox" /></td>
              <td>{order.email || '-'}</td>
              <td>{order.type === 'Order' ? 'Order' : 'Inquiry'}</td>
              <td>{order.status}</td>
              <td>{order.pcb_price ?? '-'}</td>
              <td>{order.pcb_lead_time ?? '-'}</td>
              <td>{order.pcb_status ?? '-'}</td>
              <td>{order.admin_order_status ?? '-'}</td>
              <td>{order.admin_order_price ?? '-'}</td>
              <td>{order.admin_order_lead_time ?? '-'}</td>
              <td>{order.created_at}</td>
              <td>
                <Button onClick={() => onOrderClick(order)}>Detail</Button>
                <Button onClick={() => onStatusChange(order.id, 'reviewed')}>Review</Button>
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