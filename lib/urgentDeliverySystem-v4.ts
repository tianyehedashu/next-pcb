/**
 * 🚀 加急交期系统 v4.0
 * 基于HTML文档中的详细加急逻辑规则
 * 
 * 主要特性：
 * 1. 精细化的加急天数限制（根据层数、铜厚、面积区间）
 * 2. 阶梯式加急费用（减1天到减8天的不同价格）
 * 3. 复杂的支持矩阵（某些配置不支持加急）
 * 4. 面积区间细分（0-0.5㎡、0.5-1㎡、1-3㎡等）
 */

import { QuoteFormData } from "@/app/quote2/schema/quoteSchema";

// 加急选项类型定义
export interface UrgentOption {
  reduceDays: number;      // 减少的天数
  fee: number;             // 加急费用（元）
  feeType: 'fixed' | 'per_sqm';  // 费用类型：固定费用 或 每平米费用
  supported: boolean;      // 是否支持
  label: string;           // 显示标签
}

// 加急配置类型
export interface UrgentConfig {
  maxReduceDays: number;   // 最大可减天数
  options: UrgentOption[]; // 可选的加急选项
}

// 面积区间枚举
export enum AreaRange {
  SMALL = '0-0.5',      // 0-0.5㎡
  MEDIUM = '0.5-1',     // 0.5-1㎡
  LARGE = '1-3',        // 1-3㎡
  EXTRA_LARGE = '3+'    // 3㎡以上
}

// 铜厚类型
export enum CopperType {
  ONE_OZ = '1oz',
  TWO_OZ = '2oz',
  THREE_OZ = '3oz',
  FOUR_OZ = '4oz'
}

// 获取面积区间
function getAreaRange(area: number): AreaRange {
  if (area <= 0.5) return AreaRange.SMALL;
  if (area <= 1) return AreaRange.MEDIUM;
  if (area <= 3) return AreaRange.LARGE;
  return AreaRange.EXTRA_LARGE;
}

// 获取铜厚类型
function getCopperType(form: QuoteFormData): CopperType {
  const outerOz = Number(form.outerCopperWeight || '1');
  const innerOz = Number(form.innerCopperWeight || '1');
  const maxOz = Math.max(outerOz, innerOz);
  
  if (maxOz >= 4) return CopperType.FOUR_OZ;
  if (maxOz >= 3) return CopperType.THREE_OZ;
  if (maxOz >= 2) return CopperType.TWO_OZ;
  return CopperType.ONE_OZ;
}

