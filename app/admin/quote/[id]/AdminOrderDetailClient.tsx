"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import OrderStepBar from "@/components/ui/OrderStepBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPublicFileUrl } from "@/lib/supabase-file-url";
import DownloadButton from "../../../components/custom-ui/DownloadButton";
import { calcPcbPriceV2 } from "@/lib/pcb-calc-v2";
import { supabase } from "@/lib/supabaseClient";
import { toUSD } from "@/lib/utils";
import { PcbQuoteForm } from "@/types/pcbQuoteForm";
import type { Database } from "@/types/supabase";
import { OrderStatus } from '@/types/form';

// 字段分组与友好名映射
const FIELD_GROUPS: { title: string; fields: { key: keyof PcbQuoteForm; label: string }[] }[] = [
  {
    title: "Base Info",
    fields: [
      { key: "pcbType", label: "Type" },
      { key: "layers", label: "Layers" },
      { key: "thickness", label: "Thickness" },
      { key: "hdi", label: "HDI" },
      { key: "tg", label: "TG" },
      { key: "panelSet", label: "Panel Count" },
      { key: "singleDimensions", label: "Single Size (cm)" },
      { key: "singleCount", label: "Single Count" },
      { key: "shipmentType", label: "Shipment" },
      { key: "border", label: "Border" },
      { key: "gerber", label: "Gerber" }
    ],
  },
  {
    title: "Process",
    fields: [
      { key: "outerCopperWeight", label: "Outer Copper" },
      { key: "innerCopperWeight", label: "Inner Copper" },
      { key: "surfaceFinish", label: "Surface" },
      { key: "minTrace", label: "Min Trace" },
      { key: "minHole", label: "Min Hole" },
      { key: "solderMask", label: "Solder Mask" },
      { key: "silkscreen", label: "Silkscreen" },
      { key: "goldFingers", label: "Gold Fingers" },
      { key: "castellated", label: "Castellated" },
      { key: "impedance", label: "Impedance" },
      { key: "edgePlating", label: "Edge Plating" },
      { key: "halfHole", label: "Half Hole" },
      { key: "edgeCover", label: "Edge Cover" },
      { key: "maskCover", label: "Mask Cover" },
      { key: "testMethod", label: "Test Method" },
    ],
  },
  {
    title: "Service",
    fields: [
      { key: "testMethod", label: "Test Method" },
      { key: "prodCap", label: "Production Cap." },
      { key: "productReport", label: "Product Report" },
      { key: "rejectBoard", label: "Reject Board" },
      { key: "yyPin", label: "YY Pin" },
      { key: "customerCode", label: "Customer Code" },
      { key: "payMethod", label: "Pay Method" },
      { key: "qualityAttach", label: "Quality Attach" },
      { key: "smt", label: "SMT" },
    ],
  },
];

// 订单状态文本映射
const orderStatusText: Record<OrderStatus, string> = {
  [OrderStatus.Draft]: '草稿',
  [OrderStatus.Created]: '待审核',
  [OrderStatus.Reviewed]: '已审核',
  [OrderStatus.Unpaid]: '待支付',
  [OrderStatus.PaymentPending]: '支付中',
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
  [OrderStatus.Draft]: 'bg-gray-100 text-gray-600',
  [OrderStatus.Created]: 'bg-yellow-100 text-yellow-600',
  [OrderStatus.Reviewed]: 'bg-blue-100 text-blue-600',
  [OrderStatus.Unpaid]: 'bg-orange-100 text-orange-600',
  [OrderStatus.PaymentPending]: 'bg-purple-100 text-purple-600',
  [OrderStatus.Paid]: 'bg-green-100 text-green-600',
  [OrderStatus.InProduction]: 'bg-indigo-100 text-indigo-600',
  [OrderStatus.QualityCheck]: 'bg-pink-100 text-pink-600',
  [OrderStatus.ReadyForShipment]: 'bg-teal-100 text-teal-600',
  [OrderStatus.Shipped]: 'bg-cyan-100 text-cyan-600',
  [OrderStatus.Delivered]: 'bg-emerald-100 text-emerald-600',
  [OrderStatus.Completed]: 'bg-green-100 text-green-600',
  [OrderStatus.Cancelled]: 'bg-red-100 text-red-600',
  [OrderStatus.OnHold]: 'bg-gray-100 text-gray-600',
  [OrderStatus.Rejected]: 'bg-red-100 text-red-600',
  [OrderStatus.Refunded]: 'bg-gray-100 text-gray-600'
};

