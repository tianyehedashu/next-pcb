import { pcbFieldRules } from './pcbFieldRules';
import type { PcbQuoteForm } from '../types/pcbQuoteForm';
import { ProdCap, TestMethod } from '../types/form';

// 类型定义
/**
 * handler输出：本次新增extra、detail、notes
 */
export type PriceContextOut = {
  extra?: number;
  detail?: Record<string, number>;
  notes?: string[];
};

/**
 * 单个价格处理器函数类型。
 * 每个PriceHandler负责处理报价流程中的一个环节（如板材类型、工艺边、测试方式等），
 * 只返回本次新增的extra、detail、notes，由主流程负责合并。
 *
 * @param form       当前报价表单（PcbQuoteForm），包含所有用户输入的参数
 * @param area       当前订单总面积（㎡），已按拼板/单片数量计算
 * @param totalCount 当前订单总片数（已按拼板/单片数量计算）
 * @returns          本次新增的extra、detail、notes
 */
export type PriceHandler = (
  form: PcbQuoteForm,
  area: number,
  totalCount: number
) => PriceContextOut;

/**
 * 板材类型加价
 * 规则：部分特殊板材（如aluminum、rogers、flex、rigid-flex）按面积加价，单价见规则表。
 * 公式：extra = 单价 × max(1, area)
 * 说明：FR4不加价，面积不足1㎡按1㎡计。
 */
export const pcbTypeHandler = Object.assign(
  (form: PcbQuoteForm, area: number, totalCount: number) => {
    const priceRule = pcbFieldRules.pcbType.price;
    type PriceKey = keyof typeof priceRule;
    const unitPrice = priceRule[form.pcbType as PriceKey] || 0;
    const extra = unitPrice * Math.max(1, area);
    let detail: Record<string, number> = {};
    let notes: string[] = [];
    if (unitPrice > 0) {
      detail['pcbType'] = extra;
      notes.push(`${form.pcbType} board: +${unitPrice} × ${Math.max(1, area)}㎡ = ${extra} CNY`);
    }
    return {
      extra: extra,
      detail: detail,
      notes: notes,
    };
  },
  { dependencies: ['pcbType'] }
);

/**
 * 沉金边加价
 * 规则：如需沉金边（edgePlating=true），整单加20元。
 */
export const edgePlatingHandler = Object.assign(
  (form: PcbQuoteForm, area: number, totalCount: number) => {
    let extra = 0, detail: Record<string, number> = {}, notes: string[] = [];
    if (form.edgePlating === true) {
      extra = 20;
      detail['edgePlating'] = 20;
      notes.push('Edge plating: +20 CNY');
    }
    return {
      extra: extra,
      detail: detail,
      notes: notes,
    };
  },
  { dependencies: ['edgePlating'] }
);

/**
 * 半孔/铣槽加价
 * 规则：如需半孔（castellated=true 或 halfHole!=none），整单加100元。
 */
export const castellatedHandler: PriceHandler = (form, area, totalCount) => {
  let extra = 0;
  const detail: Record<string, number> = {};
  const notes: string[] = [];
  if (form.castellated === true || (form.halfHole && form.halfHole !== 'none')) {
    extra = 100;
    detail['castellated'] = 100;
    notes.push('Castellated/half-hole: +100 CNY');
  }
  return {
    extra: extra,
    detail: detail,
    notes: notes,
  };
};

/**
 * 沉金盖板加价
 * 规则：如需盖板（edgeCover!=none），整单加20元。
 */
export const edgeCoverHandler: PriceHandler = (form, area, totalCount) => {
  let extra = 0;
  const detail: Record<string, number> = {};
  const notes: string[] = [];
  if (form.edgeCover && form.edgeCover !== 'none') { extra = 20; detail['edgeCover'] = 20; notes.push('Edge cover: +20 CNY'); }
  return {
    extra: extra,
    detail: detail,
    notes: notes,
  };
};

/**
 * 阻焊盖孔加价
 * 规则：如需盖孔（maskCover=plug/plug_flat），整单加10元。
 */
export const maskCoverHandler: PriceHandler = (form, area, totalCount) => {
  let extra = 0;
  const detail: Record<string, number> = {};
  const notes: string[] = [];
  if (form.maskCover && ['plug', 'plug_flat'].includes(form.maskCover)) { extra = 10; detail['maskCover'] = 10; notes.push('Mask cover: +10 CNY'); }
  return {
    extra: extra,
    detail: detail,
    notes: notes,
  };
};

/**
 * 产能手动加价
 * 规则：如需手动产能（prodCap=ProdCap.Manual），整单加10元。
 */
export const prodCapHandler: PriceHandler = (form, area, totalCount) => {
  let extra = 0;
  const detail: Record<string, number> = {};
  const notes: string[] = [];
  if (form.prodCap && form.prodCap === ProdCap.Manual) {
    extra = 10;
    detail['prodCap'] = 10;
    notes.push('Production capacity manual: +10 CNY');
  }
  return {
    extra: extra,
    detail: detail,
    notes: notes,
  };
};

/**
 * 阴阳钉加价
 * 规则：如需阴阳钉（yyPin=true），整单加10元。
 */
export const yyPinHandler: PriceHandler = (form, area, totalCount) => {
  let extra = 0;
  const detail: Record<string, number> = {};
  const notes: string[] = [];
  if (form.yyPin === true) { extra = 10; detail['yyPin'] = 10; notes.push('Yin-yang pin: +10 CNY'); }
  return {
    extra: extra,
    detail: detail,
    notes: notes,
  };
};

