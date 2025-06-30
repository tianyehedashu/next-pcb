import { BaseProductCalculator, ProductCalculationResult } from './productCalculator';
import { 
  StencilMaterial, 
  StencilThickness, 
  StencilProcess, 
  FrameType,
  SurfaceTreatment 
} from '@/app/quote2/schema/stencilTypes';

export class StencilCalculator extends BaseProductCalculator {
  // 钢网基础价格表 (CNY/mm²)
  private readonly priceMatrix: Record<StencilMaterial, Record<StencilThickness, number>> = {
    [StencilMaterial.STAINLESS_STEEL_304]: {
      [StencilThickness.T0_08]: 0.015,
      [StencilThickness.T0_10]: 0.018,
      [StencilThickness.T0_12]: 0.022,
      [StencilThickness.T0_15]: 0.028,
      [StencilThickness.T0_20]: 0.035
    },
    [StencilMaterial.STAINLESS_STEEL_316L]: {
      [StencilThickness.T0_08]: 0.020,
      [StencilThickness.T0_10]: 0.025,
      [StencilThickness.T0_12]: 0.030,
      [StencilThickness.T0_15]: 0.038,
      [StencilThickness.T0_20]: 0.048
    },
    [StencilMaterial.NICKEL]: {
      [StencilThickness.T0_08]: 0.045,
      [StencilThickness.T0_10]: 0.055,
      [StencilThickness.T0_12]: 0.068,
      [StencilThickness.T0_15]: 0.085,
      [StencilThickness.T0_20]: 0.110
    }
  };

  // 工艺加价系数
  private readonly processMultipliers: Record<StencilProcess, number> = {
    [StencilProcess.LASER_CUT]: 1.0,
    [StencilProcess.ELECTROFORM]: 2.5,
    [StencilProcess.CHEMICAL_ETCH]: 1.8
  };

  // 框架费用 (CNY)
  private readonly frameCosts: Record<FrameType, number> = {
    [FrameType.NO_FRAME]: 0,
    [FrameType.SMT_FRAME]: 150,
    [FrameType.CUSTOM_FRAME]: 300
  };

  // 数量折扣配置
  private readonly quantityBreakpoints = [
    { qty: 100, discount: 0.15 }, // 15% 折扣
    { qty: 50, discount: 0.10 },  // 10% 折扣
    { qty: 20, discount: 0.05 }   // 5% 折扣
  ];

  calculatePrice(formData: any): ProductCalculationResult {
    const { 
      stencilMaterial, 
      stencilThickness, 
      stencilProcess, 
      frameType,
      surfaceTreatment,
      singleDimensions, 
      singleCount 
    } = formData;

    // 验证必要参数
    if (!singleDimensions?.length || !singleDimensions?.width || !singleCount) {
      return this.getEmptyResult();
    }

    // 计算面积 (mm²)
    const area = singleDimensions.length * singleDimensions.width;

    // 基础价格
    const basePrice = this.getBasePricePerMm2(stencilMaterial, stencilThickness);
    
    // 工艺加价
    const processMultiplier = this.processMultipliers[stencilProcess] || 1.0;
    
    // 框架费用
    const frameAddition = this.frameCosts[frameType] || 0;
    
    // 表面处理加价
    const surfaceTreatmentCost = this.getSurfaceTreatmentCost(surfaceTreatment, area);
    
    // 数量折扣
    const quantityDiscount = this.getQuantityDiscount(singleCount, this.quantityBreakpoints);
    
    // 单价计算
    const materialCost = basePrice * area;
    const processCost = materialCost * (processMultiplier - 1);
    const unitCostBeforeDiscount = materialCost * processMultiplier + frameAddition + surfaceTreatmentCost;
    const unitCost = unitCostBeforeDiscount * quantityDiscount;
    const totalPrice = unitCost * singleCount;

    // 价格明细
    const breakdown = {
      "Material Cost": this.formatPrice(materialCost * singleCount),
      "Process Cost": this.formatPrice(processCost * singleCount),
      "Frame Cost": this.formatPrice(frameAddition * singleCount),
      "Surface Treatment": this.formatPrice(surfaceTreatmentCost * singleCount),
      "Quantity Discount": this.formatPrice((unitCostBeforeDiscount * (1 - quantityDiscount)) * singleCount * -1)
    };

    return {
      totalPrice: this.formatPrice(totalPrice),
      unitPrice: this.formatPrice(unitCost),
      breakdown,
      notes: this.generatePriceNotes(formData),
      leadTimeDays: this.calculateLeadTime(formData, new Date()),
      leadTimeReason: this.getLeadTimeReasons(formData),
      minOrderQty: 1
    };
  }

