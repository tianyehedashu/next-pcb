"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import OrderStepBar from "@/components/ui/OrderStepBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectItem, SelectContent, SelectTrigger } from "@/components/ui/select";
import { getPublicFileUrl } from "@/lib/supabase-file-url";
import DownloadButton from "../../../../components/custom-ui/DownloadButton";
import { useExchangeRate } from "@/lib/hooks/useExchangeRate";
import { calcPcbPriceV2 } from "@/lib/pcb-calc-v2";
import { calcProductionCycle } from "@/lib/pcb-calc";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// 字段分组与友好名映射
const FIELD_GROUPS = [
  {
    title: "基础信息",
    fields: [
      { key: "pcbType", label: "板材类型" },
      { key: "layers", label: "层数" },
      { key: "thickness", label: "板厚" },
      { key: "hdi", label: "HDI" },
      { key: "tg", label: "TG" },
      { key: "panelCount", label: "拼板数" },
      { key: "singleLength", label: "单板长 (mm)" },
      { key: "singleWidth", label: "单板宽 (mm)" },
      { key: "singleCount", label: "单板数" },
      { key: "shipmentType", label: "发货方式" },
      { key: "border", label: "板边" },
      { key: "gerber", label: "Gerber 文件" }
      // { key: "pcb_note", label: "PCB 备注" }
    ],
  },
  {
    title: "工艺参数",
    fields: [
      { key: "copperWeight", label: "铜厚" },
      { key: "surfaceFinish", label: "表面处理" },
      { key: "minTrace", label: "最小线宽" },
      { key: "minHole", label: "最小孔径" },
      { key: "solderMask", label: "阻焊颜色" },
      { key: "silkscreen", label: "丝印" },
      { key: "goldFingers", label: "金手指" },
      { key: "castellated", label: "半孔" },
      { key: "impedance", label: "阻抗" },
      { key: "edgePlating", label: "边镀金" },
      { key: "halfHole", label: "半孔" },
      { key: "edgeCover", label: "边覆盖" },
      { key: "maskCover", label: "阻焊覆盖" },
      { key: "flyingProbe", label: "飞针测试" },
    ],
  },
  {
    title: "服务参数",
    fields: [
      { key: "quantity", label: "数量" },
      { key: "delivery", label: "交期" },
      { key: "testMethod", label: "测试方式" },
      { key: "prodCap", label: "产能" },
      { key: "productReport", label: "出货报告" },
      { key: "rejectBoard", label: "不良板" },
      { key: "yyPin", label: "YY Pin" },
      { key: "customerCode", label: "客户代码" },
      { key: "payMethod", label: "支付方式" },
      { key: "qualityAttach", label: "品质附件" },
      { key: "smt", label: "SMT" },
    ],
  },
];

function renderValue(val: unknown) {
  if (Array.isArray(val)) return val.length ? val.join("，") : "-";
  if (typeof val === "boolean") return val ? "是" : "否";
  if (val === null || val === undefined || val === "") return "-";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function getSizeLabel(shipmentType: string) {
  return shipmentType === "single" ? "Single Size (cm)" : "Panel Size (cm)";
}

function getCountLabel(shipmentType: string) {
  return shipmentType === "single" ? "Single Count" : "Panel Count";
}

function getCountUnit(shipmentType: string) {
  return shipmentType === "single" ? "Pcs" : "Set";
}

function OrderAddressCard({ address }: { address: Record<string, unknown> }) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold text-blue-700">收货地址</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 p-4 pt-0">
        <div><span className="text-xs text-muted-foreground font-semibold uppercase">国家</span><div className="text-base font-semibold text-gray-800 break-all">{address?.country ?? "-"}</div></div>
        <div><span className="text-xs text-muted-foreground font-semibold uppercase">省/州</span><div className="text-base font-semibold text-gray-800 break-all">{address?.state ?? "-"}</div></div>
        <div><span className="text-xs text-muted-foreground font-semibold uppercase">城市</span><div className="text-base font-semibold text-gray-800 break-all">{address?.city ?? "-"}</div></div>
        <div><span className="text-xs text-muted-foreground font-semibold uppercase">邮编</span><div className="text-base font-semibold text-gray-800 break-all">{address?.zip ?? "-"}</div></div>
        <div className="col-span-2"><span className="text-xs text-muted-foreground font-semibold uppercase">详细地址</span><div className="text-base font-semibold text-gray-800 break-all">{address?.address ?? "-"}</div></div>
        <div><span className="text-xs text-muted-foreground font-semibold uppercase">电话</span><div className="text-base font-semibold text-gray-800 break-all">{address?.phone ?? "-"}</div></div>
        <div><span className="text-xs text-muted-foreground font-semibold uppercase">邮箱</span><div className="text-base font-semibold text-gray-800 break-all">{address?.email ?? "-"}</div></div>
        <div className="col-span-2 mt-2"><span className="text-sm font-semibold text-blue-700">地址备注</span>{address?.note ? (<div className="mt-1 text-base font-medium text-gray-800 bg-blue-50 border border-blue-100 rounded px-3 py-2">{address.note}</div>) : (<div className="mt-1 text-base text-gray-400 bg-blue-50 border border-blue-100 rounded px-3 py-2">-</div>)}</div>
      </CardContent>
    </Card>
  );
}

