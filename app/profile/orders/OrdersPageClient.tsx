"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { useUserStore } from "@/lib/userStore";
import { toUSD } from "@/lib/utils";
import { canOrderBePaid, getOrderPaymentAmount, type OrderWithAdminOrder } from "@/lib/utils/orderHelpers";
import { RefundStatusBadge } from "@/app/components/custom-ui/RefundStatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import { Search, Package, Plus, RefreshCw, Eye, CreditCard, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/app/components/ui/pagination";

interface AdminOrderInfo {
  id: string;
  status: string;
  admin_price: number | null;
  currency: string;
  payment_status?: string | null;
  refund_status?: string | null;
  requested_refund_amount?: number | null;
  approved_refund_amount?: number | null;
  [key: string]: unknown;
}

interface OrderListItem {
  id: string;
  created_at: string | null;
  status: string | null;
  pcb_spec?: Record<string, unknown>;
  cal_values?: { leadTimeDays?: number; totalPrice?: number };
  admin_orders?: AdminOrderInfo[] | AdminOrderInfo;
}

type SortField = 'created_at' | 'status' | 'admin_price' | 'lead_time';
type SortOrder = 'asc' | 'desc';

const ORDER_STATUS_MAP: Record<string, { text: string; style: string; description: string }> = {
  'created': { text: "Created", style: "bg-blue-100 text-blue-800 border-blue-200", description: "Quote request submitted" },
  'pending': { text: "Pending", style: "bg-yellow-100 text-yellow-800 border-yellow-200", description: "Awaiting review" },
  'quoted': { text: "Quoted", style: "bg-green-100 text-green-800 border-green-200", description: "Quote provided" },
  'reviewed': { text: "Reviewed", style: "bg-green-100 text-green-800 border-green-200", description: "Admin reviewed and approved" },
  'confirmed': { text: "Confirmed", style: "bg-indigo-100 text-indigo-800 border-indigo-200", description: "Order confirmed" },
  'paid': { text: "Paid", style: "bg-emerald-100 text-emerald-800 border-emerald-200", description: "Payment completed, ready for production" },
  'in_production': { text: "In Production", style: "bg-blue-100 text-blue-800 border-blue-200", description: "PCBs being manufactured" },
  'shipped': { text: "Shipped", style: "bg-cyan-100 text-cyan-800 border-cyan-200", description: "Order shipped" },
  'delivered': { text: "Delivered", style: "bg-emerald-100 text-emerald-800 border-emerald-200", description: "Order delivered" },
  'completed': { text: "Completed", style: "bg-green-100 text-green-800 border-green-200", description: "Order completed" },
  'cancelled': { text: "Cancelled", style: "bg-red-100 text-red-800 border-red-200", description: "Order cancelled" },
  'refunded': { text: "Refunded", style: "bg-purple-100 text-purple-800 border-purple-200", description: "Order refunded" },
};

