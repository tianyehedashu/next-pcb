"use client";

import { useMemo, useCallback } from 'react';
import { useQuoteFormData, useQuoteStore } from '@/lib/stores/quote-store';
import { ProductType } from '../schema/stencilTypes';
import { StencilCalculator } from '@/lib/calculators/stencilCalculator';
import { ProductCalculator } from '@/lib/calculators/productCalculator';
import { calcPcbPriceV3 } from '@/lib/pcb-calc-v3';
import { calculateLeadTime } from '@/lib/stores/quote-calculations';
import { calculateShippingCost } from '@/lib/shipping-calculator';
import { useExchangeRate } from '@/lib/hooks/useExchangeRate';

// PCB计算器包装类，用于适配现有的PCB计算逻辑
class PcbCalculatorWrapper implements ProductCalculator {
  calculatePrice(formData: any) {
    try {
      const { total, detail, notes } = calcPcbPriceV3(formData);
      const totalCount = this.getTotalCount(formData);
      const unitPrice = totalCount > 0 ? total / totalCount : 0;
      
      // 计算交期
      const delivery = formData.deliveryOptions?.delivery || 'standard';
      const leadTimeResult = calculateLeadTime(formData, new Date(), delivery);
      
      return {
        totalPrice: total,
        unitPrice,
        breakdown: detail,
        notes,
        leadTimeDays: leadTimeResult.cycleDays,
        leadTimeReason: leadTimeResult.reason,
        minOrderQty: this.getMinOrderQty(formData)
      };
    } catch (error) {
      console.error('PCB价格计算失败:', error);
      return {
        totalPrice: 0,
        unitPrice: 0,
        breakdown: {},
        notes: ['Price calculation failed'],
        leadTimeDays: 0,
        leadTimeReason: [],
        minOrderQty: 1
      };
    }
  }

  calculateLeadTime(formData: any, startDate: Date): number {
    const delivery = formData.deliveryOptions?.delivery || 'standard';
    const leadTimeResult = calculateLeadTime(formData, startDate, delivery);
    return leadTimeResult.cycleDays;
  }

  calculateWeight(formData: any): number {
    // 使用现有的PCB重量计算逻辑
    // 这里需要引入现有的PCB重量计算函数
    // 暂时返回估算值，后续可以优化
    const { singleDimensions, thickness = 1.6, layers = 2 } = formData;
    const totalCount = this.getTotalCount(formData);
    
    if (!singleDimensions?.length || !singleDimensions?.width || !totalCount) {
      return 0;
    }

    // 简化的PCB重量计算 (实际应该使用更精确的计算)
    const area = (singleDimensions.length * singleDimensions.width) / 10000; // cm²
    const volume = area * (thickness / 10); // cm³
    const density = 1.85; // FR4密度 g/cm³
    const singleWeight = volume * density / 1000; // kg
    
    return singleWeight * totalCount;
  }

  private getTotalCount(formData: any): number {
    // 复用现有的数量计算逻辑
    if (formData.shipmentType === 'single') {
      return formData.singleCount || 0;
    } else if (formData.shipmentType === 'panel_by_gerber' || formData.shipmentType === 'panel_by_speedx') {
      const row = formData.panelDimensions?.row || 1;
      const column = formData.panelDimensions?.column || 1;
      const panelSet = formData.panelSet || 0;
      return row * column * panelSet;
    }
    return 0;
  }

  private getMinOrderQty(formData: any): number {
    // PCB的最小订购量逻辑
    return 5; // 一般PCB最小5片
  }
}