function OrderShippingCard({ order }: { order: Record<string, unknown> }) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold text-blue-700">物流信息</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 p-4 pt-0">
        <div><span className="text-xs text-muted-foreground font-semibold uppercase">快递公司</span><div className="text-base font-semibold text-gray-800 break-all">{order.courier ?? "-"}</div></div>
        <div><span className="text-xs text-muted-foreground font-semibold uppercase">运单号</span><div className="text-base font-semibold text-gray-800 break-all">{order.tracking_no ?? "-"}</div></div>
        <div><span className="text-xs text-muted-foreground font-semibold uppercase">发货时间</span><div className="text-base font-semibold text-gray-800 break-all">{order.status === "shipped" || order.status === "completed" ? (order.created_at ? new Date(order.created_at).toLocaleString() : "-") : "-"}</div></div>
        <div><span className="text-xs text-muted-foreground font-semibold uppercase">物流状态</span><div className="text-base font-semibold text-gray-800 break-all">{order.status ?? "-"}</div></div>
      </CardContent>
    </Card>
  );
}

function OrderCustomsCard({ customs }: { customs: Record<string, unknown> }) {
  const { cnyToUsdRate: rate } = useExchangeRate();
  const toUSD = (cny: number) => rate ? cny * rate : 0;
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold text-blue-700">报关/税务信息</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 p-4 pt-0">
        <div><span className="text-xs text-muted-foreground font-semibold uppercase">报关方式</span><div className="text-base font-semibold text-gray-800 break-all">{customs?.declaration_method ?? "-"}</div></div>
        <div><span className="text-xs text-muted-foreground font-semibold uppercase">公司名称</span><div className="text-base font-semibold text-gray-800 break-all">{customs?.company_name ?? "-"}</div></div>
        <div><span className="text-xs text-muted-foreground font-semibold uppercase">税号</span><div className="text-base font-semibold text-gray-800 break-all">{customs?.tax_id ?? "-"}</div></div>
        <div><span className="text-xs text-muted-foreground font-semibold uppercase">个人ID</span><div className="text-base font-semibold text-gray-800 break-all">{customs?.personal_id ?? "-"}</div></div>
        <div><span className="text-xs text-muted-foreground font-semibold uppercase">贸易术语</span><div className="text-base font-semibold text-gray-800 break-all">{customs?.incoterm ?? "-"}</div></div>
        <div><span className="text-xs text-muted-foreground font-semibold uppercase">用途</span><div className="text-base font-semibold text-gray-800 break-all">{customs?.purpose ?? "-"}</div></div>
        <div><span className="text-xs text-muted-foreground font-semibold uppercase">申报价值</span><div className="text-base font-semibold text-gray-800 break-all">{customs?.declared_value != null ? `$ ${toUSD(customs?.declared_value).toFixed(2)}` : "-"}</div></div>
        <div className="col-span-2"><span className="text-xs text-muted-foreground font-semibold uppercase">报关备注</span><div className="text-base font-semibold text-gray-800 break-all">{customs?.customs_note ?? "-"}</div></div>
      </CardContent>
    </Card>
  );
}

