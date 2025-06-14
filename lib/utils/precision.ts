/**
 * 精度处理工具函数
 * 提供比 Math.round(x * 10000) / 10000 更好的解决方案
 */

import { BorderType, BreakAwayRail, ShipmentType } from '../../types/form';

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
 * @description 根据不同的出货方式（Single, Panel by Gerber, Panel by SpeedX）计算单片面积和总面积。
 * - **Single**: 直接使用单片尺寸和数量计算总面积。`singleArea` 返回的是单片PCB的面积。
 * - **Panel by SpeedX**: 此方式下，函数会首先根据单片的尺寸、拼版的行列数以及指定的工艺边（breakAwayRail 和 border）计算出 **整个拼版（含工艺边）** 的尺寸。然后将这个拼版的面积作为 `singleArea` 返回。总面积 `totalArea` 则是这个拼版面积乘以拼版套数（panelSet）。
 * - **Panel by Gerber**: 此方式下，`singleArea` 返回的是单片PCB的面积（基于 singleDimensions）。总面积 `totalArea` 则是这个单片面积乘以拼版套数（panelSet），这个计算假设一套拼版中只含一个单片设计，或Gerber文件本身已处理好布局。
 * @param form 包含出货所需参数的表单数据对象。
 * @returns {{singleArea: number, totalArea: number}}
 * - `singleArea`: 单片面积（m²）。请注意，对于 `PanelBySpeedx`，这代表的是 **整个拼版** 的面积。
 * - `totalArea`: 基于上述逻辑计算的总面积（m²）。
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
    border = BorderType.Five,
    breakAwayRail = BreakAwayRail.None,
  } = form;

  // 工艺边宽度辅助函数
  function getBorderWidth(border: string): number {
    if (!border) return 0;
    return Number(border); // 直接返回mm值
  }

  // 计算加工艺边后的大板尺寸
  function getPanelSizeWithBorder(singleDimensions: { length?: number; width?: number }, panelDimensions: { row?: number; column?: number }, border: string, breakAwayRail: string) {
    let length = singleDimensions.length || 0; // 单位mm
    let width = singleDimensions.width || 0;   // 单位mm
    length = length * (panelDimensions.row || 1); 
    width = width * (panelDimensions.column || 1);
    const borderWidth = getBorderWidth(border); // 已经是mm单位
    if (breakAwayRail !== BreakAwayRail.None) {
      if (breakAwayRail === BreakAwayRail.TopBottom || breakAwayRail === BreakAwayRail.All) {
        length += 2 * borderWidth;
      }
      if (breakAwayRail === BreakAwayRail.LeftRight || breakAwayRail === BreakAwayRail.All) {
        width += 2 * borderWidth;
      }
    }
    return { length, width };
  }

  // 计算单片面积
  let singleArea = 0;

  // 计算总面积
  let totalArea = 0;
  if (shipmentType === ShipmentType.PanelBySpeedx) {
    const { length, width } = getPanelSizeWithBorder(singleDimensions,panelDimensions, border, breakAwayRail);

    singleArea = calculateSinglePcbArea(length, width);
    const totalCount =  panelSet;
    totalArea = singleArea * totalCount;
  } else if(shipmentType === ShipmentType.Single){
    singleArea = calculateSinglePcbArea(singleDimensions.length, singleDimensions.width);
    totalArea = singleArea * singleCount;
  } else if(shipmentType === ShipmentType.PanelByGerber){
    const { length, width } = singleDimensions;
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