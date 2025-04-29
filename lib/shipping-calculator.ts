interface Dimensions {
  length: number;
  width: number;
  height: number;
  quantity: number;
}

interface PCBSpecs {
  pcbType: string;
  layers: number;
  copperWeight: string;
  singleLength: string;
  singleWidth: string;
  thickness: string;
  quantity: number;
  panelCount: number;
}

interface ShippingZone {
  name: string;
  countries: string[];
  dhl: {
    baseRate: number;
    pricePerKg: number;
    fuelSurcharge: number;
    peak: number; // 旺季附加费
  };
  fedex: {
    baseRate: number;
    pricePerKg: number;
    fuelSurcharge: number;
    peak: number;
  };
  ups: {
    baseRate: number;
    pricePerKg: number;
    fuelSurcharge: number;
    peak: number;
  };
}

// 定义运输区域和各快递公司的价格
const shippingZones: ShippingZone[] = [
  {
    name: 'Zone 1 - North America',
    countries: ['us', 'ca'],
    dhl: {
      baseRate: 45,
      pricePerKg: 8.5,
      fuelSurcharge: 0.16,
      peak: 0.20
    },
    fedex: {
      baseRate: 48,
      pricePerKg: 9.0,
      fuelSurcharge: 0.18,
      peak: 0.22
    },
    ups: {
      baseRate: 46,
      pricePerKg: 8.8,
      fuelSurcharge: 0.17,
      peak: 0.21
    }
  },
  {
    name: 'Zone 2 - Europe',
    countries: ['uk', 'de', 'fr', 'it', 'es', 'nl', 'be', 'ch', 'se', 'no', 'dk', 'fi'],
    dhl: {
      baseRate: 50,
      pricePerKg: 9.5,
      fuelSurcharge: 0.18,
      peak: 0.22
    },
    fedex: {
      baseRate: 52,
      pricePerKg: 10.0,
      fuelSurcharge: 0.19,
      peak: 0.23
    },
    ups: {
      baseRate: 51,
      pricePerKg: 9.8,
      fuelSurcharge: 0.185,
      peak: 0.225
    }
  },
  {
    name: 'Zone 3 - Asia Pacific',
    countries: ['au', 'jp', 'kr', 'sg', 'my', 'th', 'vn', 'id', 'ph', 'nz'],
    dhl: {
      baseRate: 40,
      pricePerKg: 7.5,
      fuelSurcharge: 0.15,
      peak: 0.18
    },
    fedex: {
      baseRate: 42,
      pricePerKg: 8.0,
      fuelSurcharge: 0.16,
      peak: 0.19
    },
    ups: {
      baseRate: 41,
      pricePerKg: 7.8,
      fuelSurcharge: 0.155,
      peak: 0.185
    }
  }
];

// 快递服务类型系数
const serviceTypeMultipliers = {
  'express': 1.3, // 快速
  'standard': 1.0, // 标准
  'economy': 0.8  // 经济
} as const;

// 材料密度 (g/cm³)
const materialDensity = {
  'fr4': 1.85, // FR4标准密度
  'aluminum': 2.7,
  'copper': 8.96
};

// 铜层厚度换算 (1 oz = 35 微米)
const OZ_TO_MM = 0.035;

