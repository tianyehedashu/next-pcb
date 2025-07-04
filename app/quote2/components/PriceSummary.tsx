"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
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
import { useProductCalculation } from "../hooks/useProductCalculation";
import { DeliveryType } from "../schema/shared-types";
import { StencilPriceExplainer } from "./StencilPriceExplainer";

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
  
  // === 新增：修复hydration不匹配问题 ===
  const [clientProductType, setClientProductType] = useState<string>('PCB'); // 默认为PCB避免hydration不匹配

  // 从 quote-store 获取数据
  const formData = useQuoteFormData();
  const calculated = useQuoteCalculated();
  const setCalValues = useQuoteStore((state) => state.setCalValues);
  
  // 获取实时汇率
  const { cnyToUsdRate } = useExchangeRate();

  // === 新增：产品计算Hook ===
  const { calculator, getProductType, isStencilProduct } = useProductCalculation();

  // 运费计算状态
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    cost: 0,
    days: "",
    courierName: "",
    weight: 0,
    actualWeight: 0,
    volumetricWeight: 0,
    error: null
  });

  // 确保只在客户端渲染 + 更新产品类型
  useEffect(() => {
    setIsClient(true);
    // 客户端加载后立即更新产品类型显示
    setClientProductType(isStencilProduct() ? 'Stencil' : 'PCB');
  }, [isStencilProduct]);

  // 监听产品类型变化并更新显示
  useEffect(() => {
    if (isClient) {
      setClientProductType(isStencilProduct() ? 'Stencil' : 'PCB');
    }
  }, [isClient, isStencilProduct, formData]);

  // CNY 转 USD 的辅助函数 - 使用实时汇率
  const convertCnyToUsd = useCallback((cnyAmount: number): number => {
    // 如果汇率无效，使用默认汇率 0.14
    const rate = cnyToUsdRate > 0 ? cnyToUsdRate : 0.14;
    return cnyAmount * rate;
  }, [cnyToUsdRate]);

  // 运费计算逻辑（异步）- 使用防抖避免频繁计算
  useEffect(() => {
    if (!isClient) {
      return;
    }

    // 防抖：延迟执行，避免快速连续的状态变化触发多次计算
    const timeoutId = setTimeout(async () => {
      // 优先使用 shippingAddress，如果没有则使用 shippingCostEstimation
      const hasShippingAddress = formData.shippingAddress?.country && formData.shippingAddress?.courier;
      const hasShippingEstimation = formData.shippingCostEstimation?.country && formData.shippingCostEstimation?.courier;
      
      if (!hasShippingAddress && !hasShippingEstimation) {
        setShippingInfo({ 
          cost: 0, 
          days: "", 
          courierName: "", 
          weight: 0, 
          actualWeight: 0, 
          volumetricWeight: 0, 
          error: "Please select shipping country and courier to calculate shipping cost" 
        });
        return;
      }

      // 检查是否有足够的PCB信息进行重量计算
      if (calculated.totalQuantity === 0) {
        setShippingInfo({ 
          cost: 0, 
          days: "", 
          courierName: hasShippingAddress ? formData.shippingAddress.courier : formData.shippingCostEstimation?.courier || "", 
          weight: 0, 
          actualWeight: 0, 
          volumetricWeight: 0, 
          error: "Please enter PCB quantity to calculate shipping cost" 
        });
        return;
      }

      try {
        // 创建一个临时的 formData 对象，确保 shippingAddress 有正确的数据
        let tempFormData = formData;
        
        if (!hasShippingAddress && hasShippingEstimation) {
          // 如果没有完整的 shippingAddress，但有 shippingCostEstimation，则使用估算数据
          tempFormData = {
            ...formData,
            shippingAddress: {
              country: formData.shippingCostEstimation?.country || "",
              courier: formData.shippingCostEstimation?.courier || "",
              // 其他字段使用默认值，因为运费计算只需要 country 和 courier
              state: "",
              city: "",
              address: "",
              zipCode: "",
              phone: "",
              contactName: "",
            }
          };
        }
        
        const shippingResult = await calculateShippingCost(tempFormData as PcbQuoteForm);
        const { finalCost, deliveryTime, chargeableWeight, actualWeight, volumetricWeight } = shippingResult;
        
        // 🔧 重要：运费计算器现在返回人民币，需要转换为美元
        const shippingCostUSD = convertCnyToUsd(finalCost);
        
        const courier = tempFormData.shippingAddress?.courier || "";
        const courierInfo: Record<string, { courierName: string }> = {
          "dhl": { courierName: "DHL" },
          "fedex": { courierName: "FedEx" },
          "ups": { courierName: "UPS" },
          "standard": { courierName: "Standard Shipping" },
        };
        
        setShippingInfo({
          cost: shippingCostUSD, // 返回转换后的美元金额
          days: deliveryTime,
          courierName: courierInfo[courier]?.courierName || courier,
          weight: chargeableWeight,
          actualWeight: actualWeight,
          volumetricWeight: volumetricWeight,
          error: null,
        });
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Shipping calculation failed";
        console.error('运费计算失败:', e);
        setShippingInfo({
          cost: 0,
          days: "N/A",
          courierName: hasShippingAddress ? formData.shippingAddress.courier : formData.shippingCostEstimation?.courier || "",
          weight: 0,
          actualWeight: 0,
          volumetricWeight: 0,
          error: errorMessage,
        });
      }
    }, 300); // 300ms 防抖延迟

    // 清理函数：取消之前的定时器
    return () => clearTimeout(timeoutId);
  }, [formData, isClient, calculated.totalQuantity, convertCnyToUsd]);

  // 统一产品价格计算（支持PCB和钢网）
  const priceBreakdown = useMemo((): PriceBreakdown => {
    if (!isClient) {
      return {
        totalPrice: 0,
        unitPrice: 0,
        detail: {
          "Product Cost": 0,
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
      const isStencil = isStencilProduct();
      
      let total: number, detail: Record<string, number>, notes: string[];
      let productLabel: string;
      
      if (isStencil) {
        // 钢网价格计算
        const stencilResult = calculator.calculatePrice(formData);
        total = stencilResult.totalPrice; // 修正：使用totalPrice字段
        detail = stencilResult.breakdown || {};
        notes = stencilResult.notes || [];
        productLabel = "Stencil Cost";
      } else {
        // PCB价格计算（使用原有逻辑）
        const pcbResult = calcPcbPriceV3(formData);
        total = pcbResult.total; // CNY
        detail = pcbResult.detail;
        notes = pcbResult.notes;
        productLabel = "PCB Cost";
      }

      const totalCount = calculated.totalQuantity;
      const productCostUsd = convertCnyToUsd(total); // 转换为 USD
      const unitPrice = totalCount > 0 ? productCostUsd / totalCount : 0;
      
      // 计算交期
      let leadTimeDays: number;
      
      if (isStencil) {
        // 钢网交期计算
        leadTimeDays = calculator.calculateLeadTime(formData as any); // 钢网计算器不需要日期参数
      } else {
        // PCB交期计算
        const leadTimeResult = calculateLeadTime(formData, new Date(), 'standard');
        leadTimeDays = leadTimeResult.cycleDays;
      }
      
      // 转换detail中的价格
      const detailUsd: Record<string, number> = {};
      Object.entries(detail).forEach(([key, value]) => {
        detailUsd[key] = convertCnyToUsd(value);
      });
      
      return {
        totalPrice: productCostUsd,
        unitPrice,
        detail: {
          [productLabel]: productCostUsd,
          "Shipping": shippingInfo.cost,
          "Tax": 0,
          "Discount": 0,
          ...detailUsd
        },
        notes: [...notes, `※ Prices converted from CNY to USD at rate ${cnyToUsdRate > 0 ? cnyToUsdRate : 0.14}`],
        minOrderQty: isStencil ? 1 : 5, // 钢网最小起订量为1
        leadTime: `${leadTimeDays} days`,
        totalCount
      };
    } catch (error) {
      console.error('Price calculation error:', error);
      return {
        totalPrice: 0,
        unitPrice: 0,
        detail: {
          "Product Cost": 0,
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
  }, [formData, calculated.totalQuantity, isClient, convertCnyToUsd, shippingInfo.cost, calculator, getProductType, isStencilProduct]);

  // 计算 calValues 并写入 store（副作用）
  useEffect(() => {
    if (!isClient) return;
    try {
      const isStencil = isStencilProduct();
      let total: number, detail: Record<string, number>, notes: string[];
      
      if (isStencil) {
        // 钢网价格计算
        const stencilResult = calculator.calculatePrice(formData);
        total = stencilResult.totalPrice; // CNY
        detail = stencilResult.breakdown || {};
        notes = stencilResult.notes || [];
      } else {
        // PCB价格计算（使用原有逻辑）
        const pcbResult = calcPcbPriceV3(formData);
        total = pcbResult.total; // CNY
        detail = pcbResult.detail;
        notes = pcbResult.notes;
      }

      const totalCount = calculated.totalQuantity;
      const productCostUsd = convertCnyToUsd(total); // 转换为 USD
      const unitPrice = totalCount > 0 ? productCostUsd / totalCount : 0;
      
      // 计算交期
      let leadTimeDays: number;
      
      if (isStencil) {
        // 钢网交期计算
        leadTimeDays = calculator.calculateLeadTime(formData as any);
      } else {
        // PCB交期计算
        const leadTimeResult = calculateLeadTime(formData, new Date(), 'standard'); // 转换为字符串
        leadTimeDays = leadTimeResult.cycleDays;
      }

      const shippingCost = shippingInfo.cost;
      const shippingWeight = shippingInfo.weight;
      const actualWeight = shippingInfo.actualWeight;
      const volumetricWeight = shippingInfo.volumetricWeight;
      const courier = formData.shippingAddress?.courier || "";
      const courierDays = shippingInfo.days || "";
      const estimatedFinishDate = new Date(Date.now() + leadTimeDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      // 转换detail中的价格为USD
      const detailUsd: Record<string, number> = {};
      Object.entries(detail).forEach(([key, value]) => {
        detailUsd[key] = convertCnyToUsd(value);
      });

      // 根据产品类型设置不同的计算值结构
      if (isStencil) {
        // 钢网计算值 - 使用新的分离结构
        const stencilCalculation = {
          stencilPrice: productCostUsd, // 钢网产品价格（USD，不含运费）
          stencilArea: calculated.singlePcbArea, // 钢网面积（重用面积计算）
          totalWeight: shippingWeight, // 钢网总重量
          breakdown: detailUsd, // 钢网价格明细
        };

        setCalValues({
          // === 产品类型标识 ===
          product_type: 'stencil',
          
          // === 通用计算值（所有产品类型共享） ===
          totalPrice: productCostUsd + shippingCost, // 总价（产品+运费）
          unitPrice, // 单价
          totalCount, // 总数量
          minOrderQty: 1, // 钢网最小起订量
          
          // 交期相关
          leadTimeDays,
          leadTimeResult: {
            cycleDays: leadTimeDays,
            reason: [`Stencil manufacturing: ${leadTimeDays} days`],
          },
          estimatedFinishDate,
          
          // 运费相关
          shippingCost,
          shippingWeight,
          shippingActualWeight: actualWeight,
          shippingVolumetricWeight: volumetricWeight,
          courier,
          courierDays,
          
          // 税费和折扣
          tax: 0,
          discount: 0,
          
          // 价格说明
          priceNotes: [...notes, `※ All prices converted to USD (rate: ${cnyToUsdRate > 0 ? cnyToUsdRate : 0.14})`],
          
          // === 钢网专用计算值 ===
          stencil_calculation: stencilCalculation,
          
          // === 向后兼容字段（暂时保留） ===
          pcbPrice: productCostUsd, // 临时兼容
          breakdown: detailUsd,
          singlePcbArea: calculated.singlePcbArea,
          totalArea: calculated.totalArea,
        });
      } else {
        // PCB计算值 - 使用新的分离结构
        const pcbCalculation = {
          pcbPrice: productCostUsd, // PCB产品价格（USD，不含运费）
          singlePcbArea: calculated.singlePcbArea, // 单片PCB面积
          totalArea: calculated.totalArea, // 总PCB面积
          breakdown: detailUsd, // PCB价格明细
        };

        setCalValues({
          // === 产品类型标识 ===
          product_type: 'pcb',
          
          // === 通用计算值（所有产品类型共享） ===
          totalPrice: productCostUsd + shippingCost, // 总价（产品+运费）
          unitPrice, // 单价
          totalCount, // 总数量
          minOrderQty: 5, // PCB最小起订量
          
          // 交期相关
          leadTimeDays,
          leadTimeResult: {
            cycleDays: leadTimeDays,
            reason: [`PCB manufacturing: ${leadTimeDays} days`],
          },
          estimatedFinishDate,
          
          // 运费相关
          shippingCost,
          shippingWeight,
          shippingActualWeight: actualWeight,
          shippingVolumetricWeight: volumetricWeight,
          courier,
          courierDays,
          
          // 税费和折扣
          tax: 0,
          discount: 0,
          
          // 价格说明
          priceNotes: [...notes, `※ All prices converted to USD (rate: ${cnyToUsdRate > 0 ? cnyToUsdRate : 0.14})`],
          
          // === PCB专用计算值 ===
          pcb_calculation: pcbCalculation,
          
          // === 向后兼容字段（暂时保留） ===
          pcbPrice: productCostUsd,
          breakdown: detailUsd,
          singlePcbArea: calculated.singlePcbArea,
          totalArea: calculated.totalArea,
        });
      }
    } catch (error) {
      console.error('Price calculation error in calValues update:', error);
      // 出错时仍然设置基本值
      setCalValues({
        totalPrice: 0,
        pcbPrice: 0,
        shippingCost: 0,
        shippingWeight: 0,
        shippingActualWeight: 0,
        shippingVolumetricWeight: 0,
        tax: 0,
        discount: 0,
        unitPrice: 0,
        minOrderQty: isStencilProduct() ? 1 : 5,
        totalCount: 0,
        leadTimeResult: {
          cycleDays: 0,
          reason: ['Error calculating lead time'],
        },
        leadTimeDays: 0,
        estimatedFinishDate: new Date().toISOString().slice(0, 10),
        priceNotes: ['Price calculation error - please check form data'],
        breakdown: {},
        courier: "",
        courierDays: "",
        singlePcbArea: calculated.singlePcbArea,
        totalArea: calculated.totalArea,
      });
    }
  }, [formData, calculated.totalQuantity, isClient, calculated.singlePcbArea, calculated.totalArea, setCalValues, shippingInfo.cost, shippingInfo.weight, shippingInfo.actualWeight, shippingInfo.volumetricWeight, shippingInfo.days, convertCnyToUsd, calculator, isStencilProduct]);

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
    const delivery = formData.deliveryOptions?.delivery || 'standard';
    const leadTimeData = calculateLeadTime(formData, new Date(), delivery);
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
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
          Order Summary
        </h2>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Price Summary */}
        <div className="space-y-2">
          <div className="flex justify-between items-center py-1">
            <span className="text-sm font-medium text-gray-700">
              {clientProductType} Cost
            </span>
            {!isClient ? (
              <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
                          ) : priceBreakdown.totalPrice === 0 ? (
              <span className="text-gray-400 text-sm">Enter details to calculate</span>
            ) : (
              <span className="font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">${priceBreakdown.totalPrice.toFixed(2)}</span>
            )}
          </div>

          {/* === 新增：钢网价格明细展开 === */}
          {isClient && clientProductType === 'Stencil' && priceBreakdown.totalPrice > 0 && (
            <div className="ml-4 mt-2">
              <StencilPriceExplainer 
                priceBreakdown={priceBreakdown.detail}
                totalPrice={priceBreakdown.totalPrice}
                showDetails={showPriceDetails}
              />
            </div>
          )}

          {/* === 新增：PCB价格明细展开 === */}
          {isClient && clientProductType === 'PCB' && priceBreakdown.totalPrice > 0 && showPriceDetails && (
            <div className="ml-4 space-y-1 border-l-2 border-blue-100 pl-3 bg-blue-50/30 py-2 rounded-r">
              {Object.entries(priceBreakdown.detail)
                .filter(([key]) => !["PCB Cost", "Shipping", "Tax", "Discount"].includes(key))
                .map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 capitalize">
                      • {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className={`font-medium ${value >= 0 ? 'text-gray-700' : 'text-blue-600'}`}>
                      {value >= 0 ? '+' : ''}${value.toFixed(2)}
                    </span>
                  </div>
                ))}
            </div>
          )}
          
          <div className="flex justify-between items-center py-1">
            <span className="text-sm font-medium text-gray-700">Shipping</span>
            {!isClient ? (
              <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
            ) : shippingInfo.error ? (
              <div className="flex flex-col items-end">
                <span className="text-amber-600 text-xs bg-amber-50 px-2 py-1 rounded border border-amber-200" title={shippingInfo.error}>
                  Need Info
                </span>
                <span className="text-xs text-gray-500 mt-1 max-w-32 text-right leading-tight">
                  {shippingInfo.error.includes("country") || shippingInfo.error.includes("courier") ? "Select shipping options" : 
                   shippingInfo.error.includes("quantity") ? "Enter quantity" : "Missing info"}
                </span>
              </div>
            ) : shippingInfo.cost === 0 ? (
              <span className="text-gray-400 text-sm">Calculating...</span>
            ) : (
              <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">${shippingInfo.cost.toFixed(2)}</span>
            )}
          </div>
          
          {/* Only show Tax if it's not 0 */}
          {isClient && priceBreakdown.detail.Tax !== 0 && (
            <div className="flex justify-between items-center py-1">
              <span className="text-sm font-medium text-gray-700">Tax</span>
              <span className="font-semibold text-gray-900">${priceBreakdown.detail.Tax.toFixed(2)}</span>
            </div>
          )}
          
          {/* Only show Discount if it's not 0 */}
          {isClient && priceBreakdown.detail.Discount !== 0 && (
            <div className="flex justify-between items-center py-1">
              <span className="text-sm font-medium text-gray-700">Discount</span>
              <span className="font-semibold text-gray-900">-${Math.abs(priceBreakdown.detail.Discount).toFixed(2)}</span>
            </div>
          )}
          
          {/* Total Price */}
          <div className="border-t-2 border-blue-100 pt-3 mt-3 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 -mx-6 px-6 pb-3 rounded-b-lg">
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-gray-900 flex items-center">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                Total
              </span>
              {!isClient ? (
                <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
              ) : priceBreakdown.totalPrice === 0 && shippingInfo.cost === 0 ? (
                <span className="text-gray-400 text-base">$0.00</span>
              ) : (
                <span className="text-xl font-bold text-blue-600 bg-white px-3 py-1 rounded-md shadow-sm">
                  ${(priceBreakdown.totalPrice + shippingInfo.cost).toFixed(2)}
                </span>
              )}
            </div>
            
                        {/* Unit Price */}
            <div className="mt-2 space-y-1">
            {isClient && calculated.totalQuantity > 0 && priceBreakdown.totalPrice > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Unit Price</span>
                  <span className="text-xs font-medium text-gray-700">${priceBreakdown.unitPrice.toFixed(3)}/pc</span>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Production Cycle */}
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              {clientProductType === 'Stencil' ? 'Manufacturing Cycle' : 'Production Cycle'}
            </h3>
            {process.env.NODE_ENV === 'development' && isClient && calculated.totalQuantity > 0 && (
              <button
                type="button"
                className="text-xs text-gray-600 hover:text-gray-800 hover:underline transition-colors"
                onClick={() => setShowProductionCycleDetail(!showProductionCycleDetail)}
              >
                {showProductionCycleDetail ? "Hide Details" : "Show Details"}
              </button>
            )}
          </div>
          
          {!isClient ? (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-center">
              <div className="animate-pulse space-y-2">
                <div className="bg-gray-200 h-3 w-24 rounded mx-auto"></div>
                <div className="bg-gray-200 h-2 w-32 rounded mx-auto"></div>
              </div>
            </div>
                      ) : calculated.totalQuantity === 0 ? (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-md p-3 text-center">
              <div className="text-amber-800 text-sm font-medium mb-1 flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></span>
                Ready to Calculate {clientProductType === 'Stencil' ? 'Manufacturing' : 'Production'} Time
              </div>
              <div className="text-amber-600 text-xs">
                Please enter your {clientProductType === 'Stencil' ? 'stencil' : 'PCB'} quantity to see lead time and delivery date
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Lead Time</span>
                <span className="text-sm font-semibold text-gray-900">
                  {productionCycle.standard.cycle}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Est. Finish</span>
                <span className="text-sm font-semibold text-gray-900">
                  {productionCycle.standard.finish}
                </span>
              </div>

              {/* === 新增：钢网工艺详情 === */}
              {isClient && clientProductType === 'Stencil' && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="text-xs font-medium text-blue-800 mb-2">
                    🔧 Manufacturing Process Information:
                  </div>
                  <div className="space-y-1 text-xs text-blue-700">
                    <div className="flex justify-between">
                      <span>• Manufacturing Lead Time:</span>
                      <span className="font-medium">
                        {productionCycle.standard.cycle}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Process Type:</span>
                      <span className="font-medium">Based on specifications</span>
                    </div>
                    {formData.deliveryOptions?.delivery === DeliveryType.Urgent && (
                      <div className="flex justify-between text-orange-700">
                        <span>• Rush Processing:</span>
                        <span className="font-medium">Additional fee applies</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Shipping Time */}
              {isClient && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                    Shipping Time
                  </span>
                  {shippingInfo.error ? (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                      {shippingInfo.error.includes("country") || shippingInfo.error.includes("courier") ? "Select shipping options" : 
                       shippingInfo.error.includes("quantity") ? "Enter quantity" : "Need shipping info"}
                    </span>
                  ) : shippingInfo.cost > 0 && shippingInfo.courierName ? (
                    <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {shippingInfo.days} via {shippingInfo.courierName}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">Calculating...</span>
                  )}
                </div>
              )}

              {/* Production Cycle Details */}
              {showProductionCycleDetail && (
                <div className="mt-3 bg-gray-50 rounded-md p-3 border border-gray-200">
                  <div className="text-xs font-medium text-gray-700 mb-2">
                    {clientProductType === 'Stencil' ? 'Manufacturing Details:' : 'Production Details:'}
                  </div>
                  <ul className="space-y-1">
                    {productionCycle.standard.reasons.map((reason: string, idx: number) => (
                      <li key={idx} className="text-xs text-gray-600 flex items-start">
                        <span className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                        <span className="leading-relaxed">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
            Order Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Quantity:</span>
                {!isClient ? (
                  <div className="animate-pulse bg-gray-200 h-3 w-12 rounded"></div>
                ) : priceBreakdown.totalCount === 0 ? (
                  <span className="text-gray-400 text-xs">Not set</span>
                ) : (
                  <span className="text-xs font-medium text-gray-900">{priceBreakdown.totalCount} pcs</span>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Unit Price:</span>
                {!isClient ? (
                  <div className="animate-pulse bg-gray-200 h-3 w-12 rounded"></div>
                ) : priceBreakdown.unitPrice === 0 ? (
                  <span className="text-gray-400 text-xs">-</span>
                ) : (
                  <span className="text-xs font-medium text-gray-900">${priceBreakdown.unitPrice.toFixed(3)}/pc</span>
                )}
              </div>
              
                <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Min Order:</span>
                  <span className="text-xs font-medium text-gray-900">{priceBreakdown.minOrderQty} pcs</span>
                </div>

              {/* === 钢网专用信息 === */}
              {isClient && clientProductType === 'Stencil' && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Product Type:</span>
                    <span className="text-xs font-medium text-blue-600">Stencil</span>
                  </div>
                </>
              )}

              {/* === PCB专用信息 === */}
              {isClient && clientProductType === 'PCB' && (
              <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Product Type:</span>
                  <span className="text-xs font-medium text-green-600">PCB</span>
                </div>
              )}
              </div>
              
            <div className="space-y-3">
              {/* 通用面积显示 */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">
                  {clientProductType === 'Stencil' ? 'Stencil Area:' : 'Total Area:'}
                </span>
                {!isClient ? (
                  <div className="animate-pulse bg-gray-200 h-3 w-12 rounded"></div>
                ) : calculated.totalQuantity === 0 ? (
                  <span className="text-gray-400 text-xs">-</span>
                ) : (
                  <span className="text-xs font-medium text-gray-900">
                    {isClient ? `${calculated.totalArea.toFixed(4)} m²` : 'Loading...'}
                  </span>
                )}
            </div>
            
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Chargeable Weight:</span>
                {!isClient ? (
                  <div className="animate-pulse bg-gray-200 h-3 w-12 rounded"></div>
                ) : shippingInfo.weight > 0 ? (
                  <span className="text-xs font-medium text-gray-900">{shippingInfo.weight.toFixed(2)} kg</span>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Actual Weight:</span>
                {!isClient ? (
                  <div className="animate-pulse bg-gray-200 h-3 w-12 rounded"></div>
                ) : shippingInfo.actualWeight > 0 ? (
                  <span className="text-xs font-medium text-gray-900">{shippingInfo.actualWeight.toFixed(2)} kg</span>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Volume Weight:</span>
                {!isClient ? (
                  <div className="animate-pulse bg-gray-200 h-3 w-12 rounded"></div>
                ) : shippingInfo.volumetricWeight > 0 ? (
                  <span className="text-xs font-medium text-gray-900">{shippingInfo.volumetricWeight.toFixed(2)} kg</span>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </div>
            </div>
          </div>

          {/* === 新增：产品规格概览 === */}
          {isClient && calculated.totalQuantity > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="text-xs font-medium text-gray-700 mb-2">
                {clientProductType === 'Stencil' ? 'Stencil Specifications:' : 'PCB Specifications:'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                {clientProductType === 'Stencil' ? (
                  // 钢网规格信息
                  <>
                    <div>Material: Premium Stainless Steel</div>
                    <div>Thickness: As specified</div>
                    <div>Process: Laser cutting/Electroforming</div>
                    <div>Quality: Professional grade</div>
                  </>
                ) : (
                  // PCB规格信息
                  <>
                    <div>Layers: {formData.layers || 2}</div>
                    <div>Thickness: {formData.thickness || 1.6}mm</div>
                    <div>Surface: {formData.surfaceFinish || 'HASL'}</div>
                    <div>Color: {formData.solderMask || 'Green'}</div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* === 新增：钢网价格详情控制 === */}
        {isClient && clientProductType === 'Stencil' && priceBreakdown.totalPrice > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowPriceDetails(!showPriceDetails)}
              className="w-full justify-start text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-md text-sm"
            >
              {showPriceDetails ? (
                <ChevronDown className="h-4 w-4 mr-2" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-2" />
              )}
              {showPriceDetails ? 'Hide' : 'Show'} Stencil Price Details
            </Button>
          </div>
        )}

        {/* Show Price Details Toggle - 只在开发模式下显示PCB价格详情 */}
        {process.env.NODE_ENV === 'development' && clientProductType === 'PCB' && (
          <div className="border-t border-gray-200 pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowPriceDetails(!showPriceDetails)}
              className="w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-50 p-2 rounded-md text-sm"
            >
              {showPriceDetails ? (
                <ChevronDown className="h-4 w-4 mr-2" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-2" />
              )}
              Show PCB Price Details
            </Button>
          </div>
        )}

        {/* Show Debug Toggle - 只在开发模式下显示 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="pt-2">
            <Button
              variant="ghost"
              onClick={() => setShowDebug(!showDebug)}
              className="w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-50 p-2 rounded-md text-sm"
            >
              {showDebug ? (
                <ChevronDown className="h-4 w-4 mr-2" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-2" />
              )}
              Show Debug
            </Button>
            {showDebug && (
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                  className="w-full text-red-600 border-red-200 hover:bg-red-50 text-sm"
                >
                  Clear Storage & Reload
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Debug Information */}
        {showDebug && process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-50 rounded-md p-3 max-h-64 overflow-y-auto border border-gray-200">
            <div className="space-y-3 text-xs">
              <div>
                <div className="font-medium text-gray-700 mb-2">Current Form Values:</div>
                <pre className="whitespace-pre-wrap text-gray-600 font-mono bg-white p-2 rounded border text-xs overflow-x-auto">
                  {JSON.stringify(formData, null, 2)}
                </pre>
              </div>
              <div>
                <div className="font-medium text-gray-700 mb-2">Calculated Properties:</div>
                <pre className="whitespace-pre-wrap text-gray-600 font-mono bg-white p-2 rounded border text-xs overflow-x-auto">
                  {JSON.stringify(calculated, null, 2)}
                </pre>
              </div>
              <div>
                <div className="font-medium text-gray-700 mb-2">Quantity Debug:</div>
                <div className="text-gray-600 bg-white p-2 rounded border space-y-1 text-xs">
                  <p>Shipment Type: {formData.shipmentType}</p>
                  <p>Single Count: {formData.singleCount}</p>
                  <p>Panel Set: {formData.panelSet}</p>
                  <p>Panel Dimensions: {formData.panelDimensions?.row} x {formData.panelDimensions?.column}</p>
                  <p>Calculated Total Quantity: {calculated.totalQuantity}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Price Details (Collapsible) - 只在开发模式下显示 */}
        {showPriceDetails && process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
            <div className="space-y-3 text-sm">
              {/* Price Breakdown */}
              <div>
                <div className="font-medium text-gray-700 mb-2">Price Breakdown:</div>
                <div className="space-y-1">
                  {!isClient ? (
                    <div className="text-gray-400 text-sm">Loading...</div>
                  ) : Object.entries(priceBreakdown.detail)
                    .filter(([key]) => !["PCB Cost", "Shipping", "Tax", "Discount"].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center py-1 text-xs">
                        <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className={`font-medium ${value > 0 ? 'text-gray-900' : value < 0 ? 'text-gray-900' : 'text-gray-600'}`}>
                          {value > 0 ? '+' : ''}${Math.abs(value).toFixed(2)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Price Notes */}
              {isClient && priceBreakdown.notes.length > 0 && (
                <div className="border-t border-gray-200 pt-2">
                  <h4 className="font-medium text-gray-700 mb-2">Price Notes:</h4>
                  <ul className="space-y-1 text-xs text-gray-600">
                    {priceBreakdown.notes.map((note, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Calculated Properties */}
              <div className="border-t border-gray-200 pt-2">
                <div className="font-medium text-gray-700 mb-2">Calculated Properties:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Panel/Single unit Area:</span>
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
          </div>
        )}

        {/* Disclaimer */}
        <div className="text-center py-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            For reference only, final price is subject to review.
          </p>
        </div>
      </div>
    </div>
  );
} 