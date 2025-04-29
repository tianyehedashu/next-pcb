'use client';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { useState, useRef, useMemo } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { MapPin } from "lucide-react";
import { Tabs, Tab } from "@/components/ui/tabs";
import QuoteForm from "./QuoteForm";
import SectionNav from "./SectionNav";
import ShippingTaxEstimationPanel from "./ShippingTaxEstimationPanel";
import { Badge } from "@/components/ui/badge";
import ProductionCycle from "./ProductionCycle";
import { calcProductionCycle, isHoliday, getRealDeliveryDate, calcPcbPrice } from "@/lib/pcb-calc";
import { useQuoteStore } from "@/lib/quoteStore";

function RadioGroup({ name, options, value, onChange }: any) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt: any) => (
        <button
          type="button"
          key={opt.value}
          className={`px-4 py-2 rounded-md border text-sm font-medium transition-all ${value === opt.value
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
            }`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function CheckboxGroup({ name, options, value, onChange }: any) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt: any) => (
        <label key={opt.value} className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={value.includes(opt.value)}
            onChange={() => {
              if (value.includes(opt.value)) {
                onChange(value.filter((v: any) => v !== opt.value));
              } else {
                onChange([...value, opt.value]);
              }
            }}
            className="accent-blue-600"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

export default function QuotePage() {
  // 表单状态（改为 zustand）
  const { form, setForm } = useQuoteStore();
  const [errors, setErrors] = useState<any>({});
  const [shippingCost, setShippingCost] = useState(0);

  // 当前分区索引
  const [activeSection, setActiveSection] = useState(0);
  const sectionRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const sectionList = [
    { label: "Basic Information" },
    { label: "Process Information" },
    { label: "Service Information" },
  ];

  // 滚动监听，自动高亮当前分区
  function handleScroll() {
    const offsets = sectionRefs.map(ref => ref.current?.getBoundingClientRect().top ?? 9999);
    const active = offsets.findIndex(offset => offset > 60);
    setActiveSection(active === -1 ? 2 : Math.max(0, active - 1));
  }

  const pcbPrice = useMemo(() => calcPcbPrice(form), [form]);

  // 计算总价
  const totalPrice = useMemo(() => {
    return pcbPrice + shippingCost;
  }, [pcbPrice, shippingCost]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 pt-16">
      <div className="relative flex flex-row w-full min-h-[600px]">
        {/* 左侧分区导航（fixed） */}
        <aside className="hidden md:flex flex-col w-64 gap-2 fixed left-8 top-1/2 -translate-y-1/2 z-30">
          <SectionNav
            sectionList={sectionList}
            activeSection={activeSection}
            onTabChange={setActiveSection}
            sectionRefs={sectionRefs}
          />
          {/* PCB Cost Details Card */}
          <Card className="py-1">
            <CardHeader className="py-0">
              <span className="font-semibold text-xs">PCB Cost Details</span>
            </CardHeader>
            <CardContent className="py-1">
              <div className="border rounded-md bg-slate-50 text-xs text-muted-foreground mb-1 p-1">
                <div className="flex justify-between py-0"><span>PCB Cost:</span><span>¥ {pcbPrice.toFixed(2)}</span></div>
              </div>
            </CardContent>
          </Card>
          {/* Cost Details Card 吸底 */}
          <Card className="py-1">
            <CardHeader className="py-1">
              <span className="font-semibold text-sm">Cost Details</span>
            </CardHeader>
            <CardContent className="py-1">
              <div className="border rounded-md bg-slate-50 text-xs mb-2 p-2">
                <div className="flex justify-between"><span>PCB Cost:</span><span>¥ {pcbPrice.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Shipping:</span><span>¥ {shippingCost.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Tax:</span><span>¥ 0.00</span></div>
                <div className="flex justify-between"><span>Discount:</span><span className="text-green-600">-¥ 0.00</span></div>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Estimated Total:</span>
                <span className="text-lg font-bold text-red-600">¥ {totalPrice.toFixed(2)}</span>
              </div>
              <div className="text-xs text-muted-foreground">For reference only, final price is subject to review.</div>
            </CardContent>
          </Card>
        </aside>
        {/* 主内容和右侧信息栏容器 */}
        <div className="flex-1 flex flex-row justify-center max-w-8xl mx-auto gap-10 pl-72">
          <main className="flex-1 max-w-full">
            <Card>
              <CardHeader>
                <CardTitle>PCB Instant Quote</CardTitle>
              </CardHeader>
              <CardContent>
                <QuoteForm
                  form={form}
                  errors={errors}
                  setForm={setForm}
                  setErrors={setErrors}
                  sectionRefs={sectionRefs}
                />
              </CardContent>
            </Card>
          </main>
          {/* 右侧信息栏 */}
          <aside className="md:block w-[420px] flex flex-col gap-4">
            <div className="sticky top-4 z-10">
              <ProductionCycle form={form} calcProductionCycle={calcProductionCycle} getRealDeliveryDate={getRealDeliveryDate} />
              <ShippingTaxEstimationPanel form={form} onShippingCostChange={setShippingCost} />
            </div>
          </aside>
        </div>
      </div>
    
    </div>
  );
} 