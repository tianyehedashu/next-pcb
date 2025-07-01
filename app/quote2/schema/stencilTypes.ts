// 钢网相关类型定义 - 严格按照图片字段设计

// 产品类型枚举
export enum ProductType {
  PCB = 'pcb',
  STENCIL = 'stencil'
}

// === 新钢网字段枚举定义 ===

// 边框类型
export enum BorderType {
  FRAMEWORK = 'framework',
  NON_FRAMEWORK = 'non_framework'
}

// 钢网类型
export enum StencilType {
  SOLDER_PASTE = 'solder_paste',
  ADHESIVES = 'adhesives',
  STEP_DOWN = 'step_down'
}

// 印刷方式
export enum PrintingMethod {
  SEMI_AUTOMATIC = 'semi_automatic',
  FULLY_AUTOMATIC = 'fully_automatic',
  MANUAL = 'manual'
}

// 钢网尺寸
export enum StencilSize {
  SIZE_420X520 = '420x520'
}

// 钢网面
export enum StencilSide {
  TOP = 'top',
  BOTTOM = 'bottom',
  TOP_BOTTOM = 'top_bottom',
  TOP_BOTTOM_DIFFERENT = 'top_bottom_different'
}

// 钢网厚度 - 按图片去掉0.20mm
export enum StencilThickness {
  T0_10 = 0.10,
  T0_12 = 0.12,
  T0_15 = 0.15
}

// 现有基准点
export enum ExistingFiducials {
  NONE = 'none',
  HALF_LASERED = 'half_lasered',
  LASERED_THROUGH = 'lasered_through'
}

// 电抛光
export enum Electropolishing {
  GRINDING_POLISHING = 'grinding_polishing',
  ELECTROPOLISHING = 'electropolishing'
}

// 工程要求
export enum EngineeringRequirements {
  SPEEDX_SPEC = 'speedx_spec',
  CUSTOMER_CONFIRM = 'customer_confirm'
}

// === 显示标签映射 ===

export const BorderTypeLabels: Record<BorderType, string> = {
  [BorderType.FRAMEWORK]: 'Framework',
  [BorderType.NON_FRAMEWORK]: 'Non-framework'
};

export const StencilTypeLabels: Record<StencilType, string> = {
  [StencilType.SOLDER_PASTE]: 'Stencil for Solder Paste',
  [StencilType.ADHESIVES]: 'Stencil for Adhesives',
  [StencilType.STEP_DOWN]: 'Step Down Stencil'
};

export const PrintingMethodLabels: Record<PrintingMethod, string> = {
  [PrintingMethod.SEMI_AUTOMATIC]: 'Semi-automatic Printing',
  [PrintingMethod.FULLY_AUTOMATIC]: 'Fully Automatic Printing',
  [PrintingMethod.MANUAL]: 'Manual Printing'
};

export const StencilSizeLabels: Record<StencilSize, string> = {
  [StencilSize.SIZE_420X520]: '420×520mm(Valid area 240×340mm)'
};

export const StencilSideLabels: Record<StencilSide, string> = {
  [StencilSide.TOP]: 'Top',
  [StencilSide.BOTTOM]: 'Bottom',
  [StencilSide.TOP_BOTTOM]: 'Top & Bottom',
  [StencilSide.TOP_BOTTOM_DIFFERENT]: 'Top & Bottom (Different Solder Paste)'
};

export const StencilThicknessLabels: Record<StencilThickness, string> = {
  [StencilThickness.T0_10]: '0.10mm',
  [StencilThickness.T0_12]: '0.12mm',
  [StencilThickness.T0_15]: '0.15mm'
};

export const ExistingFiducialsLabels: Record<ExistingFiducials, string> = {
  [ExistingFiducials.NONE]: 'None',
  [ExistingFiducials.HALF_LASERED]: 'Half lasered',
  [ExistingFiducials.LASERED_THROUGH]: 'Lasered through'
};

export const ElectropolishingLabels: Record<Electropolishing, string> = {
  [Electropolishing.GRINDING_POLISHING]: 'Grinding and Polishing',
  [Electropolishing.ELECTROPOLISHING]: 'Electropolishing'
};

