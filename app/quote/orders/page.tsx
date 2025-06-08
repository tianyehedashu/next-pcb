"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useUserStore } from "@/lib/userStore";
import type { Database } from "../../../types/supabase";
import { useEnsureLogin } from "@/lib/auth";
import { Sidebar } from "../../components/custom-ui/Sidebar";
import { ArrowRight, Download, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "../../components/ui/pagination";
import { toUSD } from "@/lib/utils";
import { OrderStatus } from '@/types/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OrderListItem {
  id: string;
  created_at: string | null;
  status: string | null;
  total_amount: number | null;
  user_notes: string | null;
}

// 订单状态显示文本映射
const orderStatusText: Record<OrderStatus, string> = {
  [OrderStatus.Draft]: '草稿',
  [OrderStatus.Created]: '已创建',
  [OrderStatus.Reviewed]: '已审核',
  [OrderStatus.Unpaid]: '未支付',
  [OrderStatus.PaymentPending]: '支付中',
  [OrderStatus.PartiallyPaid]: '部分支付',
  [OrderStatus.PaymentFailed]: '支付失败',
  [OrderStatus.PaymentCancelled]: '支付已取消',
  [OrderStatus.Paid]: '已支付',
  [OrderStatus.InProduction]: '生产中',
  [OrderStatus.QualityCheck]: '质检中',
  [OrderStatus.ReadyForShipment]: '待发货',
  [OrderStatus.Shipped]: '已发货',
  [OrderStatus.Delivered]: '已送达',
  [OrderStatus.Completed]: '已完成',
  [OrderStatus.Cancelled]: '已取消',
  [OrderStatus.OnHold]: '已暂停',
  [OrderStatus.Rejected]: '已拒绝',
  [OrderStatus.Refunded]: '已退款'
};

// 订单状态样式映射
const orderStatusStyle: Record<OrderStatus, string> = {
  [OrderStatus.Draft]: 'text-gray-500',
  [OrderStatus.Created]: 'text-blue-500',
  [OrderStatus.Reviewed]: 'text-green-500',
  [OrderStatus.Unpaid]: 'text-yellow-500',
  [OrderStatus.PaymentPending]: 'text-blue-500',
  [OrderStatus.PartiallyPaid]: 'text-orange-500',
  [OrderStatus.PaymentFailed]: 'text-red-500',
  [OrderStatus.PaymentCancelled]: 'text-gray-500',
  [OrderStatus.Paid]: 'text-green-500',
  [OrderStatus.InProduction]: 'text-blue-500',
  [OrderStatus.QualityCheck]: 'text-purple-500',
  [OrderStatus.ReadyForShipment]: 'text-orange-500',
  [OrderStatus.Shipped]: 'text-blue-500',
  [OrderStatus.Delivered]: 'text-green-500',
  [OrderStatus.Completed]: 'text-green-500',
  [OrderStatus.Cancelled]: 'text-red-500',
  [OrderStatus.OnHold]: 'text-yellow-500',
  [OrderStatus.Rejected]: 'text-red-500',
  [OrderStatus.Refunded]: 'text-gray-500'
};

// 订单状态筛选选项
const orderStatusFilters = [
  { value: 'all', label: '全部状态' },
  { value: OrderStatus.Created, label: '待审核' },
  { value: OrderStatus.Reviewed, label: '已审核' },
  { value: OrderStatus.Unpaid, label: '待支付' },
  { value: OrderStatus.PaymentPending, label: '支付中' },
  { value: OrderStatus.Paid, label: '已支付' },
  { value: OrderStatus.InProduction, label: '生产中' },
  { value: OrderStatus.QualityCheck, label: '质检中' },
  { value: OrderStatus.ReadyForShipment, label: '待发货' },
  { value: OrderStatus.Shipped, label: '已发货' },
  { value: OrderStatus.Delivered, label: '已送达' },
  { value: OrderStatus.Completed, label: '已完成' },
  { value: OrderStatus.Cancelled, label: '已取消' },
  { value: OrderStatus.OnHold, label: '已暂停' },
  { value: OrderStatus.Rejected, label: '已拒绝' },
  { value: OrderStatus.Refunded, label: '已退款' }
];

