// PCB报价计算（严格参照线上报价单.csv）

import { ShipmentType, CrossOuts } from '@/types/form';
import {
  PriceHandler,
  basePriceHandler,
  pcbTypeHandler,
  edgePlatingHandler, // 边镀金
  castellatedHandler, // 半孔/金属包边
  edgeCoverHandler, // 边覆盖
  maskCoverHandler, // 阻焊覆盖
  prodCapHandler, // 产能确认
  yyPinHandler, // 阴阳针
  customerCodeHandler, // 客户加码
  payMethodHandler, // 付款方式
  qualityAttachHandler, // 质检附件
  smtHandler, // SMT贴片
  syMaterialHandler, // 生益板材
  tgMaterialHandler, // TG板材
  holeCountHandler, // 钻孔数
  holeCount015Handler, // 0.15mm孔加价
  // solderMaskHandler, // 阻焊色
  silkscreenHandler, // 字符色
  surfaceFinishHandler, // 表面处理
  impedanceHandler, // 阻抗
  goldFingersHandler, // 金手指
  testMethodHandler, // 测试方式
  productReportHandler, // 产品报告

  blueMaskHandler, // 蓝胶
  holeCu25umHandler,
  filmFeeHandler,
  engFeeHandler,
  copperWeightHandler, // 外层铜厚
  multilayerCopperWeightHandler,
  traceHandler,
  drillAndThicknessHandler, // 内层铜厚 
} from './priceHandlers';
import type { PcbQuoteForm } from '../types/pcbQuoteForm';
import { calculateTotalPcbArea } from './utils/precision';

// 计算总数和面积（平方米）
function getTotalCountAndArea(form: PcbQuoteForm): { totalCount: number; area: number } {
  let totalCount = 0;
  if (form.shipmentType === ShipmentType.PanelByCustom) {
    totalCount = (form.panelDimensions?.row || 1) * (form.panelDimensions?.column || 1) * (form.panelSet || 0);
  } else if (form.shipmentType === ShipmentType.PanelBySpeedx) {
    totalCount = form.panelSet || 0;
  } else if (form.shipmentType === ShipmentType.Single) {
    totalCount = form.singleCount || 0;
  }
  const { totalArea } = calculateTotalPcbArea(form);
  return { totalCount, area: totalArea };
}

export function initContext(form: PcbQuoteForm): { form: PcbQuoteForm; area: number; totalCount: number } {
  const { totalCount, area } = getTotalCountAndArea(form);
  return { form, area, totalCount };
}

// =================== 主流程 ===================
// 拼板加成逻辑封装
function getPanelAddPercent(differentDesignsCount: number | undefined): { percent: number, note: string | null } {
  const df = differentDesignsCount || 1;
  if(df < 1) return { percent: 0, note: '拼板数量<1，不加价' };
  if (df < 10) return { percent: 0.1, note: '拼板数量<10，基础工艺价加10%（不含工程费和菲林费）' };
  if (df < 20) return { percent: 0.2, note: '拼板数量10-19，基础工艺价加20%（不含工程费和菲林费）' };
  if (df < 30) return { percent: 0.3, note: '拼板数量20-29，基础工艺价加30%（不含工程费和菲林费）' };
  return { percent: 0, note: null };
}

export function calcPcbPriceV2(form: PcbQuoteForm): {
  total: number;
  detail: Record<string, number>;
  minOrderQty: number;
  leadTime: string;
  notes: string[];
  totalCount: number;
} {
  // 初始化
  const { form: ctxForm, area, totalCount } = initContext(form);
  if (!totalCount || totalCount <= 0) {
    return {
      total: 0,
      detail: {},
      minOrderQty: 0,
      leadTime: '',
      notes: ['Quantity is 0, no price calculated.'],
      totalCount: 0
    };
  }
  let extra = 0;
  let detail: Record<string, number> = {};
  let notes: string[] = [];
  const handlers: PriceHandler[] = [
    basePriceHandler, // 基础价格
    pcbTypeHandler, // 板材类型

    edgePlatingHandler, // 边镀金
    castellatedHandler, // 半孔/金属包边
    edgeCoverHandler, // 边覆盖
    maskCoverHandler, // 阻焊覆盖
    prodCapHandler, // 产能确认
    yyPinHandler, // 阴阳针
    customerCodeHandler, // 客户加码
    payMethodHandler, // 付款方式
    qualityAttachHandler, // 质检附件
    smtHandler, // SMT贴片
    syMaterialHandler, // 生益板材
    tgMaterialHandler, // TG板材
    holeCountHandler, // 钻孔数
    holeCount015Handler, // 0.15mm孔加价

    // solderMaskHandler, // 阻焊色
    silkscreenHandler, // 字符色
    surfaceFinishHandler, // 表面处理
    impedanceHandler, // 阻抗
    goldFingersHandler, // 金手指
    testMethodHandler, // 测试方式
    productReportHandler, // 产品报告
// 不良板
    blueMaskHandler, // 蓝胶
    holeCu25umHandler, // 孔铜25um
    copperWeightHandler, // 外层铜厚
    multilayerCopperWeightHandler, // 内层铜厚
    traceHandler, // 线宽线距
    drillAndThicknessHandler, // 最小线宽线距

    // ...如有其它handler继续补充...
  ];
  for (const handler of handlers) {
    const result = handler(ctxForm, area, totalCount);
    extra += result.extra || 0;
    detail = { ...detail, ...(result.detail || {}) };
    notes = [...notes, ...(result.notes || [])];
  }
  // 计算总价、合并明细与备注
  // engFeeHandler, // 工程费
  // filmFeeHandler, // 菲林费
  // 1. 只遍历普通 handlers
let subtotal = extra;


// 2. 单独计算工程费和菲林费
const engFeeResult = engFeeHandler(ctxForm, area, totalCount);
const filmFeeResult = filmFeeHandler(ctxForm);
let addPercent = 0;
if (ctxForm.crossOuts === CrossOuts.Accept) {
  const { percent, note } = getPanelAddPercent(ctxForm.differentDesignsCount);
  addPercent = percent;
  if (note) notes.push(note);
}

// 3. 处理"打叉板"加成（只对 subtotal 部分）

subtotal = subtotal * (1 + addPercent);

// 4. 计算总价
const total = subtotal + (engFeeResult.extra || 0) + (filmFeeResult.extra || 0);

detail = { ...detail, ...(engFeeResult.detail || {}), ...(filmFeeResult.detail || {}) };
notes = [...notes, ...(engFeeResult.notes || []), ...(filmFeeResult.notes || [])];
  return {
    total,
    detail,
    minOrderQty: Number(detail.minOrderQty) || 0,
    leadTime: String(detail.leadTime || ''),
    notes,
    totalCount
  };
}

// 详细实现请参考docs/pcb-pricing-v2.md 

// 计算总数量 (根据出货方式)
export function calcTotalCount(form: PcbQuoteForm): number {
  if (form.shipmentType === 'single') {
    return form.singleCount || 0;
  } else if (form.shipmentType === 'panel') {
    return (form.panelDimensions?.row || 1) * (form.panelDimensions?.column || 1) * (form.panelSet || 0);
  }
  return 0;
}