/**
 * 客户码加价
 * 规则：客户码（customerCode=add）加10元，customerCode=add_pos加15元。
 */
export const customerCodeHandler: PriceHandler = (form, area, totalCount) => {
  let extra = 0;
  const detail: Record<string, number> = {};
  const notes: string[] = [];
  if (form.customerCode === 'add') { extra = 10; detail['customerCode'] = 10; notes.push('Customer code add: +10 CNY'); }
  if (form.customerCode === 'add_pos') { extra = 15; detail['customerCode'] = 15; notes.push('Customer code add_pos: +15 CNY'); }
  return {
    extra: extra,
    detail: detail,
    notes: notes,
  };
};

/**
 * 手动支付加价
 * 规则：如需手动支付（payMethod=manual），整单加5元。
 */
export const payMethodHandler: PriceHandler = (form, area, totalCount) => {
  let extra = 0;
  const detail: Record<string, number> = {};
  const notes: string[] = [];
  if (form.payMethod === 'manual') { extra = 5; detail['payMethod'] = 5; notes.push('Manual payment: +5 CNY'); }
  return {
    extra: extra,
    detail: detail,
    notes: notes,
  };
};

/**
 * 全检附加加价
 * 规则：如需全检附加（qualityAttach=full），整单加20元。
 */
export const qualityAttachHandler: PriceHandler = (form, area, totalCount) => {
  let extra = 0;
  const detail: Record<string, number> = {};
  const notes: string[] = [];
  if (form.qualityAttach === 'full') { extra = 20; detail['qualityAttach'] = 20; notes.push('Full quality attach: +20 CNY'); }
  return {
    extra: extra,
    detail: detail,
    notes: notes,
  };
};

/**
 * SMT贴片加价
 * 规则：如需SMT贴片（smt=true），整单加50元。
 * 说明：如需按面积计价可调整为50×max(1, area)
 */
export const smtHandler: PriceHandler = (form, area, totalCount) => {
  let extra = 0;
  const detail: Record<string, number> = {};
  const notes: string[] = [];
  if (form.smt === true) {
    extra = 50;
    detail['smt'] = 50;
    notes.push('SMT: +50 CNY');
  }
  return {
    extra: extra,
    detail: detail,
    notes: notes,
  };
};

/**
 * 生益板材加价（与TG值联动）
 * 规则：
 * - 仅在 useShengyiMaterial 为 true 时生效。
 * - TG135：样品（area<1）+80元/款，批量（area>=1）+80元/㎡。
 * - TG150：样品+120元/款，批量+120元/㎡。
 * - TG170：样品+150元/款，批量+150元/㎡。
 * - 明细和备注中体现TG类型和加价方式。
 * 适用场景：
 * - 用户指定使用生益品牌板材时，且TG值不同，自动按规则加价。
 * - 便于报价明细展示和后续维护。
 */
export const syMaterialHandler: PriceHandler = (form, area, totalCount) => {
  let extra = 0;
  const detail: Record<string, number> = {};
  const notes: string[] = [];
  if (form.useShengyiMaterial) {
    const isSample = area < 1;
    let price = 80;
    if (form.tg === 'TG150') price = 120;
    if (form.tg === 'TG170') price = 150;
    if (isSample) {
      extra = price;
      detail['syMaterial'] = price;
      notes.push(`Shengyi material (${form.tg}, sample): +${price} CNY/lot`);
    } else {
      const fee = price * area;
      extra = fee;
      detail['syMaterial'] = fee;
      notes.push(`Shengyi material (${form.tg}, batch): +${price} CNY/㎡ × ${area.toFixed(2)} = ${fee.toFixed(2)} CNY`);
    }
  }
  return { extra, detail, notes };
};

/**
 * 钻孔数加价
 * 规则：钻孔数>100000时，每超1万孔加10元/㎡。
 * 公式：extra = ceil((holeCount-100000)/10000) × 10 × max(1, area)
 */
export const holeCountHandler: PriceHandler = (form, area, totalCount) => {
  let extra = 0;
  const detail: Record<string, number> = {};
  const notes: string[] = [];
  if (form.holeCount && form.holeCount > 100000) {
    const fee = Math.ceil((form.holeCount - 100000) / 10000) * 10 * Math.max(1, area);
    extra += fee;
    detail['holeCount'] = fee;
    notes.push(`Drill count >100k: +${fee} CNY`);
  }
  return {
    extra: extra,
    detail: detail,
    notes: notes,
  };
};

/**
 * 0.15mm孔加价
 * 规则：最小孔径0.15mm且钻孔数>10000时，每超1万孔加30元/㎡。
 * 公式：extra = ceil((holeCount-10000)/10000) × 30 × max(1, area)
 */
export const holeCount015Handler: PriceHandler = (form, area, totalCount) => {
  let extra = 0;
  const detail: Record<string, number> = {};
  const notes: string[] = [];
  if (form.minHole === '0.15' && form.holeCount && form.holeCount > 10000) {
    const fee = Math.ceil((form.holeCount - 10000) / 10000) * 30 * Math.max(1, area);
    extra += fee;
    detail['holeCount_015'] = fee;
    notes.push(`Drill 0.15mm >10k: +${fee} CNY`);
  }
  return {
    extra: extra,
    detail: detail,
    notes: notes,
  };
};

