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
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Orders</h3>
      <form onSubmit={handleChange} className="space-y-4">
        {/* 移动端：垂直布局，桌面端：网格布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="w-full">
            <label className="block mb-1 text-sm font-medium text-gray-700">Keyword</label>
            <Input 
              name="keyword" 
              defaultValue={value?.keyword || ''} 
              placeholder="Search email, phone..." 
              className="w-full" 
            />
          </div>
          
          <div className="w-full">
            <label className="block mb-1 text-sm font-medium text-gray-700">Order ID</label>
            <Input 
              name="id" 
              defaultValue={value?.id || ''} 
              placeholder="Enter order ID..." 
              className="w-full font-mono text-sm" 
            />
          </div>
          
          <div className="w-full">
            <label className="block mb-1 text-sm font-medium text-gray-700">Status</label>
            <Select name="status" defaultValue={value?.status || 'all'}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* 移动端：日期范围在一行 */}
          <div className="w-full md:col-span-2 xl:col-span-1">
            <label className="block mb-1 text-sm font-medium text-gray-700">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <Input 
                type="date" 
                name="dateStart" 
                defaultValue={value?.dateRange?.[0] || ''} 
                className="w-full text-sm" 
                placeholder="Start date"
              />
              <Input 
                type="date" 
                name="dateEnd" 
                defaultValue={value?.dateRange?.[1] || ''} 
                className="w-full text-sm" 
                placeholder="End date"
              />
            </div>
          </div>
        </div>
        
        {/* 搜索按钮 */}
        <div className="flex justify-end pt-2">
          <Button 
            type="submit" 
            className="w-full sm:w-auto bg-primary text-white hover:bg-primary/90 rounded-lg font-semibold px-8"
          >
            🔍 Search Orders
          </Button>
        </div>
      </form>
    </div>
  );
} 