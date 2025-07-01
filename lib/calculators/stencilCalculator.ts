import { ProductCalculationResult, BaseProductCalculator } from './productCalculator';
import { getStencilSpec, BorderType } from '@/app/quote2/schema/stencilTypes';

// 钢网表单数据接口
interface StencilFormData {
  productType: string;
  borderType: BorderType;
  size: string;
  quantity: number;
  thickness: number;
  stencilType: string;
  stencilSide: string;
  existingFiducials: string;
  electropolishing: string;
  engineeringRequirements: string;
  [key: string]: unknown;
}

export class StencilCalculator extends BaseProductCalculator {
  calculatePrice(formData: StencilFormData): ProductCalculationResult {
    const { borderType, size, quantity } = formData;
    
    // 获取钢网规格
    const sizeInfo = getStencilSpec(borderType, size);
    if (!sizeInfo) {
      throw new Error(`未找到钢网规格: ${borderType} ${size}`);
    }

    // 基础价格计算（人民币）
    const basePrice = sizeInfo.pricePerPcs * quantity;
    
    // 工艺加价
    const processAddons = this.calculateProcessAddons(formData);
    
    // 总价格（人民币）
    const totalPriceCny = basePrice + processAddons;
    
    // 转换为USD（用于统一显示）
    const totalPriceUsd = this.convertCnyToUsd(totalPriceCny);
    const unitPriceUsd = totalPriceUsd / quantity;

    // 价格明细
    const breakdown = {
      basePrice: this.convertCnyToUsd(basePrice),
      processAddons: this.convertCnyToUsd(processAddons),
    };

    // 计算说明
    const notes = [
      `钢网规格: ${size}mm (${borderType === BorderType.FRAMEWORK ? '含框' : '无框'})`,
      `基础价格: ¥${basePrice.toFixed(2)} (¥${sizeInfo.pricePerPcs}/片 × ${quantity}片)`,
      `工艺加价: ¥${processAddons.toFixed(2)}`,
      `总价: $${totalPriceUsd.toFixed(2)} (¥${totalPriceCny.toFixed(2)})`
    ];

    return {
      totalPrice: totalPriceUsd,
      unitPrice: unitPriceUsd,
      breakdown,
      notes,
      leadTimeDays: this.calculateLeadTime(formData),
      leadTimeReason: ['钢网制作周期: 3-5个工作日'],
      minOrderQty: 1,
    };
  }

  calculateLeadTime(formData: StencilFormData): number {
    // 钢网标准制作周期
    let leadDays = 1; // 基础5天

    // 特殊工艺延长交期
    if (formData.electropolishing === 'electropolishing') {
      leadDays += 1; // 电抛光+1天
    }

  

    return leadDays;
  }

  calculateWeight(formData: StencilFormData): number {
    const { borderType, size, quantity } = formData;
    
    const sizeInfo = getStencilSpec(borderType, size);
    if (!sizeInfo) return 0.5; // 默认最小重量0.5kg

    // 钢网重量计算（严格按照规格表）
    return sizeInfo.weightKgPerPcs * quantity;
  }

  private calculateProcessAddons(formData: StencilFormData): number {
    let addons = 0;

    // 厚度加价
    const thickness = formData.thickness || 0.12;
    if (thickness > 0.12) {
      addons += 20; // 厚钢网加价
    }

    // 电抛光加价
    if (formData.electropolishing === 'electropolishing') {
      addons += 50;
    }

    // 特殊孔加价
    if (formData.existingFiducials !== 'none') {
      addons += 30;
    }

    // 双面钢网加价
    if (formData.stencilSide?.includes('top_bottom')) {
      addons += 100;
    }

    return addons;
  }

  // 生成新格式的计算值
  generateCalValues(formData: StencilFormData, shippingCost: number = 0): Record<string, unknown> {
    const calculation = this.calculatePrice(formData);
    const weight = this.calculateWeight(formData);
    
    // 钢网专用计算详情
    const stencilCalculation = {
      stencilPrice: calculation.totalPrice, // 钢网产品价格（USD，不含运费）
      stencilArea: this.calculateStencilArea(formData), // 钢网面积
      totalWeight: weight, // 钢网总重量
      breakdown: calculation.breakdown, // 钢网价格明细
    };

    // 返回新格式的CalValues
    return {
      // === 产品类型标识 ===
      product_type: 'stencil',
      
      // === 通用计算值 ===
      totalPrice: calculation.totalPrice + shippingCost, // 总价（产品+运费）
      unitPrice: calculation.unitPrice,
      totalCount: formData.quantity,
      minOrderQty: calculation.minOrderQty,
      
      // 交期相关
      leadTimeDays: calculation.leadTimeDays,
      leadTimeResult: {
        cycleDays: calculation.leadTimeDays,
        reason: calculation.leadTimeReason,
      },
      estimatedFinishDate: this.calculateFinishDate(calculation.leadTimeDays),
      
      // 运费相关（由运费计算器填充）
      shippingCost,
      shippingWeight: 0,
      shippingActualWeight: 0,
      shippingVolumetricWeight: 0,
      courier: "",
      courierDays: "",
      
      // 税费和折扣
      tax: 0,
      discount: 0,
      
      // 价格说明
      priceNotes: calculation.notes,
      
      // === 钢网专用计算值 ===
      stencil_calculation: stencilCalculation,
    };
  }

  private calculateStencilArea(formData: StencilFormData): number {
    const { borderType, size } = formData;
    const sizeInfo = getStencilSpec(borderType, size);
    
    if (!sizeInfo) return 0;
    
    // 从size字符串解析尺寸 (例如: "420x520")
    const [width, height] = size.split('x').map(Number);
    return (width * height) / 1000000; // 转换为平方米
  }

  private calculateFinishDate(leadDays: number): string {
    const finishDate = new Date();
    finishDate.setDate(finishDate.getDate() + leadDays);
    return finishDate.toISOString().slice(0, 10);
  }
}

// 使用示例
export const useStencilCalculation = (formData: StencilFormData) => {
  const calculator = new StencilCalculator();
  return calculator.generateCalValues(formData);
}; 