export default function OrdersPageClient(): React.ReactElement {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loadingOrders, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // 排序状态
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUserStore(state => state.user);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const orderType = searchParams.get('type');

  const fetchOrders = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pcb_quotes')
        .select(`
          id,
          created_at,
          status,
          pcb_spec,
          cal_values,
          admin_orders (
            id,
            status,
            admin_price,
            currency,
            payment_status,
            refund_status,
            requested_refund_amount,
            approved_refund_amount
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setOrders(data as OrderListItem[] || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user?.id]);

  // 检查是否从支付页面返回，如果是则定期刷新状态
  useEffect(() => {
    const fromPayment = searchParams.get('from_payment');
    
    if (fromPayment === 'true') {
      // 从URL中移除参数
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('from_payment');
      router.replace(`/profile/orders?${newParams.toString()}`);
      
      // 设置定期刷新，直到状态更新
      const intervalId = setInterval(() => {
        fetchOrders();
      }, 3000); // 每3秒刷新一次
      
      // 30秒后停止自动刷新
      setTimeout(() => {
        clearInterval(intervalId);
      }, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [searchParams, router]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // 重置到第一页
    const params = new URLSearchParams(window.location.search);
    if (value === 'all') {
      params.delete('status');
    } else {
      params.set('status', value);
    }
    router.push(`/profile/orders?${params.toString()}`);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1); // 重置到第一页
  };

  // 获取排序后的订单
  const getSortedOrders = (ordersToSort: OrderListItem[]) => {
    return [...ordersToSort].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'created_at':
          aValue = new Date(a.created_at || 0).getTime();
          bValue = new Date(b.created_at || 0).getTime();
          break;
        case 'status':
          const aAdminOrder = Array.isArray(a.admin_orders) ? a.admin_orders[0] : a.admin_orders;
          const bAdminOrder = Array.isArray(b.admin_orders) ? b.admin_orders[0] : b.admin_orders;
          aValue = aAdminOrder?.status || a.status || '';
          bValue = bAdminOrder?.status || b.status || '';
          break;
        case 'admin_price':
          const aAdmin = Array.isArray(a.admin_orders) ? a.admin_orders[0] : a.admin_orders;
          const bAdmin = Array.isArray(b.admin_orders) ? b.admin_orders[0] : b.admin_orders;
          aValue = aAdmin?.admin_price || 0;
          bValue = bAdmin?.admin_price || 0;
          break;
        case 'lead_time':
          aValue = a.cal_values?.leadTimeDays || 0;
          bValue = b.cal_values?.leadTimeDays || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (orderType === 'pending-payment') {
      const canPay = canOrderBePaid(order as OrderWithAdminOrder);
      return matchesSearch && canPay;
    }

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesStatus && matchesSearch;
  });

  // 应用排序
  const sortedOrders = getSortedOrders(filteredOrders);

  // 应用分页
  const totalItems = sortedOrders.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedOrders = sortedOrders.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize));
    setCurrentPage(1);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortOrder === 'asc' ? 
      <ChevronUp className="h-4 w-4 text-blue-600" /> : 
      <ChevronDown className="h-4 w-4 text-blue-600" />;
  };

  const getOrderSummary = (order: OrderListItem) => {
    const pcbSpec = order.pcb_spec as Record<string, unknown> & { thickness?: number, surfaceFinish?: string, delivery?: string };
    const singleDimensions = pcbSpec?.singleDimensions as Record<string, unknown> & { length?: number, width?: number } | undefined;
    
    return {
      layers: String(pcbSpec?.layers || '-'),
      quantity: String(pcbSpec?.singleCount || '-'),
      size: singleDimensions?.length && singleDimensions?.width ? 
        `${singleDimensions.length}×${singleDimensions.width}mm` : '-',
      delivery: pcbSpec?.delivery === 'urgent' ? 'Urgent' : 'Standard',
      thickness: pcbSpec?.thickness ? `${pcbSpec.thickness}mm` : '-',
      surfaceFinish: String(pcbSpec?.surfaceFinish || '-'),
    };
  };

  const getAdminOrderInfo = (order: OrderListItem) => {
    if (!order.admin_orders) return null;
    const adminOrder = Array.isArray(order.admin_orders) 
      ? order.admin_orders[0] 
      : order.admin_orders;
    return adminOrder || null;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDateShort = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderOrderPrice = (order: OrderListItem) => {
    const adminOrder = getAdminOrderInfo(order);
    if (adminOrder && adminOrder.admin_price != null) {
      return (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800">
            {toUSD(adminOrder.admin_price)}
          </span>
          <span className="text-xs text-gray-500">Quoted Price</span>
        </div>
      );
    }

    if (order.cal_values && order.cal_values.totalPrice != null) {
      return (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800">
            ~{toUSD(order.cal_values.totalPrice)}
          </span>
          <span className="text-xs text-gray-500">Estimated</span>
        </div>
      );
    }
    return <span className="text-gray-500">-</span>;
  };

  const renderOrderStatus = (order: OrderListItem) => {
    const adminOrder = getAdminOrderInfo(order);
    
    // 优先使用同步后的用户订单状态，如果没有则使用管理员订单状态
    let displayStatus = order.status || 'pending';
    
    // 如果退款已完成，显示为退款状态
    if (adminOrder?.refund_status === 'processed') {
      displayStatus = 'refunded';
    }
    // 如果管理员订单存在且已付款，确保显示正确的状态
    else if (adminOrder?.payment_status === 'paid' && displayStatus === 'pending') {
      displayStatus = 'paid';
    }
    
    const statusInfo = ORDER_STATUS_MAP[displayStatus] || ORDER_STATUS_MAP.pending;
    
    return (
      <div className="flex flex-col gap-1">
        <Badge 
          variant="outline" 
          className={`${statusInfo.style} border font-medium`}
          title={statusInfo.description}
        >
          {statusInfo.text}
        </Badge>
        {adminOrder?.payment_status === 'paid' && displayStatus !== 'refunded' && displayStatus !== 'paid' && (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs">
            Paid
          </Badge>
        )}
        {/* 只在非已退款状态下显示退款徽章 */}
        {displayStatus !== 'refunded' && (
          <RefundStatusBadge 
            refundStatus={adminOrder?.refund_status || null}
            paymentStatus={adminOrder?.payment_status || undefined}
            requestedAmount={adminOrder?.requested_refund_amount || undefined}
            approvedAmount={adminOrder?.approved_refund_amount || undefined}
            showDetails={false}
          />
        )}
      </div>
    );
  };

  const renderPaymentButton = (order: OrderListItem, isMobile = false) => {
    const canPay = canOrderBePaid(order as OrderWithAdminOrder);
    const paymentAmount = getOrderPaymentAmount(order as OrderWithAdminOrder);
    
    if (!canPay) return null;
    
    return (
      <Button
        size="sm"
        onClick={() => router.push(`/payment/${order.id}`)}
        className={`bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 whitespace-nowrap min-w-0 ${
          isMobile ? 'px-3' : 'px-2'
        }`}
        title={`Pay ${toUSD(paymentAmount)}`}
      >
        <CreditCard className="h-3 w-3 flex-shrink-0" />
        {isMobile ? (
          <>
            <span className="hidden xs:inline">Pay </span>
            <span className="truncate">{toUSD(paymentAmount)}</span>
          </>
        ) : (
          <>
            <span className="hidden xl:inline">Pay </span>
            <span className="text-xs truncate">{toUSD(paymentAmount)}</span>
          </>
        )}
      </Button>
    );
  };

  if (loadingOrders) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
            {orderType === 'pending-payment' ? 'Pending Payment Orders' : 'My Orders'}
          </h1>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">
            {orderType === 'pending-payment' 
              ? 'Orders awaiting payment' 
              : 'Track your PCB orders and quotes'
            }
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            onClick={() => router.push('/quote2')}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Quote</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by Order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-xs"
          />
        </div>
        {orderType !== 'pending-payment' && (
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="quoted">Quoted</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
            </SelectContent>
          </Select>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Per page:</span>
          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-gray-600">
          Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} orders
        </div>
      </div>

      {/* Orders Table - Large Desktop */}
      <div className="hidden xl:block bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[110px]">Order ID</TableHead>
              <TableHead 
                className="w-[140px] cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">Created Date</span>
                  {renderSortIcon('created_at')}
                </div>
              </TableHead>
              <TableHead className="min-w-[260px]">Details</TableHead>
              <TableHead 
                className="w-[100px] cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('admin_price')}
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">Price</span>
                  {renderSortIcon('admin_price')}
                </div>
              </TableHead>
              <TableHead 
                className="w-[90px] cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('lead_time')}
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">Lead Time</span>
                  {renderSortIcon('lead_time')}
                </div>
              </TableHead>
              <TableHead 
                className="w-[100px] cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">Status</span>
                  {renderSortIcon('status')}
                </div>
              </TableHead>
              <TableHead className="text-right w-[200px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-gray-500">
                  {orderType === 'pending-payment' 
                    ? 'No orders pending payment' 
                    : 'No orders found'
                  }
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => {
                const summary = getOrderSummary(order);
                return (
                  <TableRow key={order.id} className="hover:bg-gray-50 border-b">
                    <TableCell>
                      <span className="font-mono text-sm font-semibold text-blue-600 hover:underline cursor-pointer" onClick={() => router.push(`/profile/orders/${order.id}`)}>
                        #{order.id.slice(0, 8)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <div className="text-sm text-gray-900">
                          {formatDateShort(order.created_at)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.created_at && new Date(order.created_at).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            hour12: false 
                          })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <div><span className="font-medium text-gray-600">Layers:</span> {summary.layers}</div>
                        <div><span className="font-medium text-gray-600">Qty:</span> {summary.quantity}</div>
                        <div><span className="font-medium text-gray-600">Size:</span> {summary.size}</div>
                        <div><span className="font-medium text-gray-600">Delivery:</span> {summary.delivery}</div>
                        <div><span className="font-medium text-gray-600">Thickness:</span> {summary.thickness}</div>
                        <div><span className="font-medium text-gray-600">Finish:</span> {summary.surfaceFinish}</div>
                      </div>
                    </TableCell>
                    <TableCell>{renderOrderPrice(order)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {order.cal_values?.leadTimeDays 
                          ? `${order.cal_values.leadTimeDays} days` 
                          : '-'}
                      </div>
                    </TableCell>
                    <TableCell>{renderOrderStatus(order)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/profile/orders/${order.id}`)}
                          className="flex items-center gap-1 px-2 min-w-0"
                          title="View Order Details"
                        >
                          <Eye className="h-3 w-3 flex-shrink-0" />
                          <span className="hidden 2xl:inline whitespace-nowrap">View</span>
                        </Button>
                        {renderPaymentButton(order)}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          </Table>
        </div>
      </div>

      {/* Orders Table - Medium Desktop */}
      <div className="hidden lg:block xl:hidden bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[750px]">
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[100px]">Order ID</TableHead>
                <TableHead 
                  className="w-[110px] cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-xs">Date</span>
                    {renderSortIcon('created_at')}
                  </div>
                </TableHead>
                <TableHead className="min-w-[160px]">Summary</TableHead>
                <TableHead 
                  className="w-[80px] cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('admin_price')}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-xs">Price</span>
                    {renderSortIcon('admin_price')}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[80px] cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-xs">Status</span>
                    {renderSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead className="text-right w-[160px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-gray-500">
                    {orderType === 'pending-payment' 
                      ? 'No orders pending payment' 
                      : 'No orders found'
                    }
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => {
                  const summary = getOrderSummary(order);
                  return (
                    <TableRow key={order.id} className="hover:bg-gray-50 border-b">
                      <TableCell>
                        <span className="font-mono text-sm font-semibold text-blue-600 hover:underline cursor-pointer" onClick={() => router.push(`/profile/orders/${order.id}`)}>
                          #{order.id.slice(0, 8)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          {formatDateShort(order.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div>{summary.layers} layers, Qty: {summary.quantity}</div>
                          <div className="text-gray-600">{summary.size} • {summary.delivery}</div>
                        </div>
                      </TableCell>
                      <TableCell>{renderOrderPrice(order)}</TableCell>
                      <TableCell>{renderOrderStatus(order)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/profile/orders/${order.id}`)}
                            className="flex items-center gap-1 px-2 min-w-0"
                            title="View Order Details"
                          >
                            <Eye className="h-3 w-3 flex-shrink-0" />
                          </Button>
                          {renderPaymentButton(order)}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Orders Cards - Mobile/Tablet */}
      <div className="lg:hidden space-y-4">
        {paginatedOrders.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-white rounded-lg border">
            {orderType === 'pending-payment' 
              ? 'No orders pending payment' 
              : 'No orders found'
            }
          </div>
        ) : (
          paginatedOrders.map((order) => {
            const summary = getOrderSummary(order);
            return (
              <div key={order.id} className="bg-white rounded-lg border shadow-sm p-4 space-y-4">
                {/* Order Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span 
                      className="font-mono text-lg font-semibold text-blue-600 hover:underline cursor-pointer" 
                      onClick={() => router.push(`/profile/orders/${order.id}`)}
                    >
                      #{order.id.slice(0, 8)}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">{formatDate(order.created_at)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {renderOrderStatus(order)}
                    {renderOrderPrice(order)}
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium text-gray-600">Layers:</span> {summary.layers}</div>
                  <div><span className="font-medium text-gray-600">Qty:</span> {summary.quantity}</div>
                  <div><span className="font-medium text-gray-600">Size:</span> {summary.size}</div>
                  <div><span className="font-medium text-gray-600">Delivery:</span> {summary.delivery}</div>
                  <div><span className="font-medium text-gray-600">Thickness:</span> {summary.thickness}</div>
                  <div><span className="font-medium text-gray-600">Finish:</span> {summary.surfaceFinish}</div>
                </div>

                {/* Lead Time */}
                {order.cal_values?.leadTimeDays && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-600">Lead Time:</span> {order.cal_values.leadTimeDays} days
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/profile/orders/${order.id}`)}
                    className="flex items-center gap-1 flex-1"
                  >
                    <Eye className="h-3 w-3" />
                    <span className="hidden xs:inline">View Details</span>
                    <span className="xs:hidden">View</span>
                  </Button>
                  {renderPaymentButton(order, true)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            total={totalItems}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
} 