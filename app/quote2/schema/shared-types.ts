// Quote2 模块共享类型定义
// 为 pcbFormilySchema 和 quoteSchema 提供统一的类型基础

export { 
  PcbType, CopperWeight, InnerCopperWeight, HdiType, TgType, 
  ShipmentType, BorderType, BorderCutType, PcbColor, SolderMask, Silkscreen,
  SurfaceFinish, SurfaceFinishEnigType, MaskCover, TestMethod,
  ProductReport, PayMethod, QualityAttach, ProdCap,
  WorkingGerber, CrossOuts, IPCClass, IfDataConflicts,
  EdgeCover, MinTrace, MinHole,
  BreakAwayRail
} from "../../../types/form";

// 字段名称类型
export type FieldName = 'thickness' | 'minTrace' | 'minHole' | 'silkscreen' | 'surfaceFinish' | 'maskCover' | 'edgeCover' | 'testMethod' | 'qualityAttach';

// 如果需要，这里还可以定义 quote2 模块特有的类型
export type ComponentType = 'Select' | 'Input' | 'Checkbox' | 'NumberInput' | 'DimensionsInput' | 'PanelDimensionsInput' | 'TextArea' | 'Radio' | 'FileUpload' | 'AddressInput' | 'CustomsInput' | 'MultiSelect';

// 组件映射配置
export const componentMap: Record<ComponentType, string> = {
  Input: "Input",
  Select: "Select", 
  Checkbox: "Checkbox",
  TextArea: "TextArea",
  NumberInput: "NumberInput",
  DimensionsInput: "DimensionsInput",
  PanelDimensionsInput: "PanelDimensionsInput",
  Radio: "Radio",
  FileUpload: "FileUpload",
  AddressInput: "AddressInput",
  CustomsInput: "CustomsInput",
  MultiSelect: "MultiSelect",
};

export enum DeliveryType {
  Standard = "standard",
  Urgent = "urgent"
}

// 加急选项类型
export interface UrgentDeliveryInfo {
  reduceDays: number;           // 减少的天数
  fee: number;                  // 加急费用
  feeType: 'fixed' | 'per_sqm'; // 费用类型
  description: string;          // 费用描述
} 