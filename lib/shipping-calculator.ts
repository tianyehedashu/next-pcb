import type { QuoteFormData as PcbQuoteForm } from '@/app/quote2/schema/quoteSchema';
import { calculateTotalPcbArea } from './utils/precision';
import { ShipmentType } from '@/types/form';
import { shippingZones } from './shipping-constants';
import { getStencilSpec, ProductType, BorderType } from '@/app/quote2/schema/stencilTypes';

// 钢网表单数据接口（用于运费计算）
interface StencilFormData {
  productType: string;
  borderType: BorderType;
  size: string;
  quantity: number;
  shippingAddress?: {
    country: string;
    courier: string;
  };
  [key: string]: unknown; // 允许其他字段
}

interface Dimensions {
  length: number;
  width: number;
  height: number;
  quantity: number;
}

interface PCBSpecs {
  pcbType: string;
  layers: number;
  outerCopperWeight: string; // 外层铜厚
  innerCopperWeight?: string; // 内层铜厚（4层及以上必填）
  singleDimensions: { length: string | number; width: string | number };
  thickness: string;
  quantity: number;
  panelCount: number;
}

// 快递服务类型系数
const serviceTypeMultipliers = {
  'express': 1.3, // 快速
  'standard': 1.0, // 标准
  'economy': 0.8  // 经济
} as const;

// 材料密度 (g/cm³)
const materialDensity = {
  fr4: 1.85, // FR4标准密度
  aluminum: 2.7,
  copper: 8.96,
  rogers: 2.2,      // 典型Rogers板密度
  flex: 1.7,        // 典型柔性板密度
  "rigid-flex": 1.8 // 典型刚挠结合板密度
};

// 导入统一汇率服务
import { getExchangeRate } from '@/lib/services/exchange-rate-service';

// 默认汇率（作为降级方案）
const DEFAULT_USD_TO_CNY_RATE = 7.2;

// 铜层厚度换算 (1 oz = 35 微米) - 业界标准
const OZ_TO_MM = 0.035;

// 计算单片PCB重量（克）- 基于业界标准的详细物理计算，
// 返回人民币计算
function calculateSinglePCBWeight(specs: PCBSpecs | PcbQuoteForm): number {
  // 兼容 PcbQuoteForm
  const s = specs as PcbQuoteForm;
  // 使用 calculateTotalPcbArea 计算面积（单位m²）
  const { singleArea } = calculateTotalPcbArea(s);
  // singleArea 单位为 m²，需转为 cm² 参与后续体积/重量计算
  const areaM2 = singleArea; // m²
  const area = areaM2 * 10000; // cm²
  const thickness = typeof s.thickness === 'number' ? s.thickness : parseFloat(String(s.thickness)) || 0;

  // 1. 计算基材重量 - 使用标准FR4密度
  const density = materialDensity[s.pcbType.toLowerCase() as keyof typeof materialDensity] ?? 1.85;
  // baseVolume 单位：cm³ = 面积(cm²) * 厚度(cm)
  const baseVolume = area * (thickness / 10);
  const baseWeight = baseVolume * density;

  // 2. 计算铜层重量（区分内外层）- 使用标准铜密度和oz换算
  const outerCopperOz = parseFloat(String(s.outerCopperWeight || '1')) || 1;
  const innerCopperOz = s.layers >= 4 ? (parseFloat(String(s.innerCopperWeight || '1'))) : 0;
  const outerCopperThicknessCm = (outerCopperOz * OZ_TO_MM) / 10;
  const innerCopperThicknessCm = (innerCopperOz * OZ_TO_MM) / 10;
  const COPPER_COVERAGE = 0.75; // 典型的铜覆盖率

  // 外层铜箔重量（2层）
  const outerCopperWeight = 2 * area * outerCopperThicknessCm * materialDensity.copper * COPPER_COVERAGE;
  // 内层铜箔重量（多层板才有）
  const innerLayerCount = Math.max(0, s.layers - 2);
  const innerCopperWeight = innerLayerCount * area * innerCopperThicknessCm * materialDensity.copper * COPPER_COVERAGE;

  // 3. 计算焊盘和过孔的额外铜重量
  const PLATING_WEIGHT_FACTOR = 0.03; // 约3%的电镀增重
  const platingWeight = (outerCopperWeight + innerCopperWeight) * PLATING_WEIGHT_FACTOR;

  // 4. 计算阻焊层重量
  const SOLDER_MASK_WEIGHT = 0.0025; // g/cm² 双面
  const solderMaskWeight = area * SOLDER_MASK_WEIGHT * 2;

  // 5. 计算丝印重量
  const SILKSCREEN_WEIGHT = 0.0015; // g/cm² 双面
  const silkscreenWeight = area * SILKSCREEN_WEIGHT * 2;

  // 总重量 = 基材 + 铜层 + 电镀 + 阻焊 + 丝印
  const totalWeight = baseWeight + outerCopperWeight + innerCopperWeight + platingWeight + solderMaskWeight + silkscreenWeight;
  
  // 在开发环境下输出计算详情
  if (process.env.NODE_ENV === 'development') {
    console.log('PCB重量计算详情:', {
      配置: `${s.layers}层 ${s.outerCopperWeight}oz ${s.thickness}mm ${area.toFixed(1)}cm²`,
      基材重量: Math.round(baseWeight * 100) / 100,
      外层铜重量: Math.round(outerCopperWeight * 100) / 100,
      内层铜重量: Math.round(innerCopperWeight * 100) / 100,
      电镀重量: Math.round(platingWeight * 100) / 100,
      阻焊重量: Math.round(solderMaskWeight * 100) / 100,
      丝印重量: Math.round(silkscreenWeight * 100) / 100,
      总重量: Math.round(totalWeight * 100) / 100
    });
  }

  return totalWeight;
}

