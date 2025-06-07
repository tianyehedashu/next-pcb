// PCB生产周期相关通用函数

import { ShipmentType } from '@/types/form';
import type { PcbQuoteForm } from '../types/pcbQuoteForm';
import { calculateTotalPcbArea } from './utils/precision';

// 节假日/周末判断与顺延用到的假期列表
const holidays = [
  // 示例：2024年五一假期
  '2024-05-01', '2024-05-02', '2024-05-03', '2024-05-04', '2024-05-05',
  // 可继续补充其它节假日
];

export function isHoliday(date: Date) {
  return holidays.includes(date.toISOString().slice(0, 10)) || date.getDay() === 0 || date.getDay() === 6;
}

export function getRealDeliveryDate(start: Date, days: number) {
  const d = new Date(start);
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (!isHoliday(d)) left--;
  }
  return d;
}

/**
 * PCB生产周期全字段参与的计算公式（V2风格）
 * @param form PCB报价表单对象（PcbQuoteForm）
 * @param orderTime 下单时间
 * @param delivery 交期类型（standard/urgent），如需加急请传'urgent'
 * @returns { cycleDays: number, reason: string[] }
 */
export function calcProductionCycle(form: PcbQuoteForm, orderTime: Date = new Date(), delivery: 'standard' | 'urgent' = 'standard'): { cycleDays: number, reason: string[] } {
  // 1. 定义各类特殊工艺、服务等加天规则（以对象表形式，便于维护和扩展）
  // 这些规则的加天数会根据面积倍数进行叠加
  const PCB_TYPE_EXTRA: Record<string, number> = { fr4: 0, aluminum: 1, rogers: 1, flex: 1, "rigid-flex": 1 };
  const SURFACE_EXTRA: Record<string, number> = { hasl: 0, leadfree: 0, enig: 1, osp: 0, immersion_silver: 2, immersion_tin: 2 };
  const MINTRACE_EXTRA: Record<string, number> = { "6/6": 0, "5/5": 0, "4/4": 1, "3.5/3.5": 1 };
  const MINHOLE_EXTRA: Record<string, number> = { "0.3": 0, "0.25": 0, "0.2": 1, "0.15": 1 };
  const HDI_EXTRA: Record<string, number> = { none: 0, "1step": 1, "2step": 2, "3step": 2 };

  const reason: string[] = [];

  let totalCount = 0;
  let area = 0;
  
  // 安全检查 singleDimensions
  const dimensions = form.singleDimensions || { length: 5, width: 5 };
  // 使用新的精度处理函数
  const singleArea = calculateTotalPcbArea(dimensions.length, dimensions.width);
  
  if (form.shipmentType === ShipmentType.PanelByCustom) {
    totalCount = (form.panelDimensions?.row || 1) * (form.panelDimensions?.column || 1) * (form.panelSet || 0);
  } else if (form.shipmentType === ShipmentType.Single) {
    totalCount = form.singleCount || 0;
  }
  
  area = singleArea * totalCount;

  const areaFactor = Math.max(1, Math.ceil(area));

  // 3. 获取层数和铜厚，用于查表
  const layers = Number(form.layers);
  // 铜厚判断：4层及以上时，outer或inner任一大于1oz即用大于1oz表，2层只看outer
  let copperWeightForTable = 1;
  const outerOz = Number(form.outerCopperWeight || '1');
  const innerOz = Number(form.innerCopperWeight || '1');
  if (layers >= 4) {
    copperWeightForTable = (outerOz > 1 || innerOz > 1) ? 2 : 1;
  } else {
    copperWeightForTable = outerOz;
  }

  // 4. 查表获取基础交期天数（已考虑层数、面积、铜厚）
  //    若查表结果为≥20天或评估，则reason中提示需评估确认
  const { days: baseDays, needReview } = getBaseDeliveryDays(layers, area, copperWeightForTable);
  if (needReview) {
    reason.push("需要评估确认，交期≥20天");
  }
  reason.push(`Base delivery days: ${baseDays}`);
  reason.push(`Area factor: ${areaFactor}x`);

  let extraDays = 0;

  // 厚铜特殊交期规则
  const maxOz = Math.max(outerOz, innerOz);
  if (maxOz >= 3) {
    if (area <= 1) {
      // 样品
      if (maxOz === 3) {
        extraDays += 2;
        reason.push('Sample 3oz copper: +2 days');
      } else if (maxOz >= 4) {
        extraDays += 3;
        reason.push('Sample 4oz copper: +3 days');
      }
    } else {
      // 批量厚铜需评估
      reason.push('Batch thick copper (≥3oz) requires delivery evaluation, set to max 20 days');
      return { cycleDays: 20, reason };
    }
  }

  // 5. 叠加所有特殊工艺、服务等加天项（每项都按面积倍数叠加）
  //    并将每项加天明细写入reason，便于前端展示
  if (form.pcbType && PCB_TYPE_EXTRA[String(form.pcbType)]) {
    const add = PCB_TYPE_EXTRA[String(form.pcbType)] * areaFactor;
    extraDays += add;
    if (PCB_TYPE_EXTRA[String(form.pcbType)] > 0) {
      reason.push(`Material: +${PCB_TYPE_EXTRA[String(form.pcbType)]} day × ${areaFactor} = +${add} days for ${String(form.pcbType)}`);
    }
  }
  if (form.surfaceFinish && SURFACE_EXTRA[String(form.surfaceFinish)]) {
    const add = SURFACE_EXTRA[String(form.surfaceFinish)] * areaFactor;
    extraDays += add;
    if (SURFACE_EXTRA[String(form.surfaceFinish)] > 0) {
      reason.push(`Surface finish (${String(form.surfaceFinish)}): +1 day × ${areaFactor} = +${add} days`);
    }
  }
  if (form.minTrace && MINTRACE_EXTRA[String(form.minTrace)]) {
    const add = MINTRACE_EXTRA[String(form.minTrace)] * areaFactor;
    extraDays += add;
    if (MINTRACE_EXTRA[String(form.minTrace)] > 0) {
      reason.push(`Min trace/spacing ≤4mil: +1 day × ${areaFactor} = +${add} days`);
    }
  }
  if (form.minHole && MINHOLE_EXTRA[String(form.minHole)]) {
    const add = MINHOLE_EXTRA[String(form.minHole)] * areaFactor;
    extraDays += add;
    if (MINHOLE_EXTRA[String(form.minHole)] > 0) {
      reason.push(`Min hole ≤0.2mm: +1 day × ${areaFactor} = +${add} days`);
    }
  }

  if (form.hdi && HDI_EXTRA[String(form.hdi)]) {
    const add = HDI_EXTRA[String(form.hdi)] * areaFactor;
    extraDays += add;
    if (HDI_EXTRA[String(form.hdi)] === 1) {
      reason.push(`HDI 1step: +1 day × ${areaFactor} = +${add} days`);
    } else if (HDI_EXTRA[String(form.hdi)] > 1) {
      reason.push(`HDI 2step/3step: +2 days × ${areaFactor} = +${add} days`);
    }
  }
  if (form.goldFingers) {
    const add = 1 * areaFactor;
    extraDays += add;
    reason.push(`Gold fingers: +1 day × ${areaFactor} = +${add} days`);
  }
  if (form.impedance) {
    const add = 1 * areaFactor;
    extraDays += add;
    reason.push(`Impedance control: +1 day × ${areaFactor} = +${add} days`);
  }
  if (form.edgePlating) {
    const add = 1 * areaFactor;
    extraDays += add;
    reason.push(`Edge plating: +1 day × ${areaFactor} = +${add} days`);
  }
  if (form.castellated) {
    const add = 1 * areaFactor;
    extraDays += add;
    reason.push(`Castellated holes: +1 day × ${areaFactor} = +${add} days`);
  }
  if (form.smt) {
    const add = 2 * areaFactor;
    extraDays += add;
    reason.push(`SMT assembly: +2 days × ${areaFactor} = +${add} days`);
  }
  // if (form.testMethod === 'flyingProbe') {
  //   const add = 1 * areaFactor;
  //   extraDays += add;
  //   reason.push(`Flying probe test: +1 day × ${areaFactor} = +${add} days`);
  // }
  if (form.qualityAttach === 'full') {
    const add = 1 * areaFactor;
    extraDays += add;
    reason.push(`Full quality inspection: +1 day × ${areaFactor} = +${add} days`);
  }
  if (form.productReport && form.productReport.length > 0 && form.productReport.some((v) => v !== 'none')) {
    const add = 1 * areaFactor;
    extraDays += add;
    reason.push(`Product report: +1 day × ${areaFactor} = +${add} days`);
  }

  // 6. 加急服务：最多减2天，最少1天，reason中注明
  let totalDays = baseDays + extraDays;
  if (delivery === 'urgent') {
    const before = totalDays;
    totalDays = Math.max(1, totalDays - 2);
    if (before !== totalDays) {
      reason.push("Urgent: -2 days");
    }
  }

  // 7. 下单时间晚于20:00，顺延一天
  const cutoffHour = 20;
  if (orderTime.getHours() >= cutoffHour) {
    totalDays += 1;
    reason.push("Order after 20:00: +1 day");
  }

  // 8. 返回最终生产周期天数和明细原因
  return { cycleDays: totalDays, reason };
}