// 计算单片PCB重量（克）
function calculateSinglePCBWeight(specs: PCBSpecs): number {
  const length = parseFloat(specs.singleLength);
  const width = parseFloat(specs.singleWidth);
  const thickness = parseFloat(specs.thickness); // 单位：mm
  const area = length * width; // 面积(cm²)
  
  // 1. 计算基材重量
  const baseVolume = area * (thickness / 10); // 体积(cm³)
  const baseWeight = baseVolume * materialDensity[specs.pcbType as keyof typeof materialDensity];
  
  // 2. 计算铜层重量
  const copperOz = parseFloat(specs.copperWeight); // 单位：oz
  const copperThicknessMm = copperOz * OZ_TO_MM; // 转换为mm
  const copperThicknessCm = copperThicknessMm / 10; // 转换为cm
  
  // 考虑铜层覆盖率（一般在70-80%之间）
  const COPPER_COVERAGE = 0.75;
  
  // 外层铜箔重量（2层）
  const outerCopperWeight = 2 * area * copperThicknessCm * materialDensity.copper * COPPER_COVERAGE;
  
  // 内层铜箔重量（如果有）
  const innerLayerCount = Math.max(0, specs.layers - 2);
  const innerCopperWeight = innerLayerCount * area * copperThicknessCm * materialDensity.copper * COPPER_COVERAGE;
  
  // 3. 计算焊盘和过孔的额外铜重量（估算值，一般占总重量的2-5%）
  const PLATING_WEIGHT_FACTOR = 0.03;
  const platingWeight = (outerCopperWeight + innerCopperWeight) * PLATING_WEIGHT_FACTOR;
  
  // 4. 计算阻焊层重量（一般每平方米0.025kg，即0.0025g/cm²）
  const SOLDER_MASK_WEIGHT = 0.0025;
  const solderMaskWeight = area * SOLDER_MASK_WEIGHT * 2; // 双面
  
  // 5. 计算丝印重量（一般每平方米0.015kg，即0.0015g/cm²）
  const SILKSCREEN_WEIGHT = 0.0015;
  const silkscreenWeight = area * SILKSCREEN_WEIGHT * 2; // 双面
  
  // 总重量
  const totalWeight = baseWeight + outerCopperWeight + innerCopperWeight + platingWeight + solderMaskWeight + silkscreenWeight;
  
  return Math.round(totalWeight * 100) / 100; // 保留两位小数
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

// 判断是否为偏远地区
function isRemoteArea(countryCode: string, postalCode: string): boolean {
  // 这里可以添加具体的偏远地区邮编判断逻辑
  const remoteAreaPostalCodes: Record<string, string[]> = {
    'us': ['99', '969', '995', '996', '997', '998', '999'],
    'ca': ['X0', 'Y0', 'Y1'],
    // 其他国家的偏远地区邮编规则
  };

  if (!remoteAreaPostalCodes[countryCode]) return false;
  
  return remoteAreaPostalCodes[countryCode].some(prefix => 
    postalCode.toString().startsWith(prefix)
  );
}

// 计算实际运费
export function calculateShippingCost(
  specs: PCBSpecs,
  countryCode: string,
  courier: 'dhl' | 'fedex' | 'ups',
  service: keyof typeof serviceTypeMultipliers = 'standard',
  postalCode: string = '',
  orderDate: Date = new Date()
): {
  actualWeight: number;
  volumetricWeight: number;
  chargeableWeight: number;
  baseCost: number;
  fuelSurcharge: number;
  peakCharge: number;
  finalCost: number;
} {
  // 计算实际重量（千克）
  const singleWeight = calculateSinglePCBWeight(specs);
  const totalWeight = (singleWeight * specs.quantity * specs.panelCount) / 1000;

  const dimensions = {
    length: parseFloat(specs.singleLength),
    width: parseFloat(specs.singleWidth),
    height: parseFloat(specs.thickness),
    quantity: specs.quantity * specs.panelCount
  };

  const volumetricWeight = calculateVolumetricWeight(dimensions);
  const chargeableWeight = calculateChargeableWeight(dimensions, totalWeight);
  
  // 查找对应的运输区域
  const zone = shippingZones.find(zone => zone.countries.includes(countryCode));
  if (!zone) {
    throw new Error('Unsupported shipping destination');
  }

  // 只检查最小重量限制
  const MIN_WEIGHT = 0.1;
  if (chargeableWeight < MIN_WEIGHT) {
    throw new Error(`Minimum weight requirement is ${MIN_WEIGHT}kg`);
  }

  // 获取快递公司的费率
  const courierRates = zone[courier];
  
  // 基础运费计算
  const baseCost = courierRates.baseRate + (chargeableWeight * courierRates.pricePerKg);
  
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
    chargeableWeight: Math.round(chargeableWeight * 1000) / 1000,
    baseCost: Math.round(baseCost * 100) / 100,
    fuelSurcharge: Math.round(fuelSurcharge * 100) / 100,
    peakCharge: Math.round(peakCharge * 100) / 100,
    finalCost: Math.round(finalCost * 100) / 100
  };
} 