/**
 * 线宽线距加价
 * 规则说明：
 *   - 针对不同层数和线宽线距规格，分档加价。
 *   - 1/2层板：
 *       - 4/4mil：样品加60元，批量加60元/㎡。
 *       - <4/4mil（如3.5/3.5、3/3、2/2）：不支持，备注提示。
 *   - 4层板：
 *       - 3.5/3.5mil：样品加60元，批量加60元/㎡。
 *       - <3.5/3.5mil（如3/3、2/2）：不支持，备注提示。
 *   - 6/8/10层及以上：
 *       - 3.5/3.5mil及以上：不加价，备注提示。
 *       - <3.5/3.5mil：不支持，备注提示。
 *   - 其它规格不加价。
 *
 * 适用场景：
 *   - 用户选择了特殊线宽线距规格时，自动判断是否加价或支持。
 *   - 便于报价明细展示和后续维护。
 */
export const traceHandler: PriceHandler = (form, area, totalCount) => {
  let extra = 0;
  const detail: Record<string, number> = {};
  const notes: string[] = [];
  const layers = form.layers;
  const minTrace = form.minTrace;
  const isSample = area < 1;
  // 线宽线距加价
  if (layers === 1 || layers === 2) {
    if (minTrace === '4/4') {
      if (isSample) {
        extra += 60;
        detail['minTrace'] = 60;
        notes.push('Trace/space 4/4mil, sample +60 CNY');
      } else {
        const fee = 60 * area;
        extra += fee;
        detail['minTrace'] = fee;
        notes.push(`Trace/space 4/4mil, batch +60 CNY/㎡ × ${area.toFixed(2)} = ${fee.toFixed(2)} CNY`);
      }
    } else if (minTrace && ['3.5/3.5', '3/3', '2/2'].includes(minTrace)) {
      notes.push('Trace/space <4/4mil, not supported');
    }
  } else if (layers === 4) {
    if (minTrace === '3.5/3.5') {
      if (isSample) {
        extra += 60;
        detail['minTrace'] = 60;
        notes.push('Trace/space 3.5/3.5mil, sample +60 CNY');
      } else {
        const fee = 60 * area;
        extra += fee;
        detail['minTrace'] = fee;
        notes.push(`Trace/space 3.5/3.5mil, batch +60 CNY/㎡ × ${area.toFixed(2)} = ${fee.toFixed(2)} CNY`);
      }
    } else if (minTrace && ['3/3', '2/2'].includes(minTrace)) {
      notes.push('Trace/space <3.5/3.5mil, not supported');
    }
  } else if (layers === 6 || layers === 8 || layers >= 10) {
    if (minTrace === '3.5/3.5') {
      notes.push('Trace/space 3.5/3.5mil and above, no extra fee');
    } else if (minTrace && ['3/3', '2/2'].includes(minTrace)) {
      notes.push('Trace/space <3.5/3.5mil, not supported');
    }
  }
  return {
    extra: extra,
    detail: detail,
    notes: notes,
  };
};

/**
 * 钻孔/板厚加价
 * 规则说明：
 *   - 针对不同层数、板厚和最小孔径的组合，分档加价或提示不支持。
 *   - 厚度>=1.6mm：
 *       - 1层：最小孔径<0.3mm不支持。
 *       - 2层：0.2mm样品加50元，批量加50元/㎡；<0.2mm不支持。
 *   - 厚度<1.6mm：
 *       - 1层：最小孔径<0.3mm不支持。
 *       - 2层：0.15mm样品加150元，批量加130元/㎡；<0.15mm不支持。
 *       - 4层：0.15mm样品加60元，批量加60元/㎡。
 *       - 6/8/10层及以上：0.15mm样品加50元，批量加50元/㎡。
 *   - 其它规格不加价。
 *
 * 适用场景：
 *   - 用户选择了特殊钻孔/板厚组合时，自动判断是否加价或支持。
 *   - 便于报价明细展示和后续维护。
 */
export const drillAndThicknessHandler: PriceHandler = (form, area, totalCount) => {
  let extra = 0;
  const detail: Record<string, number> = {};
  const notes: string[] = [];
  const layers = form.layers;
  const minHole = form.minHole;
  const thicknessNum = form.thickness;
  const isSample = area < 1;
  // 钻孔和板厚加价
  if (thicknessNum >= 1.6) {
    if (layers === 1) {
      if (minHole && parseFloat(minHole) < 0.3) {
        notes.push('Min hole <0.3mm not supported for 1L, thickness>=1.6mm');
      }
    } else if (layers === 2) {
      if (minHole && parseFloat(minHole) === 0.2) {
        if (isSample) {
          extra += 50;
          detail['minHole'] = 50;
          notes.push('Min hole 0.2mm, sample +50 CNY');
        } else {
          const fee = 50 * area;
          extra += fee;
          detail['minHole'] = fee;
          notes.push(`Min hole 0.2mm, batch +50 CNY/㎡ × ${area.toFixed(2)} = ${fee.toFixed(2)} CNY`);
        }
      } else if (minHole && parseFloat(minHole) < 0.2) {
        notes.push('Min hole <0.2mm not supported for 2L, thickness>=1.6mm');
      }
    }
  } else if (thicknessNum < 1.6) {
    if (layers === 1) {
      if (minHole && parseFloat(minHole) < 0.3) {
        notes.push('Min hole <0.3mm not supported for 1L, thickness<1.6mm');
      }
    } else if (layers === 2) {
      if (minHole && parseFloat(minHole) === 0.15) {
        if (isSample) {
          extra += 150;
          detail['minHole'] = 150;
          notes.push('Min hole 0.15mm, sample +150 CNY');
        } else {
          const fee = 130 * area;
          extra += fee;
          detail['minHole'] = fee;
          notes.push(`Min hole 0.15mm, batch +130 CNY/㎡ × ${area.toFixed(2)} = ${fee.toFixed(2)} CNY`);
        }
      } else if (minHole && parseFloat(minHole) < 0.15) {
        notes.push('Min hole <0.15mm not supported for 2L, thickness<1.6mm');
      }
    } else if (layers === 4) {
      if (minHole && parseFloat(minHole) === 0.15) {
        if (isSample) {
          extra += 60;
          detail['minHole'] = 60;
          notes.push('Min hole 0.15mm, sample +60 CNY');
        } else {
          const fee = 60 * area;
          extra += fee;
          detail['minHole'] = fee;
          notes.push(`Min hole 0.15mm, batch +60 CNY/㎡ × ${area.toFixed(2)} = ${fee.toFixed(2)} CNY`);
        }
      }
    } else if (layers === 6 || layers === 8 || layers >= 10) {
      if (minHole && parseFloat(minHole) === 0.15) {
        if (isSample) {
          extra += 50;
          detail['minHole'] = 50;
          notes.push('Min hole 0.15mm, sample +50 CNY');
        } else {
          const fee = 50 * area;
          extra += fee;
          detail['minHole'] = fee;
          notes.push(`Min hole 0.15mm, batch +50 CNY/㎡ × ${area.toFixed(2)} = ${fee.toFixed(2)} CNY`);
        }
      }
    }
  }
  return {
    extra: extra,
    detail: detail,
    notes: notes,
  };
};