export const EngineeringRequirementsLabels: Record<EngineeringRequirements, string> = {
  [EngineeringRequirements.SPEEDX_SPEC]: 'SpeedX specification',
  [EngineeringRequirements.CUSTOMER_CONFIRM]: 'Confirm by customer'
};

// === 统一选项定义 ===

// 边框类型选项
export const borderTypeOptions = [
  { label: BorderTypeLabels[BorderType.FRAMEWORK], value: BorderType.FRAMEWORK },
  { label: BorderTypeLabels[BorderType.NON_FRAMEWORK], value: BorderType.NON_FRAMEWORK }
];

// 钢网类型选项
export const stencilTypeOptions = [
  { label: StencilTypeLabels[StencilType.SOLDER_PASTE], value: StencilType.SOLDER_PASTE },
  { label: StencilTypeLabels[StencilType.ADHESIVES], value: StencilType.ADHESIVES },
  { label: StencilTypeLabels[StencilType.STEP_DOWN], value: StencilType.STEP_DOWN }
];

// 钢网面选项
export const stencilSideOptions = [
  { label: StencilSideLabels[StencilSide.TOP], value: StencilSide.TOP },
  { label: StencilSideLabels[StencilSide.BOTTOM], value: StencilSide.BOTTOM },
  { label: StencilSideLabels[StencilSide.TOP_BOTTOM], value: StencilSide.TOP_BOTTOM },
  { label: StencilSideLabels[StencilSide.TOP_BOTTOM_DIFFERENT], value: StencilSide.TOP_BOTTOM_DIFFERENT }
];

// 钢网厚度选项
export const stencilThicknessOptions = [
  { label: StencilThicknessLabels[StencilThickness.T0_10], value: StencilThickness.T0_10 },
  { label: StencilThicknessLabels[StencilThickness.T0_12], value: StencilThickness.T0_12 },
  { label: StencilThicknessLabels[StencilThickness.T0_15], value: StencilThickness.T0_15 }
];

// 现有基准点选项
export const existingFiducialsOptions = [
  { label: ExistingFiducialsLabels[ExistingFiducials.NONE], value: ExistingFiducials.NONE },
  { label: ExistingFiducialsLabels[ExistingFiducials.HALF_LASERED], value: ExistingFiducials.HALF_LASERED },
  { label: ExistingFiducialsLabels[ExistingFiducials.LASERED_THROUGH], value: ExistingFiducials.LASERED_THROUGH }
];

// 电抛光选项
export const electropolishingOptions = [
  { label: ElectropolishingLabels[Electropolishing.GRINDING_POLISHING], value: Electropolishing.GRINDING_POLISHING },
  { label: ElectropolishingLabels[Electropolishing.ELECTROPOLISHING], value: Electropolishing.ELECTROPOLISHING }
];

// 工程要求选项
export const engineeringRequirementsOptions = [
  { label: EngineeringRequirementsLabels[EngineeringRequirements.SPEEDX_SPEC], value: EngineeringRequirements.SPEEDX_SPEC },
  { label: EngineeringRequirementsLabels[EngineeringRequirements.CUSTOMER_CONFIRM], value: EngineeringRequirements.CUSTOMER_CONFIRM }
];

// === 钢网规格数据 ===

// 钢网规格详情接口
export interface StencilSizeSpec {
  size: string;
  maxEffectiveArea: string;
  pricePerPcs: number;
  weightKgPerPcs: number;
  shippingExtraPerPcs: number;
}

