// PCB报价计算（严格参照线上报价单.csv）

// PCB报价表单类型（字段完全对齐实际表单）
export interface PcbQuoteForm {
  pcbType: string; // 板材类型
  layers: number; // 层数
  thickness: string; // 板厚
  hdi: string; // HDI工艺
  tg: string; // TG值
  shipmentType: string; // 出货方式
  singleLength: number; // 单片长(cm)
  singleWidth: number; // 单片宽(cm)
  singleCount: number; // 单片数量
  panelCount?: number; // 拼板数
  border?: string; // 工艺边
  copperWeight: string; // 铜厚
  minTrace: string; // 最小线宽线距
  minHole: string; // 最小孔径
  solderMask: string; // 阻焊色
  silkscreen: string; // 字符色
  surfaceFinish: string; // 表面处理
  impedance: string; // 阻抗控制
  castellated: string; // 半孔
  goldFingers: string; // 金手指
  edgePlating: string; // 边镀金
  halfHole?: string; // 半孔数量
  edgeCover?: string; // 边覆盖
  maskCover?: string; // 阻焊覆盖
  flyingProbe?: string; // 飞针测试
  testMethod?: string; // 测试方式
  prodCap?: string; // 产能确认
  productReport?: string[]; // 产品报告
  rejectBoard?: string; // 不良板
  yyPin?: string; // 阴阳针
  customerCode?: string; // 客户加码
  payMethod?: string; // 付款方式
  qualityAttach?: string; // 质检附件
  smt?: string; // SMT贴片
  syMaterial?: string; // 生益板材
  holeCount?: number; // 钻孔数
  bga?: string; // BGA≤0.25mm
}

/**
 * PCB报价主函数
 * @param form PCB报价表单
 * @returns 价格明细和总价
 */
