"use client";
import { useState, useRef, useMemo, useEffect } from "react";
import QuoteForm from "./QuoteForm";
import SectionNav from "./SectionNav";
import { useQuoteStore } from "@/lib/quoteStore";
import QuoteSummaryCard from "./QuoteSummaryCard";
import { useCnyToUsdRate } from "@/lib/hooks/useCnyToUsdRate";
import { calcPcbPriceV2 } from "@/lib/pcb-calc-v2";

export default function QuoteClientMain() {
  const { rate } = useCnyToUsdRate();
  const { form, setForm } = useQuoteStore();
  const [errors, setErrors] = useState<any>({});
  const [shippingCost, setShippingCost] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const sectionRefs = [
    useRef<HTMLDivElement>(null), // Basic
    useRef<HTMLDivElement>(null), // Process
    useRef<HTMLDivElement>(null), // Service
    useRef<HTMLDivElement>(null), // Shipping
  ];

  // 滚动监听，自动高亮当前分区
  function handleScroll() {
    const offsets = sectionRefs.map(ref => {
      if (!ref.current) return Number.POSITIVE_INFINITY;
      return Math.abs(ref.current.getBoundingClientRect().top - 80);
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

  // 实时计算PCB价格（含明细和备注）
  const pcbPriceResult = useMemo(() => calcPcbPriceV2(form), [form]);
  const pcbPrice = pcbPriceResult.total;
  const totalPrice = useMemo(() => {
    return pcbPrice + shippingCost;
  }, [pcbPrice, shippingCost]);

  return (
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
            detail={pcbPriceResult.detail}
            notes={pcbPriceResult.notes}
          />
        </div>
      </div>
    </div>
  );
} 