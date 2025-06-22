/**
 * 智能交期计算工具
 * 考虑节假日、周末等因素，计算实际的预计交期
 */

// 2024-2025年中国法定节假日配置
const HOLIDAYS_2024_2025: string[] = [
  // 2024年节假日
  '2024-01-01', // 元旦
  '2024-02-10', '2024-02-11', '2024-02-12', '2024-02-13', '2024-02-14', '2024-02-15', '2024-02-16', '2024-02-17', // 春节
  '2024-04-04', '2024-04-05', '2024-04-06', // 清明节
  '2024-05-01', '2024-05-02', '2024-05-03', // 劳动节
  '2024-06-10', // 端午节
  '2024-09-15', '2024-09-16', '2024-09-17', // 中秋节
  '2024-10-01', '2024-10-02', '2024-10-03', '2024-10-04', '2024-10-05', '2024-10-06', '2024-10-07', // 国庆节
  
  // 2025年节假日
  '2025-01-01', // 元旦
  '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31', '2025-02-01', '2025-02-02', '2025-02-03', '2025-02-04', // 春节
  '2025-04-05', '2025-04-06', '2025-04-07', // 清明节
  '2025-05-01', '2025-05-02', '2025-05-03', // 劳动节
  '2025-05-31', // 端午节
  '2025-10-01', '2025-10-02', '2025-10-03', '2025-10-04', '2025-10-05', '2025-10-06', '2025-10-07', // 国庆节
  '2025-10-06', // 中秋节
];

// 调休工作日（周末但需要上班）
const WORKING_WEEKENDS_2024_2025: string[] = [
  '2024-02-04', '2024-02-18', // 春节调休
  '2024-04-07', '2024-04-28', // 清明、劳动节调休
  '2024-09-14', '2024-09-29', // 中秋、国庆调休
  '2025-01-26', '2025-02-08', // 春节调休
  '2025-04-27', '2025-09-27', // 劳动节、国庆调休
];

interface DeliveryCalculationResult {
  deliveryDate: string; // 预计交期 (YYYY-MM-DD)
  actualWorkingDays: number; // 实际工作日天数
  totalCalendarDays: number; // 总日历天数
  skippedDays: string[]; // 跳过的节假日/周末
  reason: string[]; // 计算说明
  isUrgent?: boolean; // 是否为加急订单
}

/**
 * 检查是否为节假日
 */
function isHoliday(date: Date): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return HOLIDAYS_2024_2025.includes(dateStr);
}

/**
 * 检查是否为工作日的周末（调休）
 */
function isWorkingWeekend(date: Date): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return WORKING_WEEKENDS_2024_2025.includes(dateStr);
}

/**
 * 检查是否为工作日
 */
function isWorkingDay(date: Date): boolean {
  const dayOfWeek = date.getDay(); // 0=周日, 1=周一, ..., 6=周六
  
  // 如果是节假日，不是工作日
  if (isHoliday(date)) {
    return false;
  }
  
  // 如果是调休的周末，是工作日
  if (isWorkingWeekend(date)) {
    return true;
  }
  
  // 周一到周五是工作日，周六周日不是
  return dayOfWeek >= 1 && dayOfWeek <= 5;
}

/**
 * 获取节假日名称
 */
function getHolidayName(date: Date): string {
  const dateStr = date.toISOString().split('T')[0];
  const year = date.getFullYear();
  
  // 定义节假日名称映射
  const holidayNames: Record<string, string> = {
    [`${year}-01-01`]: '元旦',
    [`${year}-05-01`]: '劳动节',
    [`${year}-10-01`]: '国庆节',
  };
  
  // 春节（通常在1-2月）
  if (dateStr.includes('-01-') || dateStr.includes('-02-')) {
    if (HOLIDAYS_2024_2025.includes(dateStr)) {
      return '春节';
    }
  }
  
  // 清明节（通常在4月）
  if (dateStr.includes('-04-') && HOLIDAYS_2024_2025.includes(dateStr)) {
    return '清明节';
  }
  
  // 端午节（通常在5-6月）
  if ((dateStr.includes('-05-') || dateStr.includes('-06-')) && HOLIDAYS_2024_2025.includes(dateStr)) {
    return '端午节';
  }
  
  // 中秋节（通常在9-10月）
  if ((dateStr.includes('-09-') || dateStr.includes('-10-')) && HOLIDAYS_2024_2025.includes(dateStr)) {
    return '中秋节';
  }
  
  return holidayNames[dateStr] || '节假日';
}

