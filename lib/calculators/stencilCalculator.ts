import { BaseProductCalculator, ProductCalculationResult } from './productCalculator';
import { 
  BorderType, 
  Electropolishing,
  getStencilSpec
} from '@/app/quote2/schema/stencilTypes';

interface StencilFormData {
  borderType: BorderType;
  size: string;
  electropolishing: Electropolishing;
  quantity: number;
  [key: string]: unknown;
}

export class StencilCalculator extends BaseProductCalculator {

  calculatePrice(formData: StencilFormData): ProductCalculationResult {
    const { 
      borderType,
      size,
      electropolishing,
      quantity 
    } = formData;

    // 验证必要参数
    if (!size || !quantity || quantity < 1) {
      return this.getEmptyResult();
    }

    // 获取尺寸价格信息 - 严格按照钢网规格数据表
    const sizeInfo = getStencilSpec(borderType, size);
    if (!sizeInfo) {
      return this.getEmptyResult();
    }

    // 基础价格 - 直接使用规格数据表价格
    const basePrice = sizeInfo.pricePerPcs;
    
    // 运费附加费 - 严格按照钢网规格数据表
    const shippingExtra = sizeInfo.shippingExtraPerPcs;
    
    // 电抛光处理费用（仅在选择电抛光时）
    const electropolishingCost = electropolishing === Electropolishing.ELECTROPOLISHING ? 50 : 0;
    
    // 单价计算 - 严格按照钢网规格数据表
    const unitCost = basePrice + shippingExtra + electropolishingCost;
    const totalPrice = unitCost * quantity;

    // 价格明细 - 仅显示实际涉及的项目
    const breakdown: Record<string, number> = {
      "Base Price": this.formatPrice(basePrice * quantity)
    };

    // 仅在有运费附加费时显示
    if (shippingExtra > 0) {
      breakdown["Shipping Extra"] = this.formatPrice(shippingExtra * quantity);
    }

    // 仅在选择电抛光时显示
    if (electropolishingCost > 0) {
      breakdown["Electropolishing"] = this.formatPrice(electropolishingCost * quantity);
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

  calculateLeadTime(_formData: StencilFormData, _startDate: Date): number {
    // 钢网交期固定为2-3天，不受其他参数影响
    return 2; // 统一2天交期
  }

  calculateWeight(formData: StencilFormData): number {
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

  private generatePriceNotes(formData: StencilFormData, sizeInfo: { pricePerPcs: number; maxEffectiveArea: string; shippingExtraPerPcs: number; weightKgPerPcs: number }): string[] {
    const notes: string[] = [];
    
    // 基础价格说明
    notes.push(`💰 Base price: ¥${sizeInfo.pricePerPcs.toFixed(2)} per piece (as per specification table)`);
    
    if (formData.borderType === BorderType.FRAMEWORK) {
      notes.push("🔧 Framework included for production use");
    } else {
      notes.push("📦 Frameless stencil for cost-effective prototyping");
    }
    
    if (formData.electropolishing === Electropolishing.ELECTROPOLISHING) {
      notes.push("✨ Electropolishing: +¥50 per piece for enhanced surface finish");
    }

    if (sizeInfo.maxEffectiveArea) {
      notes.push(`📐 Effective printing area: ${sizeInfo.maxEffectiveArea}mm`);
    }

    // 运费附加费说明 - 严格按照钢网规格数据表
    if (sizeInfo.shippingExtraPerPcs > 0) {
      notes.push(`📦 Large size shipping extra: ¥${sizeInfo.shippingExtraPerPcs} per piece (as per specification table)`);
    }

    notes.push(`⚖️ Weight: ${sizeInfo.weightKgPerPcs}kg per piece`);
    notes.push("🎯 All prices are based on stencil specification data table");
    
    return notes;
  }

  private getLeadTimeReasons(_formData: StencilFormData): string[] {
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