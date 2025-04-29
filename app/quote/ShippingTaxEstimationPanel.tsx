import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React, { useState, useEffect } from "react";
import { calculateShippingCost } from "@/lib/shipping-calculator";

interface PCBFormData {
  pcbType: string;
  layers: number;
  copperWeight: string;
  singleLength: string;
  singleWidth: string;
  thickness: string;
  quantity: number;
  panelCount: number;
}

interface ShippingTaxEstimationPanelProps {
  form: PCBFormData;
  onShippingCostChange?: (cost: number) => void;
}

export default function ShippingTaxEstimationPanel({ form, onShippingCostChange }: ShippingTaxEstimationPanelProps) {
  const [shippingInfo, setShippingInfo] = useState({
    country: "",
    courier: "dhl" as "dhl" | "fedex" | "ups",
    service: "standard" as "standard" | "express" | "economy",
  });

  const [shippingCost, setShippingCost] = useState<{
    actualWeight: number;
    volumetricWeight: number;
    chargeableWeight: number;
    baseCost: number;
    fuelSurcharge: number;
    peakCharge: number;
    finalCost: number;
  } | null>(null);

  const handleShippingInfoChange = (field: string, value: string) => {
    const newInfo = {
      ...shippingInfo,
      [field]: value
    };
    setShippingInfo(newInfo);
    
    // 自动计算运费
    if (newInfo.country && newInfo.courier) {
      try {
        const cost = calculateShippingCost(
          form,
          newInfo.country,
          newInfo.courier,
          newInfo.service
        );
        setShippingCost(cost);
        // 通知父组件运费变化
        onShippingCostChange?.(cost.finalCost);
      } catch (error) {
        console.error("Shipping calculation error:", error);
        setShippingCost(null);
        // 当计算出错时，传递0
        onShippingCostChange?.(0);
      }
    }
  };

  // 当PCB表单数据变化时重新计算
  useEffect(() => {
    if (shippingInfo.country && shippingInfo.courier) {
      try {
        const cost = calculateShippingCost(
          form,
          shippingInfo.country,
          shippingInfo.courier,
          shippingInfo.service
        );
        setShippingCost(cost);
        // 通知父组件运费变化
        onShippingCostChange?.(cost.finalCost);
      } catch (error) {
        console.error("Shipping calculation error:", error);
        setShippingCost(null);
        // 当计算出错时，传递0
        onShippingCostChange?.(0);
      }
    }
  }, [form]);

  return (
    <Card className="mt-4 rounded-2xl shadow-lg border-blue-100">
      <CardHeader className="pb-1 flex flex-row items-center gap-2 bg-gradient-to-r from-blue-50 to-white rounded-t-2xl">
        <h3 className="text-base font-bold tracking-wide">Shipping Cost Estimation</h3>
      </CardHeader>
      <CardContent className="pt-3 pb-4 px-4">
        <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <label className="text-xs font-normal">Destination Country</label>
            <Select value={shippingInfo.country} onValueChange={(value) => handleShippingInfoChange("country", value)}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us">United States</SelectItem>
                <SelectItem value="ca">Canada</SelectItem>
                <SelectItem value="uk">United Kingdom</SelectItem>
                <SelectItem value="de">Germany</SelectItem>
                <SelectItem value="fr">France</SelectItem>
                <SelectItem value="jp">Japan</SelectItem>
                <SelectItem value="kr">South Korea</SelectItem>
                <SelectItem value="sg">Singapore</SelectItem>
                <SelectItem value="au">Australia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-normal">Courier Service</label>
            <Select value={shippingInfo.courier} onValueChange={(value: "dhl" | "fedex" | "ups") => handleShippingInfoChange("courier", value)}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Select Courier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dhl">DHL</SelectItem>
                <SelectItem value="fedex">FedEx</SelectItem>
                <SelectItem value="ups">UPS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-normal">Service Type</label>
            <Select value={shippingInfo.service} onValueChange={(value: "standard" | "express" | "economy") => handleShippingInfoChange("service", value)}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Select Service Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="express">Express (1-3 days)</SelectItem>
                <SelectItem value="standard">Standard (3-5 days)</SelectItem>
                <SelectItem value="economy">Economy (5-7 days)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {shippingCost && (
            <div className="mt-2 space-y-3">
              <div className="border rounded-md p-3 space-y-2 bg-slate-50">
                <div className="flex justify-between text-xs">
                  <span>Actual Weight:</span>
                  <span>{shippingCost.actualWeight.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Volumetric Weight:</span>
                  <span>{shippingCost.volumetricWeight.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span>Chargeable Weight:</span>
                  <span>{shippingCost.chargeableWeight.toFixed(2)} kg</span>
                </div>
              </div>

              <div className="border rounded-md p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Base Cost:</span>
                  <span>${shippingCost.baseCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Fuel Surcharge:</span>
                  <span>${shippingCost.fuelSurcharge.toFixed(2)}</span>
                </div>
                {shippingCost.peakCharge > 0 && (
                  <div className="flex justify-between text-xs">
                    <span>Peak Season Surcharge:</span>
                    <span>${shippingCost.peakCharge.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-medium border-t pt-2 mt-2">
                  <span>Total Shipping Cost:</span>
                  <span className="text-red-600">${shippingCost.finalCost.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                * Shipping costs are estimates and may vary based on actual conditions.
                <br />
                * Additional fees may apply for remote areas or special handling.
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
} 