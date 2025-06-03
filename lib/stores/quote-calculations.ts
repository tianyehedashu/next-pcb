import { QuoteFormData } from "../../app/quote2/schema/quoteSchema";
import { 
  HdiType, SurfaceFinish, MinTrace, MinHole, CopperWeight, InnerCopperWeight 
} from "../../app/quote2/schema/shared-types";
import { calcProductionCycle } from "../productCycleCalc-v3";

// === 计算工具函数 ===

/**
 * 获取铜厚的数值
 */
export const getCopperWeightValue = (weight: CopperWeight | InnerCopperWeight): number => {
  return parseFloat(weight);
};

/**
 * 计算PCB的基础复杂度分数
 */
export const calculateComplexityScore = (formData: QuoteFormData): number => {
  let score = 0;
  
  // 层数影响 (0-40分)
  score += Math.min(formData.layers * 2, 40);
  
  // HDI工艺 (0-20分)
  if (formData.hdi === HdiType.Step1) score += 10;
  else if (formData.hdi === HdiType.Step2) score += 15;
  else if (formData.hdi === HdiType.Step3) score += 20;
  
  // 线宽线距 (0-15分)
  if (formData.minTrace === MinTrace.ThreeFive) score += 15;
  else if (formData.minTrace === MinTrace.FourFour) score += 10;
  else if (formData.minTrace === MinTrace.FiveFive) score += 5;
  
  // 孔径 (0-10分)
  if (formData.minHole === MinHole.ZeroOneFive) score += 10;
  else if (formData.minHole === MinHole.ZeroTwo) score += 7;
  else if (formData.minHole === MinHole.ZeroTwoFive) score += 5;
  
  // 特殊工艺 (0-15分)
  let specialFeatures = 0;
  if (formData.impedance) specialFeatures += 3;
  if (formData.castellated) specialFeatures += 2;
  if (formData.goldFingers) specialFeatures += 3;
  if (formData.edgePlating) specialFeatures += 2;
  if (formData.bga) specialFeatures += 3;
  if (formData.holeCu25um) specialFeatures += 2;
  score += Math.min(specialFeatures, 15);
  
  return Math.min(score, 100);
};

/**
 * 计算生产成本系数
 */
export const calculateCostMultiplier = (formData: QuoteFormData): number => {
  let multiplier = 1.0;
  
  // 层数影响
  if (formData.layers > 2) {
    multiplier += (formData.layers - 2) * 0.3;
  }
  
  // HDI工艺
  if (formData.hdi === HdiType.Step1) multiplier += 0.5;
  else if (formData.hdi === HdiType.Step2) multiplier += 1.0;
  else if (formData.hdi === HdiType.Step3) multiplier += 1.5;
  
  // 特殊表面处理
  if (formData.surfaceFinish === SurfaceFinish.Enig) multiplier += 0.3;
  else if (formData.surfaceFinish === SurfaceFinish.ImmersionSilver) multiplier += 0.4;
  else if (formData.surfaceFinish === SurfaceFinish.ImmersionTin) multiplier += 0.2;
  else if (formData.surfaceFinish === SurfaceFinish.OSP) multiplier += 0.1;
  
  // 特殊工艺
  if (formData.impedance) multiplier += 0.2;
  if (formData.goldFingers) multiplier += 0.3;
  if (formData.bga) multiplier += 0.2;
  
  return multiplier;
};

/**
 * 计算预估交期 - 使用v3版本的精确计算，返回完整信息
 */
export const calculateLeadTime = (formData: QuoteFormData, orderTime?: Date, delivery?: 'standard' | 'urgent'): { cycleDays: number; reason: string[] } => {
  const result = calcProductionCycle(
    formData, 
    orderTime || new Date(), 
    delivery || 'standard'
  );
  
  return result;
};

/**
 * 计算预估交期（带详细原因）- 使用v3版本的精确计算
 * @deprecated 使用 calculateLeadTime 替代，现在它已经返回完整信息
 */
export const calculateLeadTimeWithReason = (
  formData: QuoteFormData, 
  orderTime?: Date, 
  delivery?: 'standard' | 'urgent'
): { cycleDays: number; reason: string[] } => {
  return calcProductionCycle(
    formData, 
    orderTime || new Date(), 
    delivery || 'standard'
  );
};

/**
 * 计算PCB重量 (克)
 */