// 可用的状态转换
const availableStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.Draft]: [OrderStatus.Created],
  [OrderStatus.Created]: [OrderStatus.Reviewed, OrderStatus.Rejected],
  [OrderStatus.Reviewed]: [OrderStatus.Unpaid],
  [OrderStatus.Unpaid]: [OrderStatus.PaymentPending, OrderStatus.Cancelled],
  [OrderStatus.PaymentPending]: [OrderStatus.Paid, OrderStatus.Cancelled],
  [OrderStatus.Paid]: [OrderStatus.InProduction],
  [OrderStatus.InProduction]: [OrderStatus.QualityCheck],
  [OrderStatus.QualityCheck]: [OrderStatus.ReadyForShipment, OrderStatus.OnHold],
  [OrderStatus.ReadyForShipment]: [OrderStatus.Shipped],
  [OrderStatus.Shipped]: [OrderStatus.Delivered],
  [OrderStatus.Delivered]: [OrderStatus.Completed],
  [OrderStatus.Completed]: [],
  [OrderStatus.Cancelled]: [],
  [OrderStatus.OnHold]: [OrderStatus.InProduction, OrderStatus.Cancelled],
  [OrderStatus.Rejected]: [],
  [OrderStatus.Refunded]: []
};

function renderValue(val: unknown) {
  if (Array.isArray(val)) return val.length ? val.join(", ") : "-";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (val === null || val === undefined || val === "") return "-";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function OrderAddressCard({ address }: { address: Record<string, unknown> | null }) {
  if (!address) {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-blue-700">Shipping Address</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-base text-gray-400">No shipping address provided</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold text-blue-700">Shipping Address</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 p-4 pt-0">
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">Contact Name</span>
          <div className="text-base font-semibold text-gray-800 break-all">{(address?.contact_name as string) ?? "-"}</div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">Phone</span>
          <div className="text-base font-semibold text-gray-800 break-all">{(address?.phone as string) ?? "-"}</div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">Country</span>
          <div className="text-base font-semibold text-gray-800 break-all">
            {(address?.country_name as string) || (address?.country as string) || "-"}
          </div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">State</span>
          <div className="text-base font-semibold text-gray-800 break-all">
            {(address?.state_name as string) || (address?.state as string) || "-"}
          </div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">City</span>
          <div className="text-base font-semibold text-gray-800 break-all">
            {(address?.city_name as string) || (address?.city as string) || "-"}
          </div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">Zip Code</span>
          <div className="text-base font-semibold text-gray-800 break-all">{(address?.zip_code as string) ?? "-"}</div>
        </div>
        <div className="col-span-2">
          <span className="text-xs text-muted-foreground font-semibold uppercase">Address</span>
          <div className="text-base font-semibold text-gray-800 break-all">{(address?.address as string) ?? "-"}</div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">Courier</span>
          <div className="text-base font-semibold text-gray-800 break-all">{(address?.courier as string) ?? "-"}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderShippingCard({ order }: { order: Database["public"]["Tables"]["orders"]["Row"] }) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold text-blue-700">Shipping Info</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 p-4 pt-0">
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">Status</span>
          <div className="text-base font-semibold text-gray-800 break-all">
            {orderStatusText[order.status as OrderStatus] || order.status}
          </div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">Estimated Delivery</span>
          <div className="text-base font-semibold text-gray-800 break-all">
            {order.estimated_delivery_date 
              ? new Date(order.estimated_delivery_date).toLocaleDateString() 
              : "-"
            }
          </div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">Production Days</span>
          <div className="text-base font-semibold text-gray-800 break-all">
            {order.production_days ? `${order.production_days} days` : "-"}
          </div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">Shipping Cost</span>
          <div className="text-base font-semibold text-gray-800 break-all">
            {order.shipping_cost ? toUSD(order.shipping_cost) : "-"}
          </div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">Payment Status</span>
          <div className="text-base font-semibold text-gray-800 break-all">{order.payment_status ?? "pending"}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderPcbSpecCard({ 
  pcb_spec, 
  gerber_file_url, 
  order 
}: { 
  pcb_spec: Record<string, unknown> | null, 
  gerber_file_url?: string | null, 
  order: Database["public"]["Tables"]["orders"]["Row"] 
}) {
  if (!pcb_spec || typeof pcb_spec !== 'object') {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-blue-700">PCB Specifications</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-base text-gray-400">No PCB specifications available</div>
        </CardContent>
      </Card>
    );
  }

  let realGerberUrl = "";
  let gerberName = "";
  
  if (gerber_file_url) {
    realGerberUrl = getPublicFileUrl(gerber_file_url);
    gerberName = gerber_file_url.split("/").pop() || "Gerber File";
  } else if (pcb_spec.gerber && typeof pcb_spec.gerber === "string") {
    realGerberUrl = getPublicFileUrl(pcb_spec.gerber);
    gerberName = pcb_spec.gerber.split("/").pop() || "Gerber File";
  }

  return (
    <Card className="mb-4 shadow-lg border-blue-200 bg-gradient-to-br from-blue-50/50 via-white to-gray-50/50">
      <CardHeader className="border-b border-blue-100 pb-4">
        <CardTitle className="text-xl font-bold text-blue-800">PCB Specifications</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* 按组显示规格 */}
        {FIELD_GROUPS.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-6">
            <h3 className="text-lg font-semibold text-blue-700 mb-3 border-b border-blue-100 pb-1">
              {group.title}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {group.fields.map((field) => {
                const value = pcb_spec[field.key];
                if (value === undefined || value === null || value === "") return null;
                
                return (
                  <div key={field.key} className="space-y-1">
                    <span className="text-xs text-muted-foreground font-semibold uppercase">
                      {field.label}
                    </span>
                    <div className="text-base font-semibold text-gray-800 break-all">
                      {renderValue(value)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* 其他非结构化字段 */}
        {Object.keys(pcb_spec).some(key => 
          !FIELD_GROUPS.some(group => 
            group.fields.some(field => field.key === key)
          )
        ) && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-700 mb-3 border-b border-blue-100 pb-1">
              Other Specifications
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(pcb_spec).map(([k, v]) => {
                // 跳过已在组中显示的字段
                if (FIELD_GROUPS.some(group => 
                  group.fields.some(field => field.key === k)
                )) return null;
                
                if (v === undefined || v === null || v === "") return null;
                
                return (
                  <div key={k} className="space-y-1">
                    <span className="text-xs text-muted-foreground font-semibold uppercase">
                      {String(k)}
                    </span>
                    <div className="text-base font-semibold text-gray-800 break-all">
                      {renderValue(v)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Gerber文件展示区块 */}
        <hr className="my-4 border-blue-100" />
        <div className="mt-4">
          <span className="text-sm font-semibold text-blue-700">Gerber File:</span>
          {(pcb_spec.gerber || gerber_file_url) ? (
            <span className="ml-2 text-base font-semibold text-blue-700 break-all">
              {gerberName || "Gerber File"}
            </span>
          ) : (
            <span className="ml-2 text-base text-gray-400">-</span>
          )}
          {realGerberUrl && (
            <DownloadButton filePath={realGerberUrl || ""} bucket="next-pcb" className="ml-2">
              Download
            </DownloadButton>
          )}
        </div>

        {/* User Notes展示区块 */}
        <hr className="my-4 border-blue-100" />
        <div className="mt-4">
          <span className="text-sm font-semibold text-blue-700">User Notes</span>
          {order.user_notes ? (
            <div className="mt-1 text-base font-medium text-gray-800 bg-blue-50 border border-blue-100 rounded px-3 py-2">
              {String(order.user_notes)}
            </div>
          ) : (
            <div className="mt-1 text-base text-gray-400 bg-blue-50 border border-blue-100 rounded px-3 py-2">
              -
            </div>
          )}
        </div>

        {/* Admin Notes展示区块 */}
        <hr className="my-4 border-blue-100" />
        <div className="mt-4">
          <span className="text-sm font-semibold text-blue-700">Admin Notes</span>
          {order.admin_notes ? (
            <div className="mt-1 text-base font-medium text-gray-800 bg-yellow-50 border border-yellow-100 rounded px-3 py-2">
              {String(order.admin_notes)}
            </div>
          ) : (
            <div className="mt-1 text-base text-gray-400 bg-yellow-50 border border-yellow-100 rounded px-3 py-2">
              -
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface OrderSummaryCardProps {
  order: Database["public"]["Tables"]["orders"]["Row"];
  onBack: () => void;
  onOrderUpdate: () => void;
}

function OrderSummaryCard({ order, onBack, onOrderUpdate }: OrderSummaryCardProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<OrderStatus>(order.status || "pending");
  const [isLoading, setIsLoading] = useState(false);

  function handleRecalc() {
    setIsLoading(true);
    const pcbData = order.pcb_spec as PcbQuoteForm;
    const priceResult = calcPcbPriceV2(pcbData, pcbData.singleCount || 0);
    setUpdatedPrice(priceResult.totalPrice);
    setIsLoading(false);
  }

  async function handleSave() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .update({
          pcb_price: updatedPrice,
          status: updatedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)
        .select()
        .single();

      if (error) throw error;
      toast({
        title: "Success",
        description: "Order updated successfully.",
      });
      onOrderUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="sticky top-24 shadow-xl border-blue-200 bg-gradient-to-br from-blue-100/80 via-white to-blue-50/80">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-xl font-bold text-blue-800">Admin Panel</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Order ID</span>
            <span className="text-base font-semibold text-gray-700">{order.id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Quote ID</span>
            <span className="text-base font-semibold text-gray-700">{order.quote_id || '-'}</span>
          </div>

          {/* Status Controls */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as OrderStatus)}
            >
              {Object.entries(orderStatusText).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Price Controls */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quoted Price (USD)</label>
            <Input
              type="number"
              value={updatedPrice}
              onChange={(e) => setUpdatedPrice(Number(e.target.value))}
              step="0.01"
            />
          </div>

          <div className="pt-3 border-t">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-blue-900">Total Amount</span>
              <span className="text-2xl font-extrabold text-blue-700">
                {toUSD(updatedPrice + (order.shipping_cost || 0))}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button variant="outline" onClick={onBack}>Back</Button>
            <Button variant="secondary" onClick={handleRecalc} disabled={isLoading}>
              {isLoading ? "Recalculating..." : "Recalculate Price"}
            </Button>
            <Button variant="default" onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminOrderDetailClient({ order }: { order: Database["public"]["Tables"]["orders"]["Row"] }) {
  const router = useRouter();

  if (!order) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-muted-foreground">
        No order found.
      </div>
    );
  }

  const handleOrderUpdate = () => {
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100 font-sans">
      <div className="container max-w-7xl mx-auto py-10 px-2 md:px-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-blue-800 mb-8 tracking-tight drop-shadow-sm">
          Admin Order Detail
        </h1>
        
        {/* 步骤条 */}
        <div className="mb-10">
          <OrderStepBar currentStatus={order.status || OrderStatus.Created} steps={[
            { label: "Created", key: OrderStatus.Created },
            { label: "Reviewed", key: OrderStatus.Reviewed },
            { label: "In Production", key: OrderStatus.InProduction },
            { label: "Shipped", key: OrderStatus.Shipped },
            { label: "Completed", key: OrderStatus.Completed }
          ]} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 左侧主内容区 */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <OrderPcbSpecCard 
              pcb_spec={order.pcb_spec && typeof order.pcb_spec === 'object' ? order.pcb_spec as Record<string, unknown> : null} 
              gerber_file_url={order.gerber_file_url} 
              order={order} 
            />
            <OrderAddressCard address={order.shipping_address && typeof order.shipping_address === 'object' ? order.shipping_address as Record<string, unknown> : null} />
            <OrderShippingCard order={order} />
          </div>
          
          {/* 右侧管理员面板 */}
          <div className="col-span-12 lg:col-span-4">
            <OrderSummaryCard
              order={order}
              onBack={() => router.back()}
              onOrderUpdate={handleOrderUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 