import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import React from "react";

interface OrderSummaryBlockProps {
  pcbPrice: number;
  productionCycle: number | null;
  estimatedFinishDate: Date | null;
  shippingCost: number | null;
  customs: number;
  total: number;
  rate: number;
  rateLoading: boolean;
  error: string;
  onSubmit: () => void;
  loading: boolean;
}

export default function OrderSummaryBlock({
  pcbPrice,
  productionCycle,
  estimatedFinishDate,
  shippingCost,
  customs,
  total,
  rate,
  rateLoading,
  error,
  onSubmit,
  loading,
}: OrderSummaryBlockProps) {
  const toUSD = (cny: number) => rate ? cny * rate : 0;
  return (
    <Card className="sticky top-24 shadow-xl border-blue-200 bg-gradient-to-br from-blue-100/80 via-white to-blue-50/80 max-w-xl w-full">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-xl font-bold text-blue-800">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">PCB Price</span>
            <span className="text-lg font-bold text-blue-700">
              {rateLoading || !rate ? '-' : `$ ${toUSD(pcbPrice).toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Production Time</span>
            <span className="text-base font-semibold text-gray-700">{productionCycle != null ? `${productionCycle} days` : '-'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Estimated Finish</span>
            <span className="text-base font-semibold text-gray-700">{estimatedFinishDate ? estimatedFinishDate.toLocaleDateString() : '-'}</span>
          </div>
          <div className="flex justify-between items-center pt-3">
            <span className="text-sm text-muted-foreground">Shipping Cost</span>
            <span className="text-lg font-bold text-blue-700">
              {rateLoading || !rate ? '-' : `$ ${(shippingCost ?? 0).toFixed(2)}`}
            </span>
          </div>
          <div className="flex flex-col mb-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Customs Fee</span>
              <span className="text-base font-semibold text-blue-700">
                {rateLoading || !rate ? '-' : `$ ${(customs).toFixed(2)}`}
              </span>
            </div>
            <div className="ml-2 text-xs text-gray-500">
              Duty: ${(customs).toFixed(2)} | VAT: ${(customs).toFixed(2)}
            </div>
          </div>
          <div className="pt-3 border-t">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-blue-900">Total</span>
              <span className="text-2xl font-extrabold text-blue-700">
                {rateLoading || !rate ? '-' : `$ ${toUSD(total).toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        <Button className="w-full h-12 text-lg font-bold mt-2" size="lg" onClick={onSubmit} disabled={loading}>
          {loading ? "Processing..." : "Place Order"}
        </Button>
      </CardContent>
    </Card>
  );
} 