import { Truck, Package, Plane, Clock } from "lucide-react";
import React, { useMemo } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import countries from "@/lib/data/countries.json";
import type { PcbQuoteForm } from "@/types/pcbQuoteForm";

interface ShippingCostEstimationSectionProps {
  form: PcbQuoteForm;
  setShippingCost: (cost: number) => void;
  sectionRef: React.RefObject<HTMLDivElement>;
}

const COURIERS = [
  { value: "dhl", label: "DHL", color: "bg-yellow-400 text-black", icon: <Package size={16} /> },
  { value: "fedex", label: "FedEx", color: "bg-purple-600 text-white", icon: <Plane size={16} /> },
  { value: "ups", label: "UPS", color: "bg-amber-700 text-white", icon: <Truck size={16} /> },
];
const SERVICES = [
  { value: "express", label: "Express", desc: "1-3 days" },
  { value: "standard", label: "Standard", desc: "3-5 days" },
  { value: "economy", label: "Economy", desc: "5-7 days" },
];

function getCountryOptions() {
  const codes = ["us","ca","uk","de","fr","jp","kr","sg","au"];
  return (countries as any[]).filter(c => codes.includes(c.iso2.toLowerCase()));
}

export default function ShippingCostEstimationSection({ form, setShippingCost, sectionRef }: ShippingCostEstimationSectionProps) {
  const [shippingInfo, setShippingInfo] = React.useState({
    country: "us",
    courier: "dhl" as "dhl" | "fedex" | "ups",
    service: "standard" as "standard" | "express" | "economy",
  });
  const [shippingCost, setShippingCostState] = React.useState<{
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
    if (newInfo.country && newInfo.courier) {
      try {
        const cost = require("@/lib/shipping-calculator").calculateShippingCost(
          form,
          newInfo.country,
          newInfo.courier,
          newInfo.service
        );
        setShippingCostState(cost);
        setShippingCost(cost.finalCost);
      } catch (error) {
        setShippingCostState(null);
        setShippingCost(0);
      }
    }
  };

  React.useEffect(() => {
    if (shippingInfo.country && shippingInfo.courier) {
      console.log('shipping calc fields:', {
        singleLength: form.singleLength,
        singleWidth: form.singleWidth,
        thickness: form.thickness,
        quantity: form.quantity,
        panelCount: form.panelCount,
        copperWeight: form.copperWeight,
        layers: form.layers,
        pcbType: form.pcbType
      });
      try {
        const cost = require("@/lib/shipping-calculator").calculateShippingCost(
          form,
          shippingInfo.country,
          shippingInfo.courier,
          shippingInfo.service
        );
        setShippingCostState(cost);
        setShippingCost(cost.finalCost);
      } catch (error) {
        setShippingCostState(null);
        setShippingCost(0);
      }
    }
  }, [form]);

  const countryOptions = useMemo(() => getCountryOptions(), []);

  return (
    <div ref={sectionRef} className="scroll-mt-32">
      {/* 选择区 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* 国家选择 */}
        <div>
          <Tooltip content={<div className="max-w-xs text-left">Select the country where your order will be shipped.</div>}>
            <label className="text-xs font-medium mb-1 block cursor-help">Destination Country</label>
          </Tooltip>
          <Select value={shippingInfo.country} onValueChange={v => handleShippingInfoChange("country", v)}>
            <SelectTrigger className="w-full text-xs h-10">
              <SelectValue placeholder="Select Country" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {countryOptions.map(c => (
                <SelectItem key={c.iso2} value={c.iso2.toLowerCase()} className="flex items-center gap-2">
                  <span className="mr-2">{c.emoji}</span>{c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* 快递公司选择 */}
        <div>
          <Tooltip content={<div className="max-w-xs text-left">Choose your preferred shipping company. Cost and speed may vary.</div>}>
            <label className="text-xs font-medium mb-1 block cursor-help">Courier</label>
          </Tooltip>
          <Select value={shippingInfo.courier} onValueChange={v => handleShippingInfoChange("courier", v as any)}>
            <SelectTrigger className="w-full text-xs h-10">
              <SelectValue placeholder="Select Courier" />
            </SelectTrigger>
            <SelectContent>
              {COURIERS.map(c => (
                <SelectItem key={c.value} value={c.value} className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center ${c.color} mr-2`}>{c.icon}</span>{c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* 服务类型选择 */}
        <div>
          <Tooltip content={<div className="max-w-xs text-left">Select shipping speed. Express is fastest, economy is most affordable.</div>}>
            <label className="text-xs font-medium mb-1 block cursor-help">Service Type</label>
          </Tooltip>
          <Select value={shippingInfo.service} onValueChange={v => handleShippingInfoChange("service", v as any)}>
            <SelectTrigger className="w-full text-xs h-10">
              <SelectValue placeholder="Select Service Type" />
            </SelectTrigger>
            <SelectContent>
              {SERVICES.map(s => (
                <SelectItem key={s.value} value={s.value} className="flex items-center gap-2">
                  <Clock size={14} className="text-blue-400 mr-1" />
                  {s.label} <span className="ml-2 text-muted-foreground">({s.desc})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* 运费明细区 */}
      {shippingCost ? (
        <>
          <div className="flex flex-wrap gap-4 text-xs mb-2">
            <div className="flex-1 min-w-[160px] flex justify-between">
              <span>Actual Weight</span>
              <span>{shippingCost.actualWeight.toFixed(2)} kg</span>
            </div>
            <div className="flex-1 min-w-[160px] flex justify-between">
              <span>Volumetric Weight</span>
              <span>{shippingCost.volumetricWeight.toFixed(2)} kg</span>
            </div>
            <div className="flex-1 min-w-[160px] flex justify-between font-medium">
              <span>Chargeable Weight</span>
              <span>{shippingCost.chargeableWeight.toFixed(2)} kg</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs mb-2">
            <div className="flex-1 min-w-[160px] flex justify-between">
              <span>Base Cost</span>
              <span>${shippingCost.baseCost.toFixed(2)}</span>
            </div>
            <div className="flex-1 min-w-[160px] flex justify-between">
              <span>Fuel Surcharge</span>
              <span>${shippingCost.fuelSurcharge.toFixed(2)}</span>
            </div>
            {shippingCost.peakCharge > 0 && (
              <div className="flex-1 min-w-[160px] flex justify-between">
                <span>Peak Season Surcharge</span>
                <span>${shippingCost.peakCharge.toFixed(2)}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center text-base font-bold border-t pt-3 mt-2">
            <span>Total Shipping Cost</span>
            <span className="text-blue-700 text-xl">${shippingCost.finalCost.toFixed(2)}</span>
          </div>
        </>
      ) : (
        <div className="text-xs text-muted-foreground py-4">Please select country and courier to estimate shipping cost.</div>
      )}
      {/* 温馨提示 */}
      <div className="text-xs text-blue-400 mt-2">
        * Shipping costs are estimates and may vary based on actual conditions.<br />
        * Additional fees may apply for remote areas or special handling.<br />
        * For more accurate rates, please proceed to checkout or contact customer service.
      </div>
    </div>
  );
} 