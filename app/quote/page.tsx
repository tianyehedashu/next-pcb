'use client';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { useState, useRef, useMemo, useEffect } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { MapPin } from "lucide-react";
import { Tabs, Tab } from "@/components/ui/tabs";
import QuoteForm from "./QuoteForm";
import SectionNav from "./SectionNav";
import { Badge } from "@/components/ui/badge";
import ProductionCycle from "./ProductionCycle";
import { calcProductionCycle, isHoliday, getRealDeliveryDate, calcPcbPrice } from "@/lib/pcb-calc";
import { useQuoteStore } from "@/lib/quoteStore";
import QuoteSummaryCard from "./QuoteSummaryCard";
import { useCnyToUsdRate } from "@/lib/hooks/useCnyToUsdRate";

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
  const { rate, loading, error } = useCnyToUsdRate();
  const toUSD = (cny: number) => cny * rate;
  // 表单状态（改为 zustand）
  const { form, setForm } = useQuoteStore();
  const [errors, setErrors] = useState<any>({});
  const [shippingCost, setShippingCost] = useState(0);

  // 当前分区索引
  const [activeSection, setActiveSection] = useState(0);
  const sectionRefs = [
    useRef<HTMLDivElement>(null), // Basic
    useRef<HTMLDivElement>(null), // Process
    useRef<HTMLDivElement>(null), // Service
    useRef<HTMLDivElement>(null), // Shipping
  ];
  const sectionList = [
    { label: "Basic Information" },
    { label: "Process Information" },
    { label: "Service Information" },
    { label: "Shipping Information" },
  ];

  // 滚动监听，自动高亮当前分区
  function handleScroll() {
    const offsets = sectionRefs.map(ref => {
      if (!ref.current) return Number.POSITIVE_INFINITY;
      return Math.abs(ref.current.getBoundingClientRect().top - 80); // 80为吸顶高度或自定义
    });
    const minOffset = Math.min(...offsets);
    const newActive = offsets.findIndex(offset => offset === minOffset);
    if (newActive !== activeSection) {
      setActiveSection(newActive);
    }
  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeSection, sectionRefs]);

  const pcbPrice = useMemo(() => calcPcbPrice(form), [form]);

  // 计算总价
  const totalPrice = useMemo(() => {
    return pcbPrice + shippingCost;
  }, [pcbPrice, shippingCost]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 pt-16">
      <div className="flex flex-row max-w-[1400px] mx-auto pt-16">
        {/* 左侧分区导航（fixed，独立） */}
        <aside className="hidden md:flex flex-col w-32 flex-shrink-0 gap-2 fixed left-0 top-1/2 -translate-y-1/2 z-30">
          <SectionNav
            activeSection={activeSection}
            onTabChange={setActiveSection}
            sectionRefs={sectionRefs}
          />
        </aside>
        {/* 主内容区，左侧留出导航宽度 */}
        <main className="flex-1 min-w-0 ml-0 md:ml-32 pr-2">
          <QuoteForm
            form={form}
            errors={errors}
            setForm={setForm}
            setErrors={setErrors}
            sectionRefs={sectionRefs}
            setShippingCost={setShippingCost}
          />
        </main>
        {/* 右侧栏，Order Summary sticky 吸顶，其它内容流式排列 */}
        <div className="hidden md:flex flex-col w-[400px] flex-shrink-0 max-w-[90vw] ml-6">
          {/* Order Summary sticky 吸顶 */}
          <div
            className="sticky top-16 z-50 rounded-2xl bg-white/95 transition-all shadow-lg"
            style={{
              boxShadow: "0 4px 24px 0 rgba(31, 38, 135, 0.08), 0 1.5px 4px 0 rgba(31,38,135,0.06)",
              backdropFilter: "blur(2px)",
            }}
          >
            <QuoteSummaryCard
              pcbPrice={pcbPrice}
              shippingCost={shippingCost}
              totalPrice={totalPrice}
            />
          </div>

        </div>
      </div>
    </div>
  );
} 