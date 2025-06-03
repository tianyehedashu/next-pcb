/**
 * 材料类型专用表单配置管理
 * 
 * 设计理念：
 * 1. 基础字段：所有材料类型都有的通用字段
 * 2. 材料专用字段：特定材料类型才有的字段
 * 3. 条件字段：根据材料类型动态显示/隐藏的字段
 * 4. 工艺约束：不同材料类型对工艺参数的限制
 */

import { ISchema } from "@formily/react";
import { PcbType } from "./shared-types";

// 基础字段定义（所有材料类型都有）
export const baseFields = [
  "layers", "thickness", "differentDesignsCount", "border", 
  "singleDimensions", "shipmentType", "singleCount", 
  "panelDimensions", "panelSet", "pcbNote"
] as const;

// 工艺字段定义（大部分材料类型都有，但可能有限制）
export const processFields = [
  "outerCopperWeight", "innerCopperWeight", "minTrace", "minHole", 
  "holeCount", "solderMask", "silkscreen", "surfaceFinish", 
  "surfaceFinishEnigType", "impedance", "castellated", "halfHole", 
  "goldFingers", "goldFingersBevel", "edgePlating", "edgeCover", 
  "maskCover", "bga", "holeCu25um", "blueMask"
] as const;

// 服务字段定义（通用）
export const serviceFields = [
  "testMethod", "productReport", "yyPin",
  "customerCode", "payMethod", "qualityAttach", "smt", 
  "prodCap", "workingGerber", "ulMark", "crossOuts", 
  "ipcClass", "ifDataConflicts", "specialRequests"
] as const;

// 材料约束类型定义
export interface MaterialConstraints {
  maxLayers?: number;
  minThickness?: number;
  maxThickness?: number;
  supportedSurfaceFinish?: string[];
  thermalConductivity?: number;
  aluminumThickness?: number;
  [key: string]: string | number | string[] | number[] | boolean | undefined;
}

// 材料类型配置接口
export interface MaterialConfig {
  name: string;
  description: string;
  supportedFields: {
    base: readonly string[];
    process: readonly string[];
    service: readonly string[];
    material: readonly string[]; // 材料专用字段
  };
  fieldOverrides: Record<string, Partial<ISchema>>; // 字段覆盖配置
  constraints: MaterialConstraints; // 工艺约束
}

// FR-4 材料配置
export const fr4Config: MaterialConfig = {
  name: "FR-4",
  description: "标准阻燃玻璃纤维复合材料，适合大多数电子产品",
  supportedFields: {
    base: baseFields,
    process: processFields,
    service: serviceFields,
    material: ["useShengyiMaterial", "tg", "hdi"] // FR-4 专用字段
  },
  fieldOverrides: {
    // FR-4 特定的字段配置覆盖
    useShengyiMaterial: {
      "x-reactions": {
        dependencies: ["pcbType"],
        fulfill: {
          state: {
            visible: "{{$deps[0] === 'FR-4'}}"
          }
        }
      }
    },
    hdi: {
      "x-reactions": {
        dependencies: ["layers"],
        fulfill: {
          state: {
            visible: "{{$deps[0] >= 4}}"
          }
        }
      }
    }
  },
  constraints: {
    maxLayers: 20,
    minThickness: 0.2,
    maxThickness: 3.2,
    supportedSurfaceFinish: ['HASL', 'Leadfree HASL', 'ENIG', 'OSP', 'Immersion Silver', 'Immersion Tin']
  }
};

// 未来扩展：铝基板配置示例
export const aluminumConfigExample: MaterialConfig = {
  name: "Aluminum",
  description: "铝基板，具有优异的散热性能",
  supportedFields: {
    base: baseFields.filter(f => f !== 'layers'), // 铝基板通常是单层
    process: processFields.filter(f => !['innerCopperWeight', 'hdi'].includes(f)),
    service: serviceFields,
    material: ["thermalConductivity", "aluminumThickness"] // 铝基板专用字段
  },
  fieldOverrides: {
    layers: {
      "x-component-props": {
        options: [{ label: "1", value: 1 }] // 只支持单层
      }
    },
    surfaceFinish: {
      "x-component-props": {
        options: [
          { label: "HASL", value: "HASL" },
          { label: "OSP", value: "OSP" }
        ] // 铝基板支持的表面处理更少
      }
    }
  },
  constraints: {
    maxLayers: 1,
    minThickness: 0.8,
    maxThickness: 3.0,
    supportedSurfaceFinish: ['HASL', 'OSP']
  }
};

// 材料配置注册表
export const materialConfigs: Record<PcbType, MaterialConfig> = {
  [PcbType.FR4]: fr4Config,
  // 未来添加：
  // [PcbType.Aluminum]: aluminumConfig,
  // [PcbType.Rogers]: rogersConfig,
  // [PcbType.Flex]: flexConfig,
  // [PcbType.RigidFlex]: rigidFlexConfig,
};

// 获取材料配置的工具函数
export function getMaterialConfig(pcbType: PcbType): MaterialConfig {
  return materialConfigs[pcbType] || fr4Config;
}

// 获取材料支持的字段列表
export function getSupportedFields(pcbType: PcbType): string[] {
  const config = getMaterialConfig(pcbType);
  return [
    ...config.supportedFields.base,
    ...config.supportedFields.process,
    ...config.supportedFields.service,
    ...config.supportedFields.material
  ];
}

// 检查字段是否被材料类型支持
export function isFieldSupported(pcbType: PcbType, fieldName: string): boolean {
  return getSupportedFields(pcbType).includes(fieldName);
}

// 获取材料特定的字段配置
export function getMaterialFieldConfig(pcbType: PcbType, fieldName: string): Partial<ISchema> | null {
  const config = getMaterialConfig(pcbType);
  return config.fieldOverrides[fieldName] || null;
} 