"use client";

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";
import { calcPcbPriceV3 } from "@/lib/pcb-calc-v3";
import { calcProductionCycle, getRealDeliveryDate } from "@/lib/pcb-calc";
import { PcbQuoteForm } from "@/types/pcbQuoteForm";
import { useQuoteFormData, useQuoteCalculated } from "@/lib/stores/quote-store";
import type { QuoteFormData } from "../schema/quoteSchema";

interface PriceBreakdown {
  totalPrice: number;
  unitPrice: number;
  detail: Record<string, number>;
  notes: string[];
  minOrderQty: number;
  leadTime: string;
  totalCount: number;
}

export default function PriceSummary() {
  const [showDetails, setShowDetails] = useState(false);
  const [showPriceDetails, setShowPriceDetails] = useState(false);
  const [showProductionCycleDetail, setShowProductionCycleDetail] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // 从 quote-store 获取数据
  const formData = useQuoteFormData();
  const calculated = useQuoteCalculated();

  // 确保只在客户端渲染
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 使用 calcPcbPriceV3 进行价格计算
  const priceBreakdown = useMemo((): PriceBreakdown => {
    if (!isClient) {
      // 服务端渲染时返回默认值
      return {
        totalPrice: 0,
        unitPrice: 0,
        detail: {
          "PCB Cost": 0,
          "Shipping": 0,
          "Tax": 0,
          "Discount": 0
        },
        notes: [],
        minOrderQty: 0,
        leadTime: "TBD",
        totalCount: 0
      };
    }

    try {
      const { total, detail, notes } = calcPcbPriceV3(formData);
      
      // 使用 store 中的计算属性获取总数量
      const totalCount = calculated.totalQuantity;
      
      // 计算单价
      const unitPrice = totalCount > 0 ? total / totalCount : 0;
      
      return {
        totalPrice: total,
        unitPrice,
        detail: {
          "PCB Cost": total,
          "Shipping": 0,
          "Tax": 0,
          "Discount": 0,
          ...detail
        },
        notes,
        minOrderQty: 5, // 默认最小起订量
        leadTime: `${calculated.estimatedLeadTime} days`, // 使用 store 中的预估交期
        totalCount
      };
    } catch (error) {
      console.error("Price calculation error:", error);
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
  }, [formData, calculated.totalQuantity, calculated.estimatedLeadTime, isClient]);

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
        },
        urgent: {
          type: "Urgent",
          cycle: "TBD",
          finish: "TBD",
          available: false,
          reasons: []
        }
      };
    }

    // 将 QuoteFormData 转换为 PcbQuoteForm 格式
    const convertToPcbQuoteForm = (data: QuoteFormData): Partial<PcbQuoteForm> => {
      return {
        pcbType: data.pcbType,
        layers: data.layers,
        thickness: data.thickness,
        hdi: data.hdi,
        tg: data.tg,
        shipmentType: data.shipmentType,
        singleDimensions: {
          length: data.singleDimensions?.length || 5,
          width: data.singleDimensions?.width || 5,
        },
        singleCount: data.singleCount,
        panelDimensions: data.panelDimensions,
        panelSet: data.panelSet,
        differentDesignsCount: data.differentDesignsCount,
        outerCopperWeight: data.outerCopperWeight,
        innerCopperWeight: data.innerCopperWeight,
        minTrace: data.minTrace,
        minHole: data.minHole,
        solderMask: data.solderMask,
        silkscreen: data.silkscreen,
        surfaceFinish: data.surfaceFinish,
        impedance: data.impedance,
        castellated: data.castellated,
        goldFingers: data.goldFingers,
        edgePlating: data.edgePlating,
        testMethod: data.testMethod,
        productReport: data.productReport,
        // 添加其他需要的字段...
      };
    };

    const pcbForm = convertToPcbQuoteForm(formData);
    const now = new Date();
    
    // 计算标准和加急生产周期
    const standardInfo = calcProductionCycle(pcbForm as PcbQuoteForm, now, 'standard');
    const urgentInfo = calcProductionCycle(pcbForm as PcbQuoteForm, now, 'urgent');
    
    const standardFinish = getRealDeliveryDate(now, standardInfo.cycleDays);
    const urgentFinish = getRealDeliveryDate(now, urgentInfo.cycleDays);
    
    const isUrgent = formData.testMethod === "Test Fixture" || (formData.layers && formData.layers > 6);
    
    return {
      standard: {
        type: "Standard",
        cycle: `${standardInfo.cycleDays} day(s)`,
        finish: standardFinish.toISOString().slice(0, 10),
        reasons: standardInfo.reason
      },
      urgent: {
        type: "Urgent",
        cycle: `${urgentInfo.cycleDays} day(s)`,
        finish: urgentFinish.toISOString().slice(0, 10),
        available: isUrgent,
        reasons: urgentInfo.reason
      }
    };
  };

  const productionCycle = getProductionCycle();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-blue-600">Order Summary</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-600 hover:text-blue-700"
        >
          {showDetails ? (
            <>
              <EyeOff className="h-4 w-4 mr-1" />
              Hide Detail
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-1" />
              Show Detail
            </>
          )}
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Order Summary */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-blue-600 font-medium">PCB Cost</span>
            <span className="font-semibold">${priceBreakdown.totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-600 font-medium">Shipping</span>
            <span className="font-semibold">$ 0.00</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-600 font-medium">Tax</span>
            <span className="font-semibold">$ 0.00</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-600 font-medium">Discount</span>
            <span className="font-semibold text-green-600">-$0.00</span>
          </div>
        </div>

        {/* Production Cycle */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <span className="text-blue-600 font-medium">Production Cycle</span>
            <button
              type="button"
              className="text-xs text-blue-500 hover:underline transition-colors"
              onClick={() => setShowProductionCycleDetail(!showProductionCycleDetail)}
            >
              {showProductionCycleDetail ? "Hide Detail" : "Show Production Cycle Detail"}
            </button>
          </div>
          
          <div className="flex justify-between items-center mb-3">
            <span className="text-blue-600 font-medium">Lead Time</span>
            <span className="font-semibold">{productionCycle.standard.cycle}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-blue-600 font-medium">Est. Finish</span>
            <span className="font-semibold">{productionCycle.standard.finish}</span>
          </div>

          {/* 生产周期详细信息 */}
          {showProductionCycleDetail && (
            <div className="mt-3">
              <div className="bg-gray-50 rounded-md p-3">
                <div className="font-medium text-xs text-blue-700 mb-2">
                  Production Details:
                </div>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {productionCycle.standard.reasons.map((reason, idx) => (
                    <li key={idx} className="text-xs leading-relaxed">• {reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Show Price Details Toggle */}
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
          </div>
        )}

        {/* Price Details (Collapsible) */}
        {showPriceDetails && (
          <div className="space-y-4 text-sm bg-gray-50 rounded-lg p-3">
            {/* Price Breakdown */}
            <div>
              <div className="font-medium text-gray-700 mb-2">Price Breakdown:</div>
              <div className="space-y-2">
                {Object.entries(priceBreakdown.detail)
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
            {priceBreakdown.notes.length > 0 && (
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
                  <span className="text-gray-600">Complexity:</span>
                  <span className="font-medium">{isClient ? calculated.complexityLevel : 'Loading...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium">{isClient ? calculated.priceCategory : 'Loading...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">PCB Area:</span>
                  <span className="font-medium">{isClient ? `${calculated.singlePcbArea.toFixed(2)} cm²` : 'Loading...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Area:</span>
                  <span className="font-medium">{isClient ? `${calculated.totalArea.toFixed(2)} cm²` : 'Loading...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Est. Weight:</span>
                  <span className="font-medium">{isClient ? `${calculated.estimatedWeight.toFixed(1)}g` : 'Loading...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Difficulty:</span>
                  <span className="font-medium">{isClient ? `${calculated.productionDifficulty}/10` : 'Loading...'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="text-sm text-gray-500 text-center">
          For reference only, final price is subject to review.
        </div>

        {/* Additional Details (when showDetails is true) */}
        {showDetails && (
          <div className="pt-4 border-t border-gray-200 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-medium">{priceBreakdown.totalCount} pcs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unit Price:</span>
                <span className="font-medium">${priceBreakdown.unitPrice.toFixed(3)}</span>
              </div>
              {priceBreakdown.minOrderQty > 0 && (
                <div className="flex justify-between col-span-2">
                  <span className="text-gray-600">Min Order Qty:</span>
                  <span className="font-medium">{priceBreakdown.minOrderQty} pcs</span>
                </div>
              )}
              
              {/* 显示更多 store 中的计算属性 */}
              <div className="flex justify-between">
                <span className="text-gray-600">Multi-Layer:</span>
                <span className="font-medium">{isClient ? (calculated.isMultiLayer ? 'Yes' : 'No') : 'Loading...'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">HDI:</span>
                <span className="font-medium">{isClient ? (calculated.isHDI ? 'Yes' : 'No') : 'Loading...'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Impedance:</span>
                <span className="font-medium">{isClient ? (calculated.requiresImpedance ? 'Yes' : 'No') : 'Loading...'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Special Finish:</span>
                <span className="font-medium">{isClient ? (calculated.hasSpecialFinish ? 'Yes' : 'No') : 'Loading...'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 