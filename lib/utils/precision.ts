/**
 * 精度处理工具函数
 * 提供比 Math.round(x * 10000) / 10000 更好的解决方案
 */

import { BorderType, BreakAwayRail } from '../../types/form';

/**
 * 方案1: 使用 Number.parseFloat + toFixed 组合
 * 优点：简洁、性能好、兼容性强
 */
export function roundToPrecision(num: number, precision: number = 4): number {
  return Number(parseFloat(num.toFixed(precision)));
}

/**
 * 方案2: 使用 Math.round 但避免大数乘除
 * 优点：避免了大数运算可能的精度问题
 */
export function roundToDecimalPlaces(num: number, places: number = 4): number {
  const factor = Math.pow(10, places);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

/**
 * 方案3: 使用 Number.EPSILON 处理边界情况
 * 优点：处理了浮点数边界情况
 */
export function preciseRound(num: number, precision: number = 4): number {
  const factor = Math.pow(10, precision);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

/**
 * PCB面积计算专用函数
 * 将 cm² 转换为 m²，保持4位小数精度
 */
export function calculatePcbArea(lengthCm: number, widthCm: number, count: number = 1): number {
  // cm² 转 m²：除以 10000
  const areaM2 = (lengthCm * widthCm * count) / 10000;
  return roundToDecimalPlaces(areaM2, 4);
}

/**
 * 单片PCB面积计算（cm² 转 m²）
 */
export function calculateSinglePcbArea(lengthCm: number, widthCm: number): number {
  // Ensure inputs are valid numbers
  if (typeof lengthCm !== 'number' || !Number.isFinite(lengthCm) || lengthCm <= 0) {
    console.warn(`Invalid lengthCm value: ${lengthCm}. Defaulting to 5.`);
    lengthCm = 5;
  }
  if (typeof widthCm !== 'number' || !Number.isFinite(widthCm) || widthCm <= 0) {
    console.warn(`Invalid widthCm value: ${widthCm}. Defaulting to 5.`);
    widthCm = 5;
  }

  // cm² 转 m²：除以 10000
  const areaM2 = (lengthCm * widthCm) / 10000;
  return roundToDecimalPlaces(areaM2, 4);
}

/**
 * 如果需要更高精度，可以使用 Decimal.js 的包装函数
 * 但保持对外接口为 number 类型
 */
export function calculatePcbAreaHighPrecision(lengthCm: number, widthCm: number, count: number = 1): number {
  // 可以在这里引入 Decimal.js 进行高精度计算
  // 但最终返回 number 类型，保持兼容性
  
  // 暂时使用改进的原生方法
  return calculatePcbArea(lengthCm, widthCm, count);
}

/**
 * 格式化显示用的面积值（保留合适的小数位数）
 */
export function formatArea(area: number): string {
  if (area >= 1) {
    return area.toFixed(2); // 大于1平米显示2位小数
  } else if (area >= 0.01) {
    return area.toFixed(3); // 0.01-1平米显示3位小数
  } else {
    return area.toFixed(4); // 小于0.01平米显示4位小数
  }
}

/**
 * 统一的PCB总面积计算函数
 * 支持single、panel_by_custom、panel_by_speedx三种出货方式
 * @param form 包含shipmentType、singleDimensions、singleCount、panelDimensions、panelSet、panelRow、panelColumn、border、breakAwayRail等字段
 * @returns { singleArea: number; totalArea: number } 单片面积和总面积（单位m²）
 */
export function calculateTotalPcbArea(form: {
  shipmentType: string;
  singleDimensions: { length: number; width: number };
  singleCount?: number;
  panelDimensions?: { length?: number; width?: number; row?: number; column?: number };
  panelSet?: number;
  panelRow?: number;
  panelColumn?: number;
  border?: string;
  breakAwayRail?: string;
}): { singleArea: number; totalArea: number } {
  const {
    shipmentType,
    singleDimensions,
    singleCount = 0,
    panelDimensions = {},
    panelSet = 0,
    panelRow = 1,
    panelColumn = 1,
    border = 'None',
    breakAwayRail = 'None',
  } = form;

  // 工艺边宽度辅助函数
  function getBorderWidth(border: string): number {
    if (border === '5') return 5;
    if (border === '10') return 10;
    return 0;
  }

  // 计算加工艺边后的大板尺寸
  function getPanelSizeWithBorder(panelDimensions: any, border: string, breakAwayRail: string) {
    let length = panelDimensions.length || 0; // 单位cm
    let width = panelDimensions.width || 0;   // 单位cm
    const borderWidth = getBorderWidth(border) / 10; // mm转cm
    if (breakAwayRail !== 'None') {
      if (breakAwayRail === 'TopBottom' || breakAwayRail === 'All') {
        length += 2 * borderWidth;
      }
      if (breakAwayRail === 'LeftRight' || breakAwayRail === 'All') {
        width += 2 * borderWidth;
      }
    }
    return { length, width };
  }

  // 计算单片面积
  let singleArea = 0;

  // 计算总面积
  let totalArea = 0;
  if (shipmentType === 'panel_by_speedx') {
    const { length, width } = getPanelSizeWithBorder(panelDimensions, border, breakAwayRail);
    singleArea = calculateSinglePcbArea(length, width);
    const totalCount = (panelDimensions.row || panelRow) * (panelDimensions.column || panelColumn) * (panelSet || 0);
    totalArea = singleArea * totalCount;
  } else if(shipmentType === 'single'){
    singleArea = calculateSinglePcbArea(singleDimensions.length, singleDimensions.width);
    totalArea = singleArea * singleCount;
  } else if(shipmentType === 'panel_by_custom'){
    const { length, width } = getPanelSizeWithBorder(panelDimensions, border, breakAwayRail);
    singleArea = calculateSinglePcbArea(length, width);
    totalArea = singleArea * panelSet;
  } else{
    throw new Error('Invalid shipment type');
  }

  return { singleArea, totalArea };
}

/**
 * 获取工艺边宽度（单位：cm）
 */
function getBorderWidth(border: BorderType | undefined): number {
  if (!border) return 0;
  return Number(border) / 10; // 将 mm 转换为 cm
}

/**
 * 计算带工艺边的拼板尺寸
 */
export function getPanelSizeWithBorder(
  dimensions: { length: number; width: number },
  panelDimensions: { row: number; column: number },
  border?: BorderType,
  breakAwayRail?: BreakAwayRail
): { length: number; width: number } {
  const borderWidth = breakAwayRail !== BreakAwayRail.None ? getBorderWidth(border) : 0;
  
  // 计算拼板尺寸
  const panelLength = dimensions.length * panelDimensions.row;
  const panelWidth = dimensions.width * panelDimensions.column;
  
  // 根据工艺边位置添加宽度
  if (breakAwayRail === BreakAwayRail.LeftRight) {
    return {
      length: panelLength,
      width: panelWidth + borderWidth * 2, // 左右各加一个工艺边
    };
  } else if (breakAwayRail === BreakAwayRail.TopBottom) {
    return {
      length: panelLength + borderWidth * 2, // 上下各加一个工艺边
      width: panelWidth,
    };
  } else if (breakAwayRail === BreakAwayRail.All) {
    return {
      length: panelLength + borderWidth * 2, // 上下各加一个工艺边
      width: panelWidth + borderWidth * 2, // 左右各加一个工艺边
    };
  }
  
  return { length: panelLength, width: panelWidth };
}

/**
 * 计算带工艺边的单个PCB面积（cm² 转 m²）
 * @param lengthCm PCB长度（cm）
 * @param widthCm PCB宽度（cm）
 * @param border 工艺边宽度（mm）
 * @param breakAwayRail 工艺边位置
 * @returns 面积（m²）
 */
export function calculateSinglePcbAreaWithBorder(
  lengthCm: number,
  widthCm: number,
  border: BorderType = BorderType.Five,
  breakAwayRail: BreakAwayRail = BreakAwayRail.None
): number {
  // 确保输入有效
  if (typeof lengthCm !== 'number' || !Number.isFinite(lengthCm) || lengthCm <= 0) {
    console.warn(`Invalid lengthCm value: ${lengthCm}. Defaulting to 5.`);
    lengthCm = 5;
  }
  if (typeof widthCm !== 'number' || !Number.isFinite(widthCm) || widthCm <= 0) {
    console.warn(`Invalid widthCm value: ${widthCm}. Defaulting to 5.`);
    widthCm = 5;
  }

  // 获取工艺边宽度（mm转cm）
  const borderWidth = getBorderWidth(border);

  // 根据工艺边位置计算实际尺寸
  let finalLength = lengthCm;
  let finalWidth = widthCm;

  if (breakAwayRail !== BreakAwayRail.None) {
    if (breakAwayRail === BreakAwayRail.TopBottom || breakAwayRail === BreakAwayRail.All) {
      finalLength += 2 * borderWidth;
    }
    if (breakAwayRail === BreakAwayRail.LeftRight || breakAwayRail === BreakAwayRail.All) {
      finalWidth += 2 * borderWidth;
    }
  }

  // 计算面积（cm² 转 m²）
  const areaM2 = (finalLength * finalWidth) / 10000;
  return roundToDecimalPlaces(areaM2, 4);
} 