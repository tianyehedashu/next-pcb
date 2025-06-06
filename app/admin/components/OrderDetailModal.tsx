"use client";

import React from 'react';
import { Order } from '../types/order';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function OrderDetailModal({ order, onClose }: { order: Order | null; onClose: () => void }) {
  if (!order) return null;
  return (
    <Dialog open={!!order} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Order Detail</DialogTitle>
        </DialogHeader>
        <div>
          <div>ID: {order.id}</div>
          <div>Email: {order.email}</div>
          <div>Status: {order.status}</div>
          <div>PCB Price: {order.pcb_price ?? '-'}</div>
          <div>PCB Lead Time: {order.pcb_lead_time ?? '-'}</div>
          <div>PCB Status: {order.pcb_status ?? '-'}</div>
          <div>Admin Order Status: {order.admin_order_status ?? '-'}</div>
          <div>Admin Order Price: {order.admin_order_price ?? '-'}</div>
          <div>Admin Order Lead Time: {order.admin_order_lead_time ?? '-'}</div>
          <div>Created: {order.created_at}</div>
          <div>Admin Notes: {order.admin_notes ?? '-'}</div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 