/**
 * 基础报价分档
 * 规则：按层数、面积分档报价，详见baseTable。
 * 只在ctx.detail/basePrice体现，不累计到extra。
 */
export const basePriceHandler = Object.assign(
  (form: PcbQuoteForm, area: number, totalCount: number) => {
    const baseTable = {
      1: { engFee_0_05: 210, engFee_05_3: 142, engFee_3up: 0, samplePack: 300, priceSteps: [[0.2, 300], [0.5, 550], [1, 500], [3, 400], [5, 420], [10, 330], [30, 330], [Infinity, 330]], minOrderQty: 1, leadTime: ["5", "5", "7", "8", "10", "12", ">=15"] },
      2: { engFee_0_05: 210, engFee_05_3: 142, engFee_3up: 0, samplePack: 300, priceSteps: [[0.2, 300], [0.5, 560], [1, 450], [3, 460], [5, 435], [10, 380], [30, 340], [Infinity, 320]], minOrderQty: 1, leadTime: ["5", "5", "7", "9", "11", "13", ">=15"] },
      4: { engFee_0_05: 500, engFee_05_3: 425, engFee_3up: 0, samplePack: 610, priceSteps: [[0.2, 610], [0.5, 850], [1, 800], [3, 700], [5, 700], [10, 630], [30, 600], [Infinity, 570]], minOrderQty: 1, leadTime: ["7", "7", "9", "11", "13", "15", ">=17"] },
      6: { engFee_0_05: 850, engFee_05_3: 850, engFee_3up: 0, samplePack: 1150, priceSteps: [[0.2, 1150], [0.5, 1100], [1, 1000], [3, 920], [5, 1200], [10, 1000], [30, 900], [Infinity, 870]], minOrderQty: 1, leadTime: ["8", "8", "11", "13", "15", "17", ">=19"] },
      8: { engFee_0_05: 1050, engFee_05_3: 710, engFee_3up: 0, samplePack: 1400, priceSteps: [[0.2, 1400], [0.5, 1600], [1, 1600], [3, 1500], [5, 1600], [10, 1300], [30, 1300], [Infinity, 1300]], minOrderQty: 5, leadTime: ["10", "10", "12", "14", "16", "18", ">=20"] },
      10: { engFee_0_05: 1500, engFee_05_3: 1500, engFee_3up: 0, samplePack: 2200, priceSteps: [[0.2, 2200], [0.5, 2500], [1, 2500], [3, 2000], [5, 2150], [10, 1900], [30, 1900], [Infinity, 1800]], minOrderQty: 5, leadTime: ["11", "11", "13", "15", "17", "18", ">=20天"] },
      12: { engFee_0_05: 1600, engFee_05_3: 1600, engFee_3up: 0, samplePack: 2600, priceSteps: [[0.2, 2600], [0.5, 2600], [1, 2600], [3, 2500], [5, 2500], [10, 2400], [30, 2200], [Infinity, 2100]], minOrderQty: 5, leadTime: ["12", "12", "14", "16", "18", "19", "评估"] },
      14: { engFee_0_05: 2000, engFee_05_3: 2000, engFee_3up: 0, samplePack: 3150, priceSteps: [[0.2, 3150], [0.5, 4000], [1, 4000], [3, 3800], [5, 3600], [10, 3600], [30, 3400], [Infinity, 3400]], minOrderQty: 5, leadTime: ["13", "13", "15", "17", "19", "20", "评估"] },
      16: { engFee_0_05: 2500, engFee_05_3: 2500, engFee_3up: 0, samplePack: 3750, priceSteps: [[0.2, 3750], [0.5, 4500], [1, 4500], [3, 4300], [5, 4300], [10, 4300], [30, 4200], [Infinity, 4100]], minOrderQty: 5, leadTime: ["15", "15", "17", "19", "21", "22", "评估"] },
      18: { engFee_0_05: 3000, engFee_05_3: 3000, engFee_3up: 0, samplePack: 4200, priceSteps: [[0.2, 4200], [0.5, 5500], [1, 5500], [3, 5300], [5, 5000], [10, 5000], [30, 4800], [Infinity, 4600]], minOrderQty: 5, leadTime: ["17", "17", "19", "21", "23", "24", "评估"] },
      20: { engFee_0_05: 3500, engFee_05_3: 3500, engFee_3up: 0, samplePack: 4800, priceSteps: [[0.2, 4800], [0.5, 6500], [1, 6500], [3, 6200], [5, 6000], [10, 6000], [30, 5800], [Infinity, 5700]], minOrderQty: 5, leadTime: ["18", "18", "20", "22", "24", "25", "评估"] },
    };
    const table = baseTable[form.layers as keyof typeof baseTable];
    let calculatedBasePrice = 0;

    const notes: string[] = [];
    let found = false;
    const detail: Record<string, number> = {};
    if (!table) {
      notes.push('This layer count is not supported, please contact sales for manual evaluation');
      return {
        extra: 0,
        detail: { ...detail },
        notes: [...notes],
      };
    }
    for (let i = 0; i < table.priceSteps.length; i++) {
      const [maxArea, price] = table.priceSteps[i];
      if (area <= maxArea) {
        if (typeof price === 'string') {
          notes.push(String(price));
          calculatedBasePrice = 0;
        } else {
          calculatedBasePrice = price;
          detail['basePrice'] = calculatedBasePrice;
        }

        found = true;
        break;
      }
    }
    if (!found) {
      notes.push('Area exceeds quotation range, please contact sales for evaluation');
    }
    // 新增：基础价格说明
    if (calculatedBasePrice > 0) {
      notes.push(`PCB Basic Price: ¥${calculatedBasePrice}`);
    }
    // 只在 detail/basePrice 里体现，extra 不累计
    return {
      extra: calculatedBasePrice,
      detail: { ...detail },
      notes: [...notes],
    };
  },
  { dependencies: ['layers', 'singleLength', 'singleWidth', 'panelCount', 'panelSet', 'singleCount'] }
);

