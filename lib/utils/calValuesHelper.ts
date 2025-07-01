// 计算值辅助函数 - 用于安全访问新的分离式计算值结构
// 支持新旧数据格式的兼容性

import type { CalValues } from '@/lib/stores/quote-store';

/**
 * 安全获取总价
 * @param calValues 计算值对象
 * @returns 总价（包含产品价格和运费）
 */
export function getTotalPrice(calValues: unknown): number {
  const cal = calValues as CalValues;
  if (!cal) return 0;
  
  return Number(cal.totalPrice || 0);
}

/**
 * 安全获取单价
 * @param calValues 计算值对象
 * @returns 单价
 */
export function getUnitPrice(calValues: unknown): number {
  const cal = calValues as CalValues;
  if (!cal) return 0;
  
  return Number(cal.unitPrice || 0);
}

/**
 * 安全获取产品价格（不含运费）
 * @param calValues 计算值对象
 * @returns 产品价格
 */
export function getProductPrice(calValues: unknown): number {
  const cal = calValues as CalValues;
  if (!cal) return 0;
  
  // 使用新的分离式结构获取产品价格
  if (cal.product_type === 'stencil' && cal.stencil_calculation) {
    return Number(cal.stencil_calculation.stencilPrice || 0);
  } else if (cal.product_type === 'pcb' && cal.pcb_calculation) {
    return Number(cal.pcb_calculation.pcbPrice || 0);
  } else if (cal.product_type === 'smt' && cal.smt_calculation) {
    return Number(cal.smt_calculation.smtPrice || 0);
  } else if (cal.product_type === 'combo' && cal.combo_calculation) {
    return Number(cal.combo_calculation.comboPrice || 0);
  } else {
    // 向后兼容：使用旧的pcbPrice字段
    return Number(cal.pcbPrice || 0);
  }
}

/**
 * 安全获取运费
 * @param calValues 计算值对象
 * @returns 运费
 */
export function getShippingCost(calValues: unknown): number {
  const cal = calValues as CalValues;
  if (!cal) return 0;
  
  return Number(cal.shippingCost || 0);
}

/**
 * 安全获取产品类型
 * @param calValues 计算值对象
 * @returns 产品类型
 */
export function getProductType(calValues: unknown): 'pcb' | 'stencil' | 'smt' | 'combo' | 'unknown' {
  const cal = calValues as CalValues;
  if (!cal) return 'unknown';
  
  return cal.product_type || 'pcb'; // 默认为PCB
}

/**
 * 安全获取产品详细计算值
 * @param calValues 计算值对象
 * @returns 产品专用计算值
 */
export function getProductCalculationDetails(calValues: unknown): Record<string, unknown> | null {
  const cal = calValues as CalValues;
  if (!cal) return null;
  
  switch (cal.product_type) {
    case 'pcb':
      return cal.pcb_calculation || null;
    case 'stencil':
      return cal.stencil_calculation || null;
    case 'smt':
      return cal.smt_calculation || null;
    case 'combo':
      return cal.combo_calculation || null;
    default:
      return null;
  }
}

/**
 * 安全获取价格明细
 * @param calValues 计算值对象
 * @returns 价格明细对象
 */
export function getPriceBreakdown(calValues: unknown): Record<string, number> {
  const cal = calValues as CalValues;
  if (!cal) return {};
  
  // 优先使用产品专用计算值中的breakdown
  const productDetails = getProductCalculationDetails(cal);
  if (productDetails && typeof productDetails === 'object' && 'breakdown' in productDetails) {
    const breakdown = (productDetails as any).breakdown;
    if (breakdown && typeof breakdown === 'object') {
      return breakdown;
    }
  }
  
  // 向后兼容：使用旧的breakdown字段
  if (cal.breakdown && typeof cal.breakdown === 'object') {
    return cal.breakdown as Record<string, number>;
  }
  
  return {};
}

/**
 * 安全获取交期天数
 * @param calValues 计算值对象
 * @returns 交期天数
 */
export function getLeadTimeDays(calValues: unknown): number {
  const cal = calValues as CalValues;
  if (!cal) return 0;
  
  return Number(cal.leadTimeDays || 0);
}

/**
 * 安全获取最小起订量
 * @param calValues 计算值对象
 * @returns 最小起订量
 */
export function getMinOrderQty(calValues: unknown): number {
  const cal = calValues as CalValues;
  if (!cal) return 1;
  
  return Number(cal.minOrderQty || 1);
}

/**
 * 安全获取总数量
 * @param calValues 计算值对象
 * @returns 总数量
 */
export function getTotalCount(calValues: unknown): number {
  const cal = calValues as CalValues;
  if (!cal) return 0;
  
  return Number(cal.totalCount || 0);
}

/**
 * 获取产品类型显示标签
 * @param calValues 计算值对象
 * @returns 产品类型显示标签
 */
export function getProductTypeDisplay(calValues: unknown): string {
  const productType = getProductType(calValues);
  
  switch (productType) {
    case 'pcb':
      return 'PCB';
    case 'stencil':
      return 'Stencil';
    case 'smt':
      return 'SMT Assembly';
    case 'combo':
      return 'Combo';
    default:
      return 'Unknown';
  }
}

/**
 * 检查是否为钢网订单
 * @param calValues 计算值对象
 * @returns 是否为钢网订单
 */
export function isStencilOrder(calValues: unknown): boolean {
  return getProductType(calValues) === 'stencil';
}

/**
 * 检查是否为PCB订单
 * @param calValues 计算值对象
 * @returns 是否为PCB订单
 */
export function isPcbOrder(calValues: unknown): boolean {
  return getProductType(calValues) === 'pcb';
}

/**
 * 检查是否为SMT订单
 * @param calValues 计算值对象
 * @returns 是否为SMT订单
 */
export function isSmtOrder(calValues: unknown): boolean {
  return getProductType(calValues) === 'smt';
}

/**
 * 检查是否为组合订单
 * @param calValues 计算值对象
 * @returns 是否为组合订单
 */
export function isComboOrder(calValues: unknown): boolean {
  return getProductType(calValues) === 'combo';
}

/**
 * 格式化价格显示
 * @param price 价格
 * @param currency 货币符号，默认为USD
 * @returns 格式化后的价格字符串
 */
export function formatPrice(price: number, currency: string = 'USD'): string {
  const symbol = currency === 'USD' ? '$' : currency === 'CNY' ? '¥' : currency;
  return `${symbol}${Number(price).toFixed(2)}`;
}

/**
 * 格式化产品价格显示（包含产品类型标识）
 * @param calValues 计算值对象
 * @param currency 货币符号，默认为USD
 * @returns 格式化后的产品价格字符串
 */
export function formatProductPrice(calValues: unknown, currency: string = 'USD'): string {
  const productType = getProductTypeDisplay(calValues);
  const price = getProductPrice(calValues);
  return `${productType}: ${formatPrice(price, currency)}`;
} 