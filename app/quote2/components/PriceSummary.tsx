"use client";

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { calcPcbPriceV3 } from "@/lib/pcb-calc-v3";
import { getRealDeliveryDate } from "@/lib/productCycleCalc-v3";
import { useQuoteFormData, useQuoteCalculated } from "@/lib/stores/quote-store";
import { calculateLeadTime } from '@/lib/stores/quote-calculations';
import { useQuoteStore } from "@/lib/stores/quote-store";
import { useExchangeRate } from '@/lib/hooks/useExchangeRate';
import { calculateShippingCost } from "@/lib/shipping-calculator";
import { QuoteFormData as PcbQuoteForm } from "@/app/quote2/schema/quoteSchema";

interface PriceBreakdown {
  totalPrice: number;
  unitPrice: number;
  detail: Record<string, number>;
  notes: string[];
  minOrderQty: number;
  leadTime: string;
  totalCount: number;
}

interface ShippingInfo {
  cost: number;
  days: string;
  courierName: string;
  weight: number; // Chargeable weight
  actualWeight: number;
  volumetricWeight: number;
  error: string | null;
}

export default function PriceSummary() {
  const [showPriceDetails, setShowPriceDetails] = useState(false);
  const [showProductionCycleDetail, setShowProductionCycleDetail] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // 从 quote-store 获取数据
  const formData = useQuoteFormData();
  const calculated = useQuoteCalculated();
  const setCalValues = useQuoteStore((state) => state.setCalValues);
  
  // 获取实时汇率
  const { cnyToUsdRate } = useExchangeRate();

  // 确保只在客户端渲染
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 初始化汇率（如果需要）
  useEffect(() => {
    if (isClient && cnyToUsdRate <= 0) {
      // 如果汇率为0或负数，可以触发获取最新汇率
      // 这里暂时使用默认值，避免阻塞渲染
    }
  }, [isClient, cnyToUsdRate]);

  // CNY 转 USD 的辅助函数 - 使用实时汇率
  const convertCnyToUsd = (cnyAmount: number): number => {
    // 如果汇率无效，使用默认汇率 0.14
    const rate = cnyToUsdRate > 0 ? cnyToUsdRate : 0.14;
    return cnyAmount * rate;
  };

  // 运费计算逻辑
  const shippingInfo = useMemo((): ShippingInfo => {
    if (!isClient || !formData.shippingAddress?.courier || !formData.shippingAddress?.country) {
      return { cost: 0, days: "", courierName: "", weight: 0, actualWeight: 0, volumetricWeight: 0, error: null };
    }

    try {
      // 确保 formData 符合 PcbQuoteForm 类型
      const pcbFormData = formData as PcbQuoteForm;
      const { finalCost, deliveryTime, chargeableWeight, actualWeight, volumetricWeight } = calculateShippingCost(pcbFormData);
      
      const courier = formData.shippingAddress.courier;
      const courierInfo: Record<string, { courierName: string }> = {
        "dhl": { courierName: "DHL" },
        "fedex": { courierName: "FedEx" },
        "ups": { courierName: "UPS" },
        "standard": { courierName: "Standard Shipping" },
      };
      
      return {
        cost: finalCost,
        days: deliveryTime,
        courierName: courierInfo[courier]?.courierName || courier,
        weight: chargeableWeight,
        actualWeight: actualWeight,
        volumetricWeight: volumetricWeight,
        error: null,
      };
    } catch (e) {
      return {
        cost: 0,
        days: "N/A",
        courierName: formData.shippingAddress.courier,
        weight: 0,
        actualWeight: 0,
        volumetricWeight: 0,
        error: e instanceof Error ? e.message : "Shipping calculation failed",
      };
    }
  }, [formData, isClient]);

  // 使用 calcPcbPriceV3 进行价格计算（只做纯计算，不做副作用）
  const priceBreakdown = useMemo((): PriceBreakdown => {
    if (!isClient) {
      return {
        totalPrice: 0,
        unitPrice: 0,
        detail: {
          "PCB Cost": 0,
          "Shipping": 0,
          "Tax": 0,
          "Discount": 0
        },
        notes: ["Loading..."],
        minOrderQty: 0,
        leadTime: "TBD",
        totalCount: 0
      };
    }

    try {
      const { total, detail, notes } = calcPcbPriceV3(formData); // total 是 CNY
      const totalCount = calculated.totalQuantity;
      const pcbCostUsd = convertCnyToUsd(total); // 转换为 USD
      const unitPrice = totalCount > 0 ? pcbCostUsd / totalCount : 0;
      const leadTimeResult = calculateLeadTime(formData, new Date(), formData.delivery);
      
      // 转换detail中的价格
      const detailUsd: Record<string, number> = {};
      Object.entries(detail).forEach(([key, value]) => {
        detailUsd[key] = convertCnyToUsd(value);
      });
      
      return {
        totalPrice: pcbCostUsd,
        unitPrice,
        detail: {
          "PCB Cost": pcbCostUsd,
          "Shipping": shippingInfo.cost,
          "Tax": 0,
          "Discount": 0,
          ...detailUsd
        },
        notes: [...notes, `※ Prices converted from CNY to USD at rate ${cnyToUsdRate > 0 ? cnyToUsdRate : 0.14}`],
        minOrderQty: 5, // 默认最小起订量
        leadTime: `${leadTimeResult.cycleDays} days`,
        totalCount
      };
    } catch {
      // 可选：错误处理
      return {
        totalPrice: 0,
        unitPrice: 0,
        detail: {
          "PCB Cost": 0,
          "Shipping": 0,
          "Tax": 0,
          "Discount": 0
        },
        notes: ["Error calculating price - please check form data"],
        minOrderQty: 0,
        leadTime: "TBD",
        totalCount: 0
      };
    }
  }, [formData, calculated.totalQuantity, isClient, cnyToUsdRate, shippingInfo]);

  // 计算 calValues 并写入 store（副作用）
  useEffect(() => {
    if (!isClient) return;
    try {
      const { total, detail, notes } = calcPcbPriceV3(formData); // total 是 CNY
      const totalCount = calculated.totalQuantity;
      const pcbCostUsd = convertCnyToUsd(total); // 转换为 USD
      const unitPrice = totalCount > 0 ? pcbCostUsd / totalCount : 0;
      const leadTimeResult = calculateLeadTime(formData, new Date(), formData.delivery);
      const shippingCost = shippingInfo.cost;
      const shippingWeight = shippingInfo.weight;
      const actualWeight = shippingInfo.actualWeight;
      const volumetricWeight = shippingInfo.volumetricWeight;
      const courier = formData.shippingAddress?.courier || "";
      const courierDays = shippingInfo.days || "";
      const estimatedFinishDate = getRealDeliveryDate(new Date(), leadTimeResult.cycleDays).toISOString().slice(0, 10);

      // 转换detail中的价格为USD
      const detailUsd: Record<string, number> = {};
      Object.entries(detail).forEach(([key, value]) => {
        detailUsd[key] = convertCnyToUsd(value);
      });

      setCalValues({
        totalPrice: pcbCostUsd + shippingCost, // 总价：PCB(USD) + 运费(USD)
        pcbPrice: pcbCostUsd, // PCB价格转换为USD
        shippingCost, // 运费已经是USD
        shippingWeight,
        shippingActualWeight: actualWeight,
        shippingVolumetricWeight: volumetricWeight,
        tax: 0,
        discount: 0,
        unitPrice, // 单价基于USD
        minOrderQty: 5,
        totalCount,
        leadTimeResult: {
          cycleDays: leadTimeResult.cycleDays,
          reason: leadTimeResult.reason || [],
        },
        leadTimeDays: leadTimeResult.cycleDays,
        estimatedFinishDate,
        priceNotes: [...notes, `※ All prices converted to USD (rate: ${cnyToUsdRate > 0 ? cnyToUsdRate : 0.14})`],
        breakdown: detailUsd, // 价格明细转换为USD
        courier,
        courierDays,
        singlePcbArea: calculated.singlePcbArea,
        totalArea: calculated.totalArea,
      });
    } catch {
      // 可选：错误处理
    }
  }, [formData, calculated.totalQuantity, isClient, calculated.singlePcbArea, calculated.totalArea, setCalValues, cnyToUsdRate, shippingInfo]);

  // 获取生产周期信息
  const getProductionCycle = () => {
    if (!isClient) {
      // 服务端渲染时返回默认值
      return {
        standard: {
          type: "Standard",
          cycle: "TBD",
          finish: "TBD",
          reasons: []
        }
      };
    }
    
    // 检查数量是否为0
    if (calculated.totalQuantity === 0) {
      return {
        standard: {
          type: "Standard",
          cycle: "Please enter quantity",
          finish: "Please enter quantity",
          reasons: ["Quantity is required to calculate production cycle"]
        }
      };
    }

    const now = new Date();
    
    // 直接计算交期数据
    const leadTimeData = calculateLeadTime(formData, new Date(), formData.delivery);
    const standardFinish = getRealDeliveryDate(now, leadTimeData.cycleDays);
    
    // 添加调试信息
    if (process.env.NODE_ENV === 'development') {
        console.log('Production Cycle Debug:', {
        totalQuantity: calculated.totalQuantity,
        singleCount: formData.singleCount,
        shipmentType: formData.shipmentType,
        panelSet: formData.panelSet,
        panelDimensions: formData.panelDimensions,
        leadTimeData,
        cycleDays: leadTimeData.cycleDays,
        storeState: {
            hasHydrated: useQuoteStore.persist.hasHydrated(),
            isDirty: useQuoteStore.getState().isDirty,
            hasChanges: useQuoteStore.getState().hasChanges
        }
        });
    }
    
    return {
      standard: {
        type: "Standard",
        cycle: `${leadTimeData.cycleDays} day(s)`,
        finish: standardFinish.toISOString().slice(0, 10),
        reasons: leadTimeData.reason
      }
    };
  };

  const productionCycle = getProductionCycle();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-blue-600">Order Summary</h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Order Summary */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-blue-600 font-medium">PCB Cost</span>
            {!isClient ? (
              <span className="text-gray-400 text-sm italic">Loading...</span>
            ) : priceBreakdown.totalPrice === 0 ? (
              <span className="text-gray-400 text-sm italic">Enter details to calculate</span>
            ) : (
              <span className="font-semibold text-green-600">${priceBreakdown.totalPrice.toFixed(2)}</span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-600 font-medium">Shipping</span>
            {!isClient ? (
              <span className="text-gray-400 text-sm italic">Loading...</span>
            ) : shippingInfo.error ? (
              <span className="text-red-500 text-sm italic" title={shippingInfo.error}>Calculation Error</span>
            ) : shippingInfo.cost === 0 ? (
              <span className="text-gray-400 text-sm italic">Select courier to calculate</span>
            ) : (
              <span className="font-semibold text-green-600">$ {shippingInfo.cost.toFixed(2)}</span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-600 font-medium">Tax</span>
            {!isClient ? (
              <span className="text-gray-400 text-sm italic">Loading...</span>
            ) : (
              <span className="font-semibold">$ 0.00</span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-600 font-medium">Discount</span>
            {!isClient ? (
              <span className="text-gray-400 text-sm italic">Loading...</span>
            ) : (
              <span className="font-semibold text-green-600">-$0.00</span>
            )}
          </div>
          
          {/* Total Price */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-blue-700">Total</span>
              {!isClient ? (
                <span className="text-gray-400 text-lg italic">Loading...</span>
              ) : priceBreakdown.totalPrice === 0 && shippingInfo.cost === 0 ? (
                <span className="text-gray-400 text-lg italic">$0.00</span>
              ) : (
                <span className="text-lg font-bold text-blue-700">
                  ${(priceBreakdown.totalPrice + shippingInfo.cost).toFixed(2)}
                </span>
              )}
            </div>
            {isClient && calculated.totalQuantity > 0 && priceBreakdown.totalPrice > 0 && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-gray-500">Unit Price</span>
                <span className="text-sm text-gray-600">${priceBreakdown.unitPrice.toFixed(3)}/pc</span>
              </div>
            )}
            {isClient && shippingInfo.cost > 0 && shippingInfo.courierName && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-gray-500">via {shippingInfo.courierName}</span>
                <span className="text-sm text-gray-600">{shippingInfo.days} </span>
              </div>
            )}
          </div>
        </div>

        {/* Production Cycle */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <span className="text-blue-600 font-medium">Production Cycle</span>
            {isClient && calculated.totalQuantity > 0 && (
              <button
                type="button"
                className="text-xs text-blue-500 hover:underline transition-colors"
                onClick={() => setShowProductionCycleDetail(!showProductionCycleDetail)}
              >
                {showProductionCycleDetail ? "Hide Detail" : "Show Production Cycle Detail"}
              </button>
            )}
          </div>
          
          {!isClient ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-blue-600 text-sm font-medium mb-1">
                Loading...
              </div>
              <div className="text-blue-500 text-xs">
                Loading production cycle info
              </div>
            </div>
          ) : calculated.totalQuantity === 0 ? (
            // 当数量为0时显示友好提示
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-blue-600 text-sm font-medium mb-1">
                Ready to Calculate Production Time
              </div>
              <div className="text-blue-500 text-xs">
                Please enter your PCB quantity to see lead time and delivery date
              </div>
            </div>
          ) : (
            // 当有数量时显示正常信息
            <>
              <div className="flex justify-between items-center mb-3">
                <span className="text-blue-600 font-medium">Lead Time</span>
                <span className="font-semibold text-green-600">
                  {productionCycle.standard.cycle}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-blue-600 font-medium">Est. Finish</span>
                <span className="font-semibold text-green-600">
                  {productionCycle.standard.finish}
                </span>
              </div>

              {/* 生产周期详细信息 */}
              {showProductionCycleDetail && (
                <div className="mt-3">
                  <div className="bg-gray-50 rounded-md p-3">
                    <div className="font-medium text-xs text-blue-700 mb-2">
                      Production Details:
                    </div>
                    <ul className="text-xs text-gray-600 space-y-0.5">
                      {productionCycle.standard.reasons.map((reason: string, idx: number) => (
                        <li key={idx} className="text-xs leading-relaxed">• {reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Show Price Details Toggle - 只在开发模式下显示 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="pt-4 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={() => setShowPriceDetails(!showPriceDetails)}
              className="w-full justify-start text-blue-600 hover:text-blue-700 p-0"
            >
              {showPriceDetails ? (
                <ChevronDown className="h-4 w-4 mr-2" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-2" />
              )}
              Show Price Details
            </Button>
          </div>
        )}

        {/* Show Debug Toggle - 只在开发模式下显示 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="pt-2">
            <Button
              variant="ghost"
              onClick={() => setShowDebug(!showDebug)}
              className="w-full justify-start text-blue-600 hover:text-blue-700 p-0"
            >
              {showDebug ? (
                <ChevronDown className="h-4 w-4 mr-2" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-2" />
              )}
              Show Debug
            </Button>
            {showDebug && (
              <div className="mt-2 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                >
                  Clear Storage & Reload
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Debug Information */}
        {showDebug && process.env.NODE_ENV === 'development' && (
          <div className="space-y-2 text-xs bg-gray-50 rounded-lg p-3 max-h-64 overflow-y-auto">
            <div className="font-medium text-gray-700 mb-2">Current Form Values:</div>
            <pre className="whitespace-pre-wrap text-xs text-gray-600 font-mono">
              {JSON.stringify(formData, null, 2)}
            </pre>
            <div className="font-medium text-gray-700 mb-2 mt-4">Calculated Properties:</div>
            <pre className="whitespace-pre-wrap text-xs text-gray-600 font-mono">
              {JSON.stringify(calculated, null, 2)}
            </pre>
            <div className="font-medium text-gray-700 mb-2 mt-4">Quantity Debug:</div>
            <div className="text-xs text-gray-600">
              <p>Shipment Type: {formData.shipmentType}</p>
              <p>Single Count: {formData.singleCount}</p>
              <p>Panel Set: {formData.panelSet}</p>
              <p>Panel Dimensions: {formData.panelDimensions?.row} x {formData.panelDimensions?.column}</p>
              <p>Calculated Total Quantity: {calculated.totalQuantity}</p>
            </div>
          </div>
        )}

        {/* Price Details (Collapsible) - 只在开发模式下显示 */}
        {showPriceDetails && process.env.NODE_ENV === 'development' && (
          <div className="space-y-4 text-sm bg-gray-50 rounded-lg p-3">
            {/* Price Breakdown */}
            <div>
              <div className="font-medium text-gray-700 mb-2">Price Breakdown:</div>
              <div className="space-y-2">
                {!isClient ? (
                  <div className="text-gray-400 text-sm italic">Loading...</div>
                ) : Object.entries(priceBreakdown.detail)
                  .filter(([key]) => !["PCB Cost", "Shipping", "Tax", "Discount"].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className={`font-medium ${value > 0 ? 'text-blue-600' : value < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                        {value > 0 ? '+' : ''}${Math.abs(value).toFixed(2)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Price Notes */}
            {isClient && priceBreakdown.notes.length > 0 && (
              <div className="pt-3 border-t border-gray-200">
                <h4 className="font-medium text-gray-700 mb-2">Price Notes:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  {priceBreakdown.notes.map((note, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* 显示 store 中的计算属性 */}
            <div className="pt-3 border-t border-gray-200">
              <div className="font-medium text-gray-700 mb-2">Calculated Properties:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pannel/Single unit Area:</span>
                  <span className="font-medium">{isClient ? `${calculated.singlePcbArea.toFixed(2)} cm²` : 'Loading...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Area:</span>
                  <span className="font-medium">{isClient ? `${calculated.totalArea.toFixed(2)} cm²` : 'Loading...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{isClient ? `${calculated.totalQuantity} pcs` : 'Loading...'}</span>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Disclaimer */}
        <div className="text-sm text-gray-500 text-center">
          For reference only, final price is subject to review.
        </div>

        {/* Order Details - Always Show */}
        <div className="pt-4 border-t border-gray-200 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Quantity:</span>
              {!isClient ? (
                <span className="text-gray-400 italic">Loading...</span>
              ) : priceBreakdown.totalCount === 0 ? (
                <span className="text-gray-400 italic">Not set</span>
              ) : (
                <span className="font-medium">{priceBreakdown.totalCount} pcs</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Unit Price:</span>
              {!isClient ? (
                <span className="text-gray-400 italic">Loading...</span>
              ) : priceBreakdown.totalCount === 0 || priceBreakdown.totalPrice === 0 ? (
                <span className="text-gray-400 italic">-</span>
              ) : (
                <span className="font-medium">${priceBreakdown.unitPrice.toFixed(3)}</span>
              )}
            </div>
            {isClient && priceBreakdown.minOrderQty > 0 && (
              <div className="flex justify-between col-span-2">
                <span className="text-gray-600">Min Order Qty:</span>
                <span className="font-medium">{priceBreakdown.minOrderQty} pcs</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-600">PCB Area:</span>
              <span className="font-medium">{isClient ? `${calculated.singlePcbArea.toFixed(4)} m²` : 'Loading...'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Area:</span>
              {!isClient ? (
                <span className="text-gray-400 italic">Loading...</span>
              ) : calculated.totalQuantity === 0 ? (
                <span className="text-gray-400 italic">-</span>
              ) : (
                <span className="font-medium">{isClient ? `${calculated.totalArea.toFixed(4)} m²` : 'Loading...'}</span>
              )}
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-gray-600">Chargeable Weight:</span>
              {!isClient ? (
                <span className="text-gray-400 italic">Loading...</span>
              ) : shippingInfo.weight > 0 ? (
                <span className="font-medium">{shippingInfo.weight.toFixed(2)} kg</span>
              ) : (
                <span className="text-gray-400 italic">-</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Actual Weight:</span>
              {!isClient ? (
                <span className="text-gray-400 italic">Loading...</span>
              ) : shippingInfo.actualWeight > 0 ? (
                <span className="font-medium">{shippingInfo.actualWeight.toFixed(2)} kg</span>
              ) : (
                <span className="text-gray-400 italic">-</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Volume Weight:</span>
              {!isClient ? (
                <span className="text-gray-400 italic">Loading...</span>
              ) : shippingInfo.volumetricWeight > 0 ? (
                <span className="font-medium">{shippingInfo.volumetricWeight.toFixed(2)} kg</span>
              ) : (
                <span className="text-gray-400 italic">-</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 