/**
 * 阻焊颜色加价
 * 规则：非绿色阻焊（solderMask!=green）整单加5元。
 */
export const solderMaskHandler: PriceHandler = (form, area, totalCount) => {
  let extra = 0;
  const detail: Record<string, number> = {};
  const notes: string[] = [];
  if (form.solderMask && form.solderMask !== 'green') {
    extra = 5;
    detail['solderMask'] = 5;
    notes.push(`Solder mask: +5 CNY`);
  }
  return {
    extra: extra,
    detail: detail,
    notes: notes,
  };
};

/**
 * 丝印颜色加价
 * 规则：目前白/黑/绿都不加价。
 */
export const silkscreenHandler: PriceHandler = (form, area, totalCount) => {
  // 目前白/黑/绿都不加价
  return {
    extra: 0,
    detail: {},
    notes: [],
  };
};

/**
 * 表面处理加价
 * 规则：
 * 1. 沉金（ENIG）分为1U/2U/3U三档：
 *    - 1U：10寸加价140元/㎡，样板加140元/款（面积<1㎡视为样板）。
 *    - 2U：10寸加价190元/㎡，样板加190元/款。
 *    - 3U：10寸加价240元/㎡，样板加230元/款，且备注"全面超过3U需人工改价"。
 * 2. 沉银/沉锡：
 *    - 每平米加价100元，样板加120元/款。
 *    - 备注"交期加2天"。
 *
 * Surface Finish Price Handler
 *  - ENIG (Electroless Nickel Immersion Gold) is divided into 1U/2U/3U:
 *    - 1U: +140 CNY/㎡, sample +140 CNY/lot (sample: area < 1㎡)
 *    - 2U: +190 CNY/㎡, sample +190 CNY/lot
 *    - 3U: +240 CNY/㎡, sample +230 CNY/lot, and note: "Manual pricing required if over 3U"
 *  - Immersion Silver/Tin:
 *    - +100 CNY/㎡, sample +120 CNY/lot
 *    - Note: "Lead time +2 days"
 */
export const surfaceFinishHandler: PriceHandler = (form, area, totalCount) => {
  let extra = 0;
  const detail: Record<string, number> = {};
  const notes: string[] = [];
  // 样板定义：面积<1㎡视为样板，否则为批量
  const isSample = area < 1;
  const finish = form.surfaceFinish;
  const enigType = form.surfaceFinishEnigType;

  if (finish === 'enig') {
    // ENIG（沉金）分档加价
    let pricePerSqm = 0, pricePerSample = 0, label = '';
    if (enigType === 'enig_1u') {
      // 1U 沉金
      pricePerSqm = 140;
      pricePerSample = 140;
      label = 'ENIG 1U';
    } else if (enigType === 'enig_2u') {
      // 2U 沉金
      pricePerSqm = 190;
      pricePerSample = 190;
      label = 'ENIG 2U';
    } else if (enigType === 'enig_3u') {
      // 3U 沉金
      pricePerSqm = 240;
      pricePerSample = 230;
      label = 'ENIG 3U';
    }
    // 超过3U需人工改价
    if (enigType === 'enig_3u') {
      notes.push('ENIG 3U: 超过3U需人工改价');
    }
    if (isSample) {
      // 样板加价
      extra += pricePerSample;
      detail['surfaceFinish'] = pricePerSample;
      notes.push(`${label}: sample +${pricePerSample} CNY/款`);
    } else {
      // 批量按面积加价
      const fee = pricePerSqm * area;
      extra += fee;
      detail['surfaceFinish'] = fee;
      notes.push(`${label}: +${pricePerSqm} CNY/㎡ × ${area.toFixed(2)} = ${fee.toFixed(2)} CNY`);
    }
  } else if (finish === 'immersion_silver' || finish === 'immersion_tin') {
    // 沉银/沉锡加价
    const pricePerSqm = 100;
    const pricePerSample = 120;
    if (isSample) {
      // 样板加价
      extra += pricePerSample;
      detail['surfaceFinish'] = pricePerSample;
      notes.push(`${finish === 'immersion_silver' ? 'Immersion Silver' : 'Immersion Tin'}: sample +120 CNY/款`);
    } else {
      // 批量按面积加价
      const fee = pricePerSqm * area;
      extra += fee;
      detail['surfaceFinish'] = fee;
      notes.push(`${finish === 'immersion_silver' ? 'Immersion Silver' : 'Immersion Tin'}: +100 CNY/㎡ × ${area.toFixed(2)} = ${fee.toFixed(2)} CNY`);
    }
    // 交期备注
    notes.push('交期加2天');
  }
  return {
    extra,
    detail,
    notes,
  };
};

