// PCB生产周期相关通用函数

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
  let d = new Date(start);
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (!isHoliday(d)) left--;
  }
  return d;
}

/**
 * 自动计算PCB生产周期（Production Cycle）
 * - 更细致考虑表面处理、铜厚、线宽、拼板、特殊色等
 * - 对加急、HDI等做更灵活处理
 */
export function calcProductionCycle(form: any, orderTime: Date = new Date()): { cycleDays: number, reason: string[] } {
  let baseDays = 1; // 2层FR-4常规板基准1天
  const reason: string[] = [];

  // 1. 层数
  if (form.layers > 2) {
    const extra = Math.ceil((form.layers - 2) / 2);
    baseDays += extra;
    reason.push(`Layers: +${extra} day(s) for ${form.layers} layers`);
  }

  // 2. 板材
  if (form.pcbType && form.pcbType !== "fr4") {
    baseDays += 1;
    reason.push(`Material: +1 day for ${form.pcbType}`);
  }

  // 3. 铜厚
  if (Number(form.copperWeight) > 2) {
    baseDays += 1;
    reason.push("Copper weight >2oz: +1 day");
  }

  // 4. 表面处理
  if (["enig", "immersion_silver", "immersion_tin"].includes(form.surfaceFinish)) {
    baseDays += 1;
    reason.push(`Surface finish (${form.surfaceFinish}): +1 day`);
  }

  // 5. 最小线宽/孔径
  if (["4/4", "3.5/3.5"].includes(form.minTrace)) {
    baseDays += 1;
    reason.push("Min trace/spacing ≤4mil: +1 day");
  }
  if (["0.2", "0.15"].includes(form.minHole)) {
    baseDays += 1;
    reason.push("Min hole ≤0.2mm: +1 day");
  }

  // 6. 板色/阻焊色

  // 7. 拼板/Panel
  if (Number(form.panelCount) > 1) {
    baseDays += 1;
    reason.push("Multiple panels: +1 day");
  }

  // 8. 面积/数量
  const area = Number(form.singleLength) * Number(form.singleWidth) * Number(form.quantity);
  if (area > 100000) {
    baseDays += 1;
    reason.push("Large area/quantity: +1 day");
  }
  if (Number(form.quantity) > 1000) {
    baseDays += 1;
    reason.push("Large batch (>1000): +1 day");
  }

  // 9. 特殊工艺
  if (form.hdi && form.hdi !== "none") {
    if (form.hdi === "1step") {
      baseDays += 1;
      reason.push("HDI 1step: +1 day");
    } else {
      baseDays += 2;
      reason.push("HDI 2step/3step: +2 days");
    }
  }
  if (form.goldFingers === "yes") {
    baseDays += 1;
    reason.push("Gold fingers: +1 day");
  }
  if (form.impedance === "yes") {
    baseDays += 1;
    reason.push("Impedance control: +1 day");
  }
  if (form.edgePlating === "yes") {
    baseDays += 1;
    reason.push("Edge plating: +1 day");
  }
  if (form.castellated === "yes") {
    baseDays += 1;
    reason.push("Castellated holes: +1 day");
  }
  if (form.smt === "need") {
    baseDays += 2;
    reason.push("SMT assembly: +2 days");
  }
  if (form.flyingProbe === "yes") {
    baseDays += 1;
    reason.push("Flying probe test: +1 day");
  }

  // 10. 服务类特殊项
  if (form.qualityAttach === "full") {
    baseDays += 1;
    reason.push("Full quality inspection: +1 day");
  }
  if (form.productReport && Array.isArray(form.productReport) && form.productReport.some((v: string) => v !== "none")) {
    baseDays += 1;
    reason.push("Product report: +1 day");
  }

  // 11. 加急服务
  if (form.delivery === "urgent") {
    // 允许最多-2天，但最快1天
    baseDays = Math.max(1, baseDays - 2);
    reason.push("Urgent: -2 days");
  }

  // 12. 下单时间
  const cutoffHour = 20; // 行业部分工厂20:00前可排产
  if (orderTime.getHours() >= cutoffHour) {
    baseDays += 1;
    reason.push("Order after 20:00: +1 day");
  }

  // 13. 节假日/周末（可选扩展，暂不实现）

  return { cycleDays: baseDays, reason };
}