// 加急数据表 - 基于HTML文档完整整理
const URGENT_DATA_TABLE: Record<string, UrgentConfig> = {
  // === 1层板配置 ===
  '1-1oz-0-0.5': {
    maxReduceDays: 3,
    options: [
      { reduceDays: 1, fee: 50, feeType: 'fixed', supported: true, label: '减1天 (+50元)' },
      { reduceDays: 2, fee: 200, feeType: 'fixed', supported: true, label: '减2天 (+200元)' },
      { reduceDays: 3, fee: 500, feeType: 'fixed', supported: true, label: '减3天 (+500元)' },
    ]
  },
  '1-1oz-0.5-1': {
    maxReduceDays: 3,
    options: [
      { reduceDays: 1, fee: 50, feeType: 'fixed', supported: true, label: '减1天 (+50元)' },
      { reduceDays: 2, fee: 200, feeType: 'fixed', supported: true, label: '减2天 (+200元)' },
      { reduceDays: 3, fee: 500, feeType: 'fixed', supported: true, label: '减3天 (+500元)' },
    ]
  },
  '1-1oz-1-3': {
    maxReduceDays: 3,
    options: [
      { reduceDays: 1, fee: 200, feeType: 'per_sqm', supported: true, label: '减1天 (+200元/㎡)' },
      { reduceDays: 2, fee: 300, feeType: 'per_sqm', supported: true, label: '减2天 (+300元/㎡)' },
      { reduceDays: 3, fee: 400, feeType: 'per_sqm', supported: true, label: '减3天 (+400元/㎡)' },
    ]
  },
  '1-2oz-0-0.5': {
    maxReduceDays: 3,
    options: [
      { reduceDays: 1, fee: 50, feeType: 'fixed', supported: true, label: '减1天 (+50元)' },
      { reduceDays: 2, fee: 200, feeType: 'fixed', supported: true, label: '减2天 (+200元)' },
      { reduceDays: 3, fee: 500, feeType: 'fixed', supported: true, label: '减3天 (+500元)' },
    ]
  },
  '1-2oz-0.5-1': {
    maxReduceDays: 3,
    options: [
      { reduceDays: 1, fee: 100, feeType: 'fixed', supported: true, label: '减1天 (+100元)' },
      { reduceDays: 2, fee: 300, feeType: 'fixed', supported: true, label: '减2天 (+300元)' },
      { reduceDays: 3, fee: 600, feeType: 'fixed', supported: true, label: '减3天 (+600元)' },
    ]
  },
  '1-2oz-1-3': {
    maxReduceDays: 3,
    options: [
      { reduceDays: 1, fee: 200, feeType: 'per_sqm', supported: true, label: '减1天 (+200元/㎡)' },
      { reduceDays: 2, fee: 300, feeType: 'per_sqm', supported: true, label: '减2天 (+300元/㎡)' },
      { reduceDays: 3, fee: 400, feeType: 'per_sqm', supported: true, label: '减3天 (+400元/㎡)' },
    ]
  },

  // === 2层板配置 ===
  '2-1oz-0-0.5': {
    maxReduceDays: 3,
    options: [
      { reduceDays: 1, fee: 100, feeType: 'fixed', supported: true, label: '减1天 (+100元)' },
      { reduceDays: 2, fee: 300, feeType: 'fixed', supported: true, label: '减2天 (+300元)' },
      { reduceDays: 3, fee: 600, feeType: 'fixed', supported: true, label: '减3天 (+600元)' },
    ]
  },
  '2-1oz-0.5-1': {
    maxReduceDays: 3,
    options: [
      { reduceDays: 1, fee: 100, feeType: 'fixed', supported: true, label: '减1天 (+100元)' },
      { reduceDays: 2, fee: 300, feeType: 'fixed', supported: true, label: '减2天 (+300元)' },
      { reduceDays: 3, fee: 600, feeType: 'fixed', supported: true, label: '减3天 (+600元)' },
    ]
  },
  '2-1oz-1-3': {
    maxReduceDays: 3,
    options: [
      { reduceDays: 1, fee: 200, feeType: 'per_sqm', supported: true, label: '减1天 (+200元/㎡)' },
      { reduceDays: 2, fee: 300, feeType: 'per_sqm', supported: true, label: '减2天 (+300元/㎡)' },
      { reduceDays: 3, fee: 400, feeType: 'per_sqm', supported: true, label: '减3天 (+400元/㎡)' },
    ]
  },
  '2-2oz-0-0.5': {
    maxReduceDays: 3,
    options: [
      { reduceDays: 1, fee: 100, feeType: 'fixed', supported: true, label: '减1天 (+100元)' },
      { reduceDays: 2, fee: 200, feeType: 'fixed', supported: true, label: '减2天 (+200元)' },
      { reduceDays: 3, fee: 500, feeType: 'fixed', supported: true, label: '减3天 (+500元)' },
    ]
  },
  '2-2oz-0.5-1': {
    maxReduceDays: 3,
    options: [
      { reduceDays: 1, fee: 100, feeType: 'fixed', supported: true, label: '减1天 (+100元)' },
      { reduceDays: 2, fee: 300, feeType: 'fixed', supported: true, label: '减2天 (+300元)' },
      { reduceDays: 3, fee: 600, feeType: 'fixed', supported: true, label: '减3天 (+600元)' },
    ]
  },
  '2-2oz-1-3': {
    maxReduceDays: 3,
    options: [
      { reduceDays: 1, fee: 200, feeType: 'per_sqm', supported: true, label: '减1天 (+200元/㎡)' },
      { reduceDays: 2, fee: 300, feeType: 'per_sqm', supported: true, label: '减2天 (+300元/㎡)' },
      { reduceDays: 3, fee: 400, feeType: 'per_sqm', supported: true, label: '减3天 (+400元/㎡)' },
    ]
  },

  // === 4层板配置 ===
  '4-1oz-0-0.5': {
    maxReduceDays: 4,
    options: [
      { reduceDays: 1, fee: 200, feeType: 'fixed', supported: true, label: '减1天 (+200元)' },
      { reduceDays: 2, fee: 400, feeType: 'fixed', supported: true, label: '减2天 (+400元)' },
      { reduceDays: 3, fee: 500, feeType: 'fixed', supported: true, label: '减3天 (+500元)' },
      { reduceDays: 4, fee: 600, feeType: 'fixed', supported: true, label: '减4天 (+600元)' },
    ]
  },
  '4-1oz-0.5-1': {
    maxReduceDays: 4,
    options: [
      { reduceDays: 1, fee: 200, feeType: 'fixed', supported: true, label: '减1天 (+200元)' },
      { reduceDays: 2, fee: 500, feeType: 'fixed', supported: true, label: '减2天 (+500元)' },
      { reduceDays: 3, fee: 600, feeType: 'fixed', supported: true, label: '减3天 (+600元)' },
      { reduceDays: 4, fee: 800, feeType: 'fixed', supported: true, label: '减4天 (+800元)' },
    ]
  },
  '4-1oz-1-3': {
    maxReduceDays: 5,
    options: [
      { reduceDays: 1, fee: 50, feeType: 'per_sqm', supported: true, label: '减1天 (+50元/㎡)' },
      { reduceDays: 2, fee: 100, feeType: 'per_sqm', supported: true, label: '减2天 (+100元/㎡)' },
      { reduceDays: 3, fee: 200, feeType: 'per_sqm', supported: true, label: '减3天 (+200元/㎡)' },
      { reduceDays: 4, fee: 400, feeType: 'per_sqm', supported: true, label: '减4天 (+400元/㎡)' },
      { reduceDays: 5, fee: 600, feeType: 'per_sqm', supported: true, label: '减5天 (+600元/㎡)' },
    ]
  },
  '4-2oz-0-0.5': {
    maxReduceDays: 4,
    options: [
      { reduceDays: 1, fee: 100, feeType: 'fixed', supported: true, label: '减1天 (+100元)' },
      { reduceDays: 2, fee: 200, feeType: 'fixed', supported: true, label: '减2天 (+200元)' },
      { reduceDays: 3, fee: 400, feeType: 'fixed', supported: true, label: '减3天 (+400元)' },
      { reduceDays: 4, fee: 600, feeType: 'fixed', supported: true, label: '减4天 (+600元)' },
    ]
  },
  '4-2oz-0.5-1': {
    maxReduceDays: 4,
    options: [
      { reduceDays: 1, fee: 100, feeType: 'fixed', supported: true, label: '减1天 (+100元)' },
      { reduceDays: 2, fee: 300, feeType: 'fixed', supported: true, label: '减2天 (+300元)' },
      { reduceDays: 3, fee: 600, feeType: 'fixed', supported: true, label: '减3天 (+600元)' },
      { reduceDays: 4, fee: 800, feeType: 'fixed', supported: true, label: '减4天 (+800元)' },
    ]
  },
  '4-2oz-1-3': {
    maxReduceDays: 4,
    options: [
      { reduceDays: 1, fee: 100, feeType: 'per_sqm', supported: true, label: '减1天 (+100元/㎡)' },
      { reduceDays: 2, fee: 200, feeType: 'per_sqm', supported: true, label: '减2天 (+200元/㎡)' },
      { reduceDays: 3, fee: 300, feeType: 'per_sqm', supported: true, label: '减3天 (+300元/㎡)' },
      { reduceDays: 4, fee: 600, feeType: 'per_sqm', supported: true, label: '减4天 (+600元/㎡)' },
    ]
  },

  // === 6层板配置 ===
  '6-1oz-0-0.5': {
    maxReduceDays: 4, // [2,4]范围，但从减2天开始
    options: [
      { reduceDays: 2, fee: 500, feeType: 'fixed', supported: true, label: '减2天 (+500元)' },
      { reduceDays: 3, fee: 700, feeType: 'fixed', supported: true, label: '减3天 (+700元)' },
      { reduceDays: 4, fee: 1000, feeType: 'fixed', supported: true, label: '减4天 (+1000元)' },
    ]
  },
  '6-1oz-0.5-1': {
    maxReduceDays: 4,
    options: [
      { reduceDays: 2, fee: 600, feeType: 'fixed', supported: true, label: '减2天 (+600元)' },
      { reduceDays: 3, fee: 800, feeType: 'fixed', supported: true, label: '减3天 (+800元)' },
      { reduceDays: 4, fee: 1500, feeType: 'fixed', supported: true, label: '减4天 (+1500元)' },
    ]
  },
  '6-1oz-1-3': {
    maxReduceDays: 6,
    options: [
      { reduceDays: 1, fee: 50, feeType: 'per_sqm', supported: true, label: '减1天 (+50元/㎡)' },
      { reduceDays: 2, fee: 100, feeType: 'per_sqm', supported: true, label: '减2天 (+100元/㎡)' },
      { reduceDays: 3, fee: 200, feeType: 'per_sqm', supported: true, label: '减3天 (+200元/㎡)' },
      { reduceDays: 4, fee: 400, feeType: 'per_sqm', supported: true, label: '减4天 (+400元/㎡)' },
      { reduceDays: 5, fee: 600, feeType: 'per_sqm', supported: true, label: '减5天 (+600元/㎡)' },
      { reduceDays: 6, fee: 800, feeType: 'per_sqm', supported: true, label: '减6天 (+800元/㎡)' },
    ]
  },
  '6-2oz-0-0.5': {
    maxReduceDays: 5, // [2,5]范围
    options: [
      { reduceDays: 2, fee: 400, feeType: 'fixed', supported: true, label: '减2天 (+400元)' },
      { reduceDays: 3, fee: 600, feeType: 'fixed', supported: true, label: '减3天 (+600元)' },
      { reduceDays: 4, fee: 800, feeType: 'fixed', supported: true, label: '减4天 (+800元)' },
      { reduceDays: 5, fee: 1500, feeType: 'fixed', supported: true, label: '减5天 (+1500元)' },
    ]
  },
  '6-2oz-0.5-1': {
    maxReduceDays: 4,
    options: [
      { reduceDays: 2, fee: 400, feeType: 'fixed', supported: true, label: '减2天 (+400元)' },
      { reduceDays: 3, fee: 600, feeType: 'fixed', supported: true, label: '减3天 (+600元)' },
      { reduceDays: 4, fee: 1500, feeType: 'fixed', supported: true, label: '减4天 (+1500元)' },
    ]
  },
  '6-2oz-1-3': {
    maxReduceDays: 3,
    options: [
      { reduceDays: 1, fee: 100, feeType: 'per_sqm', supported: true, label: '减1天 (+100元/㎡)' },
      { reduceDays: 2, fee: 200, feeType: 'per_sqm', supported: true, label: '减2天 (+200元/㎡)' },
      { reduceDays: 3, fee: 400, feeType: 'per_sqm', supported: true, label: '减3天 (+400元/㎡)' },
    ]
  },

  // === 8层板配置 ===
  '8-1oz-0-0.5': {
    maxReduceDays: 6, // [4,6]范围，从减4天开始
    options: [
      { reduceDays: 4, fee: 700, feeType: 'fixed', supported: true, label: '减4天 (+700元)' },
      { reduceDays: 5, fee: 1200, feeType: 'fixed', supported: true, label: '减5天 (+1200元)' },
      { reduceDays: 6, fee: 1500, feeType: 'fixed', supported: true, label: '减6天 (+1500元)' },
    ]
  },
  '8-1oz-0.5-1': {
    maxReduceDays: 6,
    options: [
      { reduceDays: 4, fee: 800, feeType: 'fixed', supported: true, label: '减4天 (+800元)' },
      { reduceDays: 5, fee: 1500, feeType: 'fixed', supported: true, label: '减5天 (+1500元)' },
      { reduceDays: 6, fee: 2000, feeType: 'fixed', supported: true, label: '减6天 (+2000元)' },
    ]
  },
  '8-1oz-1-3': {
    maxReduceDays: 8,
    options: [
      { reduceDays: 1, fee: 50, feeType: 'per_sqm', supported: true, label: '减1天 (+50元/㎡)' },
      { reduceDays: 2, fee: 100, feeType: 'per_sqm', supported: true, label: '减2天 (+100元/㎡)' },
      { reduceDays: 3, fee: 200, feeType: 'per_sqm', supported: true, label: '减3天 (+200元/㎡)' },
      { reduceDays: 4, fee: 400, feeType: 'per_sqm', supported: true, label: '减4天 (+400元/㎡)' },
      { reduceDays: 5, fee: 600, feeType: 'per_sqm', supported: true, label: '减5天 (+600元/㎡)' },
      { reduceDays: 6, fee: 800, feeType: 'per_sqm', supported: true, label: '减6天 (+800元/㎡)' },
      { reduceDays: 7, fee: 1000, feeType: 'per_sqm', supported: true, label: '减7天 (+1000元/㎡)' },
      { reduceDays: 8, fee: 1200, feeType: 'per_sqm', supported: true, label: '减8天 (+1200元/㎡)' },
    ]
  },
  '8-2oz-0-0.5': {
    maxReduceDays: 6,
    options: [
      { reduceDays: 4, fee: 600, feeType: 'fixed', supported: true, label: '减4天 (+600元)' },
      { reduceDays: 5, fee: 1100, feeType: 'fixed', supported: true, label: '减5天 (+1100元)' },
      { reduceDays: 6, fee: 1600, feeType: 'fixed', supported: true, label: '减6天 (+1600元)' },
    ]
  },
  '8-2oz-0.5-1': {
    maxReduceDays: 6,
    options: [
      { reduceDays: 4, fee: 600, feeType: 'fixed', supported: true, label: '减4天 (+600元)' },
      { reduceDays: 5, fee: 1200, feeType: 'fixed', supported: true, label: '减5天 (+1200元)' },
      { reduceDays: 6, fee: 1700, feeType: 'fixed', supported: true, label: '减6天 (+1700元)' },
    ]
  },

  // === 10层板配置 ===
  '10-1oz-0-0.5': {
    maxReduceDays: 6, // 只支持减5-6天
    options: [
      { reduceDays: 5, fee: 1500, feeType: 'fixed', supported: true, label: '减5天 (+1500元)' },
      { reduceDays: 6, fee: 1800, feeType: 'fixed', supported: true, label: '减6天 (+1800元)' },
    ]
  },
  '10-1oz-1-3': {
    maxReduceDays: 6,
    options: [
      { reduceDays: 1, fee: 50, feeType: 'per_sqm', supported: true, label: '减1天 (+50元/㎡)' },
      { reduceDays: 2, fee: 100, feeType: 'per_sqm', supported: true, label: '减2天 (+100元/㎡)' },
      { reduceDays: 3, fee: 200, feeType: 'per_sqm', supported: true, label: '减3天 (+200元/㎡)' },
      { reduceDays: 4, fee: 400, feeType: 'per_sqm', supported: true, label: '减4天 (+400元/㎡)' },
      { reduceDays: 5, fee: 600, feeType: 'per_sqm', supported: true, label: '减5天 (+600元/㎡)' },
      { reduceDays: 6, fee: 800, feeType: 'per_sqm', supported: true, label: '减6天 (+800元/㎡)' },
    ]
  },

  // 12层及以上：通常不支持加急
  '12-1oz-0-0.5': { maxReduceDays: 0, options: [] },
  '12-1oz-0.5-1': { maxReduceDays: 0, options: [] },
  '12-1oz-1-3': { maxReduceDays: 0, options: [] },
  '14-1oz-0-0.5': { maxReduceDays: 0, options: [] },
  '14-1oz-0.5-1': { maxReduceDays: 0, options: [] },
  '14-1oz-1-3': { maxReduceDays: 0, options: [] },
  '16-1oz-0-0.5': { maxReduceDays: 0, options: [] },
  '18-1oz-0-0.5': { maxReduceDays: 0, options: [] },
  '20-1oz-0-0.5': { maxReduceDays: 0, options: [] },
};