export const calculateWeight = (formData: QuoteFormData): number => {
  const area = formData.singleDimensions.length * formData.singleDimensions.width; // mm²
  const quantity = formData.singleCount;
  
  // 基材重量 (FR4密度约1.85g/cm³)
  const baseDensity = 1.85; // g/cm³
  const baseVolume = (area / 100) * formData.thickness * quantity; // cm³
  const baseWeight = baseVolume * baseDensity;
  
  // 铜重量 (铜密度8.96g/cm³，1oz铜厚约35μm)
  const copperDensity = 8.96; // g/cm³
  const outerCopperThickness = getCopperWeightValue(formData.outerCopperWeight) * 0.035; // mm
  const innerCopperThickness = getCopperWeightValue(formData.innerCopperWeight) * 0.035; // mm
  
  // 外层铜重量
  const outerCopperVolume = (area / 100) * outerCopperThickness * 2 * quantity; // cm³ (两面)
  const outerCopperWeight = outerCopperVolume * copperDensity;
  
  // 内层铜重量
  const innerLayers = Math.max(0, formData.layers - 2);
  const innerCopperVolume = (area / 100) * innerCopperThickness * innerLayers * quantity; // cm³
  const innerCopperWeight = innerCopperVolume * copperDensity;
  
  return baseWeight + outerCopperWeight + innerCopperWeight;
};

/**
 * 获取复杂度等级描述
 */
export const getComplexityDescription = (level: 'Simple' | 'Standard' | 'Complex' | 'Advanced'): string => {
  switch (level) {
    case 'Simple':
      return 'Basic PCB with standard features, easy to manufacture';
    case 'Standard':
      return 'Multi-layer PCB with some advanced features';
    case 'Complex':
      return 'High-density PCB with advanced technologies';
    case 'Advanced':
      return 'Cutting-edge PCB with maximum complexity';
    default:
      return 'Unknown complexity level';
  }
};

/**
 * 获取价格类别描述
 */
export const getPriceCategoryDescription = (category: 'Economy' | 'Standard' | 'Premium' | 'Ultra'): string => {
  switch (category) {
    case 'Economy':
      return 'Cost-effective solution for standard applications';
    case 'Standard':
      return 'Balanced cost and performance for most applications';
    case 'Premium':
      return 'High-performance solution with advanced features';
    case 'Ultra':
      return 'Top-tier solution for demanding applications';
    default:
      return 'Unknown price category';
  }
};

/**
 * 计算材料利用率
 */
export const calculateMaterialUtilization = (formData: QuoteFormData): number => {
  const singleArea = formData.singleDimensions.length * formData.singleDimensions.width;
  
  // 假设标准板材尺寸为100x100mm
  const standardPanelArea = 100 * 100;
  
  // 计算单片PCB在标准板材上的利用率
  const utilization = (singleArea / standardPanelArea) * 100;
  
  return Math.min(utilization, 100);
};

/**
 * 获取推荐的测试方法
 */
export const getRecommendedTestMethod = (formData: QuoteFormData): string => {
  const complexityScore = calculateComplexityScore(formData);
  
  if (complexityScore > 70) {
    return 'Test Fixture'; // 高复杂度推荐测试夹具
  } else if (complexityScore > 40) {
    return '100% FPT for Batches'; // 中等复杂度推荐飞针测试
  } else {
    return 'None'; // 低复杂度可以免测
  }
};

/**
 * 计算环保评分
 */
export const calculateEnvironmentalScore = (formData: QuoteFormData): number => {
  let score = 50; // 基础分
  
  // 无铅工艺加分
  if (formData.surfaceFinish === SurfaceFinish.LeadFree) score += 20;
  if (formData.surfaceFinish === SurfaceFinish.OSP) score += 15;
  if (formData.surfaceFinish === SurfaceFinish.Enig) score += 10;
  
  // 使用生益材料加分
  if (formData.useShengyiMaterial) score += 10;
  
  // 减少铜厚减分
  const totalCopperWeight = getCopperWeightValue(formData.outerCopperWeight) + 
                           getCopperWeightValue(formData.innerCopperWeight);
  if (totalCopperWeight > 4) score -= 10;
  
  return Math.max(0, Math.min(100, score));
};

// === 导出所有工具函数 ===
export const QuoteCalculationUtils = {
  getCopperWeightValue,
  calculateComplexityScore,
  calculateCostMultiplier,
  calculateLeadTime,
  calculateLeadTimeWithReason,
  calculateWeight,
  getComplexityDescription,
  getPriceCategoryDescription,
  calculateMaterialUtilization,
  getRecommendedTestMethod,
  calculateEnvironmentalScore,
}; 