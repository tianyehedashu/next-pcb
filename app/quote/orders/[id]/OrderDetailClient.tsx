"use client";
import { useEffect, useState } from "react";
import { useUserStore } from "@/lib/userStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import OrderStepBar from "@/components/ui/OrderStepBar";
import { ORDER_STEPS } from "@/components/ui/order-steps";
import type { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { calcPcbPriceV2 } from "@/lib/pcb-calc-v2";
import { getPublicFileUrl } from "@/lib/supabase-file-url";
import DownloadButton from "../../../components/custom-ui/DownloadButton";
import { toUSD } from "@/lib/utils";
import type { UserInfo } from "@/lib/userStore";

// 字段分组与友好名映射
const FIELD_GROUPS = [
  {
    title: "Base Info",
    fields: [
      { key: "pcbType", label: "Type" },
      { key: "layers", label: "Layers" },
      { key: "thickness", label: "Thickness" },
      { key: "hdi", label: "HDI" },
      { key: "tg", label: "TG" },
      { key: "panelCount", label: "Panel Count" },
      { key: "singleLength", label: "Length (mm)" },
      { key: "singleWidth", label: "Width (mm)" },
      { key: "singleCount", label: "Single Count" },
      { key: "shipmentType", label: "Shipment" },
      { key: "border", label: "Border" },
      { key: "gerber", label: "Gerber" }
      // { key: "pcb_note", label: "PCB Note" }

    ],
  },
  {
    title: "Process",
    fields: [
      { key: "copperWeight", label: "Copper" },
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
      { key: "flyingProbe", label: "Flying Probe" },
    ],
  },
  {
    title: "Service",
    fields: [
      { key: "quantity", label: "Quantity" },
      { key: "delivery", label: "Delivery" },
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

function renderValue(val: unknown): string {
  if (Array.isArray(val)) return val.length ? val.join(", ") : "-";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (val === null || val === undefined || val === "") return "-";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

interface OrderAddressCardProps {
  address: Database["public"]["Tables"]["addresses"]["Row"] | null;
}
function OrderAddressCard({ address }: OrderAddressCardProps) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold text-blue-700">Shipping Address</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 p-4 pt-0">
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">Country</span>
          <div className="text-base font-semibold text-gray-800 break-all">{address?.country ?? "-"}</div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">State</span>
          <div className="text-base font-semibold text-gray-800 break-all">{address?.state ?? "-"}</div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">City</span>
          <div className="text-base font-semibold text-gray-800 break-all">{address?.city ?? "-"}</div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">Zip</span>
          <div className="text-base font-semibold text-gray-800 break-all">{address?.zip ?? "-"}</div>
        </div>
        <div className="col-span-2">
          <span className="text-xs text-muted-foreground font-semibold uppercase">Address</span>
          <div className="text-base font-semibold text-gray-800 break-all">{address?.address ?? "-"}</div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">Phone</span>
          <div className="text-base font-semibold text-gray-800 break-all">{address?.phone ?? "-"}</div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">Email</span>
          <div className="text-base font-semibold text-gray-800 break-all">{address?.email ?? "-"}</div>
        </div>
        {/* 地址备注单独展示，风格与PCB Note一致 */}
        <div className="col-span-2 mt-2">
          <span className="text-sm font-semibold text-blue-700">Address Note</span>
          {address?.note ? (
            <div className="mt-1 text-base font-medium text-gray-800 bg-blue-50 border border-blue-100 rounded px-3 py-2">{address.note}</div>
          ) : (
            <div className="mt-1 text-base text-gray-400 bg-blue-50 border border-blue-100 rounded px-3 py-2">-</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface OrderShippingCardProps {
  order: Database["public"]["Tables"]["orders"]["Row"];
}
function OrderShippingCard({ order }: OrderShippingCardProps) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold text-blue-700">Shipping Info</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 p-4 pt-0">
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">Carrier</span>
          <div className="text-base font-semibold text-gray-800 break-all">{order.courier ?? "-"}</div>
        </div>
        {/* tracking_no 字段如有再显示，否则注释掉 */}
        {/* <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">Tracking No.</span>
          <div className="text-base font-semibold text-gray-800 break-all">{order.tracking_no ?? "-"}</div>
        </div> */}
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">Shipped At</span>
          <div className="text-base font-semibold text-gray-800 break-all">{order.status === "shipped" || order.status === "completed" ? (order.created_at ? new Date(order.created_at).toLocaleString() : "-") : "-"}</div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">Shipping Status</span>
          <div className="text-base font-semibold text-gray-800 break-all">{order.status ?? "-"}</div>
        </div>
      </CardContent>
    </Card>
  );
}

interface OrderCustomsCardProps {
  customs: Database["public"]["Tables"]["customs_declarations"]["Row"] | null;
}
function OrderCustomsCard({ customs }: OrderCustomsCardProps) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold text-blue-700">Customs/Tax Info</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 p-4 pt-0">
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">Declaration Method</span>
          <div className="text-base font-semibold text-gray-800 break-all">{customs?.declaration_method ?? "-"}</div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">Company Name</span>
          <div className="text-base font-semibold text-gray-800 break-all">{customs?.company_name ?? "-"}</div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">Tax ID</span>
          <div className="text-base font-semibold text-gray-800 break-all">{customs?.tax_id ?? "-"}</div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">Personal ID</span>
          <div className="text-base font-semibold text-gray-800 break-all">{customs?.personal_id ?? "-"}</div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">Incoterm</span>
          <div className="text-base font-semibold text-gray-800 break-all">{customs?.incoterm ?? "-"}</div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">Purpose</span>
          <div className="text-base font-semibold text-gray-800 break-all">{customs?.purpose ?? "-"}</div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground font-semibold uppercase">Declared Value</span>
          <div className="text-base font-semibold text-gray-800 break-all">{customs?.declared_value != null ? toUSD(customs?.declared_value) : "-"}</div>
        </div>
        <div className="col-span-2">
          <span className="text-xs text-muted-foreground font-semibold uppercase">Customs Note</span>
          <div className="text-base font-semibold text-gray-800 break-all">{customs?.customs_note ?? "-"}</div>
        </div>
      </CardContent>
    </Card>
  );
}

const getSizeLabel = (shipmentType: string) => shipmentType === "single" ? "Single Size (cm)" : "Panel Size (cm)";
const getCountLabel = (shipmentType: string) => shipmentType === "single" ? "Single Count" : "Panel Count";
const getCountUnit = (shipmentType: string) => shipmentType === "single" ? "Pcs" : "Set";

interface OrderPcbSpecCardProps {
  pcb_spec: Record<string, unknown>;
  gerber_file_url?: string | null;
  order: Database["public"]["Tables"]["orders"]["Row"];
}
function OrderPcbSpecCard({ pcb_spec, gerber_file_url, order }: OrderPcbSpecCardProps) {
  if (!pcb_spec) return null;
  const allKeys = FIELD_GROUPS.flatMap(g => g.fields.map(f => f.key));
  const others = Object.entries(pcb_spec).filter(([k]) => !allKeys.includes(k));
  let gerberName = "";
  const realGerberUrl = gerber_file_url ? getPublicFileUrl(gerber_file_url) : "";
  if (
    pcb_spec.gerber &&
    typeof pcb_spec.gerber === "object" &&
    "name" in pcb_spec.gerber &&
    typeof (pcb_spec.gerber as { name?: unknown }).name === "string"
  ) {
    gerberName = (pcb_spec.gerber as { name: string }).name;
  } else if (gerber_file_url) {
    const parts = gerber_file_url.split("/");
    gerberName = parts[parts.length - 1];
  }
  const shipmentType = pcb_spec.shipmentType as string;
  return (
    <Card className="bg-white/95 border-blue-100 shadow-sm">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-xl font-bold text-blue-700">PCB参数</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* 基础参数 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {FIELD_GROUPS[0].fields.filter(f => f.key !== "gerber").map(f => {
            if (f.key === "singleLength" || f.key === "singleWidth") {
              return (
                <div key={f.key}>
                  <span className="text-xs text-muted-foreground font-semibold uppercase">{getSizeLabel(shipmentType)}</span>
                  <div className="text-base font-semibold text-gray-800 break-all">
                    {String(pcb_spec.singleLength)} × {String(pcb_spec.singleWidth)} <span className="text-xs text-muted-foreground">cm</span>
                  </div>
                </div>
              );
            }
            if (f.key === "singleCount") {
              return (
                <div key={f.key}>
                  <span className="text-xs text-muted-foreground font-semibold uppercase">{getCountLabel(shipmentType)}</span>
                  <div className="text-base font-semibold text-gray-800 break-all">
                    {String(pcb_spec.singleCount)} <span className="text-xs text-muted-foreground">{getCountUnit(shipmentType)}</span>
                  </div>
                </div>
              );
            }
            return (
              <div key={f.key}>
                <span className="text-xs text-muted-foreground font-semibold uppercase">{f.label}</span>
                <div className="text-base font-semibold text-gray-800 break-all">{renderValue(pcb_spec[f.key])}</div>
              </div>
            );
          })}
        </div>
        {/* Process */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {FIELD_GROUPS[1].fields.map(f => (
            <div key={f.key}>
              <span className="text-xs text-muted-foreground font-semibold uppercase">{f.label}</span>
              <div className="text-base font-semibold text-gray-800 break-all">{renderValue(pcb_spec[f.key])}</div>
            </div>
          ))}
        </div>
        <hr className="my-4 border-blue-100" />
        {/* Service */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {FIELD_GROUPS[2].fields.map(f => (
            <div key={f.key}>
              <span className="text-xs text-muted-foreground font-semibold uppercase">{f.label}</span>
              <div className="text-base font-semibold text-gray-800 break-all">{renderValue(pcb_spec[f.key])}</div>
            </div>
          ))}
        </div>
        {others.length > 0 && <>
          <hr className="my-4 border-blue-100" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {others.map(([k, v]) => (
              <div key={String(k)}>
                <span className="text-xs text-muted-foreground font-semibold uppercase">{String(k)}</span>
                <div className="text-base font-semibold text-gray-800 break-all">{String(v)}</div>
              </div>
            ))}
          </div>
        </>}
        {/* Gerber文件展示区块，倒数第二 */}
        <hr className="my-4 border-blue-100" />
        <div className="mt-4">
          <span className="text-sm font-semibold text-blue-700">Gerber:</span>
          {(pcb_spec.gerber || gerber_file_url) ? (
            <span className="ml-2 text-base font-semibold text-blue-700 break-all">
              {gerberName || "Gerber File"}
            </span>
          ) : (
            <span className="ml-2 text-base text-gray-400">-</span>
          )}
          {realGerberUrl && (
            <>
              <DownloadButton filePath={realGerberUrl || ""} bucket="next-pcb" className="ml-2">Download</DownloadButton>
            </>
          )}
        </div>
        {/* PCB Note展示区块，最底部 */}
        <hr className="my-4 border-blue-100" />
        {order.pcb_note && (
          <div className="mt-4">
            <span className="text-sm font-semibold text-blue-700">PCB Note</span>
            <div className="mt-1 text-base font-medium text-gray-800 bg-blue-50 border border-blue-100 rounded px-3 py-2">{String(order.pcb_note)}</div>
          </div>
        )}
        {!order.pcb_note && (
          <div className="mt-4">
            <span className="text-sm font-semibold text-blue-700">PCB Note</span>
            <div className="mt-1 text-base text-gray-400 bg-blue-50 border border-blue-100 rounded px-3 py-2">-</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface OrderSummaryCardProps {
  order: Database["public"]["Tables"]["orders"]["Row"];
  onPay: () => void;
  onCancel: () => void;
  onAfterSale: () => void;
  loading: boolean;
  status: string;
  onBack: () => void;
}
function OrderSummaryCard({ order, onPay, onCancel, onAfterSale, loading, status, onBack }: OrderSummaryCardProps) {
  // 动态计算PCB价格
  const pcbSpec = order.pcb_spec || {};
  const pcbPriceResult = calcPcbPriceV2(pcbSpec);
  return (
    <Card className="sticky top-24 shadow-xl border-blue-200 bg-gradient-to-br from-blue-100/80 via-white to-blue-50/80">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-xl font-bold text-blue-800">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">PCB Price</span>
            <span className="text-lg font-bold text-blue-700">{pcbPriceResult.total ? toUSD(pcbPriceResult.total) : '-'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Production Time</span>
            <span className="text-base font-semibold text-gray-700">{order.production_cycle != null ? `${order.production_cycle} days` : '-'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Estimated Finish</span>
            <span className="text-base font-semibold text-gray-700">{order.estimated_finish_date ? new Date(order.estimated_finish_date).toLocaleDateString() : '-'}</span>
          </div>
          <div className="flex justify-between items-center pt-3">
            <span className="text-sm text-muted-foreground">Shipping Cost</span>
            <span className="text-lg font-bold text-blue-700">{order.shipping_cost ? toUSD(order.shipping_cost) : '-'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Customs Fee</span>
            <span className="text-base font-semibold text-blue-700">{order.customs_fee ? toUSD(order.customs_fee) : '-'}</span>
          </div>
          <div className="pt-3 border-t">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-blue-900">Total</span>
              <span className="text-2xl font-extrabold text-blue-700">{order.total ? toUSD(order.total) : '-'}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button variant="outline" onClick={onBack}>Back</Button>
            {status === "confirm_pay" && (
              <Button variant="default" onClick={onPay} disabled={loading}>Pay Now</Button>
            )}
            {status != "completed" && (
              <Button variant="destructive" onClick={onCancel} disabled={loading}>Cancel Order</Button>
            )}
            {status === "completed" && (
              <Button variant="secondary" onClick={onAfterSale} disabled={loading}>After-sale</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface OrderDetailClientProps {
  user: unknown;
  order: Database["public"]["Tables"]["orders"]["Row"];
}
export default function OrderDetailClient({ user, order }: OrderDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState(false);
  const [address, setAddress] = useState<Database["public"]["Tables"]["addresses"]["Row"] | null>(null);
  const [customs, setCustoms] = useState<Database["public"]["Tables"]["customs_declarations"]["Row"] | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);

  useEffect(() => {
    if (user && typeof user === "object" && user !== null && "id" in user) {
      useUserStore.setState({ user: user as UserInfo });
    }
  }, [user]);

  useEffect(() => {
    async function fetchDetails() {
      setDetailsLoading(true);
      const supabase = createClientComponentClient<Database>();
      let addressData = null;
      let customsData = null;
      if (order.address_id) {
        const { data } = await supabase.from("addresses").select("*").eq("id", order.address_id).single();
        addressData = data;
      }
      if (order.customs_id) {
        const { data } = await supabase.from("customs_declarations").select("*").eq("id", order.customs_id).single();
        customsData = data;
      }
      setAddress(addressData);
      setCustoms(customsData);
      setDetailsLoading(false);
    }
    fetchDetails();
  }, [order.address_id, order.customs_id]);

  if (!order) return <div className="flex justify-center items-center min-h-[60vh] text-muted-foreground">No order found.</div>;
  if (detailsLoading) return <div className="flex justify-center items-center min-h-[60vh] text-muted-foreground">Loading...</div>;

  // 取消订单
  async function handleCancelOrder() {
    setActionLoading(true);
    const supabase = createClientComponentClient<Database>();
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    setActionLoading(false);
    toast({ title: "Order cancelled" });
    router.push("/quote/orders"); // 取消后跳转订单列表
  }
  // 申请售后
  async function handleAfterSale() {
    setActionLoading(true);
    setTimeout(() => {
      setActionLoading(false);
      toast({ title: "After-sale request submitted" });
    }, 1000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100 font-sans">
      <div className="container max-w-7xl mx-auto py-10 px-2 md:px-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-blue-800 mb-8 tracking-tight drop-shadow-sm">Order Detail</h1>
        {/* 步骤条 */}
        <div className="mb-10">
          <OrderStepBar currentStatus={order.status || "inquiry"} steps={ORDER_STEPS} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 左侧主内容区 */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <OrderPcbSpecCard pcb_spec={order.pcb_spec} gerber_file_url={order.gerber_file_url} order={order} />
            <OrderAddressCard address={address} />
            <OrderCustomsCard customs={customs} />
            <OrderShippingCard order={order} />
        
          </div>
          {/* 右侧订单摘要区 */}
          <div className="col-span-12 lg:col-span-4">
            <OrderSummaryCard
              order={order}
              onPay={handleAfterSale}
              onCancel={handleCancelOrder}
              onAfterSale={handleAfterSale}
              loading={actionLoading}
              status={order.status ?? ""}
              onBack={() => router.back()}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 