export const useProductCalculation = () => {
  const formData = useQuoteFormData();
  const setCalValues = useQuoteStore((state) => state.setCalValues);
  const { cnyToUsdRate } = useExchangeRate();

  // 根据产品类型选择计算器
  const calculator = useMemo(() => {
    const productType = formData.productType || ProductType.PCB;
    
    if (productType === ProductType.STENCIL) {
      return new StencilCalculator();
    } else {
      return new PcbCalculatorWrapper();
    }
  }, [formData.productType]);

  // CNY 转 USD 的辅助函数
  const convertCnyToUsd = useCallback((cnyAmount: number): number => {
    const rate = cnyToUsdRate > 0 ? cnyToUsdRate : 0.14;
    return cnyAmount * rate;
  }, [cnyToUsdRate]);

  // 统一计算方法
  const calculateAll = useCallback(async () => {
    try {
      // 1. 计算价格
      const priceResult = calculator.calculatePrice(formData);
      
      // 2. 计算重量
      const weight = calculator.calculateWeight(formData);
      
      // 3. 计算运费 (复用现有逻辑)
      let shippingCost = 0;
      let shippingWeight = weight;
      let shippingActualWeight = weight;
      let shippingVolumetricWeight = 0;
      let courierInfo = { days: 'N/A', courierName: 'N/A' };

      try {
        // 如果有地址信息，计算运费
        const hasShippingInfo = formData.shippingAddress?.country || formData.shippingCostEstimation?.country;
        
        if (hasShippingInfo && weight > 0) {
          const shippingResult = await calculateShippingCost(formData, undefined);
          shippingCost = convertCnyToUsd(shippingResult.finalCost);
          shippingWeight = shippingResult.chargeableWeight;
          shippingActualWeight = shippingResult.actualWeight;
          shippingVolumetricWeight = shippingResult.volumetricWeight;
          courierInfo.days = shippingResult.deliveryTime;
          
          // 解析快递公司名称
          const courier = formData.shippingAddress?.courier || formData.shippingCostEstimation?.courier || '';
          const courierNames: Record<string, string> = {
            'dhl': 'DHL',
            'fedex': 'FedEx', 
            'ups': 'UPS',
            'standard': 'Standard Shipping'
          };
          courierInfo.courierName = courierNames[courier] || courier;
        }
      } catch (shippingError) {
        console.error('运费计算失败:', shippingError);
        // 运费计算失败不影响价格计算
      }

      // 4. 汇率转换
      const productType = formData.productType || ProductType.PCB;
      let totalPriceUsd = priceResult.totalPrice;
      let unitPriceUsd = priceResult.unitPrice;
      let breakdownUsd: Record<string, number> = {};

      if (productType === ProductType.STENCIL) {
        // 钢网价格是CNY，需要转换为USD
        totalPriceUsd = convertCnyToUsd(priceResult.totalPrice);
        unitPriceUsd = convertCnyToUsd(priceResult.unitPrice);
        breakdownUsd = Object.fromEntries(
          Object.entries(priceResult.breakdown).map(([key, value]) => 
            [key, convertCnyToUsd(value)]
          )
        );
      } else {
        // PCB价格已经是CNY，也需要转换为USD (保持一致)
        totalPriceUsd = convertCnyToUsd(priceResult.totalPrice);
        unitPriceUsd = convertCnyToUsd(priceResult.unitPrice);
        breakdownUsd = Object.fromEntries(
          Object.entries(priceResult.breakdown).map(([key, value]) => 
            [key, convertCnyToUsd(value)]
          )
        );
      }

      // 5. 计算预计完成日期
      const estimatedFinishDate = new Date();
      estimatedFinishDate.setDate(estimatedFinishDate.getDate() + priceResult.leadTimeDays);

      // 6. 更新store
      setCalValues({
        totalPrice: Math.round(totalPriceUsd * 100) / 100,
        pcbPrice: Math.round(totalPriceUsd * 100) / 100,
        unitPrice: Math.round(unitPriceUsd * 100) / 100,
        breakdown: breakdownUsd,
        leadTimeDays: priceResult.leadTimeDays,
        leadTimeResult: {
          cycleDays: priceResult.leadTimeDays,
          reason: priceResult.leadTimeReason
        },
        shippingCost: Math.round(shippingCost * 100) / 100,
        shippingWeight: Math.round(shippingWeight * 100) / 100,
        shippingActualWeight: Math.round(shippingActualWeight * 100) / 100,
        shippingVolumetricWeight: Math.round(shippingVolumetricWeight * 100) / 100,
        priceNotes: priceResult.notes,
        minOrderQty: priceResult.minOrderQty,
        totalCount: productType === ProductType.STENCIL ? 
          (formData.singleCount || 0) : 
          Math.max(formData.singleCount || 0, 1),
        estimatedFinishDate: estimatedFinishDate.toISOString().split('T')[0],
        courier: courierInfo.courierName,
        courierDays: courierInfo.days,
        tax: 0, // 暂时设为0
        discount: 0 // 暂时设为0
      });

    } catch (error) {
      console.error('产品计算失败:', error);
      
      // 设置错误状态
      setCalValues({
        totalPrice: 0,
        pcbPrice: 0,
        unitPrice: 0,
        breakdown: {},
        leadTimeDays: 0,
        leadTimeResult: { cycleDays: 0, reason: ['计算失败'] },
        shippingCost: 0,
        shippingWeight: 0,
        shippingActualWeight: 0, 
        shippingVolumetricWeight: 0,
        priceNotes: ['价格计算失败，请检查输入信息'],
        minOrderQty: 1,
        totalCount: 0,
        estimatedFinishDate: '',
        courier: '',
        courierDays: '',
        tax: 0,
        discount: 0
      });
    }
  }, [formData, calculator, setCalValues, convertCnyToUsd]);

  // 获取当前产品类型
  const getProductType = useCallback(() => {
    return formData.productType || ProductType.PCB;
  }, [formData.productType]);

  // 检查是否为钢网产品
  const isStencilProduct = useCallback(() => {
    return getProductType() === ProductType.STENCIL;
  }, [getProductType]);

  return { 
    calculateAll, 
    calculator,
    getProductType,
    isStencilProduct,
    convertCnyToUsd
  };
}; 