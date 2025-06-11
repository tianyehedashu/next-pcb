"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useUserStore } from "@/lib/userStore";
import type { Database } from "../../../types/supabase";
import { toUSD } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Package, Calendar, DollarSign, Filter, Plus, RefreshCw, Eye, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OrderListItem {
  id: string;
  created_at: string | null;
  status: string | null;
  pcb_spec?: Record<string, unknown>;
}

const ORDER_STATUS_MAP: Record<string, { text: string; style: string; description: string }> = {
  'created': { text: "Created", style: "bg-blue-100 text-blue-800 border-blue-200", description: "Quote request submitted" },
  'pending': { text: "Pending", style: "bg-yellow-100 text-yellow-800 border-yellow-200", description: "Awaiting review" },
  'reviewed': { text: "Reviewed", style: "bg-purple-100 text-purple-800 border-purple-200", description: "Quote under review" },
  'quoted': { text: "Quoted", style: "bg-green-100 text-green-800 border-green-200", description: "Quote provided" },
  'confirmed': { text: "Confirmed", style: "bg-indigo-100 text-indigo-800 border-indigo-200", description: "Order confirmed" },
  'in_production': { text: "In Production", style: "bg-blue-100 text-blue-800 border-blue-200", description: "PCBs being manufactured" },
  'shipped': { text: "Shipped", style: "bg-cyan-100 text-cyan-800 border-cyan-200", description: "Order shipped" },
  'delivered': { text: "Delivered", style: "bg-emerald-100 text-emerald-800 border-emerald-200", description: "Order delivered" },
  'completed': { text: "Completed", style: "bg-green-100 text-green-800 border-green-200", description: "Order completed" },
  'cancelled': { text: "Cancelled", style: "bg-red-100 text-red-800 border-red-200", description: "Order cancelled" },
};

export default function OrdersPage({
  searchParams = {},
}: {
  searchParams?: { status?: string }
}): React.ReactElement {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loadingOrders, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [sortColumn, setSortColumn] = useState<'created_at' | 'status' | 'id'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  // const [adminOrders, setAdminOrders] = useState<Record<string, Record<string, unknown>>>({});
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const user = useUserStore(state => state.user);
  const [statusFilter, setStatusFilter] = useState(searchParams?.status || 'all');

  const fetchOrders = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // 先获取PCB订单
      const { data: quotesData, error: quotesError } = await supabase
        .from('pcb_quotes')
        .select('id, created_at, status, pcb_spec')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (quotesError) throw quotesError;
      
      setOrders(quotesData as OrderListItem[] || []);

      // TODO: 获取管理员订单数据 - 需要更新类型定义
      // 暂时注释掉，等类型定义更新后再启用
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user?.id, supabase]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
    const params = new URLSearchParams(window.location.search);
    if (value === 'all') {
      params.delete('status');
    } else {
      params.set('status', value);
    }
    router.push(`/profile/orders?${params.toString()}`);
  };

  const handleSort = (column: 'created_at' | 'status' | 'id') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aValue: string | number = '';
    let bValue: string | number = '';
    
    switch (sortColumn) {
      case 'created_at':
        aValue = new Date(a.created_at || '').getTime();
        bValue = new Date(b.created_at || '').getTime();
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
        break;
      case 'id':
        aValue = a.id;
        bValue = b.id;
        break;
    }
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getOrderSummary = (order: OrderListItem) => {
    const pcbSpec = order.pcb_spec as Record<string, unknown> | undefined;
    const singleDimensions = pcbSpec?.singleDimensions as Record<string, unknown> | undefined;
    
    return {
      layers: String(pcbSpec?.layers || '-'),
      quantity: String(pcbSpec?.singleCount || '-'),
      size: singleDimensions?.length && singleDimensions?.width ? 
        `${singleDimensions.length}×${singleDimensions.width}cm` : '-',
      delivery: pcbSpec?.delivery === 'urgent' ? 'Urgent' : 'Standard',
      adminStatus: 'Pending',
      estimatedDelivery: '-',
      price: null
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
              <p className="text-gray-600">Track and manage your PCB orders</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-1 gap-3 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-gray-200"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[180px] bg-white border-gray-200">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(ORDER_STATUS_MAP).map(([value, { text }]) => (
                    <SelectItem key={value} value={value}>
                      {text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-white border-gray-200"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={() => router.push('/quote2')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Quote
              </Button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loadingOrders ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading orders...</p>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? "No orders match your current filters" 
                  : "You haven't placed any orders yet"}
              </p>
              <Button
                onClick={() => router.push('/quote2')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Place Your First Order
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[120px]">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('id')}
                        className="h-auto p-0 font-semibold text-gray-700 hover:text-gray-900"
                      >
                        Order ID
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('created_at')}
                        className="h-auto p-0 font-semibold text-gray-700 hover:text-gray-900"
                      >
                        Created
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('status')}
                        className="h-auto p-0 font-semibold text-gray-700 hover:text-gray-900"
                      >
                        Status
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>PCB Specs</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((order) => {
                    const statusInfo = ORDER_STATUS_MAP[order.status || 'created'];
                    const summary = getOrderSummary(order);
                    
                    return (
                      <TableRow key={order.id} className="hover:bg-gray-50">
                        <TableCell className="font-mono text-sm">
                          #{order.id.slice(-8)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">
                              {order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={`${statusInfo?.style} border text-xs font-medium`}
                            title={statusInfo?.description}
                          >
                            {statusInfo?.text || order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div>{summary.layers} layers • {summary.quantity} pcs</div>
                            <div className="text-gray-500">{summary.size}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm font-medium ${
                            summary.delivery === 'Urgent' ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {summary.delivery}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-gray-900">
                            {summary.price ? toUSD(summary.price) : 'Pending Quote'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/profile/orders/${order.id}`)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => 
                          page === 1 || 
                          page === totalPages || 
                          Math.abs(page - currentPage) <= 1
                        )
                        .map((page, index, array) => (
                          <React.Fragment key={page}>
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="px-2 text-gray-400">...</span>
                            )}
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          </React.Fragment>
                        ))
                      }
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Summary Stats */}
        {filteredOrders.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{filteredOrders.length}</div>
                  <div className="text-sm text-gray-500">Total Orders</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {toUSD(0)}
                  </div>
                  <div className="text-sm text-gray-500">Total Value</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {filteredOrders.filter(o => ['in_production', 'confirmed'].includes(o.status || '')).length}
                  </div>
                  <div className="text-sm text-gray-500">In Production</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {filteredOrders.filter(o => ['shipped', 'delivered'].includes(o.status || '')).length}
                  </div>
                  <div className="text-sm text-gray-500">Shipping</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}