// PCB交期表（普通）
const DELIVERY_DAYS_TABLE: Record<number, { area: number, days: number }[]> = {
  1: [
    { area: 0.5, days: 5 },
    { area: 1, days: 7 },
    { area: 3, days: 8 },
    { area: 5, days: 10 },
    { area: 10, days: 12 },
    { area: 20, days: 15 },
    { area: 30, days: 15 },
    { area: Infinity, days: 20 },
  ],
  2: [
    { area: 0.5, days: 5 },
    { area: 1, days: 7 },
    { area: 3, days: 9 },
    { area: 5, days: 11 },
    { area: 10, days: 13 },
    { area: 20, days: 15 },
    { area: 30, days: 15 },
    { area: Infinity, days: 20 },
  ],
  4: [
    { area: 0.5, days: 7 },
    { area: 1, days: 9 },
    { area: 3, days: 11 },
    { area: 5, days: 13 },
    { area: 10, days: 15 },
    { area: 20, days: 17 },
    { area: 30, days: 17 },
    { area: Infinity, days: 20 },
  ],
  6: [
    { area: 0.5, days: 8 },
    { area: 1, days: 11 },
    { area: 3, days: 13 },
    { area: 5, days: 15 },
    { area: 10, days: 17 },
    { area: 20, days: 19 },
    { area: 30, days: 19 },
    { area: Infinity, days: 20 },
  ],
  8: [
    { area: 0.5, days: 10 },
    { area: 1, days: 12 },
    { area: 3, days: 14 },
    { area: 5, days: 16 },
    { area: 10, days: 18 },
    { area: 20, days: 20 },
    { area: 30, days: 20 },
    { area: Infinity, days: 20 },
  ],
  10: [
    { area: 0.5, days: 11 },
    { area: 1, days: 13 },
    { area: 3, days: 15 },
    { area: 5, days: 17 },
    { area: 10, days: 18 },
    { area: 20, days: 20 },
    { area: 30, days: 20 },
    { area: Infinity, days: 20 },
  ],
  12: [
    { area: 0.5, days: 12 },
    { area: 1, days: 14 },
    { area: 3, days: 16 },
    { area: 5, days: 18 },
    { area: 10, days: 19 },
    { area: 20, days: 20 },
    { area: 30, days: 20 },
    { area: Infinity, days: 20 },
  ],
  14: [
    { area: 0.5, days: 13 },
    { area: 1, days: 15 },
    { area: 3, days: 17 },
    { area: 5, days: 19 },
    { area: 10, days: 20 },
    { area: 20, days: 20 },
    { area: 30, days: 20 },
    { area: Infinity, days: 20 },
  ],
  16: [
    { area: 0.5, days: 15 },
    { area: 1, days: 17 },
    { area: 3, days: 19 },
    { area: 5, days: 21 },
    { area: 10, days: 22 },
    { area: 20, days: 22 },
    { area: 30, days: 22 },
    { area: Infinity, days: 20 },
  ],
  18: [
    { area: 0.5, days: 17 },
    { area: 1, days: 19 },
    { area: 3, days: 21 },
    { area: 5, days: 23 },
    { area: 10, days: 24 },
    { area: 20, days: 24 },
    { area: 30, days: 24 },
    { area: Infinity, days: 20 },
  ],
  20: [
    { area: 0.5, days: 18 },
    { area: 1, days: 20 },
    { area: 3, days: 22 },
    { area: 5, days: 24 },
    { area: 10, days: 25 },
    { area: 20, days: 25 },
    { area: 30, days: 25 },
    { area: Infinity, days: 20 },
  ],
};