/**
 * 阻抗控制加价
 * 规则：
 * 1. 阻抗控制（impedance=true）：
 *    - 样品（面积<1㎡）：加50元/款
 *    - 批量（面积≥1㎡）：不收费
 * 2. 阻抗报告（productReport 包含 'impedanceReport'）：每款加30元
 *
 * Impedance Price Handler
 *  - Impedance control (impedance=true):
 *    - Sample (area < 1㎡): +50 CNY/lot
 *    - Batch (area ≥ 1㎡): free
 *  - Impedance report (productReport includes 'impedanceReport'): +30 CNY/lot
 */
export const impedanceHandler: PriceHandler = (form, area, totalCount) => {
  let extra = 0;
  const detail: Record<string, number> = {};
  const notes: string[] = [];
  // 阻抗控制加价
  if (form.impedance === true) {
    if (area < 1) {
      extra += 50;
      detail['impedance'] = 50;
      notes.push('Impedance control: sample +50 CNY/lot');
    } else {
      notes.push('Impedance control: batch, free');
    }
  }
  // 阻抗报告加价
  if (form.productReport && Array.isArray(form.productReport) && form.productReport.includes('impedanceReport')) {
    extra += 30;
    detail['impedanceReport'] = 30;
    notes.push('Impedance report: +30 CNY/lot');
  }
  return {
    extra,
    detail,
    notes,
  };
};

/**
 * 金手指加价
 * 规则：如需金手指（goldFingers=true），整单加20元。
 */
export const goldFingersHandler: PriceHandler = (form, area, totalCount) => {
  let extra = 0;
  const detail: Record<string, number> = {};
  const notes: string[] = [];
  if (form.goldFingers === true) {
    extra = 20;
    detail['goldFingers'] = 20;
    notes.push('Gold fingers: +20 CNY');
  }
  return {
    extra: extra,
    detail: detail,
    notes: notes,
  };
};

/**
 * 测试方式加价
 * 规则：
 * 1. 面积≤0.5㎡，测试费免费，实际测试方式为"none"。
 * 2. 单层板（layers=1）：允许none/flyingProbe/fixture，非法值自动修正为none。
 *    - none：免费
 *    - flyingProbe：60元 × max(1, area)
 *    - fixture：500元
 * 3. 多层板（layers>1）：不允许none，若传入none或未传入，面积≤5㎡自动修正为flyingProbe，面积>5㎡修正为fixture。
 *    - flyingProbe：2-6层 60元/㎡，8层及以上 100元/㎡
 *    - fixture：1-6层 500元，8层 800元，10层及以上 1000元
 * 4. 面积>5㎡只能fixture。
 * 5. 其它情况：自动修正并备注实际测试方式。
 * 备注：系统会在报价明细中注明实际测试方式。
 */
export const testMethodHandler: PriceHandler = (form, area, totalCount) => {
  let extra = 0;
  const detail: Record<string, number> = {};
  const notes: string[] = [];
  const layers = Number(form.layers);
  const testMethod = form.testMethod;
  const realArea = Math.max(1, area);
  let actualType: TestMethod | undefined = testMethod;
  let fee = 0;

  // 1. 面积≤0.5㎡，免费
  if (area <= 0.5) {
    actualType = TestMethod.None;
    fee = 0;
    notes.push('Test method auto-adjusted: none (≤0.5㎡ free)');
  } else if (layers === 1) {
    // 2. 单层板
    if (!testMethod || ![TestMethod.None, TestMethod.FlyingProbe, TestMethod.Fixture].includes(testMethod)) {
      actualType = TestMethod.None;
      notes.push('Test method auto-adjusted: none (invalid input)');
    }
    if (actualType === TestMethod.None) {
      fee = 0;
    } else if (actualType === TestMethod.FlyingProbe) {
      fee = 60 * realArea;
    } else if (actualType === TestMethod.Fixture) {
      fee = 500;
    }
  } else if (layers > 1) {
    // 3. 多层板
    if (!testMethod || ![TestMethod.FlyingProbe, TestMethod.Fixture].includes(testMethod)) {
      if (area <= 5) {
        actualType = TestMethod.FlyingProbe;
        notes.push('Test method auto-adjusted: flyingProbe (invalid input, area≤5㎡)');
      } else {
        actualType = TestMethod.Fixture;
        notes.push('Test method auto-adjusted: fixture (invalid input, area>5㎡)');
      }
    } else if (testMethod === TestMethod.FlyingProbe && area > 5) {
      actualType = TestMethod.Fixture;
      notes.push('Test method auto-adjusted: fixture (area>5㎡)');
    }
    if (actualType === TestMethod.FlyingProbe) {
      if (layers >= 8) {
        fee = 100 * realArea;
      } else {
        fee = 60 * realArea;
      }
    } else if (actualType === TestMethod.Fixture) {
      if (layers <= 6) {
        fee = 500;
      } else if (layers === 8) {
        fee = 800;
      } else if (layers >= 10) {
        fee = 1000;
      }
    }
  }
  extra = fee;
  detail['testMethod'] = fee;
  notes.push(`Actual test method: ${actualType}, test fee: ${fee} CNY`);
  return {
    extra: extra,
    detail: detail,
    notes: notes,
  };
};

