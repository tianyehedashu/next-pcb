import React, { useState } from "react";

interface QuoteSummaryCardProps {
  pcbPrice: number;
  shippingCost: number;
  tax?: number;
  discount?: number;
  totalPrice: number;
  deliveryDate?: string;
}

const QuoteSummaryCard: React.FC<QuoteSummaryCardProps> = ({
  pcbPrice,
  shippingCost,
  tax = 0,
  discount = 0,
  totalPrice,
  deliveryDate,
}) => {
  const [showDetail, setShowDetail] = useState(false);
  return (
    <aside className="sticky top-4 z-10 w-full max-w-sm mx-auto">
      <div className="rounded-2xl shadow-lg border border-blue-100 bg-white/95 p-6 mb-4 transition-all">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-lg text-blue-700">Order Summary</span>
          <button
            type="button"
            className="text-xs text-blue-500 hover:underline"
            onClick={() => setShowDetail((v) => !v)}
          >
            {showDetail ? "Hide Detail" : "Show Detail"}
          </button>
        </div>
        {showDetail && (
          <div className="space-y-2 mb-2">
            <div className="flex justify-between text-sm">
              <span>PCB Cost</span>
              <span>¥ {pcbPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span>¥ {shippingCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>¥ {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Discount</span>
              <span className="text-green-600">-¥ {discount.toFixed(2)}</span>
            </div>
          </div>
        )}
        <div className="flex justify-between items-center mb-2 mt-2">
          <span className="font-semibold">Estimated Total</span>
          <span className="text-2xl font-bold text-red-600">¥ {totalPrice.toFixed(2)}</span>
        </div>
        {deliveryDate && (
          <div className="flex items-center gap-2 text-xs text-blue-600 mb-1">
            <span className="inline-block w-2 h-2 bg-blue-400 rounded-full"></span>
            <span>Estimated Delivery: {deliveryDate}</span>
          </div>
        )}
        <div className="text-xs text-muted-foreground mt-2">
          For reference only, final price is subject to review.
        </div>
      </div>
    </aside>
  );
};

export default QuoteSummaryCard;