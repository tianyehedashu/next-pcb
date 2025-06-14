import type { QuoteFormData as PcbQuoteForm } from '@/app/quote2/schema/quoteSchema';
import { calculateTotalPcbArea } from './utils/precision';
import { ShipmentType } from '@/types/form';
import { shippingZones } from './shipping-constants';

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

// 铜层厚度换算 (1 oz = 35 微米)
const OZ_TO_MM = 0.035;

// 计算单片PCB重量（克）
function calculateSinglePCBWeight(specs: PCBSpecs | PcbQuoteForm): number {
  // 兼容 PcbQuoteForm
  const s = specs as PcbQuoteForm;
  // 使用 calculateTotalPcbArea 计算面积（单位m²）
  const { singleArea } = calculateTotalPcbArea(s);
  // singleArea 单位为 m²，需转为 cm² 参与后续体积/重量计算
  const areaM2 = singleArea; // m²
  const area = areaM2 * 10000; // cm²
  const thickness = typeof s.thickness === 'number' ? s.thickness : parseFloat(String(s.thickness)) || 0;

  // 1. 计算基材重量
  const density = materialDensity[s.pcbType.toLowerCase() as keyof typeof materialDensity] ?? 1.85;
  // baseVolume 单位：cm³ = 面积(cm²) * 厚度(cm)
  const baseVolume = area * (thickness / 10);
  const baseWeight = baseVolume * density;

  // 2. 计算铜层重量（区分内外层）
  const outerCopperOz = parseFloat(String(s.outerCopperWeight || '1')) || 1;
  const innerCopperOz = s.layers >= 4 ? (parseFloat(String(s.innerCopperWeight || '1'))) : 0;
  const outerCopperThicknessCm = (outerCopperOz * OZ_TO_MM) / 10;
  const innerCopperThicknessCm = (innerCopperOz * OZ_TO_MM) / 10;
  const COPPER_COVERAGE = 0.75;

  // 外层铜箔重量（2层）
  const outerCopperWeight = 2 * area * outerCopperThicknessCm * materialDensity.copper * COPPER_COVERAGE;
  // 内层铜箔重量（多层板才有）
  const innerLayerCount = Math.max(0, s.layers - 2);
  const innerCopperWeight = innerLayerCount * area * innerCopperThicknessCm * materialDensity.copper * COPPER_COVERAGE;

  // 3. 计算焊盘和过孔的额外铜重量
  const PLATING_WEIGHT_FACTOR = 0.03;
  const platingWeight = (outerCopperWeight + innerCopperWeight) * PLATING_WEIGHT_FACTOR;

  // 4. 计算阻焊层重量
  const SOLDER_MASK_WEIGHT = 0.0025;
  const solderMaskWeight = area * SOLDER_MASK_WEIGHT * 2;

  // 5. 计算丝印重量
  const SILKSCREEN_WEIGHT = 0.0015;
  const silkscreenWeight = area * SILKSCREEN_WEIGHT * 2;

  // 总重量
  return baseWeight + outerCopperWeight + innerCopperWeight + platingWeight + solderMaskWeight + silkscreenWeight;
}

// 计算体积重量
export function calculateVolumetricWeight(dimensions: Dimensions): number {
  const { length, width, height, quantity } = dimensions;
  // 将厚度从毫米转换为厘米
  const heightInCm = height / 10;
  // 体积重 = 长(cm) × 宽(cm) × 高(cm) ÷ 5000
  return (length * width * heightInCm * quantity) / 5000;
}

// 计算实际重量和体积重量中的较大值
function calculateChargeableWeight(dimensions: Dimensions, actualWeight: number): number {
  const volumetricWeight = calculateVolumetricWeight(dimensions);
  return Math.max(volumetricWeight, actualWeight);
}

// 判断是否为旺季
function isPeakSeason(date: Date = new Date()): boolean {
  const month = date.getMonth() + 1;
  // 旺季：11月-次年1月
  return month >= 11 || month === 1;
}

// 计算实际运费
export function calculateShippingCost(
  specs: PcbQuoteForm,
): {
  actualWeight: number;
  volumetricWeight: number;
  chargeableWeight: number;
  baseCost: number;
  fuelSurcharge: number;
  peakCharge: number;
  finalCost: number;
  deliveryTime: string;
} {
  // 计算总数量，与 quote-store 保持一致
  let totalCount = 0;
  if (specs.shipmentType === ShipmentType.Single) {
    totalCount = (specs.singleCount || 0) * (specs.differentDesignsCount || 1);
  } else if (
    specs.shipmentType === ShipmentType.PanelByGerber ||
    specs.shipmentType === ShipmentType.PanelBySpeedx
  ) {
    const row = specs.panelDimensions?.row ?? 0;
    const column = specs.panelDimensions?.column ?? 0;
    const panelSet = specs.panelSet ?? 0;
    totalCount = row * column * panelSet;
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

  const singleWeight = calculateSinglePCBWeight(specs);
  const totalWeight = (singleWeight * totalCount) / 1000;

  const dimensions = {
    length: Number(specs.singleDimensions.length),
    width: Number(specs.singleDimensions.width),
    height: Number(specs.thickness),
    quantity: totalCount
  };

  const volumetricWeight = calculateVolumetricWeight(dimensions);
  const chargeableWeight = calculateChargeableWeight(dimensions, totalWeight);
  
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
  const zone = shippingZones.find(zone => zone.countries.includes(countryCode.toLowerCase()));
  if (!zone) {
    throw new Error('Unsupported shipping destination');
  }

  // 只检查最小重量限制
  const MIN_WEIGHT = 0.5; // 国际快递普遍最低计费重量为0.5kg
  // 计费重量按0.5kg向上取整
  const chargeableWeightRounded = Math.ceil(chargeableWeight * 2) / 2;
  if (chargeableWeightRounded < MIN_WEIGHT) {
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
  
  // 计算最终费用
  const finalCost = (baseCost + fuelSurcharge + peakCharge) * serviceMultiplier;

  return {
    actualWeight: Math.round(totalWeight * 1000) / 1000,
    volumetricWeight: Math.round(volumetricWeight * 1000) / 1000,
    chargeableWeight: chargeableWeightRounded,
    baseCost: Math.round(baseCost * 100) / 100,
    fuelSurcharge: Math.round(fuelSurcharge * 100) / 100,
    peakCharge: Math.round(peakCharge * 100) / 100,
    finalCost: Math.round(finalCost * 100) / 100,
    deliveryTime: courierRates.deliveryTime,
  };
} 