/**
   * PCB全字段报价公式说明：
   * 
   * 1. 设计思路：
   *    - 参考PCBWay/JLCPCB等主流PCB打样网站的计价规则，结合实际工厂报价经验。
   *    - 将所有表单字段（基础信息、工艺信息、服务信息）全部纳入计价，做到"全字段参与"。
   *    - 每个字段的加价项均以对象表的形式维护，便于后续灵活调整和扩展。
   *    - 公式结构清晰，便于维护和理解。
   * 
   * 2. 为什么这样做：
   *    - 行业主流报价系统均为"参数化计价"，即每个参数（如层数、板材、表面处理、特殊工艺等）都有独立加价项。
   *    - 这样做可以让前端预估价格与工厂实际价格高度接近，提升用户体验。
   *    - 便于后续根据业务需求灵活调整每一项加价，无需大幅重构。
   *    - 代码可读性强，方便团队协作和后期维护。
   * 
   * 3. 是否有更好的方式：
   *    - 对于大型/复杂项目，建议将所有加价规则抽离为独立的"计价配置文件"或"计价服务"，实现前后端统一。
   *    - 也可以将所有加价项、折扣等维护在数据库，由运营/产品动态配置，前端只负责展示。
   *    - 若需支持多币种/多地区/多工厂，可将公式参数化，按需切换。
   *    - 进一步可将每项加价明细展示给用户，提升透明度。
   * 
   * 4. 当前实现优点：
   *    - 适合中小型PCB打样/小批量平台，前端即可实现较为准确的价格预估。
   *    - 维护成本低，扩展性强。
   *    - 便于A/B测试不同计价策略。
   * 
   * 5. 后续建议：
   *    - 若业务量大、需求复杂，建议将计价逻辑后端化，前端仅展示。
   *    - 可增加"明细弹窗"展示每项加价来源，提升用户信任。
   */
  // 全字段参与的PCB报价公式
/**
 * PCB全字段参与的报价公式
 * @param form 报价表单对象
 * @returns 价格（number）
 */
