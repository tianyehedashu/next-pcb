import { BaseProductCalculator, ProductCalculationResult } from './productCalculator';
import { 
  BorderType, 
  StencilThickness,
  Electropolishing,
  getStencilSpec,
  StencilSizeSpec
} from '@/app/quote2/schema/stencilTypes';

// 钢网表单数据接口
interface StencilFormData {
  borderType: BorderType;
  size: string;
  thickness: StencilThickness;
  electropolishing: Electropolishing;
  quantity: number;
}

export class StencilCalculator extends BaseProductCalculator {

  // 厚度价格调整系数
  private readonly thicknessMultipliers: Record<StencilThickness, number> = {
    [StencilThickness.T0_10]: 1.0,   // 基础价格
    [StencilThickness.T0_12]: 1.1,   // 10% 加价
    [StencilThickness.T0_15]: 1.2    // 20% 加价
  };

  // 电抛光处理费用
  private readonly electropolishingCosts: Record<Electropolishing, number> = {
    [Electropolishing.GRINDING_POLISHING]: 0,     // 研磨抛光无额外费用
    [Electropolishing.ELECTROPOLISHING]: 50       // 电抛光额外50元
  };

  // 数量折扣配置
  private readonly quantityBreakpoints = [
    { qty: 100, discount: 0.15 }, // 15% 折扣
    { qty: 50, discount: 0.10 },  // 10% 折扣
    { qty: 20, discount: 0.05 }   // 5% 折扣
  ];

  calculatePrice(formData: any): ProductCalculationResult {
    const { 
      borderType,
      size,
      thickness,
      electropolishing,
      quantity 
    } = formData;

    // 验证必要参数
    if (!size || !quantity || quantity < 1) {
      return this.getEmptyResult();
    }

    // 获取尺寸价格信息
    const sizeInfo = getStencilSpec(borderType, size);
    if (!sizeInfo) {
      return this.getEmptyResult();
    }

    // 基础价格
    const basePrice = sizeInfo.pricePerPcs;
    
    // 厚度调整
    const thicknessMultiplier = this.thicknessMultipliers[thickness as StencilThickness] || 1.0;
    
    // 电抛光费用
    const electropolishingCost = this.electropolishingCosts[electropolishing as Electropolishing] || 0;
    
    // 数量折扣
    const quantityDiscount = this.getQuantityDiscount(quantity, this.quantityBreakpoints);
    
    // 运费附加费 - 严格按照钢网规格数据表
    const shippingExtra = sizeInfo.shippingExtraPerPcs;
    
    // 单价计算 - 严格按照钢网规格数据表
    const adjustedBasePrice = basePrice * thicknessMultiplier;
    const unitCostBeforeDiscount = adjustedBasePrice + electropolishingCost + shippingExtra;
    const unitCost = unitCostBeforeDiscount * quantityDiscount;
    const totalPrice = unitCost * quantity;

    // 价格明细 - 严格按照钢网规格数据表
    const breakdown: Record<string, number> = {
      "Base Price": this.formatPrice(basePrice * quantity),
      "Thickness Adjustment": this.formatPrice((adjustedBasePrice - basePrice) * quantity),
      "Electropolishing": this.formatPrice(electropolishingCost * quantity)
    };

    // 仅在有运费附加费时显示
    if (shippingExtra > 0) {
      breakdown["Shipping Extra"] = this.formatPrice(shippingExtra * quantity);
    }

    // 仅在有折扣时显示
    if (quantityDiscount < 1.0) {
      breakdown["Quantity Discount"] = this.formatPrice((unitCostBeforeDiscount * (1 - quantityDiscount)) * quantity * -1);
    }

    return {
      totalPrice: this.formatPrice(totalPrice),
      unitPrice: this.formatPrice(unitCost),
      breakdown,
      notes: this.generatePriceNotes(formData, sizeInfo),
      leadTimeDays: this.calculateLeadTime(formData, new Date()),
      leadTimeReason: this.getLeadTimeReasons(formData),
      minOrderQty: 1
    };
  }



  calculateLeadTime(_formData: any, _startDate: Date): number {
    // 钢网交期固定为2-3天，不受其他参数影响
    return 2; // 统一2天交期
  }

  calculateWeight(formData: any): number {
    const { borderType, size, quantity } = formData;
    
    if (!size || !quantity) {
      return 0;
    }

    const sizeInfo = getStencilSpec(borderType, size);
    if (!sizeInfo) {
      return 0;
    }
    
    return this.formatPrice(sizeInfo.weightKgPerPcs * quantity);
  }

  private generatePriceNotes(formData: any, sizeInfo: any): string[] {
    const notes: string[] = [];
    
    if (formData.borderType === BorderType.FRAMEWORK) {
      notes.push("🔧 Framework included for production use");
    } else {
      notes.push("📦 Frameless stencil for cost-effective prototyping");
    }
    
    if (formData.electropolishing === Electropolishing.ELECTROPOLISHING) {
      notes.push("✨ Electropolishing enhances print quality and durability");
    }
    
    if (formData.quantity >= 20) {
      notes.push("💰 Quantity discount applied");
    }

    if (sizeInfo.maxEffectiveArea) {
      notes.push(`📐 Effective printing area: ${sizeInfo.maxEffectiveArea}mm`);
    }

    // 运费附加费说明 - 严格按照钢网规格数据表
    if (sizeInfo.shippingExtraPerPcs > 0) {
      notes.push(`📦 Large size shipping extra: ¥${sizeInfo.shippingExtraPerPcs} per piece`);
    }

    notes.push(`💰 Base price: ¥${sizeInfo.pricePerPcs.toFixed(2)} per piece`);
    notes.push(`⚖️ Weight: ${sizeInfo.weightKgPerPcs}kg per piece`);
    
    return notes;
  }

  private getLeadTimeReasons(_formData: any): string[] {
    const reasons: string[] = [];
    
    reasons.push("📐 Stencil manufacturing lead time:");
    reasons.push("• Fast production: 2-3 days");
    reasons.push("• All processes included");
    reasons.push("• Quality guaranteed");
    
    return reasons;
  }

  private getEmptyResult(): ProductCalculationResult {
    return {
      totalPrice: 0,
      unitPrice: 0,
      breakdown: {},
      notes: ["Please select stencil size and enter quantity"],
      leadTimeDays: 0,
      leadTimeReason: [],
      minOrderQty: 1
    };
  }
} 