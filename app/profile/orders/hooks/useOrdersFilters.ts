import { useState, useMemo } from 'react';
import { filterOrdersByKeyword, sortOrders } from '../utils/orderHelpers';
import { DEFAULT_SORT_FIELD, DEFAULT_SORT_ORDER, DEFAULT_SEARCH_COLUMN } from '../constants/orderConstants';
import type { OrderListItem, OrdersFilters, OrdersSort, SortField, SortOrder } from '../types/orderTypes';

interface UseOrdersFiltersProps {
  orders: OrderListItem[];
}

interface UseOrdersFiltersReturn {
  // 筛选状态
  filters: OrdersFilters;
  setFilters: (filters: OrdersFilters) => void;
  
  // 排序状态
  sort: OrdersSort;
  setSort: (sort: OrdersSort) => void;
  
  // 处理函数
  handleBackendSearch: () => void;
  handleClearSearch: () => void;
  handleSort: (field: SortField) => void;
  handleStatusFilter: (status: string) => void;
  handleToggleCancelled: () => void;
  updateSearchKeyword: (keyword: string) => void;
  updateSearchColumn: (column: string) => void;
  
  // 筛选后的数据
  filteredOrders: OrderListItem[];
  hasSearchResults: boolean;
}

export function useOrdersFilters({ orders }: UseOrdersFiltersProps): UseOrdersFiltersReturn {
  const [filters, setFilters] = useState<OrdersFilters>({
    searchKeyword: '',
    searchColumn: DEFAULT_SEARCH_COLUMN,
    backendSearchTerm: '',
    statusFilter: 'all',
    showCancelledOrders: false,
  });

  const [sort, setSort] = useState<OrdersSort>({
    sortField: DEFAULT_SORT_FIELD as SortField,
    sortOrder: DEFAULT_SORT_ORDER as SortOrder,
  });

  // 前端实时筛选和排序
  const filteredOrders = useMemo(() => {
    let filtered = filterOrdersByKeyword(orders, filters.searchKeyword, filters.searchColumn);
    filtered = sortOrders(filtered, sort.sortField, sort.sortOrder);
    return filtered;
  }, [orders, filters.searchKeyword, filters.searchColumn, sort.sortField, sort.sortOrder]);

  const hasSearchResults = filteredOrders.length !== orders.length;

  // 处理后端搜索
  const handleBackendSearch = () => {
    console.log('Triggering backend search for:', filters.searchKeyword);
    setFilters({
      ...filters,
      backendSearchTerm: filters.searchKeyword
    });
  };

  // 清除搜索
  const handleClearSearch = () => {
    setFilters({
      ...filters,
      searchKeyword: '',
      searchColumn: DEFAULT_SEARCH_COLUMN, // 重置为默认搜索列
      backendSearchTerm: ''
    });
  };

  // 处理前端排序
  const handleSort = (field: SortField) => {
    console.log('Frontend sort changing:', field);
    if (sort.sortField === field) {
      setSort({
        ...sort,
        sortOrder: sort.sortOrder === 'asc' ? 'desc' : 'asc'
      });
    } else {
      setSort({
        sortField: field,
        sortOrder: 'desc'
      });
    }
  };

  // 处理状态筛选
  const handleStatusFilter = (status: string) => {
    console.log('Changing status filter to:', status);
    setFilters({
      ...filters,
      statusFilter: status
    });
  };

  // 切换取消订单显示
  const handleToggleCancelled = () => {
    setFilters({
      ...filters,
      showCancelledOrders: !filters.showCancelledOrders
    });
  };

  // 更新搜索关键词
  const updateSearchKeyword = (keyword: string) => {
    setFilters({
      ...filters,
      searchKeyword: keyword
    });
  };

  // 更新搜索列
  const updateSearchColumn = (column: string) => {
    setFilters({
      ...filters,
      searchColumn: column
    });
  };

  return {
    filters,
    setFilters,
    sort,
    setSort,
    handleBackendSearch,
    handleClearSearch,
    handleSort,
    handleStatusFilter,
    handleToggleCancelled,
    updateSearchKeyword,
    updateSearchColumn,
    filteredOrders,
    hasSearchResults
  };
} 