"use client";
import { useEffect, useState } from "react";
import { useUserStore } from "@/lib/userStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import OrderStepBar from "@/components/ui/OrderStepBar";
import { ORDER_STEPS } from "@/components/ui/order-steps";
import type { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { motion } from "framer-motion";
import { calcPcbPrice, calcProductionCycle, getRealDeliveryDate } from "@/lib/pcb-calc";
import { getPublicFileUrl } from "@/lib/supabase-file-url";
import DownloadButton from "../../../components/custom-ui/DownloadButton";

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

function getStatusColor(status: string) {
  switch (status) {
    case "completed": return "text-green-600 bg-green-50 border-green-200";
    case "cancelled": return "text-red-500 bg-red-50 border-red-200";
    case "pending": return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "paid": return "text-blue-700 bg-blue-50 border-blue-200";
    case "shipped": return "text-blue-700 bg-blue-50 border-blue-200";
    default: return "text-gray-500 bg-gray-50 border-gray-200";
  }
}

function renderValue(val: any) {
  if (Array.isArray(val)) return val.length ? val.join(", ") : "-";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (val === null || val === undefined || val === "") return "-";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function OrderBaseInfoCard({ order, onBack, onPay, onCancel, onAfterSale, cancelOpen, setCancelOpen, afterSaleOpen, setAfterSaleOpen, actionLoading, afterSaleReason, setAfterSaleReason, handleCancelOrder, handleAfterSale, toast }: any) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-xl font-bold tracking-wide">Order Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <span className="font-semibold text-xs text-muted-foreground">Status</span>
          <div className={`text-base font-bold ${getStatusColor(order.status)}`}>{order.status ?? "-"}</div>
        </div>
        <div>
          <span className="font-semibold text-xs text-muted-foreground">Total</span>
          <div className="text-lg font-bold text-primary">¥ {order.total?.toFixed(2) ?? "-"}</div>
        </div>
        <div>
          <span className="font-semibold text-xs text-muted-foreground">Created At</span>
          <div>{order.created_at ? new Date(order.created_at as string).toLocaleString() : "-"}</div>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <Button variant="outline" onClick={onBack}>Back</Button>
          {order.status === "pending" && (
            <Button variant="default" onClick={onPay}>Pay Now</Button>
          )}
          {order.status === "pending" && (
            <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
              <Button variant="destructive" onClick={() => setCancelOpen(true)} disabled={actionLoading}>Cancel Order</Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel Order</DialogTitle>
                  <DialogDescription>Are you sure you want to cancel this order?</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={actionLoading}>Close</Button>
                  <Button variant="destructive" onClick={handleCancelOrder} disabled={actionLoading}>{actionLoading ? "Cancelling..." : "Confirm Cancel"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {order.status === "completed" && (
            <Dialog open={afterSaleOpen} onOpenChange={setAfterSaleOpen}>
              <Button variant="secondary" onClick={() => setAfterSaleOpen(true)} disabled={actionLoading}>After-sale</Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>After-sale Request</DialogTitle>
                  <DialogDescription>Please describe your after-sale issue.</DialogDescription>
                </DialogHeader>
                <textarea className="w-full border rounded p-2 mt-2 text-sm min-h-[80px]" value={afterSaleReason} onChange={e => setAfterSaleReason(e.target.value)} placeholder="Describe your issue..." disabled={actionLoading} />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAfterSaleOpen(false)} disabled={actionLoading}>Close</Button>
                  <Button variant="default" onClick={handleAfterSale} disabled={actionLoading || !afterSaleReason.trim()}>{actionLoading ? "Submitting..." : "Submit"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function OrderAddressCard({ address }: { address: Database["public"]["Tables"]["addresses"]["Row"] | null }) {
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

function OrderShippingCard({ order }: { order: Database["public"]["Tables"]["orders"]["Row"] }) {
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

function OrderCustomsCard({ customs }: { customs: Database["public"]["Tables"]["customs_declarations"]["Row"] | null }) {
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
          <div className="text-base font-semibold text-gray-800 break-all">{customs?.declared_value != null ? `¥ ${customs?.declared_value}` : "-"}</div>
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

function OrderPcbSpecCard({ pcb_spec, gerber_file_url, order }: { pcb_spec: any, gerber_file_url?: string | null, order: any }) {
  if (!pcb_spec) return null;
  const allKeys = FIELD_GROUPS.flatMap(g => g.fields.map(f => f.key));
  const others = Object.entries(pcb_spec).filter(([k]) => !allKeys.includes(k));
  let gerberName = "";
  let realGerberUrl = gerber_file_url ? getPublicFileUrl(gerber_file_url) : null;
  if (pcb_spec.gerber && typeof pcb_spec.gerber === "object" && pcb_spec.gerber.name) {
    gerberName = pcb_spec.gerber.name;
  } else if (gerber_file_url) {
    const parts = gerber_file_url.split("/");
    gerberName = parts[parts.length - 1];
  }
  const shipmentType = pcb_spec.shipmentType;
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
                  <div className="text-base font-semibold text-gray-800 break-all">{pcb_spec.singleLength} × {pcb_spec.singleWidth} <span className="text-xs text-muted-foreground">cm</span></div>
                </div>
              );
            }
            if (f.key === "singleCount") {
              return (
                <div key={f.key}>
                  <span className="text-xs text-muted-foreground font-semibold uppercase">{getCountLabel(shipmentType)}</span>
                  <div className="text-base font-semibold text-gray-800 break-all">{pcb_spec.singleCount} <span className="text-xs text-muted-foreground">{getCountUnit(shipmentType)}</span></div>
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
              <div key={k}>
                <span className="text-xs text-muted-foreground font-semibold uppercase">{k}</span>
                <div className="text-base font-semibold text-gray-800 break-all">{renderValue(v)}</div>
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
              <DownloadButton filePath={gerber_file_url ?? ""} bucket="next-pcb" className="ml-2">Download</DownloadButton>
            </>
          )}
        </div>
        {/* PCB Note展示区块，最底部 */}
        <hr className="my-4 border-blue-100" />
        {order.pcb_note && (
          <div className="mt-4">
            <span className="text-sm font-semibold text-blue-700">PCB Note</span>
            <div className="mt-1 text-base font-medium text-gray-800 bg-blue-50 border border-blue-100 rounded px-3 py-2">{order.pcb_note}</div>
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

function OrderNoteCard({ order }: { order: Database["public"]["Tables"]["orders"]["Row"] }) {
  return (
    <div className="mb-2">
      <span className="font-semibold text-xs text-muted-foreground">User Note</span>
      <div>{order.user_note ?? "-"}</div>
      <span className="font-semibold text-xs text-muted-foreground mt-2 block">Admin Note</span>
      <div>{order.admin_note ?? "-"}</div>
    </div>
  );
}

function OrderSummaryCard({ order, onPay, onCancel, onAfterSale, loading, status, onBack }: any) {
  return (
    <Card className="sticky top-24 shadow-xl border-blue-200 bg-gradient-to-br from-blue-100/80 via-white to-blue-50/80">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-xl font-bold text-blue-800">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">PCB Price</span>
            <span className="text-lg font-bold text-blue-700">¥ {order.pcb_price?.toFixed(2) ?? '-'}</span>
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
            <span className="text-lg font-bold text-blue-700">¥ {order.shipping_cost?.toFixed(2) ?? '-'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Customs Fee</span>
            <span className="text-base font-semibold text-blue-700">¥ {order.customs_fee?.toFixed(2) ?? '-'}</span>
          </div>
          <div className="pt-3 border-t">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-blue-900">Total</span>
              <span className="text-2xl font-extrabold text-blue-700">¥ {order.total?.toFixed(2) ?? '-'}</span>
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

export default function OrderDetailClient({ user, order }: { user: any, order: Database["public"]["Tables"]["orders"]["Row"] }) {
  const setUser = useUserStore(state => state.setUser);
  const router = useRouter();
  const { toast } = useToast();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [afterSaleOpen, setAfterSaleOpen] = useState(false);
  const [afterSaleReason, setAfterSaleReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [address, setAddress] = useState<Database["public"]["Tables"]["addresses"]["Row"] | null>(null);
  const [customs, setCustoms] = useState<Database["public"]["Tables"]["customs_declarations"]["Row"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) setUser(user);
  }, [user, setUser]);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
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
      setLoading(false);
    }
    fetchDetails();
  }, [order.address_id, order.customs_id]);

  if (!order) return <div className="flex justify-center items-center min-h-[60vh] text-muted-foreground">No order found.</div>;
  if (loading) return <div className="flex justify-center items-center min-h-[60vh] text-muted-foreground">Loading...</div>;

  // 取消订单
  async function handleCancelOrder() {
    setActionLoading(true);
    const supabase = createClientComponentClient<Database>();
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    setActionLoading(false);
    setCancelOpen(false);
    toast({ title: "Order cancelled" });
    router.push("/quote/orders"); // 取消后跳转订单列表
  }
  // 申请售后
  async function handleAfterSale() {
    setActionLoading(true);
    setTimeout(() => {
      setActionLoading(false);
      setAfterSaleOpen(false);
      toast({ title: "After-sale request submitted" });
      setAfterSaleReason("");
    }, 1000);
  }

  // 费用明细
  const pcbSpec = order.pcb_spec || {};
  const shippingCost = order.shipping_cost || 0;
  const customsFee = order.customs_fee || 0;

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
            <OrderPcbSpecCard pcb_spec={pcbSpec} gerber_file_url={order.gerber_file_url} order={order} />
            <OrderAddressCard address={address} />
            <OrderCustomsCard customs={customs} />
            <OrderShippingCard order={order} />
        
          </div>
          {/* 右侧订单摘要区 */}
          <div className="col-span-12 lg:col-span-4">
            <OrderSummaryCard
              order={order}
              onPay={() => toast({ title: "TODO: Payment integration" })}
              onCancel={handleCancelOrder}
              onAfterSale={handleAfterSale}
              loading={actionLoading}
              status={order.status}
              onBack={() => router.back()}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 