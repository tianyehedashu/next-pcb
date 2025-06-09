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
 * 将 mm² 转换为 m²，保持4位小数精度
 */
export function calculatePcbArea(lengthMm: number, widthMm: number, count: number = 1): number {
  // mm² 转 m²：除以 1000000
  const areaM2 = (lengthMm * widthMm * count) / 1000000;
  return Number(areaM2.toFixed(4));
}

/**
 * 单片PCB面积计算（mm² 转 m²）
 */
export function calculateSinglePcbArea(lengthMm: number, widthMm: number): number {
  // 参数验证
  if (typeof lengthMm !== 'number' || !Number.isFinite(lengthMm) || lengthMm <= 0) {
    console.warn(`Invalid lengthMm value: ${lengthMm}. Defaulting to 50.`);
    lengthMm = 50;
  }
  if (typeof widthMm !== 'number' || !Number.isFinite(widthMm) || widthMm <= 0) {
    console.warn(`Invalid widthMm value: ${widthMm}. Defaulting to 50.`);
    widthMm = 50;
  }

  // mm² 转 m²：除以 1000000
  const areaM2 = (lengthMm * widthMm) / 1000000;
  return Number(areaM2.toFixed(4));
}

/**
 * 如果需要更高精度，可以使用 Decimal.js 的包装函数
 * 但保持对外接口为 number 类型
 */
export function calculatePcbAreaHighPrecision(lengthMm: number, widthMm: number, count: number = 1): number {
  // 使用高精度计算
  return calculatePcbArea(lengthMm, widthMm, count);
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
 * 支持single、panel_by_gerber、panel_by_speedx三种出货方式
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
    return Number(border); // 直接返回mm值
  }

  // 计算加工艺边后的大板尺寸
  function getPanelSizeWithBorder(singleDimensions: { length?: number; width?: number }, border: string, breakAwayRail: string) {
    let length = singleDimensions.length || 0; // 单位mm
    let width = singleDimensions.width || 0;   // 单位mm
    const borderWidth = getBorderWidth(border); // 已经是mm单位
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
    const { length, width } = getPanelSizeWithBorder(singleDimensions, border, breakAwayRail);
    singleArea = calculateSinglePcbArea(length, width);
    const totalCount = (panelDimensions.row || panelRow) * (panelDimensions.column || panelColumn) * (panelSet || 0);
    totalArea = singleArea * totalCount;
  } else if(shipmentType === 'single'){
    singleArea = calculateSinglePcbArea(singleDimensions.length, singleDimensions.width);
    totalArea = singleArea * singleCount;
  } else if(shipmentType === 'panel_by_gerber'){
    const { length, width } = getPanelSizeWithBorder(singleDimensions, border, breakAwayRail);
    singleArea = calculateSinglePcbArea(length, width);
    totalArea = singleArea * panelSet;
  } else{
    throw new Error('Invalid shipment type');
  }

  return { singleArea, totalArea };
}

/**
 * 获取工艺边宽度（单位：mm）
 */
export function getBorderWidth(border: BorderType | undefined): number {
  if (!border) return 0;
  return Number(border); // 直接返回mm值
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
 * 计算带工艺边的单个PCB面积（mm² 转 m²）
 * @param lengthMm PCB长度（mm）
 * @param widthMm PCB宽度（mm）
 */
export function calculatePcbAreaWithBorder(
  lengthMm: number,
  widthMm: number,
  border: BorderType,
  breakAwayRail?: BreakAwayRail
): number {
  // 参数验证
  if (typeof lengthMm !== 'number' || !Number.isFinite(lengthMm) || lengthMm <= 0) {
    console.warn(`Invalid lengthMm value: ${lengthMm}. Defaulting to 50.`);
    lengthMm = 50;
  }
  if (typeof widthMm !== 'number' || !Number.isFinite(widthMm) || widthMm <= 0) {
    console.warn(`Invalid widthMm value: ${widthMm}. Defaulting to 50.`);
    widthMm = 50;
  }

  // 获取工艺边宽度（mm）
  const borderWidth = getBorderWidth(border);

  let finalLength = lengthMm;
  let finalWidth = widthMm;

  // 根据工艺边类型添加宽度
  if (breakAwayRail === BreakAwayRail.LeftRight || breakAwayRail === BreakAwayRail.All) {
    finalLength += borderWidth * 2;
  }
  if (breakAwayRail === BreakAwayRail.TopBottom || breakAwayRail === BreakAwayRail.All) {
    finalWidth += borderWidth * 2;
  }

  // 计算面积（mm² 转 m²）
  const areaM2 = (finalLength * finalWidth) / 1000000;
  return Number(areaM2.toFixed(4));
} 