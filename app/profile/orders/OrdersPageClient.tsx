"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { useUserStore } from "@/lib/userStore";
import { toUSD } from "@/lib/utils";
import { canOrderBePaid, getOrderPaymentAmount, type OrderWithAdminOrder } from "@/lib/utils/orderHelpers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Package, Plus, RefreshCw, Eye, CreditCard } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AdminOrderInfo {
  id: string;
  status: string;
  admin_price: number | null;
  currency: string;
  payment_status?: string | null;
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

const ORDER_STATUS_MAP: Record<string, { text: string; style: string; description: string }> = {
  'created': { text: "Created", style: "bg-blue-100 text-blue-800 border-blue-200", description: "Quote request submitted" },
  'pending': { text: "Pending", style: "bg-yellow-100 text-yellow-800 border-yellow-200", description: "Awaiting review" },
  'quoted': { text: "Quoted", style: "bg-green-100 text-green-800 border-green-200", description: "Quote provided" },
  'confirmed': { text: "Confirmed", style: "bg-indigo-100 text-indigo-800 border-indigo-200", description: "Order confirmed" },
  'in_production': { text: "In Production", style: "bg-blue-100 text-blue-800 border-blue-200", description: "PCBs being manufactured" },
  'shipped': { text: "Shipped", style: "bg-cyan-100 text-cyan-800 border-cyan-200", description: "Order shipped" },
  'delivered': { text: "Delivered", style: "bg-emerald-100 text-emerald-800 border-emerald-200", description: "Order delivered" },
  'completed': { text: "Completed", style: "bg-green-100 text-green-800 border-green-200", description: "Order completed" },
  'cancelled': { text: "Cancelled", style: "bg-red-100 text-red-800 border-red-200", description: "Order cancelled" },
};

export default function OrdersPageClient(): React.ReactElement {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loadingOrders, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);

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
            payment_status
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    const params = new URLSearchParams(window.location.search);
    if (value === 'all') {
      params.delete('status');
    } else {
      params.set('status', value);
    }
    router.push(`/profile/orders?${params.toString()}`);
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
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const renderOrderPrice = (order: OrderListItem) => {
    const adminOrder = getAdminOrderInfo(order);
    if (adminOrder && adminOrder.admin_price != null) {
      return (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800">
            ${toUSD(adminOrder.admin_price)}
          </span>
          <span className="text-xs text-gray-500">Quoted Price</span>
        </div>
      );
    }

    if (order.cal_values && order.cal_values.totalPrice != null) {
      return (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800">
            ~${toUSD(order.cal_values.totalPrice)}
          </span>
          <span className="text-xs text-gray-500">Estimated</span>
        </div>
      );
    }
    return <span className="text-gray-500">-</span>;
  };

  const renderOrderStatus = (order: OrderListItem) => {
    const adminOrder = getAdminOrderInfo(order);
    const status = adminOrder?.status || order.status || 'pending';
    const statusInfo = ORDER_STATUS_MAP[status] || ORDER_STATUS_MAP.pending;
    
    return (
      <Badge 
        variant="outline" 
        className={`${statusInfo.style} border font-medium`}
        title={statusInfo.description}
      >
        {statusInfo.text}
      </Badge>
    );
  };

  const renderPaymentButton = (order: OrderListItem) => {
    const canPay = canOrderBePaid(order as OrderWithAdminOrder);
    const paymentAmount = getOrderPaymentAmount(order as OrderWithAdminOrder);
    
    if (!canPay) return null;
    
    return (
      <Button
        size="sm"
        onClick={() => router.push(`/payment/${order.id}`)}
        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
      >
        <CreditCard className="h-3 w-3" />
        Pay ${toUSD(paymentAmount)}
      </Button>
    );
  };

  if (loadingOrders) {
    return (
      <div className="container mx-auto px-4 py-8">
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
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-8 w-8 text-blue-600" />
            {orderType === 'pending-payment' ? 'Pending Payment Orders' : 'My Orders'}
          </h1>
          <p className="text-gray-600 mt-1">
            {orderType === 'pending-payment' 
              ? 'Orders awaiting payment' 
              : 'Track your PCB orders and quotes'
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => router.push('/quote2')}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Quote
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search by Order ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        {orderType !== 'pending-payment' && (
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="quoted">Quoted</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[150px]">Order</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="w-[150px]">Price</TableHead>
              <TableHead className="w-[120px]">Lead Time</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="text-right w-[220px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-gray-500">
                  {orderType === 'pending-payment' 
                    ? 'No orders pending payment' 
                    : 'No orders found'
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const summary = getOrderSummary(order);
                return (
                  <TableRow key={order.id} className="hover:bg-gray-50 border-b">
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-sm font-semibold text-blue-600 hover:underline cursor-pointer" onClick={() => router.push(`/profile/orders/${order.id}`)}>
                          #{order.id.slice(0, 8)}
                        </span>
                        <span className="text-xs text-gray-500">{formatDate(order.created_at)}</span>
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
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/profile/orders/${order.id}`)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View
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
  );
} 