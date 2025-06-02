import React, { useState } from "react";
import { useExchangeRateStore } from "@/lib/exchangeRateStore";
import { calcProductionCycle, getRealDeliveryDate } from "@/lib/pcb-calc";
import { PcbQuoteForm } from "@/types/pcbQuoteForm";

interface QuoteSummaryCardProps {
  pcbPrice: number;
  shippingCost: number;
  tax?: number;
  discount?: number;
  totalPrice: number;
  deliveryDate?: string;
  form?: Partial<PcbQuoteForm>;
  detail?: Record<string, number>;
  notes?: string[];
}

const compareOptions = [
  { label: "Standard", delivery: "standard" },
  { label: "Urgent", delivery: "urgent" },
];

const QuoteSummaryCard: React.FC<QuoteSummaryCardProps> = ({
  pcbPrice,
  shippingCost,
  tax = 0,
  discount = 0,
  totalPrice,
  deliveryDate,
  form = {},
  detail,
  notes,
}) => {
  const [showDetail, setShowDetail] = useState(true);
  const [showProductionCycleDetail, setShowProductionCycleDetail] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const rate = useExchangeRateStore((s) => s.cnyToUsd);
//@TODO: 汇率计算 先使用1 调试
  // const toUSD = (cny: number) => rate ? cny * rate : 0;
  const toUSD = (cny: number) => rate ? cny * 1 : 0;
  const now = new Date();

  // 生产周期信息
  const prodCycles = compareOptions.map(opt => {
    const testForm = { ...form, delivery: opt.delivery } as PcbQuoteForm;
    const info = calcProductionCycle(testForm, now);
    const finishDate = getRealDeliveryDate(now, info.cycleDays);
    return {
      label: opt.label,
      days: info.cycleDays,
      finish: finishDate.toISOString().slice(0, 10),
      isUrgent: opt.delivery === "urgent",
      reasons: info.reason
    };
  });

  return (
    <div
      className="rounded-2xl bg-white/95 shadow-lg transition-all p-6 w-full"
      style={{
        boxShadow:
          "0 4px 24px 0 rgba(31, 38, 135, 0.08), 0 1.5px 4px 0 rgba(31,38,135,0.06)",
        backdropFilter: "blur(2px)",
      }}
    >
      {/* 标题区 */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-xl font-bold text-blue-700">Order Summary</span>
        <button
          type="button"
          className="text-xs text-blue-500 hover:underline px-2 py-1 rounded transition-colors hover:bg-blue-50"
          onClick={() => setShowDetail((v) => !v)}
        >
          {showDetail ? "Hide Detail" : "Show Detail"}
        </button>
      </div>
      {/* 明细区 */}
      <div
        className={`grid gap-2 mb-4 transition-all duration-300 ${showDetail ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 overflow-hidden'}`}
        aria-hidden={!showDetail}
      >
        <div className="flex justify-between text-sm">
          <span className="text-blue-700 font-medium">PCB Cost</span>
          <span className="font-semibold">$ {toUSD(pcbPrice).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-blue-700 font-medium">Shipping</span>
          <span className="font-semibold">$ {toUSD(shippingCost).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-blue-700 font-medium">Tax</span>
          <span className="font-semibold">$ {toUSD(tax).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-blue-700 font-medium">Discount</span>
          <span className="font-semibold text-green-600">-${toUSD(discount).toFixed(2)}</span>
        </div>
        {/* 生产周期信息 */}
        <div className="mt-2">
          <div className="flex justify-between items-center mb-1">
            <div className="text-blue-700 font-medium">Production Cycle</div>
            <button
              type="button"
              className="text-xs text-blue-500 hover:underline transition-colors"
              onClick={() => setShowProductionCycleDetail(!showProductionCycleDetail)}
            >
              {showProductionCycleDetail ? "Hide Detail" : "Show Production Cycle Detail"}
            </button>
          </div>
          
          <div className="flex justify-between text-sm mb-1">
            <span className="text-blue-700 font-medium">Lead Time</span>
            <span className="font-semibold">{prodCycles[0].days} day(s)</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-blue-700 font-medium">Est. Finish</span>
            <span className="font-semibold">{prodCycles[0].finish}</span>
          </div>
          
          {/* 生产周期详细信息 */}
          {showProductionCycleDetail && (
            <div className="mt-2">
              <div className="bg-gray-50 rounded-md p-2">
                <div className="font-medium text-xs text-blue-700 mb-1">
                  Production Details:
                </div>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {prodCycles[0].reasons.map((reason, idx) => (
                    <li key={idx} className="text-xs leading-relaxed">• {reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        {/* PCB价格明细（可选） */}
        {detail && Object.keys(detail).length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-blue-600">Show Price Details</summary>
            <pre className="text-xs bg-slate-100 rounded p-2 mt-1">{JSON.stringify(detail, null, 2)}</pre>
          </details>
        )}
        
        {/* Show Debug 按钮 */}
        <div className="mt-2">
          <button
            type="button"
            className="text-xs text-blue-500 hover:underline transition-colors"
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? "Hide Debug" : "Show Debug"}
          </button>
        </div>
        
        {/* Debug Information */}
        {showDebug && (
          <div className="mt-2 space-y-2 text-xs bg-gray-50 rounded-lg p-3 max-h-64 overflow-y-auto">
            <div className="font-medium text-gray-700 mb-2">Form Properties:</div>
            <pre className="whitespace-pre-wrap text-xs text-gray-600 font-mono">
              {JSON.stringify(form, null, 2)}
            </pre>
          </div>
        )}
      </div>
      {/* 总价区 */}
      <div className="flex justify-between items-center py-3 px-2 rounded-xl bg-blue-50 mb-2">
        <span className="font-bold text-blue-700 text-lg">Estimated Total</span>
        <span className="text-3xl font-extrabold text-blue-700">$ {toUSD(totalPrice).toFixed(2)}</span>
      </div>
      {/* 交付日期（如有） */}
      {deliveryDate && (
        <div className="flex items-center gap-2 text-xs text-blue-600 mb-1">
          <span className="inline-block w-2 h-2 bg-blue-400 rounded-full"></span>
          <span>Estimated Delivery: {deliveryDate}</span>
        </div>
      )}
      {/* 参考说明 */}
      <div className="text-xs mt-2">
        <span className="text-blue-700 font-medium">For reference only,</span>
        <span className="text-gray-500"> final price is subject to review.</span>
      </div>
      {/* 价格备注notes */}
      {notes && notes.length > 0 && (
        <div className="text-xs mt-2 text-gray-600">
          <div className="font-semibold text-blue-700 mb-1">Price Notes</div>
          <ul className="list-disc pl-5">
            {notes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default QuoteSummaryCard;