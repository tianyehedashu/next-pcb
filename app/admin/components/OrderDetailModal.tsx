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
      <DialogContent className="max-w-[90vw] sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Order Detail</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">ID:</span> {order.id}
            </div>
            <div className="text-sm">
              <span className="font-medium">Email:</span> {order.email}
            </div>
            <div className="text-sm">
              <span className="font-medium">Status:</span> {order.status}
            </div>
            <div className="text-sm">
              <span className="font-medium">PCB Price:</span> {order.pcb_price ?? '-'}
            </div>
            <div className="text-sm">
              <span className="font-medium">PCB Lead Time:</span> {order.pcb_lead_time ?? '-'}
            </div>
            <div className="text-sm">
              <span className="font-medium">PCB Status:</span> {order.pcb_status ?? '-'}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Admin Order Status:</span> {order.admin_order_status ?? '-'}
            </div>
            <div className="text-sm">
              <span className="font-medium">Admin Order Price:</span> {order.admin_order_price ?? '-'}
            </div>
            <div className="text-sm">
              <span className="font-medium">Admin Order Lead Time:</span> {order.admin_order_lead_time ?? '-'}
            </div>
            <div className="text-sm">
              <span className="font-medium">Created:</span> {order.created_at}
            </div>
            <div className="text-sm">
              <span className="font-medium">Admin Notes:</span> {order.admin_notes ?? '-'}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 