// 铜厚大于1oz交期表
const DELIVERY_DAYS_TABLE_COPPER: Record<number, { area: number, days: number }[]> = {
  1: [
    { area: 0.5, days: 5 },
    { area: 1, days: 7 },
    { area: 3, days: 8 },
    { area: 5, days: 10 },
    { area: 10, days: 12 },
    { area: 20, days: 15 },
    { area: 30, days: 15 },
    { area: Infinity, days: 20 },
  ],
  2: [
    { area: 0.5, days: 5 },
    { area: 1, days: 7 },
    { area: 3, days: 9 },
    { area: 5, days: 11 },
    { area: 10, days: 13 },
    { area: 20, days: 15 },
    { area: 30, days: 15 },
    { area: Infinity, days: 20 },
  ],
  4: [
    { area: 0.5, days: 7 },
    { area: 1, days: 9 },
    { area: 3, days: 11 },
    { area: 5, days: 13 },
    { area: 10, days: 15 },
    { area: 20, days: 17 },
    { area: 30, days: 17 },
    { area: Infinity, days: 20 },
  ],
  6: [
    { area: 0.5, days: 8 },
    { area: 1, days: 11 },
    { area: 3, days: 13 },
    { area: 5, days: 15 },
    { area: 10, days: 17 },
    { area: 20, days: 19 },
    { area: 30, days: 19 },
    { area: Infinity, days: 20 },
  ],
  8: [
    { area: 0.5, days: 10 },
    { area: 1, days: 12 },
    { area: 3, days: 14 },
    { area: 5, days: 16 },
    { area: 10, days: 18 },
    { area: 20, days: 20 },
    { area: 30, days: 20 },
    { area: Infinity, days: 20 },
  ],
  10: [
    { area: 0.5, days: 11 },
    { area: 1, days: 13 },
    { area: 3, days: 15 },
    { area: 5, days: 17 },
    { area: 10, days: 18 },
    { area: 20, days: 18 },
    { area: 30, days: 18 },
    { area: Infinity, days: 20 },
  ],
  12: [
    { area: 0.5, days: 12 },
    { area: 1, days: 14 },
    { area: 3, days: 16 },
    { area: 5, days: 18 },
    { area: 10, days: 19 },
    { area: 20, days: 19 },
    { area: 30, days: 19 },
    { area: Infinity, days: 20 },
  ],
  14: [
    { area: 0.5, days: 13 },
    { area: 1, days: 15 },
    { area: 3, days: 17 },
    { area: 5, days: 19 },
    { area: 10, days: 20 },
    { area: 20, days: 20 },
    { area: 30, days: 20 },
    { area: Infinity, days: 20 },
  ],
  16: [
    { area: 0.5, days: 15 },
    { area: 1, days: 17 },
    { area: 3, days: 19 },
    { area: 5, days: 21 },
    { area: 10, days: 22 },
    { area: 20, days: 22 },
    { area: 30, days: 22 },
    { area: Infinity, days: 20 },
  ],
  18: [
    { area: 0.5, days: 17 },
    { area: 1, days: 19 },
    { area: 3, days: 21 },
    { area: 5, days: 23 },
    { area: 10, days: 24 },
    { area: 20, days: 24 },
    { area: 30, days: 24 },
    { area: Infinity, days: 20 },
  ],
  20: [
    { area: 0.5, days: 18 },
    { area: 1, days: 20 },
    { area: 3, days: 22 },
    { area: 5, days: 24 },
    { area: 10, days: 25 },
    { area: 20, days: 25 },
    { area: 30, days: 25 },
    { area: Infinity, days: 20 },
  ],
};

// 查表函数：根据层数和面积查交期天数
function getBaseDeliveryDays(layers: number, area: number, copperWeight: number): { days: number, needReview: boolean } {
  // 铜厚大于1oz用铜厚表，否则用普通表
  const table = copperWeight > 1 ? DELIVERY_DAYS_TABLE_COPPER : DELIVERY_DAYS_TABLE;
  // 层数向下取最近支持的
  let layerKey = layers;
  while (!table[layerKey] && layerKey > 1) layerKey--;
  const arr = table[layerKey] || table[2];
  for (const item of arr) {
    if (area <= item.area) {
      // 20天及以上或特殊标记视为评估
      if (item.days >= 20) return { days: 20, needReview: true };
      return { days: item.days, needReview: false };
    }
  }
  return { days: 20, needReview: true };
}