/**
 * 产品报告加价
 * 规则：每选1项报告加5元。
 */
export const productReportHandler: PriceHandler = (form, area, totalCount) => {
  let extra = 0;
  const detail: Record<string, number> = {};
  const notes: string[] = [];
  if (form.productReport && Array.isArray(form.productReport)) {
    const count = form.productReport.filter((i: string) => i !== 'none').length;
    if (count > 0) {
      extra = count * 5;
      detail['productReport'] = extra;
      notes.push(`Product report: +${extra} CNY`);
    }
  }
  return {
    extra: extra,
    detail: detail,
    notes: notes,
  };
};

/**
 * 不良板加价
 * 规则：如需不良板（isRejectBoard=true），整单加10元。
 */
export const rejectBoardHandler: PriceHandler = (form, area, totalCount) => {
  let extra = 0;
  const detail: Record<string, number> = {};
  const notes: string[] = [];
  if (form.isRejectBoard) {
    extra = 10;
    detail['rejectBoard'] = 10;
    notes.push('Reject board: +10 CNY');
  }
  return {
    extra: extra,
    detail: detail,
    notes: notes,
  };
};

/**
 * 蓝胶加价
 * 规则：如需蓝胶（solderMask=blue），
 *   - 样品（面积<1㎡）：加120元/款，交期加2天；
 *   - 批量（面积≥1㎡）：加100元/㎡，交期加3天以上。
 *
 * Blue Mask Price Handler
 *   - Sample (area < 1㎡): +120 CNY/lot, lead time +2 days
 *   - Batch (area ≥ 1㎡): +100 CNY/㎡, lead time +3 days or more
 *   - If solderMask is 'blue', treat as blue mask.
 */
export const blueMaskHandler: PriceHandler = (form, area, totalCount) => {
  let extra = 0;
  const detail: Record<string, number> = {};
  const notes: string[] = [];
  // 只要阻焊色为 blue 即视为蓝胶
  if (form.solderMask === 'blue') {
    const isSample = area < 1;
    if (isSample) {
      extra = 120;
      detail['blueMask'] = 120;
      notes.push('Blue mask: sample +120 CNY/lot');
      notes.push('Lead time +2 days');
    } else {
      const fee = 100 * area;
      extra = fee;
      detail['blueMask'] = fee;
      notes.push(`Blue mask: +100 CNY/㎡ × ${area.toFixed(2)} = ${fee.toFixed(2)} CNY`);
      notes.push('Lead time +3 days or more');
    }
  }
  return {
    extra,
    detail,
    notes,
  };
};

/**
 * 孔铜25um加价
 * 规则：如需孔铜25um（holeCu25um=true），整单加20元。
 */
export const holeCu25umHandler: PriceHandler = (form, area, totalCount) => {
  let extra = 0;
  const detail: Record<string, number> = {};
  const notes: string[] = [];
  if (form.holeCu25um === true) {
    extra = 20;
    detail['holeCu25um'] = 20;
    notes.push('Hole Cu 25um: +20 CNY');
  }
  return {
    extra: extra,
    detail: detail,
    notes: notes,
  };
};

/**
 * 菲林费加价
 * 规则：光绘面积超出0.06平方米, 按200元/平方米计费（1-2L按6张，4L按8张，6层按11张，8层按13张,10层按15张计费）
 */
export const filmFeeHandler: PriceHandler = (form, area, totalCount) => {
  // 单片面积
  const singleArea = (form.singleLength * form.singleWidth) / 10000;
  // 菲林张数
  let filmCount = 0;
  if (form.layers === 1 || form.layers === 2) filmCount = 6;
  else if (form.layers === 4) filmCount = 8;
  else if (form.layers === 6) filmCount = 11;
  else if (form.layers === 8) filmCount = 13;
  else if (form.layers === 10) filmCount = 15;
  else filmCount = form.layers + 5; // 其它层数估算

  // 区分出货方式
  let boardCount: number;
  let boardCountSource = '';
  if (form.shipmentType === 'single') {
    // 单片出货时，boardCount=totalCount，totalCount即为用户选择的单片出货总数量
    boardCount = totalCount;
    boardCountSource = 'single (totalCount)';
  } else {
    if (form.panelSet != null) {
      boardCount = form.panelSet;
      boardCountSource = 'panelSet';
    } else {
      boardCount = totalCount / (form.singleCount || 1);
      boardCountSource = 'totalCount/singleCount';
    }
  }

  // 总光绘面积
  const totalFilmArea = singleArea * filmCount * boardCount;
  let extra = 0;
  const detail: Record<string, number> = {};
  const notes: string[] = [];
  if (totalFilmArea > 0.06) {
    const fee = Math.ceil(totalFilmArea / 0.06) * 200;
    extra = fee;
    detail['filmFee'] = fee;
    notes.push(
      `Film fee: total film area ${totalFilmArea.toFixed(3)}㎡ > 0.06㎡, ceil(${totalFilmArea.toFixed(3)}/0.06)*200 = ${fee} CNY (boardCount=${boardCount}, source=${boardCountSource}, shipmentType=${form.shipmentType})`
    );
  }
  return { extra, detail, notes };
};

