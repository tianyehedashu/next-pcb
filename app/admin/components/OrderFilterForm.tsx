"use client";

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { z } from 'zod';
import { OrderStatus } from '@/types/form';

export const orderFilterSchema = z.object({
  keyword: z.string().optional(),
  id: z.string().optional(),
  status: z.string().optional(),
  dateRange: z.tuple([z.string(), z.string()]).optional(),
});

interface OrderFilterFormValue {
  keyword?: string;
  id?: string;
  status?: string;
  dateRange?: [string, string];
}

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.Draft]: 'Draft',
  [OrderStatus.Created]: 'Created',
  [OrderStatus.Reviewed]: 'Reviewed',
  [OrderStatus.Unpaid]: 'Unpaid',
  [OrderStatus.PaymentPending]: 'Payment Pending',
  [OrderStatus.PartiallyPaid]: 'Partially Paid',
  [OrderStatus.PaymentFailed]: 'Payment Failed',
  [OrderStatus.PaymentCancelled]: 'Payment Cancelled',
  [OrderStatus.Paid]: 'Paid',
  [OrderStatus.InProduction]: 'In Production',
  [OrderStatus.QualityCheck]: 'Quality Check',
  [OrderStatus.ReadyForShipment]: 'Ready For Shipment',
  [OrderStatus.Shipped]: 'Shipped',
  [OrderStatus.Delivered]: 'Delivered',
  [OrderStatus.Completed]: 'Completed',
  [OrderStatus.Cancelled]: 'Cancelled',
  [OrderStatus.OnHold]: 'On Hold',
  [OrderStatus.Rejected]: 'Rejected',
  [OrderStatus.Refunded]: 'Refunded',
};

export function OrderFilterForm({ value, onChange }: { value: OrderFilterFormValue; onChange: (v: OrderFilterFormValue) => void }) {
  // 这里只做受控表单示例，实际可结合 react-hook-form/zod 实现完整校验
  const handleChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const keyword = formData.get('keyword') as string;
    const id = formData.get('id') as string;
    const status = formData.get('status') as string;
    const dateStart = formData.get('dateStart') as string;
    const dateEnd = formData.get('dateEnd') as string;
    onChange({
      keyword,
      id,
      status,
      dateRange: dateStart && dateEnd ? [dateStart, dateEnd] : undefined,
    });
  };

  return (
    <form onSubmit={handleChange} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
      <div className="w-full">
        <label className="block mb-1 text-sm font-medium">Keyword</label>
        <Input name="keyword" defaultValue={value?.keyword || ''} placeholder="Search by email, phone..." className="w-full" />
      </div>
      <div className="w-full">
        <label className="block mb-1 text-sm font-medium">Order ID</label>
        <Input 
          name="id" 
          defaultValue={value?.id || ''} 
          placeholder="Search by ID (supports partial UUID)..." 
          className="w-full font-mono text-sm" 
        />
      </div>
      <div className="w-full">
        <label className="block mb-1 text-sm font-medium">Status</label>
        <Select name="status" defaultValue={value?.status || 'all'}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-full">
        <label className="block mb-1 text-sm font-medium">Date Start</label>
        <Input type="date" name="dateStart" defaultValue={value?.dateRange?.[0] || ''} className="w-full" />
      </div>
      <div className="w-full">
        <label className="block mb-1 text-sm font-medium">Date End</label>
        <Input type="date" name="dateEnd" defaultValue={value?.dateRange?.[1] || ''} className="w-full" />
      </div>
      <Button type="submit" className="w-full sm:w-auto">Search</Button>
    </form>
  );
} 