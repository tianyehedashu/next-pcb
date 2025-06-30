// 钢网相关类型定义

// 产品类型枚举
export enum ProductType {
  PCB = 'pcb',
  STENCIL = 'stencil'
}

// 钢网材质
export enum StencilMaterial {
  STAINLESS_STEEL_304 = 'ss304',
  STAINLESS_STEEL_316L = 'ss316l',
  NICKEL = 'nickel'
}

// 钢网厚度 (mm)
export enum StencilThickness {
  T0_08 = 0.08,
  T0_10 = 0.10,
  T0_12 = 0.12,
  T0_15 = 0.15,
  T0_20 = 0.20
}

// 制造工艺
export enum StencilProcess {
  LASER_CUT = 'laser_cut',
  ELECTROFORM = 'electroform',
  CHEMICAL_ETCH = 'chemical_etch'
}

// 框架类型
export enum FrameType {
  NO_FRAME = 'no_frame',
  SMT_FRAME = 'smt_frame',
  CUSTOM_FRAME = 'custom_frame'
}

// 表面处理
export enum SurfaceTreatment {
  NONE = 'none',
  ELECTROPOLISH = 'electropolish',
  PASSIVATION = 'passivation'
}

// 钢网规格接口
export interface StencilSpec {
  productType: ProductType.STENCIL;
  stencilMaterial: StencilMaterial;
  stencilThickness: StencilThickness;
  stencilProcess: StencilProcess;
  frameType: FrameType;
  frameSize?: {
    length: number;
    width: number;
  };
  surfaceTreatment: SurfaceTreatment;
  tensionMesh: boolean;
  fiducialMarks: boolean;
  specialRequests?: string;
  
  // 公共字段
  singleDimensions: {
    length: number;
    width: number;
  };
  singleCount: number;
}

// 扩展现有的共享类型
export type ProductSpec = StencilSpec | any; // 这里的any代表现有的PCB规格类型

// 钢网材质显示名称映射
export const StencilMaterialLabels: Record<StencilMaterial, string> = {
  [StencilMaterial.STAINLESS_STEEL_304]: 'Stainless Steel 304',
  [StencilMaterial.STAINLESS_STEEL_316L]: 'Stainless Steel 316L',
  [StencilMaterial.NICKEL]: 'Nickel'
};

// 钢网厚度显示名称映射
export const StencilThicknessLabels: Record<StencilThickness, string> = {
  [StencilThickness.T0_08]: '0.08mm',
  [StencilThickness.T0_10]: '0.10mm',
  [StencilThickness.T0_12]: '0.12mm',
  [StencilThickness.T0_15]: '0.15mm',
  [StencilThickness.T0_20]: '0.20mm'
};

// 制造工艺显示名称映射
export const StencilProcessLabels: Record<StencilProcess, string> = {
  [StencilProcess.LASER_CUT]: 'Laser Cutting (Most Common)',
  [StencilProcess.ELECTROFORM]: 'Electroforming (High Precision)',
  [StencilProcess.CHEMICAL_ETCH]: 'Chemical Etching (Fine Pitch)'
};

// 框架类型显示名称映射
export const FrameTypeLabels: Record<FrameType, string> = {
  [FrameType.NO_FRAME]: 'No Frame (Flexible)',
  [FrameType.SMT_FRAME]: 'SMT Frame (Standard)',
  [FrameType.CUSTOM_FRAME]: 'Custom Frame'
};

// 表面处理显示名称映射
export const SurfaceTreatmentLabels: Record<SurfaceTreatment, string> = {
  [SurfaceTreatment.NONE]: 'None',
  [SurfaceTreatment.ELECTROPOLISH]: 'Electropolishing',
  [SurfaceTreatment.PASSIVATION]: 'Passivation'
}; 