// PCB专用体积重量计算（基于实际密度特性）
function calculatePCBVolumetricWeight(
  pcbLength: number, 
  pcbWidth: number, 
  pcbThickness: number, 
  quantity: number
): number {
  // PCB的实际体积（不是包装盒体积）
  const singlePcbVolume = (pcbLength * pcbWidth * pcbThickness) / 1000; // cm³
  const totalPcbVolume = singlePcbVolume * quantity; // cm³
  
  // 对于PCB这种高密度产品，使用更合理的体积重量系数
  // 标准的5000除数对轻泡货物适用，对PCB这种密度产品应该使用更小的除数
  const PCB_VOLUMETRIC_DIVISOR = 1000; // 相当于1000 kg/m³的密度标准，更适合PCB
  
  return totalPcbVolume / PCB_VOLUMETRIC_DIVISOR;
}

// 传统的体积重量计算（保留用于其他可能的用途）
export function calculateVolumetricWeight(dimensions: Dimensions): number {
  const { length, width, height, quantity } = dimensions;
  const singleVolumetricWeight = (length * width * height) / 5000;
  return singleVolumetricWeight * quantity;
}

// 判断是否为旺季
function isPeakSeason(date: Date = new Date()): boolean {
  const month = date.getMonth() + 1;
  // 旺季：11月-次年1月
  return month >= 11 || month === 1;
}

// 钢网专用重量计算（基于规格数据表）
function calculateStencilWeight(formData: StencilFormData): number {
  const { borderType, size, quantity } = formData;
  
  if (!size || !quantity || quantity <= 0) {
    console.warn('钢网重量计算: 缺少必要参数', { borderType, size, quantity });
    return 500; // 返回默认最小重量0.5kg (500g)
  }

  // 获取钢网规格信息
  const sizeInfo = getStencilSpec(borderType, size);
  if (!sizeInfo) {
    console.warn('钢网重量计算: 未找到对应规格', { borderType, size });
    // 返回默认重量：框架钢网2kg/件，无框钢网1kg/件
    const defaultWeight = borderType === BorderType.FRAMEWORK ? 2000 : 1000; // 克
    return defaultWeight * quantity;
  }
  
  // 严格按照钢网规格数据表的重量计算（克）
  const totalWeight = sizeInfo.weightKgPerPcs * quantity * 1000; // 转换为克
  
  // 确保最小重量
  return Math.max(totalWeight, 500); // 最小0.5kg
}

// 钢网不需要体积重量计算，因为是高密度金属产品