/**
 * 计算智能交期
 * @param productionDays 生产天数（工作日）
 * @param startDate 开始日期，默认今天
 * @param isUrgent 是否加急
 * @returns 交期计算结果
 */
export function calculateSmartDeliveryDate(
  productionDays: number,
  startDate: Date = new Date(),
  isUrgent: boolean = false
): DeliveryCalculationResult {
  const reason: string[] = [];
  const skippedDays: string[] = [];
  
  // 加急处理：减少1-2个工作日，但最少1天
  let actualProductionDays = productionDays;
  if (isUrgent) {
    const reduction = Math.min(2, productionDays - 1);
    actualProductionDays = Math.max(1, productionDays - reduction);
    reason.push(`⚡ 加急服务: ${productionDays}天 → ${actualProductionDays}天 (减少${reduction}天)`);
  }
  
  // 从第二天开始计算（当天不算）
  let currentDate = new Date(startDate);
  currentDate.setDate(currentDate.getDate() + 1);
  
  let workingDaysCount = 0;
  let totalDaysCount = 0;
  
  reason.push(`📅 开始计算: ${startDate.toLocaleDateString('zh-CN')} → 需要${actualProductionDays}个工作日`);
  
  // 检查开始时间
  const startHour = startDate.getHours();
  if (startHour >= 20) {
    currentDate.setDate(currentDate.getDate() + 1);
    reason.push(`🌙 下单时间${startHour}:00，顺延至次日开始计算`);
  }
  
  // 循环计算工作日
  while (workingDaysCount < actualProductionDays) {
    totalDaysCount++;
    
    if (isWorkingDay(currentDate)) {
      workingDaysCount++;
      reason.push(`✅ ${currentDate.toLocaleDateString('zh-CN')} (工作日${workingDaysCount})`);
    } else {
      const dayOfWeek = currentDate.getDay();
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      
      if (isHoliday(currentDate)) {
        const holidayName = getHolidayName(currentDate);
        skippedDays.push(`${currentDate.toLocaleDateString('zh-CN')} (${holidayName})`);
        reason.push(`❌ ${currentDate.toLocaleDateString('zh-CN')} (${holidayName}) - 跳过`);
      } else {
        skippedDays.push(`${currentDate.toLocaleDateString('zh-CN')} (${dayNames[dayOfWeek]})`);
        reason.push(`❌ ${currentDate.toLocaleDateString('zh-CN')} (${dayNames[dayOfWeek]}) - 跳过`);
      }
    }
    
    // 移到下一天
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // 最终交期日期（前一天，因为循环结束时已经多加了一天）
  const deliveryDate = new Date(currentDate);
  deliveryDate.setDate(deliveryDate.getDate() - 1);
  
  reason.push(`🎯 预计完成: ${deliveryDate.toLocaleDateString('zh-CN')} (总计${totalDaysCount}天，${workingDaysCount}个工作日)`);
  
  if (skippedDays.length > 0) {
    reason.push(`⏭️ 跳过了${skippedDays.length}天: ${skippedDays.slice(0, 3).join(', ')}${skippedDays.length > 3 ? '...' : ''}`);
  }
  
  return {
    deliveryDate: deliveryDate.toISOString().split('T')[0],
    actualWorkingDays: workingDaysCount,
    totalCalendarDays: totalDaysCount,
    skippedDays,
    reason,
    isUrgent
  };
}

/**
 * 计算两个日期之间的工作日天数
 */
export function calculateWorkingDaysBetween(startDate: Date, endDate: Date): number {
  let workingDays = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (isWorkingDay(current)) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return workingDays;
}

/**
 * 检查指定日期是否为工作日（对外接口）
 */
export function checkIsWorkingDay(date: Date): boolean {
  return isWorkingDay(date);
}

/**
 * 获取下一个工作日
 */
export function getNextWorkingDay(date: Date): Date {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  
  while (!isWorkingDay(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
}

/**
 * 简化的交期计算（用于快速预览）
 */
export function calculateSimpleDeliveryDate(productionDays: number, startDate: Date = new Date()): string {
  const result = calculateSmartDeliveryDate(productionDays, startDate, false);
  return result.deliveryDate;
} 