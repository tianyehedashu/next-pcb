import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OrderTableRow from './OrderTableRow';
import type { OrderListItem, OrdersSort, SortField } from '../types/orderTypes';

interface OrdersTableProps {
  orders: OrderListItem[];
  sort: OrdersSort;
  loading: boolean;
  onSort: (field: SortField) => void;
}

export default function OrdersTable({
  orders,
  sort,
  loading,
  onSort,
}: OrdersTableProps) {
  const getSortIcon = (field: SortField) => {
    if (sort.sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-300" />;
    }
    return sort.sortOrder === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  const getSortButtonClass = (field: SortField) => {
    const baseClass = "flex items-center gap-1 font-medium hover:text-blue-600 transition-colors";
    if (sort.sortField === field) {
      return `${baseClass} text-blue-600`;
    }
    return `${baseClass} text-gray-700`;
  };

  if (loading) {
    return (
      <div className="p-6 sm:p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-6 sm:p-8">
        <div className="text-center">
          <p className="text-gray-500 text-lg">No orders found</p>
          <p className="text-gray-400 text-sm mt-2">
            Try adjusting your search criteria or create a new quote
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 桌面端表格视图 */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700 min-w-[80px]">
                  Order ID
                </th>
                <th className="text-left py-3 px-4 min-w-[120px]">
                  <Button
                    variant="ghost"
                    onClick={() => onSort('created_at')}
                    className={`p-0 h-auto ${getSortButtonClass('created_at')}`}
                  >
                    Date
                    {getSortIcon('created_at')}
                  </Button>
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 min-w-[100px]">
                  <Button
                    variant="ghost"
                    onClick={() => onSort('status')}
                    className={`p-0 h-auto ${getSortButtonClass('status')}`}
                  >
                    Status
                    {getSortIcon('status')}
                  </Button>
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 min-w-[200px]">
                  PCB Specifications
                </th>
                <th className="text-left py-3 px-4 min-w-[100px]">
                  <Button
                    variant="ghost"
                    onClick={() => onSort('admin_price')}
                    className={`p-0 h-auto ${getSortButtonClass('admin_price')}`}
                  >
                    Price
                    {getSortIcon('admin_price')}
                  </Button>
                </th>
                <th className="text-left py-3 px-4 min-w-[100px]">
                  <Button
                    variant="ghost"
                    onClick={() => onSort('lead_time')}
                    className={`p-0 h-auto ${getSortButtonClass('lead_time')}`}
                  >
                    Lead Time
                    {getSortIcon('lead_time')}
                  </Button>
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 min-w-[120px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <OrderTableRow key={order.id} order={order} viewMode="table" />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 移动端/平板端卡片视图 */}
      <div className="lg:hidden">
        <div className="p-4 space-y-4">
          {/* 排序控制 - 移动端 */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={sort.sortField === 'created_at' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSort('created_at')}
              className="text-xs"
            >
              Date {sort.sortField === 'created_at' && getSortIcon('created_at')}
            </Button>
            <Button
              variant={sort.sortField === 'status' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSort('status')}
              className="text-xs"
            >
              Status {sort.sortField === 'status' && getSortIcon('status')}
            </Button>
            <Button
              variant={sort.sortField === 'admin_price' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSort('admin_price')}
              className="text-xs"
            >
              Price {sort.sortField === 'admin_price' && getSortIcon('admin_price')}
            </Button>
            <Button
              variant={sort.sortField === 'lead_time' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSort('lead_time')}
              className="text-xs"
            >
              Lead Time {sort.sortField === 'lead_time' && getSortIcon('lead_time')}
            </Button>
          </div>

          {/* 订单卡片列表 */}
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderTableRow key={order.id} order={order} viewMode="card" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
} 