export default function OrdersPage() {
  useEnsureLogin();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loadingOrders, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const user = useUserStore(state => state.user);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const pagedOrders = orders.slice((page - 1) * pageSize, page * pageSize);
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, status, total_amount, user_notes")
        .eq("user_id", user.id)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setOrders(data as OrderListItem[]);
      }
      setLoading(false);
    };
    fetchOrders();
  }, [user?.id, supabase]);

  // 统计数据
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === OrderStatus.Completed).length;
  const pendingOrders = orders.filter(o => o.status === OrderStatus.Created).length;
  const totalAmount = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  // 根据状态筛选订单
  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  // 更新状态筛选
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all') {
      newParams.delete('status');
    } else {
      newParams.set('status', value);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100/60 via-white to-blue-50/80 py-32 px-2 relative">
      {/* 顶部渐变分割线 */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-200/60 via-blue-50/0 to-blue-200/60 z-10" />
      <div className="max-w-7xl mx-auto flex gap-8 relative z-20">
        {/* Sidebar */}
        <Sidebar />
        {/* Main Content */}
        <div className="flex-1 ml-12">
          {/* 欢迎语和统计卡片区 */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-blue-800">Hi, {user?.name || user?.email || 'User'}!</h2>
                <p className="text-slate-500 mt-1">Here is a summary of your orders.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="rounded-xl shadow border-blue-100 bg-white/90">
                <CardHeader className="pb-2">
                  <span className="text-xs text-slate-400">Total Orders</span>
                  <span className="text-2xl font-bold text-blue-700 mt-1">{totalOrders}</span>
                </CardHeader>
              </Card>
              <Card className="rounded-xl shadow border-blue-100 bg-white/90">
                <CardHeader className="pb-2">
                  <span className="text-xs text-slate-400">Completed</span>
                  <span className="text-2xl font-bold text-green-600 mt-1">{completedOrders}</span>
                </CardHeader>
              </Card>
              <Card className="rounded-xl shadow border-blue-100 bg-white/90">
                <CardHeader className="pb-2">
                  <span className="text-xs text-slate-400">Pending</span>
                  <span className="text-2xl font-bold text-yellow-600 mt-1">{pendingOrders}</span>
                </CardHeader>
              </Card>
              <Card className="rounded-xl shadow border-blue-100 bg-white/90">
                <CardHeader className="pb-2">
                  <span className="text-xs text-slate-400">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-900 mt-1">{toUSD(totalAmount)}</span>
                </CardHeader>
              </Card>
            </div>
          </div>
          <Card className="shadow-2xl border-blue-100 bg-white/95 rounded-2xl">
            <CardHeader className="border-b pb-4 flex flex-row items-center gap-4 bg-gradient-to-r from-blue-50/60 to-white rounded-t-2xl">
              <CardTitle className="text-2xl font-bold text-blue-800 tracking-wide flex-1">My Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <svg className="animate-spin h-8 w-8 text-blue-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                  <span className="text-muted-foreground text-lg">Loading your orders...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <svg className="h-24 w-24 text-blue-200 mb-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="#e0e7ff" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" stroke="#6366f1" strokeWidth="2" /></svg>
                  <span className="text-blue-400 text-2xl font-semibold text-center mb-4">No orders yet</span>
                  <span className="text-slate-500 text-base text-center mb-8">You have not placed any orders yet.<br/>Start by creating a new quote!</span>
                  <Button variant="default" className="rounded-full px-8 py-3 text-lg shadow-md hover:scale-105 transition-transform" onClick={() => router.push('/quote')}>
                    New Quote
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">我的订单</h1>
                    <div className="flex items-center gap-4">
                      <Select value={statusFilter} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="选择状态" />
                        </SelectTrigger>
                        <SelectContent>
                          {orderStatusFilters.map(filter => (
                            <SelectItem key={filter.value} value={filter.value}>
                              {filter.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-50/60 to-white border-b">
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Order ID</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Date</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                          <th className="px-4 py-3 text-right font-semibold text-slate-600">Total</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Note</th>
                          <th className="px-4 py-3 text-center font-semibold text-slate-600">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order) => (
                          <tr key={order.id} className="border-b hover:bg-blue-50/60 transition-all duration-150 group align-top">
                            <td className="px-4 py-2 font-mono text-blue-700 text-xs max-w-[120px] truncate align-middle">{order.id}</td>
                            <td className="px-4 py-2 text-slate-700 align-middle">{order.created_at ? new Date(order.created_at).toLocaleString() : "-"}</td>
                            <td className="px-4 py-2 align-middle min-w-[120px]">
                              <span className="inline-flex items-center gap-2">
                                <div className={`
                                  w-2.5 h-2.5 rounded-full
                                  ${order.status === OrderStatus.Completed ? 'bg-green-500' :
                                    order.status === OrderStatus.Cancelled ? 'bg-red-400' :
                                    order.status === OrderStatus.Created ? 'bg-yellow-400' :
                                    'bg-gray-400'}
                                `} />
                                <span className={`
                                  ${order.status === OrderStatus.Completed ? 'text-green-600 font-semibold' :
                                    order.status === OrderStatus.Cancelled ? 'text-red-500 font-semibold' :
                                    order.status === OrderStatus.Created ? 'text-yellow-600 font-semibold' :
                                    'text-gray-600'}
                                `}>
                                  {orderStatusText[order.status as OrderStatus] || order.status}
                                </span>
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right align-middle">
                              <span className="text-blue-400 text-base font-semibold align-top mr-1">¥</span>
                              <span className="text-blue-900 text-lg font-bold">{order.total_amount?.toFixed(2) ?? "-"}</span>
                            </td>
                            <td className="px-4 py-2 align-middle min-w-[120px]">
                              {order.user_notes ? (
                                <Badge variant="secondary" className="max-w-[160px] truncate" title={order.user_notes}>{order.user_notes}</Badge>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-center align-middle">
                              <div className="flex items-center justify-center gap-2">
                                <Button size="sm" variant="outline" className="rounded-full px-3 shadow-sm group-hover:scale-105 transition-transform flex items-center gap-1" onClick={() => router.push(`/quote/orders/${order.id}`)}>
                                  View <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                                <Button size="sm" variant="ghost" className="rounded-full px-2" title="Download PDF" onClick={() => {/* TODO: 下载PDF功能 */}}>
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="rounded-full px-2" title="Repeat Order" onClick={() => {/* TODO: 再次下单功能 */}}>
                                  <RefreshCw className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    total={orders.length}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={setPage}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 