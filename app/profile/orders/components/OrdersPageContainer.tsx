import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useOrdersData } from '../hooks/useOrdersData';
import { useOrdersFilters } from '../hooks/useOrdersFilters';
import { DEFAULT_PAGE_SIZE } from '../constants/orderConstants';
import { filterOrdersByKeyword, sortOrders } from '../utils/orderHelpers';
import OrdersSearchBar from './OrdersSearchBar';
import OrdersTable from './OrdersTable';
import OrdersPagination from './OrdersPagination';
import type { OrdersPagination, OrdersFilters, OrdersSort, SortField } from '../types/orderTypes';

export default function OrdersPageContainer() {
  const searchParams = useSearchParams();
  const orderType = searchParams.get('type');

  // 分页状态
  const [pagination, setPagination] = useState<OrdersPagination>({
    currentPage: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalCount: 0,
  });

  // 筛选和排序状态管理
  const [filters, setFilters] = useState<OrdersFilters>({
    searchKeyword: '',
    searchColumn: 'order_id',
    backendSearchTerm: '',
    statusFilter: 'all',
    showCancelledOrders: false,
    dateStart: undefined,
    dateEnd: undefined,
  });

  // 排序状态
  const [sort, setSort] = useState<OrdersSort>({
    sortField: 'created_at',
    sortOrder: 'desc',
  });

  // 数据获取 - 后端数据
  const { 
    orders, 
    loading, 
    refreshing, 
    totalCount, 
    fetchOrders,
    handleRefresh 
  } = useOrdersData({
    filters,
    pagination,
    orderType,
  });

  // 前端筛选和排序
  const filteredOrders = useMemo(() => {
    let filtered = filterOrdersByKeyword(orders, filters.searchKeyword, filters.searchColumn);
    filtered = sortOrders(filtered, sort.sortField, sort.sortOrder);
    return filtered;
  }, [orders, filters.searchKeyword, filters.searchColumn, sort.sortField, sort.sortOrder]);

  const hasSearchResults = filteredOrders.length !== orders.length;

  // 更新分页状态中的总数
  React.useEffect(() => {
    setPagination(prev => ({ ...prev, totalCount }));
  }, [totalCount]);

  // 处理分页变化
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPagination(prev => ({ 
      ...prev, 
      pageSize, 
      currentPage: 1 // 重置到第一页
    }));
  };

  const handleDateChange = (date: Date | undefined, field: "dateStart" | "dateEnd") => {
    setFilters(prev => ({ ...prev, [field]: date }));
  };

  // 处理排序
  const handleSort = (field: SortField) => {
    setSort(prev => ({
      sortField: field,
      sortOrder: prev.sortField === field && prev.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 响应式容器 */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* 页面标题 - 响应式设计 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Orders</h1>
              {orderType && (
                <p className="text-sm text-gray-500 mt-1">
                  Type: <span className="font-medium">{orderType}</span>
                </p>
              )}
            </div>
            {/* 移动端可添加快捷操作 */}
            <div className="flex items-center gap-2 sm:hidden">
              <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-md border">
                {totalCount} orders
              </div>
            </div>
          </div>

          {/* 搜索和筛选栏 */}
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
            <OrdersSearchBar
              filters={filters}
              totalCount={totalCount}
              filteredCount={filteredOrders.length}
              hasSearchResults={hasSearchResults}
              loading={loading}
              refreshing={refreshing}
              onSearchKeywordChange={(keyword) => setFilters(prev => ({ ...prev, searchKeyword: keyword }))}
              onSearchColumnChange={(column) => setFilters(prev => ({ ...prev, searchColumn: column }))}
              onBackendSearch={(term) => setFilters(prev => ({ ...prev, backendSearchTerm: term }))}
              onClearSearch={() => setFilters(prev => ({ ...prev, searchKeyword: '', backendSearchTerm: '' }))}
              onStatusFilter={(status) => setFilters(prev => ({ ...prev, statusFilter: status }))}
              onToggleCancelled={(show) => setFilters(prev => ({ ...prev, showCancelledOrders: show }))}
              onRefresh={handleRefresh}
              onDateChange={handleDateChange}
            />
          </div>

          {/* 订单表格/列表 */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <OrdersTable
              orders={filteredOrders}
              sort={sort}
              loading={loading}
              onSort={handleSort}
            />
          </div>

          {/* 分页控制 */}
          {!loading && totalCount > 0 && (
            <div className="flex justify-center">
              <OrdersPagination
                pagination={pagination}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 