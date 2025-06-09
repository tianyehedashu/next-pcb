"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useUserStore } from "@/lib/userStore";
import type { Database } from "../../../types/supabase";
import { useEnsureLogin } from "@/lib/auth";
import { Sidebar } from "../../components/custom-ui/Sidebar";
import { toUSD } from "@/lib/utils";
import { OrderStatus } from '@/types/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OrderListItem {
  id: string;
  created_at: string | null;
  status: OrderStatus;
  total_amount: number | null;
}

const ORDER_STATUS_MAP: Record<OrderStatus, { text: string; style: string }> = {
  [OrderStatus.Draft]: { text: "草稿", style: "bg-gray-100 text-gray-800" },
  [OrderStatus.Created]: { text: "已创建", style: "bg-blue-100 text-blue-800" },
  [OrderStatus.Reviewed]: { text: "已审核", style: "bg-green-100 text-green-800" },
  [OrderStatus.Unpaid]: { text: "未支付", style: "bg-yellow-100 text-yellow-800" },
  [OrderStatus.PaymentPending]: { text: "支付中", style: "bg-blue-100 text-blue-800" },
  [OrderStatus.PartiallyPaid]: { text: "部分支付", style: "bg-orange-100 text-orange-800" },
  [OrderStatus.PaymentFailed]: { text: "支付失败", style: "bg-red-100 text-red-800" },
  [OrderStatus.PaymentCancelled]: { text: "支付已取消", style: "bg-gray-100 text-gray-800" },
  [OrderStatus.Paid]: { text: "已支付", style: "bg-green-100 text-green-800" },
  [OrderStatus.InProduction]: { text: "生产中", style: "bg-blue-100 text-blue-800" },
  [OrderStatus.QualityCheck]: { text: "质检中", style: "bg-purple-100 text-purple-800" },
  [OrderStatus.ReadyForShipment]: { text: "待发货", style: "bg-orange-100 text-orange-800" },
  [OrderStatus.Shipped]: { text: "已发货", style: "bg-blue-100 text-blue-800" },
  [OrderStatus.Delivered]: { text: "已送达", style: "bg-green-100 text-green-800" },
  [OrderStatus.Completed]: { text: "已完成", style: "bg-green-100 text-green-800" },
  [OrderStatus.Cancelled]: { text: "已取消", style: "bg-red-100 text-red-800" },
  [OrderStatus.OnHold]: { text: "已暂停", style: "bg-yellow-100 text-yellow-800" },
  [OrderStatus.Rejected]: { text: "已拒绝", style: "bg-red-100 text-red-800" },
  [OrderStatus.Refunded]: { text: "已退款", style: "bg-gray-100 text-gray-800" }
};

export default function OrdersPage({
  searchParams = {},
}: {
  searchParams?: { status?: string }
}): React.ReactElement {
  useEnsureLogin();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loadingOrders, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const user = useUserStore(state => state.user);
  const [statusFilter, setStatusFilter] = useState(searchParams?.status || 'all');

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('id, created_at, status, total_amount')
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

    fetchOrders();
  }, [user?.id, supabase]);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    const params = new URLSearchParams(window.location.search);
    if (value === 'all') {
      params.delete('status');
    } else {
      params.set('status', value);
    }
    router.push(`/quote/orders?${params.toString()}`);
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>我的订单</CardTitle>
              <div className="flex items-center gap-4">
                <Select
                  value={statusFilter}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    {Object.entries(ORDER_STATUS_MAP).map(([value, { text }]) => (
                      <SelectItem key={value} value={value}>
                        {text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <div className="text-center py-8">加载中...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8">暂无订单</div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/quote/orders/${order.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">订单 #{order.id}</h3>
                        <p className="text-sm text-gray-500">
                          创建时间: {order.created_at ? new Date(order.created_at).toLocaleString() : '-'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{toUSD(order.total_amount || 0)}</p>
                        <p className="text-sm text-gray-500">
                          {ORDER_STATUS_MAP[order.status]?.text || order.status}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 