/**
 * 工程费加价
 * 规则：
 * 1. S≤0.5㎡，取csv表中工程费（如1层210元、2层210元、4层500元等）
 * 2. 0.5㎡<S≤3㎡，取csv表中工程费S＞0.5（如1层142元、2层142元、4层425元等）
 * 3. S>3㎡，工程费为0元
 * 只在detail/engFee体现，不累计到extra
 */
export const engFeeHandler: PriceHandler = (form, area, totalCount) => {
  // 工程费分档表
  const engFeeTable: Record<number, { engFee_0_05: number; engFee_05_3: number; engFee_3up: number }> = {
    1: { engFee_0_05: 210, engFee_05_3: 142, engFee_3up: 0 },
    2: { engFee_0_05: 210, engFee_05_3: 142, engFee_3up: 0 },
    4: { engFee_0_05: 500, engFee_05_3: 425, engFee_3up: 0 },
    6: { engFee_0_05: 850, engFee_05_3: 850, engFee_3up: 0 },
    8: { engFee_0_05: 1050, engFee_05_3: 710, engFee_3up: 0 },
    10: { engFee_0_05: 1500, engFee_05_3: 1500, engFee_3up: 0 },
    12: { engFee_0_05: 1600, engFee_05_3: 1600, engFee_3up: 0 },
    14: { engFee_0_05: 2000, engFee_05_3: 2000, engFee_3up: 0 },
    16: { engFee_0_05: 2500, engFee_05_3: 2500, engFee_3up: 0 },
    18: { engFee_0_05: 3000, engFee_05_3: 3000, engFee_3up: 0 },
    20: { engFee_0_05: 3500, engFee_05_3: 3500, engFee_3up: 0 },
  };
  const table = engFeeTable[form.layers as keyof typeof engFeeTable];
  let engFee: number | undefined = undefined;
  const notes: string[] = [];
  if (!table) {
    notes.push('This layer count is not supported for engineering fee, please contact sales for manual evaluation');
    return { extra: 0, detail: {}, notes };
  }
  if (area <= 0.5) {
    engFee = table.engFee_0_05;
    notes.push(`Engineering fee: area≤0.5㎡, engFee=${engFee}`);
  } else if (area > 0.5 && area <= 3) {
    engFee = table.engFee_05_3;
    notes.push(`Engineering fee: 0.5㎡<area≤3㎡, engFee=${engFee}`);
  } else {
    engFee = table.engFee_3up;
    notes.push('Engineering fee: area>3㎡, engFee=0');
  }
  const detail: Record<string, number> = engFee ? { engFee } : {};
  return {
    extra: engFee,
    detail,
    notes,
  };
};

/**
 * BGA加价
 * 规则：如有BGA且间距≤0.25mm（form.bga为true），整单加价50元。
 * 适用场景：高密度BGA封装对PCB工艺要求高，需额外加价。
 */
export const bgaHandler: PriceHandler = (form, area, totalCount) => {
  let extra = 0;
  const detail: Record<string, number> = {};
  const notes: string[] = [];
  if (form.bga === true) {
    extra = 50;
    detail['bga'] = 50;
    notes.push('BGA (≤0.25mm pitch): +50 CNY');
  }
  return {
    extra,
    detail,
    notes,
  };
};

/**
 * TG板材加价
 * 规则：
 * - TG150：样品单双面+80元/款，多层+100元/款，大于1㎡+60元/㎡，多层+80元/㎡。
 * - TG170：样品单双面+100元/款，多层+150元/款，大于1㎡+80元/㎡，多层+100元/㎡。
 * - 只处理TG150、TG170，TG135不加价。
 */
export const tgMaterialHandler: PriceHandler = (form, area, totalCount) => {
  let extra = 0;
  const detail: Record<string, number> = {};
  const notes: string[] = [];
  const isSample = area < 1;
  const isMultilayer = form.layers > 2;
  if (form.tg === 'TG150') {
    if (!isMultilayer) {
      extra = 80;
      detail['tgMaterial'] = 80;
      notes.push('TG150, sample single/double layer: +80 CNY');
    } else {
      extra = 100;
      detail['tgMaterial'] = 100;
      notes.push('TG150, multilayer: +100 CNY');
    }
    if (area > 1) {
      const fee = isMultilayer ? 80 * area : 60 * area;
      extra += fee;
      detail['tgMaterial_area'] = fee;
      notes.push(`TG150, area>1㎡: +${isMultilayer ? 80 : 60} CNY/㎡ × ${area.toFixed(2)} = ${fee.toFixed(2)} CNY`);
    }
  } else if (form.tg === 'TG170') {
    if (!isMultilayer) {
      extra = 100;
      detail['tgMaterial'] = 100;
      notes.push('TG170, sample single/double layer: +100 CNY');
    } else {
      extra = 150;
      detail['tgMaterial'] = 150;
      notes.push('TG170, multilayer: +150 CNY');
    }
    if (area > 1) {
      const fee = isMultilayer ? 100 * area : 80 * area;
      extra += fee;
      detail['tgMaterial_area'] = fee;
      notes.push(`TG170, area>1㎡: +${isMultilayer ? 100 : 80} CNY/㎡ × ${area.toFixed(2)} = ${fee.toFixed(2)} CNY`);
    }
  }
  return { extra, detail, notes };
};