// 钢网规格数据表
export const stencilSizeSpecs: Record<BorderType, StencilSizeSpec[]> = {
  // 无框钢网规格
  [BorderType.NON_FRAMEWORK]: [
    {
      size: '280x380',
      maxEffectiveArea: '200×360/260×300',
      pricePerPcs: 130.00,
      weightKgPerPcs: 1,
      shippingExtraPerPcs: 0
    },
    {
      size: '320x420',
      maxEffectiveArea: '240×400/300×340',
      pricePerPcs: 234.30,
      weightKgPerPcs: 1,
      shippingExtraPerPcs: 0
    },
    {
      size: '420x520',
      maxEffectiveArea: '320×500',
      pricePerPcs: 121.71,
      weightKgPerPcs: 1.5,
      shippingExtraPerPcs: 0
    },
    {
      size: '460x460',
      maxEffectiveArea: '380×430',
      pricePerPcs: 241.40,
      weightKgPerPcs: 1.5,
      shippingExtraPerPcs: 0
    },
    {
      size: '600x600',
      maxEffectiveArea: '520×560',
      pricePerPcs: 294.14,
      weightKgPerPcs: 1.5,
      shippingExtraPerPcs: 0
    }
  ],
  // 含框钢网规格
  [BorderType.FRAMEWORK]: [
    {
      size: '300x400',
      maxEffectiveArea: '140×240',
      pricePerPcs: 156.40,
      weightKgPerPcs: 1.5,
      shippingExtraPerPcs: 0
    },
    {
      size: '370x470',
      maxEffectiveArea: '190×290',
      pricePerPcs: 163.30,
      weightKgPerPcs: 2.0,
      shippingExtraPerPcs: 0
    },
    {
      size: '420x520',
      maxEffectiveArea: '240×340',
      pricePerPcs: 204.70,
      weightKgPerPcs: 2.5,
      shippingExtraPerPcs: 0
    },
    {
      size: '450x550',
      maxEffectiveArea: '270×370',
      pricePerPcs: 259.90,
      weightKgPerPcs: 2.5,
      shippingExtraPerPcs: 0
    },
    {
      size: '584x584',
      maxEffectiveArea: '380×380',
      pricePerPcs: 315.10,
      weightKgPerPcs: 4.0,
      shippingExtraPerPcs: 10
    },
    {
      size: '550x650',
      maxEffectiveArea: '350×450',
      pricePerPcs: 338.10,
      weightKgPerPcs: 4.5,
      shippingExtraPerPcs: 10
    },
    {
      size: '736x736',
      maxEffectiveArea: '500×500',
      pricePerPcs: 430.10,
      weightKgPerPcs: 6.0,
      shippingExtraPerPcs: 10
    },
    {
      size: '400x600',
      maxEffectiveArea: '220×400',
      pricePerPcs: 253.00,
      weightKgPerPcs: 3.5,
      shippingExtraPerPcs: 10
    },
    {
      size: '400x800',
      maxEffectiveArea: '220×600',
      pricePerPcs: 287.50,
      weightKgPerPcs: 4.5,
      shippingExtraPerPcs: 10
    },
    {
      size: '500x700',
      maxEffectiveArea: '320×500',
      pricePerPcs: 314.94,
      weightKgPerPcs: 5.5,
      shippingExtraPerPcs: 10
    },
    {
      size: '500x800',
      maxEffectiveArea: '320×600',
      pricePerPcs: 340.60,
      weightKgPerPcs: 5.5,
      shippingExtraPerPcs: 10
    }
  ]
};

// 动态尺寸选项 - 基于规格数据生成
export const sizeOptions = {
  // 无框钢网选项
  [BorderType.NON_FRAMEWORK]: stencilSizeSpecs[BorderType.NON_FRAMEWORK].map(spec => ({
    label: `${spec.size.replace('x', '×')}mm (Valid area ${spec.maxEffectiveArea}mm)`,
    value: spec.size
  })),
  // 含框钢网选项
  [BorderType.FRAMEWORK]: stencilSizeSpecs[BorderType.FRAMEWORK].map(spec => ({
    label: `${spec.size.replace('x', '×')}mm (Valid area ${spec.maxEffectiveArea}mm)`,
    value: spec.size
  }))
};

// 根据尺寸获取规格信息的辅助函数
export function getStencilSpec(borderType: BorderType, size: string): StencilSizeSpec | undefined {
  return stencilSizeSpecs[borderType].find(spec => spec.size === size);
}

// === 钢网规格接口 ===
export interface StencilSpec {
  productType: ProductType.STENCIL;
  borderType: BorderType;
  stencilType: StencilType;
  printingMethod: PrintingMethod;
  size: StencilSize;
  stencilSide: StencilSide;
  quantity: number;
  thickness: StencilThickness;
  existingFiducials: ExistingFiducials;
  electropolishing: Electropolishing;
  engineeringRequirements: EngineeringRequirements;
  addPoNo?: string;
  specialRequests?: string;
}

// 扩展现有的共享类型
export type ProductSpec = StencilSpec; 