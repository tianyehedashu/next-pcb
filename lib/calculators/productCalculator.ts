// 通用产品计算器接口

export interface ProductCalculationResult {
  totalPrice: number;
  unitPrice: number;
  breakdown: Record<string, number>;
  notes: string[];
  leadTimeDays: number;
  leadTimeReason: string[];
  minOrderQty: number;
}

export interface ProductCalculator {
  calculatePrice(formData: any): ProductCalculationResult;
  calculateLeadTime(formData: any, startDate: Date): number;
  calculateWeight(formData: any): number;
}

// 基础计算器抽象类
export abstract class BaseProductCalculator implements ProductCalculator {
  abstract calculatePrice(formData: any): ProductCalculationResult;
  abstract calculateLeadTime(formData: any, startDate: Date): number;
  abstract calculateWeight(formData: any): number;

  // 通用的数量折扣计算
  protected getQuantityDiscount(quantity: number, breakpoints: Array<{ qty: number; discount: number }>): number {
    for (const breakpoint of breakpoints.sort((a, b) => b.qty - a.qty)) {
      if (quantity >= breakpoint.qty) {
        return 1 - breakpoint.discount;
      }
    }
    return 1.0; // 无折扣
  }

  // 通用的汇率转换（CNY to USD）
  protected convertCnyToUsd(cnyAmount: number, rate: number = 0.14): number {
    return cnyAmount * rate;
  }

  // 通用的价格格式化
  protected formatPrice(price: number): number {
    return Math.round(price * 100) / 100;
  }
} 