  private getBasePricePerMm2(material: StencilMaterial, thickness: StencilThickness): number {
    return this.priceMatrix[material]?.[thickness] || 0.025;
  }

  private getSurfaceTreatmentCost(treatment: SurfaceTreatment, area: number): number {
    const treatmentCosts: Record<SurfaceTreatment, number> = {
      [SurfaceTreatment.NONE]: 0,
      [SurfaceTreatment.ELECTROPOLISH]: area * 0.002, // 0.002 CNY/mm²
      [SurfaceTreatment.PASSIVATION]: area * 0.001    // 0.001 CNY/mm²
    };
    return treatmentCosts[treatment] || 0;
  }

  calculateLeadTime(formData: any, startDate: Date): number {
    const { stencilProcess, frameType, singleCount } = formData;
    
    // 基础工期
    let baseDays = 3; // 激光切割基础3天
    
    // 工艺加时
    if (stencilProcess === StencilProcess.ELECTROFORM) {
      baseDays += 4; // 电铸工艺需要额外4天
    } else if (stencilProcess === StencilProcess.CHEMICAL_ETCH) {
      baseDays += 2; // 化学蚀刻额外2天
    }
    
    // 框架加时
    if (frameType === FrameType.CUSTOM_FRAME) {
      baseDays += 2; // 定制框架额外2天
    }
    
    // 数量加时
    if (singleCount > 50) {
      baseDays += 1; // 大批量额外1天
    }
    
    return baseDays;
  }

  calculateWeight(formData: any): number {
    const { singleDimensions, stencilThickness, frameType, singleCount } = formData;
    
    if (!singleDimensions?.length || !singleDimensions?.width || !singleCount) {
      return 0;
    }

    const area = singleDimensions.length * singleDimensions.width; // mm²
    const volume = area * stencilThickness; // mm³
    const density = 7.9; // 不锈钢密度 g/cm³
    
    // 单个钢网重量 (kg)
    let singleWeight = (volume * density) / 1000000; // 转换为kg
    
    // 框架重量
    if (frameType === FrameType.SMT_FRAME) {
      singleWeight += 0.2; // SMT框架约200g
    } else if (frameType === FrameType.CUSTOM_FRAME) {
      singleWeight += 0.35; // 定制框架约350g
    }
    
    return this.formatPrice(singleWeight * singleCount);
  }

  private generatePriceNotes(formData: any): string[] {
    const notes: string[] = [];
    
    if (formData.stencilProcess === StencilProcess.ELECTROFORM) {
      notes.push("⚡ Electroforming provides highest precision for fine pitch components");
    }
    
    if (formData.frameType === FrameType.CUSTOM_FRAME) {
      notes.push("🔧 Custom frame pricing may vary based on specific requirements");
    }
    
    if (formData.singleCount >= 20) {
      notes.push("💰 Quantity discount applied");
    }

    if (formData.surfaceTreatment !== SurfaceTreatment.NONE) {
      notes.push("✨ Surface treatment enhances durability and print quality");
    }

    if (formData.tensionMesh) {
      notes.push("🎯 Tension mesh recommended for fine pitch components");
    }
    
    return notes;
  }

  private getLeadTimeReasons(formData: any): string[] {
    const reasons: string[] = [];
    const { stencilProcess, frameType } = formData;
    
    reasons.push("📐 Stencil manufacturing lead time includes:");
    
    if (stencilProcess === StencilProcess.LASER_CUT) {
      reasons.push("• Laser cutting: 1-2 days");
    } else if (stencilProcess === StencilProcess.ELECTROFORM) {
      reasons.push("• Electroforming: 4-6 days (high precision)");
    } else if (stencilProcess === StencilProcess.CHEMICAL_ETCH) {
      reasons.push("• Chemical etching: 3-4 days");
    }
    
    if (frameType !== FrameType.NO_FRAME) {
      reasons.push("• Frame mounting: 1-2 days");
    }
    
    reasons.push("• Quality inspection: 1 day");
    
    return reasons;
  }

  private getEmptyResult(): ProductCalculationResult {
    return {
      totalPrice: 0,
      unitPrice: 0,
      breakdown: {},
      notes: ["Please fill in stencil dimensions and quantity"],
      leadTimeDays: 0,
      leadTimeReason: [],
      minOrderQty: 1
    };
  }
} 