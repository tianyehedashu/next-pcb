// PCB报价计算（严格参照线上报价单.csv）

import {
  PriceHandler,
  basePriceHandler,
  pcbTypeHandler,
  filmFeeHandler,
  engFeeHandler, // 工程费
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
  rejectBoardHandler, // 不良板
  blueMaskHandler, // 蓝胶
  holeCu25umHandler
} from './priceHandlers';
import type { PcbQuoteForm } from '../types/pcbQuoteForm';

// 计算总数和面积（平方米）
function getTotalCountAndArea(form: PcbQuoteForm): { totalCount: number; area: number } {
  let totalCount = form.singleCount;
  if (form.shipmentType === 'panel' || form.shipmentType === 'panel_agent') {
    totalCount = (form.panelRow || 1) * (form.panelColumn || 1) * (form.panelSet || 0);
  }
  const area = (form.singleLength * form.singleWidth * totalCount) / 10000;
  return { totalCount, area };
}

export function initContext(form: PcbQuoteForm): { form: PcbQuoteForm; area: number; totalCount: number } {
  const { totalCount, area } = getTotalCountAndArea(form);
  return { form, area, totalCount };
}

// =================== 主流程 ===================
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
    engFeeHandler, // 工程费
    basePriceHandler, // 基础价格
    pcbTypeHandler, // 板材类型
    filmFeeHandler, // 菲林费
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
    rejectBoardHandler, 
    // ...如有其它handler继续补充...
  ];
  for (const handler of handlers) {
    const result = handler(ctxForm, area, totalCount);
    extra += result.extra || 0;
    detail = { ...detail, ...(result.detail || {}) };
    notes = [...notes, ...(result.notes || [])];
  }
  // 计算总价、合并明细与备注
  const total = + extra;
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
