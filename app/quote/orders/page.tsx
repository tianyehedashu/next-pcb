"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useUserStore } from "@/lib/userStore";
import type { Database } from "../../../types/supabase";
import { useEnsureLogin } from "@/lib/auth";
import Sidebar from "../../components/custom-ui/Sidebar";
import { ArrowRight, Download, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import OrderStepBar from "@/components/ui/OrderStepBar";
import Pagination from "../../components/ui/pagination";
import { useCnyToUsdRate } from "@/lib/hooks/useCnyToUsdRate";

type Order = Database["public"]["Tables"]["orders"]["Row"];

export default function OrdersPage() {
  const { rate, loading, error } = useCnyToUsdRate();
  const toUSD = (cny: number) => cny * rate;
  const [orders, setOrders] = useState<Order[]>([]);
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const user = useUserStore(state => state.user);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const pagedOrders = orders.slice((page - 1) * pageSize, page * pageSize);

  // 动态菜单配置
  const menu = [
    { label: "My Orders", path: "/quote/orders", show: true },
    { label: "New Quote", path: "/quote", show: true },
    { label: "Profile", path: "/profile", show: true },
    // 管理员专属菜单
    { label: "Admin Panel", path: "/quote/admin/orders", show: user?.role === "admin" },
  ];

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, status, total, admin_price, user_note")
        .eq("user_id", user?.id)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });
        console.log("data", data);
      if (!error && data) {
        setOrders(data as Order[]);
      }
      setLoading(false);
     
    };
    fetchOrders();
  }, []);

  // 统计数据
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === "completed").length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const totalAmount = orders.reduce((sum, o) => sum + (o.total || 0), 0);

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
                  <span className="text-2xl font-bold text-blue-900 mt-1">$ {toUSD(totalAmount).toFixed(2)}</span>
                </CardHeader>
              </Card>
            </div>
          </div>
          <Card className="shadow-2xl border-blue-100 bg-white/95 rounded-2xl">
            <CardHeader className="border-b pb-4 flex flex-row items-center gap-4 bg-gradient-to-r from-blue-50/60 to-white rounded-t-2xl">
              <CardTitle className="text-2xl font-bold text-blue-800 tracking-wide flex-1">My Orders</CardTitle>
              
            </CardHeader>
            <CardContent>
              {loading ? (
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
                        {pagedOrders.map((order) => (
                          <tr key={order.id} className="border-b hover:bg-blue-50/60 transition-all duration-150 group align-top">
                            <td className="px-4 py-2 font-mono text-blue-700 text-xs max-w-[120px] truncate align-middle">{order.id}</td>
                            <td className="px-4 py-2 text-slate-700 align-middle">{order.created_at ? new Date(order.created_at as string).toLocaleString() : "-"}</td>
                            <td className="px-4 py-2 align-middle min-w-[120px]">
                              <span className="inline-flex items-center gap-2">
                                <span className={
                                  order.status === "completed" ? "w-2.5 h-2.5 rounded-full bg-green-500" :
                                  order.status === "cancelled" ? "w-2.5 h-2.5 rounded-full bg-red-400" :
                                  order.status === "pending" ? "w-2.5 h-2.5 rounded-full bg-yellow-400" :
                                  "w-2.5 h-2.5 rounded-full bg-blue-400"
                                } />
                                <span className={
                                  order.status === "completed" ? "text-green-600 font-semibold" :
                                  order.status === "cancelled" ? "text-red-500 font-semibold" :
                                  order.status === "pending" ? "text-yellow-600 font-semibold" :
                                  "text-blue-700 font-semibold"
                                }>
                                  {order.status ?? "-"}
                                </span>
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right align-middle">
                              <span className="text-blue-400 text-base font-semibold align-top mr-1">¥</span>
                              <span className="text-blue-900 text-lg font-bold">{order.total?.toFixed(2) ?? "-"}</span>
                            </td>
                            <td className="px-4 py-2 align-middle min-w-[120px]">
                              {order.user_note ? (
                                <Badge variant="secondary" className="max-w-[160px] truncate" title={order.user_note}>{order.user_note}</Badge>
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