// 计算实际运费（异步版本，使用动态汇率）- 支持PCB、钢网、SMT产品
export async function calculateShippingCost(
  specs: PcbQuoteForm | StencilFormData, // 支持PCB、钢网、SMT产品
  usdToCnyRateOverride?: number // 可选的汇率参数，避免重复请求
): Promise<{
  actualWeight: number;
  volumetricWeight: number;
  chargeableWeight: number;
  baseCost: number;
  fuelSurcharge: number;
  peakCharge: number;
  finalCost: number;
  deliveryTime: string;
}> {
  // 判断产品类型 - 支持新的数据结构
  const productType = (specs as { productType?: string }).productType || ProductType.PCB;
  const isStencil = productType === ProductType.STENCIL || productType === 'stencil';
  // 为未来SMT支持预留 - 暂时使用字符串比较
  // const isSmtAssembly = productType === 'smt';

  // 计算总数量
  let totalCount = 0;
  
  if (isStencil) {
    // 钢网产品：直接使用quantity
    const stencilSpecs = specs as StencilFormData;
    totalCount = stencilSpecs.quantity || 0;
  } else {
    // PCB产品：使用原有逻辑
    const pcbSpecs = specs as PcbQuoteForm;
    if (pcbSpecs.shipmentType === ShipmentType.Single) {
      totalCount = (pcbSpecs.singleCount || 0) * (pcbSpecs.differentDesignsCount || 1);
    } else if (
      pcbSpecs.shipmentType === ShipmentType.PanelByGerber ||
      pcbSpecs.shipmentType === ShipmentType.PanelBySpeedx
    ) {
      const row = pcbSpecs.panelDimensions?.row ?? 0;
      const column = pcbSpecs.panelDimensions?.column ?? 0;
      const panelSet = pcbSpecs.panelSet ?? 0;
      totalCount = row * column * panelSet;
    }
  }
  
  // 如果总数为0，则无法计算运费
  if (totalCount === 0) {
    return {
      actualWeight: 0,
      volumetricWeight: 0,
      chargeableWeight: 0,
      baseCost: 0,
      fuelSurcharge: 0,
      peakCharge: 0,
      finalCost: 0,
      deliveryTime: 'N/A',
    };
  }

  let totalWeight: number;
  let volumetricWeight: number;

  if (isStencil) {
    // 钢网重量计算：严格按照钢网规格数据表，无需计算体积重量
    const stencilSpecs = specs as StencilFormData;
    totalWeight = calculateStencilWeight(stencilSpecs) / 1000; // 转换为kg
    volumetricWeight = 0; // 钢网不计算体积重量

    // 确保钢网重量满足最小要求
    if (totalWeight < 0.5) {
      console.warn('钢网重量过低，使用最小重量0.5kg', { 
        原始重量: totalWeight, 
        调整后重量: 0.5 
      });
      totalWeight = 0.5;
    }

    // 调试信息（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log('钢网重量计算:', {
        borderType: stencilSpecs.borderType,
        size: stencilSpecs.size,
        quantity: totalCount,
        totalWeight: totalWeight,
        volumetricWeight: '不计算体积重量',
        note: '钢网为高密度产品，直接使用实际重量'
      });
    }
  } else {
    // PCB重量计算：使用原有逻辑
    const pcbSpecs = specs as PcbQuoteForm;
    const singleWeight = calculateSinglePCBWeight(pcbSpecs);
    totalWeight = (singleWeight * totalCount) / 1000;

    // PCB体积重量计算
    const pcbLength = Number(pcbSpecs.singleDimensions.length);
    const pcbWidth = Number(pcbSpecs.singleDimensions.width);
    const pcbThickness = Number(pcbSpecs.thickness);
    
    volumetricWeight = calculatePCBVolumetricWeight(
      pcbLength, 
      pcbWidth, 
      pcbThickness, 
      totalCount
    );

    // 调试信息（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log('PCB体积重量计算:', {
        pcb: { length: pcbLength, width: pcbWidth, thickness: pcbThickness },
        quantity: totalCount,
        volumetricWeight: volumetricWeight,
        actualWeight: totalWeight,
        ratio: volumetricWeight / totalWeight
      });
    }
  }

  const chargeableWeight = Math.max(volumetricWeight, totalWeight);
  
  // 读取国家、快递公司、服务类型、下单时间
  const countryCode = specs.shippingAddress?.country || "";
  const courier = specs.shippingAddress?.courier as 'dhl' | 'fedex' | 'ups' || 'dhl';
  let service: keyof typeof serviceTypeMultipliers = 'standard';
  if ('shippingService' in specs && typeof (specs as Record<string, unknown>).shippingService === 'string') {
    const s = (specs as Record<string, unknown>).shippingService;
    if (s === 'express' || s === 'standard' || s === 'economy') service = s;
  }
  let orderDate: Date = new Date();
  if ('orderDate' in specs && (specs as Record<string, unknown>).orderDate instanceof Date) {
    orderDate = (specs as Record<string, unknown>).orderDate as Date;
  }

  // 查找对应的运输区域
  let zone = shippingZones.find(zone => zone.countries.includes(countryCode.toLowerCase()));
  if (!zone) {
    // 如果找不到对应的区域，使用 "other" 区域作为默认
    zone = shippingZones.find(zone => zone.zone === 'other');
    if (!zone) {
      throw new Error('Shipping configuration error: No default zone found');
    }
    console.log(`使用默认运输区域处理国家: ${countryCode}`);
  }

  // 计费重量处理
  const MIN_WEIGHT = 0.5; // 国际快递普遍最低计费重量为0.5kg
  // 确保计费重量不低于最小值
  const safeChargeableWeight = Math.max(chargeableWeight, MIN_WEIGHT);
  // 计费重量按0.5kg向上取整
  const chargeableWeightRounded = Math.ceil(safeChargeableWeight * 2) / 2;
  
  // 最终检查（冗余保护）
  if (chargeableWeightRounded < MIN_WEIGHT) {
    console.error('计费重量异常:', { 
      chargeableWeight, 
      safeChargeableWeight, 
      chargeableWeightRounded,
      productType: isStencil ? 'stencil' : 'pcb'
    });
    throw new Error(`Minimum weight requirement is ${MIN_WEIGHT}kg`);
  }

  // 获取快递公司的费率
  const courierRates = zone[courier];
  
  // 基础运费计算
  const baseCost = courierRates.baseRate + (chargeableWeightRounded * courierRates.pricePerKg);
  
  // 燃油附加费
  const fuelSurcharge = baseCost * courierRates.fuelSurcharge;
  
  // 旺季附加费
  const peakCharge = isPeakSeason(orderDate) ? baseCost * courierRates.peak : 0;

  // 应用服务类型系数
  const serviceMultiplier = serviceTypeMultipliers[service];
  
  // 计算最终费用（美元）
  const finalCostUSD = (baseCost + fuelSurcharge + peakCharge) * serviceMultiplier;
  
  // 🔧 重要修改：使用动态汇率将所有费用转换为人民币
  let usdToCnyRate = DEFAULT_USD_TO_CNY_RATE; // 默认汇率作为降级方案
  
  // 如果提供了汇率参数，直接使用，避免重复请求
  if (usdToCnyRateOverride) {
    usdToCnyRate = usdToCnyRateOverride;
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 使用传入汇率: 1 USD = ${usdToCnyRate} CNY`);
    }
  } else {
    // 只有在没有提供汇率时才请求
    try {
      const exchangeRateData = await getExchangeRate('USD', 'CNY');
      if (exchangeRateData) {
        usdToCnyRate = exchangeRateData.rate;
        if (process.env.NODE_ENV === 'development') {
          console.log(`🌐 获取动态汇率: 1 USD = ${usdToCnyRate} CNY (${exchangeRateData.source})`);
        }
      } else {
        console.warn(`⚠️ 未找到USD->CNY汇率，使用默认汇率: ${DEFAULT_USD_TO_CNY_RATE}`);
      }
    } catch (error) {
      console.warn(`❌ 获取汇率失败，使用默认汇率: ${DEFAULT_USD_TO_CNY_RATE}`, error);
    }
  }
  
  const baseCostCNY = baseCost * usdToCnyRate;
  const fuelSurchargeCNY = fuelSurcharge * usdToCnyRate;
  const peakChargeCNY = peakCharge * usdToCnyRate;
  const finalCostCNY = finalCostUSD * usdToCnyRate;

  return {
    actualWeight: Math.round(totalWeight * 1000) / 1000,
    volumetricWeight: Math.round(volumetricWeight * 1000) / 1000,
    chargeableWeight: chargeableWeightRounded,
    baseCost: Math.round(baseCostCNY * 100) / 100,        // 返回人民币
    fuelSurcharge: Math.round(fuelSurchargeCNY * 100) / 100, // 返回人民币
    peakCharge: Math.round(peakChargeCNY * 100) / 100,    // 返回人民币
    finalCost: Math.round(finalCostCNY * 100) / 100,      // 返回人民币
    deliveryTime: courierRates.deliveryTime,
  };
} 