function OrderPcbSpecCard({ pcb_spec, gerber_file_url, order }: { pcb_spec: Record<string, unknown>, gerber_file_url?: string | null, order: Record<string, unknown> }) {
  if (!pcb_spec) return null;
  const allKeys = FIELD_GROUPS.flatMap(g => g.fields.map(f => f.key));
  const others = Object.entries(pcb_spec).filter(([k]) => !allKeys.includes(k));
  let gerberName = "";
  const realGerberUrl = gerber_file_url ? getPublicFileUrl(gerber_file_url) : null;
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
        {/* 工艺参数 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {FIELD_GROUPS[1].fields.map(f => (
            <div key={f.key}>
              <span className="text-xs text-muted-foreground font-semibold uppercase">{f.label}</span>
              <div className="text-base font-semibold text-gray-800 break-all">{renderValue(pcb_spec[f.key])}</div>
            </div>
          ))}
        </div>
        <hr className="my-4 border-blue-100" />
        {/* 服务参数 */}
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
        {/* Gerber文件展示区块 */}
        <hr className="my-4 border-blue-100" />
        <div className="mt-4">
          <span className="text-sm font-semibold text-blue-700">Gerber文件:</span>
          {(pcb_spec.gerber || gerber_file_url) ? (
            <span className="ml-2 text-base font-semibold text-blue-700 break-all">
              {gerberName || "Gerber文件"}
            </span>
          ) : (
            <span className="ml-2 text-base text-gray-400">-</span>
          )}
          {realGerberUrl && (
            <>
           <DownloadButton filePath={gerber_file_url ?? ""} bucket="next-pcb" className="ml-2">download</DownloadButton>
            </>
          )}
        </div>
        {/* PCB备注区块 */}
        <hr className="my-4 border-blue-100" />
        {order.pcb_note && (
          <div className="mt-4">
            <span className="text-sm font-semibold text-blue-700">PCB备注</span>
            <div className="mt-1 text-base font-medium text-gray-800 bg-blue-50 border border-blue-100 rounded px-3 py-2">{order.pcb_note}</div>
          </div>
        )}
        {!order.pcb_note && (
          <div className="mt-4">
            <span className="text-sm font-semibold text-blue-700">PCB备注</span>
            <div className="mt-1 text-base text-gray-400 bg-blue-50 border border-blue-100 rounded px-3 py-2">-</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 订单步骤与状态流转严格一致
const ORDER_STEPS = [
  { label: "Inquiry", key: "inquiry" },
  { label: "Review", key: "review" },
  { label: "Confirm & Pay", key: "confirm_pay" },
  { label: "Scheduling", key: "scheduling" },
  { label: "Production", key: "production" },
  { label: "Shipping", key: "shipping" },
  { label: "Receiving", key: "receiving" },
  { label: "Complete", key: "complete" },
];

// 订单状态流转配置（可维护、可扩展）
const ORDER_STATUS_FLOW_CONFIG: Record<string, { value: string, label: string }[]> = {
  inquiry: [
    { value: "review", label: "Review" },
    { value: "confirm_pay", label: "Confirm & Pay" },
    { value: "cancelled", label: "Cancelled" }
  ],
  review: [
    { value: "confirm_pay", label: "Confirm & Pay" },
    { value: "cancelled", label: "Cancelled" }
  ],
  confirm_pay: [
    { value: "scheduling", label: "Scheduling" },
    { value: "cancelled", label: "Cancelled" }
  ],
  scheduling: [
    { value: "production", label: "Production" },
    { value: "cancelled", label: "Cancelled" }
  ],
  production: [
    { value: "shipping", label: "Shipping" },
    { value: "cancelled", label: "Cancelled" }
  ],
  shipping: [
    { value: "receiving", label: "Receiving" }
  ],
  receiving: [
    { value: "complete", label: "Complete" }
  ],
  complete: [],
  cancelled: []
};

function OrderSummaryCard({ order, onBack, onOrderUpdate, address }: { order: Record<string, unknown>, onBack: () => void, onOrderUpdate: () => void, address: Record<string, unknown> }) {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    pcb_price: order.pcb_price ?? 0,
    shipping_cost: order.shipping_cost ?? 0,
    customs_fee: order.customs_fee ?? 0,
    total: order.total ?? 0,
    production_cycle: order.production_cycle ?? 0,
    reason: "",
    status: order.status ?? "inquiry",
    estimated_finish_date: order.estimated_finish_date ? order.estimated_finish_date.slice(0, 10) : ""
  });
  const [saving, setSaving] = useState(false);
  const [recalcLoading, setRecalcLoading] = useState(false);
  const { cnyToUsdRate: rate } = useExchangeRate();
  const toUSD = (cny: number) => rate ? cny * rate : 0;
  // 重新计算
  function handleRecalc() {

    if (!order.pcb_spec) {
      alert("PCB参数不存在，无法重新计算");
      return;
    }
    setRecalcLoading(true);
    setTimeout(() => {
      const pcbPrice = calcPcbPriceV2(order.pcb_spec).total;
      const productionCycle = calcProductionCycle(order.pcb_spec).cycleDays;
      setForm(f => ({
        ...f,
        pcb_price: pcbPrice,
        production_cycle: productionCycle,
        total: Number(pcbPrice) + Number(f.shipping_cost) + Number(f.customs_fee)
      }));
      setRecalcLoading(false);
    }, 400); // 400ms 交互提示
  }
  // 保存
  async function handleSave() {
    if (form.status === "cancelled" && !form.reason.trim()) {
      alert("取消订单时必须填写原因");
      return;
    }
    if (form.status === "cancelled") {
      if (!window.confirm("确定要取消该订单吗？此操作不可逆。")) {
        return;
      }
    }
    setSaving(true);
    const supabase = createClientComponentClient();
    // 先获取当前 reason 数组
    const { data: orderData } = await supabase
      .from("orders")
      .select("admin_update_reason")
      .eq("id", order.id)
      .single();

    let reasons: string[] = [];
    if (Array.isArray(orderData?.admin_update_reason)) {
      reasons = orderData.admin_update_reason;
    }
    // 只追加非空 reason
    if (form.reason && form.reason.trim() !== "") {
      reasons.push(form.reason.trim());
    }

    const { error } = await supabase.from("orders").update({
      pcb_price: Number(form.pcb_price),
      shipping_cost: Number(form.shipping_cost),
      customs_fee: Number(form.customs_fee),
      total: Number(form.total),
      production_cycle: Number(form.production_cycle),
      admin_update_reason: reasons,
      status: form.status,
      estimated_finish_date: form.estimated_finish_date || null
    }).eq("id", order.id);
    setSaving(false);
    if (!error) {
      // 邮件通知客服
      fetch('/api/notify-customer-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: address?.email, // 地址信息里的邮箱
          subject: `订单${order.id}已被管理员修改`,
          html: `<p>订单ID: ${order.id} 已被管理员修改，请及时处理。</p>`
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log('客服邮件已发送');
        } else {
          console.error('客服邮件发送失败', data.error);
        }
      })
      .catch(err => {
        console.error('客服邮件发送接口异常', err);
      });
      onOrderUpdate && onOrderUpdate();
      setEdit(false);
    } else {
      // 保存失败: " + error.message
    }
  }
  // 监听价格相关字段变化，自动更新总价
  useEffect(() => {
    if (edit) {
      setForm(f => ({
        ...f,
        total: Number(f.pcb_price) + Number(f.shipping_cost) + Number(f.customs_fee)
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.pcb_price, form.shipping_cost, form.customs_fee, edit]);
  // 保证form.status和order.status同步
  useEffect(() => {
    setForm(f => ({
      ...f,
      status: order.status ?? "inquiry"
    }));
  }, [order.status]);
  // 编辑模式下输入框
  return (
    <Card className="sticky top-24 shadow-xl border-blue-200 bg-gradient-to-br from-blue-100/80 via-white to-blue-50/80">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-xl font-bold text-blue-800">订单摘要</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">PCB价格</span>
            {edit ? (
              <Input type="number" value={form.pcb_price} onChange={e => setForm(f => ({ ...f, pcb_price: e.target.value }))} className="w-32" />
            ) : (
              <span className="text-lg font-bold text-blue-700">$ {order.pcb_price ? toUSD(order.pcb_price).toFixed(2) : '-'}</span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">生产周期</span>
            {edit ? (
              <Input type="number" value={form.production_cycle} onChange={e => setForm(f => ({ ...f, production_cycle: e.target.value }))} className="w-32" />
            ) : (
              <span className="text-base font-semibold text-gray-700">{order.production_cycle != null ? `${order.production_cycle} 天` : '-'}</span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">预计完成</span>
            {edit ? (
              <Input
                type="date"
                value={form.estimated_finish_date}
                onChange={e => setForm(f => ({ ...f, estimated_finish_date: e.target.value }))}
                className="w-40"
              />
            ) : (
              <span className="text-base font-semibold text-gray-700">{order.estimated_finish_date ? new Date(order.estimated_finish_date).toLocaleDateString() : '-'}</span>
            )}
          </div>
          <div className="flex justify-between items-center pt-3">
            <span className="text-sm text-muted-foreground">运费</span>
            {edit ? (
              <Input type="number" value={form.shipping_cost} onChange={e => setForm(f => ({ ...f, shipping_cost: e.target.value }))} className="w-32" />
            ) : (
              <span className="text-lg font-bold text-blue-700">$ {order.shipping_cost ? toUSD(order.shipping_cost).toFixed(2) : '-'}</span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">关税</span>
            {edit ? (
              <Input type="number" value={form.customs_fee} onChange={e => setForm(f => ({ ...f, customs_fee: e.target.value }))} className="w-32" />
            ) : (
              <span className="text-base font-semibold text-blue-700">$ {order.customs_fee ? toUSD(order.customs_fee).toFixed(2) : '-'}</span>
            )}
          </div>
          <div className="pt-3 border-t">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-blue-900">总计</span>
              {edit ? (
                <Input type="number" value={form.total} onChange={e => setForm(f => ({ ...f, total: e.target.value }))} className="w-32" />
              ) : (
                <span className="text-2xl font-extrabold text-blue-700">$ {order.total ? toUSD(order.total).toFixed(2) : '-'}</span>
              )}
            </div>
          </div>
          {edit && (
            <div className="flex flex-col gap-2 pt-2">
              <span className="text-sm text-muted-foreground">修改原因（选填）</span>
              <Input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="请输入修改原因" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">订单状态</span>
            {edit ? (
              <Select
                value={form.status}
                onValueChange={val => setForm(f => ({ ...f, status: val }))}
              >
                <SelectTrigger className="w-40" />
                <SelectContent>
                  {(ORDER_STATUS_FLOW_CONFIG[order.status] || []).map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span
                className={`px-2 py-1 rounded text-xs font-bold ${
                  form.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : form.status === 'cancelled'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {(() => {
                  // 优先用label，否则显示原始status
                  const labelMap = {
                    pending: 'Pending',
                    paid: 'Paid',
                    processing: 'Processing',
                    shipped: 'Shipped',
                    completed: 'Completed',
                    cancelled: 'Cancelled'
                  };
                  const statusKey = String(form.status) as keyof typeof labelMap;
                  return labelMap[statusKey] || form.status;
                })()}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 pt-2">
            {edit ? (
              <div className="flex gap-2 flex-wrap">
                <Button variant="secondary" onClick={handleRecalc} disabled={recalcLoading}>
                  {recalcLoading ? "计算中..." : "重新计算"}
                </Button>
                <Button variant="default" onClick={handleSave} disabled={saving}>{saving ? "保存中..." : "保存"}</Button>
                <Button variant="outline" onClick={() => { setEdit(false); setForm({
                  pcb_price: order.pcb_price ?? 0,
                  shipping_cost: order.shipping_cost ?? 0,
                  customs_fee: order.customs_fee ?? 0,
                  total: order.total ?? 0,
                  production_cycle: order.production_cycle ?? 0,
                  reason: "",
                  status: order.status ?? "inquiry",
                  estimated_finish_date: order.estimated_finish_date ? order.estimated_finish_date.slice(0, 10) : ""
                }); }}>取消</Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => { setEdit(true); }}>编辑</Button>
            )}
            <Button variant="outline" onClick={onBack}>返回</Button>
          </div>
        </div>
       
      </CardContent>
    </Card>
  );
}

function AdminOrderDetailClient({ order }: { order: Record<string, unknown> }) {
  const router = useRouter();
  const [address, setAddress] = useState<Record<string, unknown> | null>(null);
  const [customs, setCustoms] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      const supabase = createClientComponentClient();
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

  if (!order) return <div className="flex justify-center items-center min-h-[60vh] text-muted-foreground">未找到订单</div>;
  if (loading) return <div className="flex justify-center items-center min-h-[60vh] text-muted-foreground">加载中...</div>;

  // 费用明细
  const pcbSpec = order.pcb_spec || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100 font-sans">
      <div className="container max-w-7xl mx-auto py-15 px-2 md:px-6">
     
        {/* 步骤条 */}
        <div className="mb-5">
          <OrderStepBar currentStatus={order.status || "inquiry"} steps={ORDER_STEPS} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 左侧主内容区 */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <OrderPcbSpecCard pcb_spec={pcbSpec} gerber_file_url={order.gerber_file_url} order={order} />
            <OrderAddressCard address={address} />
            <OrderCustomsCard customs={customs} />
            <OrderShippingCard order={order} />
            {/* 历史修改原因展示 */}
            {Array.isArray(order.admin_update_reason) && order.admin_update_reason.length > 0 && (
              <div className="mb-4">
                <div className="font-semibold text-blue-700 mb-2">历史修改原因</div>
                <ul className="list-disc pl-5 text-gray-700 text-sm">
                  {order.admin_update_reason.map((r: string, idx: number) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {/* 右侧订单摘要区 */}
          <div className="col-span-12 lg:col-span-4">
            <OrderSummaryCard order={order} address={address} onBack={() => router.back()} onOrderUpdate={() => {}} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminOrderDetailClient; 