export function calcPcbPrice(form: any): number {
  // 板材类型加价（FR-4为0，特殊板材加价）
  const PCB_TYPE_EXTRA: Record<string, number> = { fr4: 0, aluminum: 30, rogers: 50, flex: 40, "rigid-flex": 60 };
  // HDI工艺加价
  const HDI_EXTRA: Record<string, number> = { none: 0, "1step": 30, "2step": 50, "3step": 80 };
  // TG值加价
  const TG_EXTRA: Record<string, number> = { TG170: 0, TG150: 10, TG130: 20 };
  // 出货方式加价
  const SHIPMENT_EXTRA: Record<string, number> = { single: 0, panel: 10, panel_agent: 20 };
  // 工艺边加价
  const BORDER_EXTRA: Record<string, number> = { none: 10, "5": 0, "10": 0 };
  // 最小线宽线距加价
  const MINTRACE_EXTRA: Record<string, number> = { "6/6": 0, "5/5": 10, "4/4": 20, "3.5/3.5": 30, "8/8": 0, "10/10": 0 };
  // 最小孔径加价
  const MINHOLE_EXTRA: Record<string, number> = { "0.3": 0, "0.25": 10, "0.2": 15, "0.15": 20 };
  // 表面处理加价
  const SURFACE_EXTRA: Record<string, number> = { hasl: 0, leadfree: 10, enig: 15, osp: 5, immersion_silver: 10, immersion_tin: 10 };
  // 板色/阻焊色加价
  const COLOR_EXTRA: Record<string, number> = { green: 0, blue: 5, red: 5, black: 5, white: 5, yellow: 5 };
  // 字符色加价
  const SILK_EXTRA: Record<string, number> = { white: 0, black: 0, green: 0 };
  // 阻抗控制加价
  const IMPEDANCE_EXTRA = (v: string) => v === "yes" ? 20 : 0;
  // 半孔加价
  const CASTELLATED_EXTRA = (v: string) => v === "yes" ? 10 : 0;
  // 金手指加价
  const GOLDFINGER_EXTRA = (v: string) => v === "yes" ? 20 : 0;
  // 边镀金加价
  const EDGEPLATING_EXTRA = (v: string) => v === "yes" ? 20 : 0;
  // 半孔数量加价（每侧5元）
  const HALFHOLLE_EXTRA = (v: string) => v && v !== "none" ? 5 * (parseInt(v) || 1) : 0;
  // 边覆盖数量加价（每侧5元）
  const EDGECOVER_EXTRA = (v: string) => v && v !== "none" ? 5 * (parseInt(v) || 1) : 0;
  // 阻焊覆盖特殊工艺加价
  const MASKCOVER_EXTRA = (v: string) => ["plug", "plug_flat"].includes(v) ? 10 : 0;
  // 飞针测试加价
  const FLYINGPROBE_EXTRA = (v: string) => v === "yes" ? 10 : 0;
  // 测试方式加价
  const TESTMETHOD_EXTRA = (v: string) => v === "paid" ? 10 : 0;
  // 产能确认加价
  const PRODCAP_EXTRA = (v: string) => v === "manual" ? 10 : 0;
  // 产品报告加价（每项5元）
  const PRODUCTREPORT_EXTRA = (arr: string[]) => arr?.filter(i => i !== "none").length * 5;
  // 不良板处理加价
  const REJECTBOARD_EXTRA = (v: string) => v === "reject" ? 10 : 0;
  // 阴阳针加价
  const YYPIN_EXTRA = (v: string) => v === "need" ? 10 : 0;
  // 客户加码加价
  const CUSTOMERCODE_EXTRA = (v: string) => v === "add" ? 10 : v === "add_pos" ? 15 : 0;
  // 付款方式加价
  const PAYMETHOD_EXTRA = (v: string) => v === "manual" ? 5 : 0;
  // 质检附件加价
  const QUALITYATTACH_EXTRA = (v: string) => v === "full" ? 20 : 0;
  // SMT贴片加价
  const SMT_EXTRA = (v: string) => v === "need" ? 50 : 0;

  // 优化：根据出货形式动态计算数量和面积
  let qty = 1;
  let area = 0;
  if (form.shipmentType === 'single') {
    qty = Number(form.singleCount) || 1;
    area = Number(form.singleLength) * Number(form.singleWidth) || 0;
  } else if (form.shipmentType === 'panel' || form.shipmentType === 'panel_agent') {
    qty = Number(form.singleCount) || 1; // 这里singleCount表示Set数
    area = Number(form.singleLength) * Number(form.singleWidth) || 0; // 联片尺寸
    // 若有panelSetCount字段，表示每Set包含多少单片
    if (form.panelSetCount) {
      qty = qty * Number(form.panelSetCount);
    }
  }

  // 价格主公式：基础价+面积+层数+所有参数加价
  let price =
    20 + // 基础费用
    area * 0.05 + // 面积单价
    (Number(form.layers) - 2) * 8 + // 层数加价（2层起步）
    PCB_TYPE_EXTRA[form.pcbType] + // 板材类型
    HDI_EXTRA[form.hdi] + // HDI工艺
    TG_EXTRA[form.tg] + // TG值
    (Number(form.panelCount) - 1) * 5 + // 拼板数加价
    SHIPMENT_EXTRA[form.shipmentType] + // 出货方式
    BORDER_EXTRA[form.border] + // 工艺边
    (Number(form.copperWeight) - 1) * 10 + // 铜厚加价
    MINTRACE_EXTRA[form.minTrace] + // 最小线宽线距
    MINHOLE_EXTRA[form.minHole] + // 最小孔径
    COLOR_EXTRA[form.solderMask] + // 阻焊色
    SILK_EXTRA[form.silkscreen] + // 字符色
    SURFACE_EXTRA[form.surfaceFinish] + // 表面处理
    IMPEDANCE_EXTRA(form.impedance) + // 阻抗控制
    CASTELLATED_EXTRA(form.castellated) + // 半孔
    GOLDFINGER_EXTRA(form.goldFingers) + // 金手指
    EDGEPLATING_EXTRA(form.edgePlating) + // 边镀金
    HALFHOLLE_EXTRA(form.halfHole) + // 半孔数量
    EDGECOVER_EXTRA(form.edgeCover) + // 边覆盖
    MASKCOVER_EXTRA(form.maskCover) + // 阻焊覆盖
    FLYINGPROBE_EXTRA(form.flyingProbe) + // 飞针测试
    TESTMETHOD_EXTRA(form.testMethod) + // 测试方式
    PRODCAP_EXTRA(form.prodCap) + // 产能确认
    PRODUCTREPORT_EXTRA(form.productReport) + // 产品报告
    REJECTBOARD_EXTRA(form.rejectBoard) + // 不良板
    YYPIN_EXTRA(form.yyPin) + // 阴阳针
    CUSTOMERCODE_EXTRA(form.customerCode) + // 客户加码
    PAYMETHOD_EXTRA(form.payMethod) + // 付款方式
    QUALITYATTACH_EXTRA(form.qualityAttach) + // 质检附件
    SMT_EXTRA(form.smt); // SMT贴片

  // 数量折扣（批量越大单价越低）
  let discount = 1;
  if (qty >= 1000) discount = 0.8;
  else if (qty >= 500) discount = 0.85;
  else if (qty >= 100) discount = 0.9;
  else if (qty >= 50) discount = 0.95;

  // 总价=单价*数量*折扣，最低价保护
  price = price * qty * discount;
  if (price < 30) price = 30;
  return price;
} 