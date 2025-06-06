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

export const orderFilterSchema = z.object({
  keyword: z.string().optional(),
  status: z.string().optional(),
  dateRange: z.tuple([z.string(), z.string()]).optional(),
});

interface OrderFilterFormValue {
  keyword?: string;
  status?: string;
  dateRange?: [string, string];
}

export function OrderFilterForm({ value, onChange }: { value: OrderFilterFormValue; onChange: (v: OrderFilterFormValue) => void }) {
  // 这里只做受控表单示例，实际可结合 react-hook-form/zod 实现完整校验
  const handleChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const keyword = formData.get('keyword') as string;
    const status = formData.get('status') as string;
    const dateStart = formData.get('dateStart') as string;
    const dateEnd = formData.get('dateEnd') as string;
    onChange({
      keyword,
      status,
      dateRange: dateStart && dateEnd ? [dateStart, dateEnd] : undefined,
    });
  };

  return (
    <form onSubmit={handleChange} className="flex flex-wrap gap-4 items-end">
      <div>
        <label className="block mb-1 text-sm font-medium">Keyword</label>
        <Input name="keyword" defaultValue={value?.keyword || ''} placeholder="Search..." />
      </div>
      <div>
        <label className="block mb-1 text-sm font-medium">Status</label>
        <Select name="status" defaultValue={value?.status || 'all'}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="in_production">In Production</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block mb-1 text-sm font-medium">Date Start</label>
        <Input type="date" name="dateStart" defaultValue={value?.dateRange?.[0] || ''} />
      </div>
      <div>
        <label className="block mb-1 text-sm font-medium">Date End</label>
        <Input type="date" name="dateEnd" defaultValue={value?.dateRange?.[1] || ''} />
      </div>
      <Button type="submit">Search</Button>
    </form>
  );
} 