/**
 * 获取加急配置
 * @param form 表单数据
 * @param area 面积
 * @returns 加急配置
 */
export function getUrgentConfig(form: QuoteFormData, area: number): UrgentConfig {
  const layers = Number(form.layers || 2);
  const copperType = getCopperType(form);
  const areaRange = getAreaRange(area);
  
  // 构建查表key
  const key = `${layers}-${copperType}-${areaRange}`;
  const config = URGENT_DATA_TABLE[key];
  
  if (config) {
    return config;
  }
  
  // 默认配置：不支持加急
  return {
    maxReduceDays: 0,
    options: []
  };
}

/**
 * 计算加急费用
 * @param form 表单数据  
 * @param area 面积
 * @param reduceDays 减少天数
 * @returns 加急费用信息
 */
export function calculateUrgentFee(
  form: QuoteFormData, 
  area: number, 
  reduceDays: number
): {
  fee: number;
  feeType: 'fixed' | 'per_sqm';
  description: string;
  supported: boolean;
} {
  const config = getUrgentConfig(form, area);
  const option = config.options.find(opt => opt.reduceDays === reduceDays);
  
  if (!option || !option.supported) {
    return {
      fee: 0,
      feeType: 'fixed',
      description: '不支持此加急选项',
      supported: false
    };
  }
  
  let actualFee = option.fee;
  let description = option.label;
  
  if (option.feeType === 'per_sqm') {
    actualFee = option.fee * area;
    description = `减${reduceDays}天: ${option.fee}元/㎡ × ${area.toFixed(2)}㎡ = ${actualFee.toFixed(0)}元`;
  } else {
    description = `减${reduceDays}天: ${actualFee}元`;
  }
  
  return {
    fee: actualFee,
    feeType: option.feeType,
    description,
    supported: true
  };
}

/**
 * 获取可用的加急选项
 * @param form 表单数据
 * @param area 面积
 * @returns 可用的加急选项列表
 */
export function getAvailableUrgentOptions(form: QuoteFormData, area: number): UrgentOption[] {
  const config = getUrgentConfig(form, area);
  return config.options.filter(option => option.supported);
}

/**
 * 检查是否支持加急
 * @param form 表单数据
 * @param area 面积
 * @returns 是否支持加急
 */
export function isUrgentSupported(form: QuoteFormData, area: number): boolean {
  const config = getUrgentConfig(form, area);
  return config.maxReduceDays > 0 && config.options.length > 0;
}

/**
 * 获取最大可减天数
 */
export function getMaxReduceDays(form: QuoteFormData, area: number): number {
  const config = getUrgentConfig(form, area);
  return config.maxReduceDays;
}

/**
 * 验证加急选项是否有效
 */
export function validateUrgentOption(form: QuoteFormData, area: number, reduceDays: number): boolean {
  const config = getUrgentConfig(form, area);
  return config.options.some(option => option.reduceDays === reduceDays && option.supported);
} 