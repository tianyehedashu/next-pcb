/**
 * 精度处理工具函数
 * 提供比 Math.round(x * 1000000) / 1000000 更好的解决方案
 */

/**
 * 方案1: 使用 Number.parseFloat + toFixed 组合
 * 优点：简洁、性能好、兼容性强
 */
export function roundToPrecision(num: number, precision: number = 6): number {
  return Number(parseFloat(num.toFixed(precision)));
}

/**
 * 方案2: 使用 Math.round 但避免大数乘除
 * 优点：避免了大数运算可能的精度问题
 */
export function roundToDecimalPlaces(num: number, places: number = 6): number {
  const factor = Math.pow(10, places);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

/**
 * 方案3: 使用 Number.EPSILON 处理边界情况
 * 优点：处理了浮点数边界情况
 */
export function preciseRound(num: number, precision: number = 6): number {
  const factor = Math.pow(10, precision);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

/**
 * PCB面积计算专用函数
 * 将 cm² 转换为 m²，保持6位小数精度
 */
export function calculatePcbArea(lengthCm: number, widthCm: number, count: number = 1): number {
  // cm² 转 m²：除以 10000
  const areaM2 = (lengthCm * widthCm * count) / 10000;
  return roundToDecimalPlaces(areaM2, 6);
}

/**
 * 单片PCB面积计算（cm² 转 m²）
 */
export function calculateSinglePcbArea(lengthCm: number, widthCm: number): number {
  // cm² 转 m²：除以 10000
  const areaM2 = (lengthCm * widthCm) / 10000;
  return roundToDecimalPlaces(areaM2, 6);
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
    return area.toFixed(4); // 0.01-1平米显示4位小数
  } else {
    return area.toFixed(6); // 小于0.01平米显示6位小数
  }
} 