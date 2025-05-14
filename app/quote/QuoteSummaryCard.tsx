import React, { useState } from "react";
import { useExchangeRateStore } from "@/lib/exchangeRateStore";
import { calcProductionCycle, getRealDeliveryDate } from "@/lib/pcb-calc";

interface QuoteSummaryCardProps {
  pcbPrice: number;
  shippingCost: number;
  tax?: number;
  discount?: number;
  totalPrice: number;
  deliveryDate?: string;
  form?: any;
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
  const rate = useExchangeRateStore((s) => s.cnyToUsd);
  const toUSD = (cny: number) => rate ? cny * rate : 0;
  const now = new Date();

  // 生产周期信息
  const prodCycles = compareOptions.map(opt => {
    const testForm = { ...form, delivery: opt.delivery };
    const info = calcProductionCycle(testForm, now);
    const finishDate = getRealDeliveryDate(now, info.cycleDays);
    return {
      label: opt.label,
      days: info.cycleDays,
      finish: finishDate.toISOString().slice(0, 10),
      isUrgent: opt.delivery === "urgent"
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
          <div className="font-semibold text-blue-700 mb-1">Production Cycle</div>
          <table className="w-full text-xs text-center bg-slate-50 rounded-md">
            <thead>
              <tr className="border-b">
                <th className="py-1 font-medium">Type</th>
                <th className="py-1 font-medium">Cycle</th>
                <th className="py-1 font-medium">Est. Finish</th>
              </tr>
            </thead>
            <tbody>
              {prodCycles.map((item) => (
                <tr key={item.label} className={item.isUrgent ? "bg-red-50 text-red-600 font-semibold" : ""}>
                  <td className="py-1">{item.isUrgent && <span className="text-base">⚡</span>} {item.label}</td>
                  <td className="py-1">{item.days} day(s)</td>
                  <td className="py-1">{item.finish}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* PCB价格明细（可选） */}
        {detail && Object.keys(detail).length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-blue-600">Show Price Details</summary>
            <pre className="text-xs bg-slate-100 rounded p-2 mt-1">{JSON.stringify(detail, null, 2)}</pre>
          </details>
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