// 统一的产品Schema管理
import { ISchema } from "@formily/react";
import { ProductType } from "./stencilTypes";
import { pcbFormilySchema, fieldGroups as pcbFieldGroups } from "./pcbFormilySchema";
import { stencilFormilySchema, stencilFieldGroups, stencilDefaultFormData } from "./stencilFormilySchema";
import { DEFAULT_FORM_DATA } from "@/lib/stores/quote-store";

// 字段分组接口
export interface FieldGroup {
  title: string;
  fields: string[];
}

// 根据产品类型获取对应的Schema
export function getSchemaByProductType(productType: ProductType): ISchema {
  switch (productType) {
    case ProductType.STENCIL:
      return stencilFormilySchema;
    case ProductType.PCB:
    default:
      return pcbFormilySchema;
  }
}

// 根据产品类型获取字段分组
export function getFieldGroups(productType: ProductType): FieldGroup[] {
  switch (productType) {
    case ProductType.STENCIL:
      return stencilFieldGroups;
    case ProductType.PCB:
    default:
      return pcbFieldGroups;
  }
}

// 根据产品类型获取默认表单数据
export function getDefaultFormData(productType: ProductType): any {
  switch (productType) {
    case ProductType.STENCIL:
      return {
        ...stencilDefaultFormData,
        productType: ProductType.STENCIL
      };
    case ProductType.PCB:
    default:
      return {
        ...DEFAULT_FORM_DATA,
        productType: ProductType.PCB
      };
  }
}

// 验证字段是否属于当前产品类型
export function isValidFieldForProductType(fieldName: string, productType: ProductType): boolean {
  const fieldGroups = getFieldGroups(productType);
  const allFields = fieldGroups.flatMap(group => group.fields);
  return allFields.includes(fieldName);
}

// 过滤表单数据，只保留当前产品类型相关的字段
export function filterFormDataByProductType(formData: any, productType: ProductType): any {
  const fieldGroups = getFieldGroups(productType);
  const validFields = fieldGroups.flatMap(group => group.fields);
  
  // 添加通用字段
  const commonFields = [
    'productType',
    'singleDimensions', 
    'singleCount',
    'size',
    'quantity',
    'deliveryOptions',
    'gerberUrl',
    'shippingCostEstimation',
    'shippingAddress',
    'specialRequests',
    'userNote'
  ];
  
  const allValidFields = [...validFields, ...commonFields];
  
  const filteredData: any = {};
  
  for (const field of allValidFields) {
    if (formData.hasOwnProperty(field)) {
      filteredData[field] = formData[field];
    }
  }
  
  return filteredData;
}

// 获取产品类型的显示信息
export function getProductTypeInfo(productType: ProductType) {
  const productInfo = {
    [ProductType.PCB]: {
      icon: "🔧",
      title: "PCB Manufacturing",
      description: "Professional circuit board fabrication",
      color: "blue"
    },
    [ProductType.STENCIL]: {
      icon: "📐", 
      title: "Stencil Manufacturing",
      description: "High-precision solder paste stencils",
      color: "green"
    }
  };
  
  return productInfo[productType] || productInfo[ProductType.PCB];
}

// 检查产品类型切换时需要重置的字段
export function getFieldsToResetOnProductTypeChange(
  fromProductType: ProductType, 
  toProductType: ProductType
): string[] {
  if (fromProductType === toProductType) {
    return [];
  }

  // PCB -> 钢网时需要重置的字段
  if (fromProductType === ProductType.PCB && toProductType === ProductType.STENCIL) {
    return [
      'pcbType', 'layers', 'thickness', 'hdi', 'tg', 'shipmentType',
      'panelDimensions', 'panelSet', 'differentDesignsCount', 'border',
      'borderCutType', 'breakAwayRail', 'useShengyiMaterial', 'pcbNote',
      'outerCopperWeight', 'innerCopperWeight', 'minTrace', 'minHole',
      'solderMask', 'silkscreen', 'surfaceFinish', 'surfaceFinishEnigType',
      'impedance', 'goldFingers', 'goldFingersBevel', 'edgePlating',
      'halfHole', 'edgeCover', 'maskCover', 'bga', 'holeCu25um',
      'blueMask', 'holeCount', 'testMethod', 'productReport',
      'workingGerber', 'ulMark', 'crossOuts', 'ipcClass', 'ifDataConflicts'
    ];
  }

  // 钢网 -> PCB时需要重置的字段  
  if (fromProductType === ProductType.STENCIL && toProductType === ProductType.PCB) {
    return [
      'borderType', 'stencilType', 'printingMethod', 'size', 'stencilSide',
      'quantity', 'thickness', 'existingFiducials', 'electropolishing',
      'engineeringRequirements', 'addPoNo'
    ];
  }

  return [];
}

// 产品类型切换助手
export class ProductTypeManager {
  static switchProductType(
    currentFormData: any,
    fromProductType: ProductType,
    toProductType: ProductType
  ): any {
    if (fromProductType === toProductType) {
      return currentFormData;
    }

    // 获取新产品类型的默认数据
    const newDefaultData = getDefaultFormData(toProductType);
    
    // 保留通用字段的值
    const commonFieldsToKeep = [
      'singleDimensions',
      'singleCount',
      'size',
      'quantity',
      'deliveryOptions',
      'gerberUrl',
      'shippingCostEstimation',
      'shippingAddress',
      'specialRequests',
      'userNote'
    ];

    const newFormData = { ...newDefaultData };
    
    // 保留通用字段的现有值
    for (const field of commonFieldsToKeep) {
      if (currentFormData[field] !== undefined) {
        newFormData[field] = currentFormData[field];
      }
    }

    return newFormData;
  }

  static getProductTypeFromFormData(formData: any): ProductType {
    return formData?.productType || ProductType.PCB;
  }

  static validateProductTypeData(formData: any, productType: ProductType): boolean {
    const requiredFields = this.getRequiredFieldsByProductType(productType);
    
    for (const field of requiredFields) {
      if (!formData[field] || (Array.isArray(formData[field]) && formData[field].length === 0)) {
        return false;
      }
    }
    
    return true;
  }

  private static getRequiredFieldsByProductType(productType: ProductType): string[] {
    const commonRequired = ['singleDimensions', 'singleCount'];
    
    if (productType === ProductType.STENCIL) {
      return [
        ...commonRequired,
        'stencilMaterial',
        'stencilThickness', 
        'stencilProcess',
        'frameType'
      ];
    } else {
      return [
        ...commonRequired,
        'pcbType',
        'layers',
        'thickness',
        'outerCopperWeight',
        'minTrace',
        'minHole',
        'solderMask',
        'silkscreen',
        'surfaceFinish'
      ];
    }
  }
}

export default {
  getSchemaByProductType,
  getFieldGroups,
  getDefaultFormData,
  isValidFieldForProductType,
  filterFormDataByProductType,
  getProductTypeInfo,
  getFieldsToResetOnProductTypeChange,
  ProductTypeManager
}; 