export function calcPcbPriceV2(form: PcbQuoteForm): {
  total: number;
  detail: Record<string, number>;
  minOrderQty: number;
  leadTime: string;
  notes: string[];
} {
  // 1. 计算面积（平方米）
  const area = (form.singleLength * form.singleWidth) / 10000 * form.singleCount; // cm²转m²

  // 2. 层数主表
  const baseTable: Record<number, {
    engFee: number;
    samplePack: number | string;
    priceSteps: [number, number | string][]; // [面积上限, 单价]
    minOrderQty: number;
    leadTime: string[];
  }> = {
    1: { engFee: 180, samplePack: 300, priceSteps: [[0.2, 300], [0.5, 510], [1, 450], [3, 400], [5, 340], [10, 280], [30, 290], [Infinity, 280]], minOrderQty: 1, leadTime: ["5", "6", "7", "8", "10", "12", ">=15"] },
    2: { engFee: 210, samplePack: 300, priceSteps: [[0.2, 330], [0.5, 560], [1, 510], [3, 470], [5, 440], [10, 400], [30, 370], [Infinity, 320]], minOrderQty: 1, leadTime: ["5", "6", "7", "9", "11", "13", ">=15"] },
    4: { engFee: 500, samplePack: 610, priceSteps: [[0.2, 610], [0.5, 850], [1, 810], [3, 770], [5, 730], [10, 630], [30, 560], [Infinity, 540]], minOrderQty: 1, leadTime: ["7", "8", "9", "11", "13", "15", ">=17"] },
    6: { engFee: 1100, samplePack: 1100, priceSteps: [[0.2, 1300], [0.5, 1300], [1, 1200], [3, 1150], [5, 1100], [10, 1000], [30, 950], [Infinity, 930]], minOrderQty: 1, leadTime: ["9", "10", "11", "13", "15", "17", "20"] },
    8: { engFee: 1350, samplePack: 1350, priceSteps: [[0.2, 1500], [0.5, 2000], [1, 1900], [3, 1900], [5, 1700], [10, 1700], [30, 1700], [Infinity, 1600]], minOrderQty: 5, leadTime: ["10", "11", "12", "14", "16", "18", "21"] },
    10: { engFee: 1000, samplePack: 2200, priceSteps: [[0.2, 2500], [0.5, 2500], [1, 2500], [3, 2400], [5, 2400], [10, 2300], [30, 2000], [Infinity, 1850]], minOrderQty: 5, leadTime: ["11", "11", "13", "15", "17", "18", "22"] },
    12: { engFee: 1600, samplePack: 2600, priceSteps: [[0.2, 2600], [0.5, 2600], [1, 2600], [3, 2500], [5, 2500], [10, 2400], [30, 2200], [Infinity, 2100]], minOrderQty: 5, leadTime: ["12", "12", "14", "16", "18", "19", "25"] },
    14: { engFee: 2000, samplePack: 3150, priceSteps: [[0.2, 4000], [0.5, 4000], [1, 4000], [3, 3800], [5, 3600], [10, 3600], [30, 3400], [Infinity, 3400]], minOrderQty: 5, leadTime: ["13", "13", "15", "17", "19", "20", "28"] },
    16: { engFee: 2500, samplePack: 3750, priceSteps: [[0.2, 4500], [0.5, 4500], [1, 4500], [3, 4300], [5, 4300], [10, 4300], [30, 4200], [Infinity, 4100]], minOrderQty: 5, leadTime: ["15", "15", "17", "19", "21", "22", "30"] },
    18: { engFee: 3000, samplePack: 4200, priceSteps: [[0.2, 5500], [0.5, 5500], [1, 5500], [3, 5300], [5, 5000], [10, 5000], [30, 4800], [Infinity, 4600]], minOrderQty: 5, leadTime: ["17", "17", "19", "21", "23", "24", "32"] },
    20: { engFee: 3500, samplePack: 4800, priceSteps: [[0.2, 6500], [0.5, 6500], [1, 6500], [3, 6200], [5, 6000], [10, 6000], [30, 5800], [Infinity, 5700]], minOrderQty: 5, leadTime: ["18", "18", "20", "22", "24", "25", "34"] },
  };

  // 3. 匹配层数主表
  const table = baseTable[form.layers as keyof typeof baseTable];
  if (!table) {
    return {
      total: 0,
      detail: {},
      minOrderQty: 0,
      leadTime: '',
      notes: ['暂不支持该层数报价，请联系业务人工评估']
    };
  }

  // 4. 匹配面积区间
  let basePrice = 0;
  let priceDetail: Record<string, number> = {};
  let notes: string[] = [];
  let minOrderQty = table.minOrderQty;
  let leadTime = '';
  let found = false;
  for (let i = 0; i < table.priceSteps.length; i++) {
    const [maxArea, price] = table.priceSteps[i];
    if (area <= maxArea) {
      if (typeof price === 'string') {
        notes.push(String(price));
        basePrice = 0;
      } else {
        basePrice = price;
        priceDetail['basePrice'] = basePrice;
      }
      leadTime = table.leadTime[i] || '';
      found = true;
      break;
    }
  }
  if (!found) {
    notes.push('面积超出报价范围，请联系业务评估');
  }

  // 5. 工程费
  priceDetail['engFee'] = table.engFee;

  // 6. 特殊工艺加价
  let extra = 0;
  // 板材类型加价
  if (form.pcbType === 'aluminum') { extra += 30; priceDetail['pcbType'] = 30; }
  if (form.pcbType === 'rogers') { extra += 50; priceDetail['pcbType'] = 50; }
  if (form.pcbType === 'flex') { extra += 40; priceDetail['pcbType'] = 40; }
  if (form.pcbType === 'rigid-flex') { extra += 60; priceDetail['pcbType'] = 60; }
  // 出货方式加价
  if (form.shipmentType === 'panel') { extra += 10; priceDetail['shipmentType'] = 10; }
  if (form.shipmentType === 'panel_agent') { extra += 20; priceDetail['shipmentType'] = 20; }
  // 工艺边加价
  if (form.border === 'none') { extra += 10; priceDetail['border'] = 10; }
  // 字符色加价（如有规则可补充）
  // 边镀金加价
  if (form.edgePlating === 'yes') { extra += 20; priceDetail['edgePlating'] = 20; }
  // 半孔/金属包边加价
  if (form.castellated === 'yes' || (form.halfHole && form.halfHole !== 'none')) { extra += 100; priceDetail['castellated'] = 100; }
  // 边覆盖加价
  if (form.edgeCover && form.edgeCover !== 'none') { extra += 20; priceDetail['edgeCover'] = 20; }
  // 阻焊覆盖加价
  if (form.maskCover && ['plug', 'plug_flat'].includes(form.maskCover)) { extra += 10; priceDetail['maskCover'] = 10; }
  // 飞针测试加价
  if (form.flyingProbe === 'yes') { extra += 10; priceDetail['flyingProbe'] = 10; }
  // 测试方式加价
  if (form.testMethod === 'paid') { extra += 10; priceDetail['testMethod'] = 10; }
  // 产能确认加价
  if (form.prodCap === 'manual') { extra += 10; priceDetail['prodCap'] = 10; }
  // 不良板加价
  if (form.rejectBoard === 'reject') { extra += 10; priceDetail['rejectBoard'] = 10; }
  // 阴阳针加价
  if (form.yyPin === 'need') { extra += 10; priceDetail['yyPin'] = 10; }
  // 客户加码加价
  if (form.customerCode === 'add') { extra += 10; priceDetail['customerCode'] = 10; }
  if (form.customerCode === 'add_pos') { extra += 15; priceDetail['customerCode'] = 15; }
  // 付款方式加价
  if (form.payMethod === 'manual') { extra += 5; priceDetail['payMethod'] = 5; }
  // 质检附件加价
  if (form.qualityAttach === 'full') { extra += 20; priceDetail['qualityAttach'] = 20; }
  // SMT贴片加价
  if (form.smt === 'need') { extra += 50; priceDetail['smt'] = 50; }
  // 生益板材加价
  if (form.syMaterial === 'sy') { extra += 80; priceDetail['syMaterial'] = 80; }
  if (form.syMaterial === 'sy_tg150') { extra += 120; priceDetail['syMaterial'] = 120; }
  if (form.syMaterial === 'sy_tg170') { extra += 150; priceDetail['syMaterial'] = 150; }
  // 钻孔数/孔密度加价
  if (form.holeCount && form.holeCount > 100000) { extra += Math.ceil((form.holeCount - 100000) / 10000) * 10 * area; priceDetail['holeCount'] = Math.ceil((form.holeCount - 100000) / 10000) * 10 * area; }
  if (form.minHole === '0.15' && form.holeCount && form.holeCount > 10000) { extra += Math.ceil((form.holeCount - 10000) / 10000) * 30 * area; priceDetail['holeCount_015'] = Math.ceil((form.holeCount - 10000) / 10000) * 30 * area; }
  // BGA≤0.25mm加价
  if (form.bga === 'yes') { extra += 0.15 * (basePrice + table.engFee + extra); priceDetail['bga'] = 0.15 * (basePrice + table.engFee + extra); }
  // 拼板类型/打叉板加价
  if (form.panelCount && form.panelCount > 1) {
    if (form.panelCount <= 10) { extra += 0.1 * (basePrice + table.engFee + extra); priceDetail['panelCount_extra'] = 0.1 * (basePrice + table.engFee + extra); }
    else if (form.panelCount <= 20) { extra += 0.2 * (basePrice + table.engFee + extra); priceDetail['panelCount_extra'] = 0.2 * (basePrice + table.engFee + extra); }
    else if (form.panelCount <= 30) { extra += 0.3 * (basePrice + table.engFee + extra); priceDetail['panelCount_extra'] = 0.3 * (basePrice + table.engFee + extra); }
  }
  // 板厚区间细分加价
  if (parseFloat(form.thickness) > 1.6) {
    const add = Math.ceil((parseFloat(form.thickness) - 1.6) / 0.4) * (form.layers <= 2 ? 100 : 80) * Math.max(1, area);
    extra += add; priceDetail['thickness_extra'] = add;
  }
  // 其它评估/特殊说明
  if ((form.layers <= 2 && form.minTrace && ['3.5/3.5','3/3'].includes(form.minTrace)) || (form.layers >= 4 && form.minTrace && ['3/3','2/2'].includes(form.minTrace))) {
    notes.push('小于标准线宽线距需评估');
  }
  if (form.minHole === '0.15') { notes.push('0.15mm孔径需评估'); }
  if (form.goldFingers === 'yes') { notes.push('金手指需先评审资料'); }
  if (form.hdi && form.hdi !== 'none') { notes.push('盲埋孔交期加2天'); }
  if (form.surfaceFinish === 'immersion_silver') { notes.push('沉银交期加2天'); }
  if (form.surfaceFinish === 'immersion_tin') { notes.push('沉锡交期加2天'); }
  if (form.copperWeight === '3') { notes.push('3OZ铜厚样品交期加2天'); }
  if (form.copperWeight === '4') { notes.push('4OZ铜厚样品交期加3天'); }
  if (form.thickness === '0.2' || form.thickness === '0.4') { notes.push('0.2-0.4mm样板+300元/款'); }
  // 7. 总价（基础价+工程费+特殊工艺加价）
  let total = basePrice + table.engFee + extra;

  return {
    total,
    detail: priceDetail,
    minOrderQty,
    leadTime,
    notes
  };
}

// 详细实现请参考docs/pcb-pricing-v2.md 