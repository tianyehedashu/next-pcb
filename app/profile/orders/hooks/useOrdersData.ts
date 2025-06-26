import { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import type { OrderListItem, OrdersFilters, OrdersPagination } from '../types/orderTypes';

interface UseOrdersDataProps {
  filters: OrdersFilters;
  pagination: OrdersPagination;
  orderType?: string | null;
}

interface UseOrdersDataReturn {
  orders: OrderListItem[];
  loading: boolean;
  refreshing: boolean;
  totalCount: number;
  fetchOrders: () => Promise<void>;
  handleRefresh: () => Promise<void>;
}

export function useOrdersData({ 
  filters, 
  pagination, 
  orderType 
}: UseOrdersDataProps): UseOrdersDataReturn {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  
  const { user } = useAuth();

  const fetchOrders = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      console.log('Fetching orders from backend...');
      
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        pageSize: pagination.pageSize.toString(),
        status: filters.statusFilter,
        search: filters.backendSearchTerm,
        searchColumn: filters.searchColumn,
        sortField: 'created_at', 
        sortOrder: 'desc',
        showCancelled: filters.showCancelledOrders.toString(),
        ...(orderType && { type: orderType }),
        ...(filters.dateStart && { dateStart: filters.dateStart.toISOString().split('T')[0] }),
        ...(filters.dateEnd && { dateEnd: filters.dateEnd.toISOString().split('T')[0] }),
      });

      const response = await fetch(`/api/user/orders?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error || 'Unknown error',
          url: `/api/user/orders?${params}`
        });
        throw new Error(`Failed to fetch orders: ${errorData.error || response.statusText}`);
      }
      
      const { orders: ordersData, pagination: paginationData } = await response.json();
      setOrders(ordersData || []);
      setTotalCount(paginationData?.total || 0);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  // 当相关参数变化时重新获取数据
  useEffect(() => {
    fetchOrders();
  }, [
    pagination.currentPage, 
    pagination.pageSize, 
    filters.statusFilter, 
    filters.showCancelledOrders, 
    filters.backendSearchTerm,
    filters.searchColumn,
    filters.dateStart,
    filters.dateEnd,
    orderType, 
    user?.id
  ]);

  return {
    orders,
    loading,
    refreshing,
    totalCount,
    fetchOrders,
    handleRefresh
  };
} 