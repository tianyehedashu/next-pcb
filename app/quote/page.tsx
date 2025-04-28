'use client';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { useState, useRef, useMemo } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { MapPin } from "lucide-react";
import { Tabs, Tab } from "@/components/ui/tabs";
import QuoteForm from "./QuoteForm";
import SectionNav from "./SectionNav";
import SideInfoPanel from "./SideInfoPanel";

function RadioGroup({ name, options, value, onChange }: any) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt: any) => (
        <button
          type="button"
          key={opt.value}
          className={`px-4 py-2 rounded-md border text-sm font-medium transition-all ${
            value === opt.value
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
          }`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function CheckboxGroup({ name, options, value, onChange }: any) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt: any) => (
        <label key={opt.value} className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={value.includes(opt.value)}
            onChange={() => {
              if (value.includes(opt.value)) {
                onChange(value.filter((v: any) => v !== opt.value));
              } else {
                onChange([...value, opt.value]);
              }
            }}
            className="accent-blue-600"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

export default function QuotePage() {
  // 表单状态
  const [form, setForm] = useState({
    pcbType: "fr4",
    layers: 2,
    thickness: "1.6",
    boardColor: "green",
    surfaceFinish: "hasl",
    copperWeight: "1",
    minTrace: "6/6",
    minHole: "0.2",
    solderMask: "green",
    silkscreen: "white",
    goldFingers: "no",
    castellated: "no",
    impedance: "no",
    flyingProbe: "no",
    quantity: 10,
    delivery: "standard",
    gerber: null as File | null,
    hdi: "none",
    tg: "TG170",
    panelCount: 1,
    shipmentType: "single",
    singleLength: "10",
    singleWidth: "10",
    singleCount: "10",
    border: "5",
    maskCover: "cover",
    edgePlating: "no",
    halfHole: "none",
    edgeCover: "none",
    testMethod: "free",
    prodCap: "auto",
    productReport: ["none"],
    rejectBoard: "accept",
    yyPin: "none",
    customerCode: "none",
    payMethod: "auto",
    qualityAttach: "standard",
    smt: "none",
  });
  const [errors, setErrors] = useState<any>({});

  // 当前分区索引
  const [activeSection, setActiveSection] = useState(0);
  const sectionRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const sectionList = [
    { label: "Basic Information" },
    { label: "Process Information" },
    { label: "Service Information" },
  ];

  // 滚动监听，自动高亮当前分区
  function handleScroll() {
    const offsets = sectionRefs.map(ref => ref.current?.getBoundingClientRect().top ?? 9999);
    const active = offsets.findIndex(offset => offset > 60);
    setActiveSection(active === -1 ? 2 : Math.max(0, active - 1));
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
  const pcbPrice = useMemo(() => {
    // 板材类型加价（FR-4为0，特殊板材加价）
    const PCB_TYPE_EXTRA: Record<string, number> = { fr4: 0, aluminum: 30, rogers: 50, flex: 40, "rigid-flex": 60 };
    // HDI工艺加价
    const HDI_EXTRA: Record<string, number> = { none: 0, "1step": 30, "2step": 50, "3step": 80 };
    // TG值加价
    const TG_EXTRA: Record<string, number> = { TG170: 0, TG150: 10, TG135: 20 };
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
    const SILK_EXTRA: Record<string, number> = { white: 0, black: 0 };
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

    // 计算面积（mm²）
    const area = Number(form.singleLength) * Number(form.singleWidth);
    // 层数
    const layers = Number(form.layers);
    // 数量
    const qty = Number(form.quantity);

    // 价格主公式：基础价+面积+层数+所有参数加价
    let price =
      20 + // 基础费用
      area * 0.05 + // 面积单价
      (layers - 2) * 8 + // 层数加价（2层起步）
      PCB_TYPE_EXTRA[form.pcbType] + // 板材类型
      HDI_EXTRA[form.hdi] + // HDI工艺
      TG_EXTRA[form.tg] + // TG值
      (Number(form.panelCount) - 1) * 5 + // 拼板数加价
      SHIPMENT_EXTRA[form.shipmentType] + // 出货方式
      BORDER_EXTRA[form.border] + // 工艺边
      (Number(form.copperWeight) - 1) * 10 + // 铜厚加价
      MINTRACE_EXTRA[form.minTrace] + // 最小线宽线距
      MINHOLE_EXTRA[form.minHole] + // 最小孔径
      COLOR_EXTRA[form.boardColor] + // 板色
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
  }, [form]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 pt-16">
      <div className="relative flex flex-row w-full min-h-[600px]">
        {/* 左侧分区导航（fixed） */}
        <aside className="hidden md:flex flex-col w-64 gap-3 fixed left-8 top-1/2 -translate-y-1/2 z-30">
          <SectionNav
            sectionList={sectionList}
            activeSection={activeSection}
            onTabChange={setActiveSection}
            sectionRefs={sectionRefs}
          />
          {/* PCB Cost Details Card */}
          <Card className="py-2">
            <CardHeader className="py-2">
              <span className="font-semibold text-sm">PCB Cost Details</span>
            </CardHeader>
            <CardContent className="py-2">
              <div className="border rounded-md bg-slate-50 text-xs text-muted-foreground mb-2 p-2">
                <div className="flex justify-between"><span>PCB Cost:</span><span>¥ {pcbPrice.toFixed(2)}</span></div>
              </div>
            </CardContent>
          </Card>
          {/* Cost Details Card 吸底 */}
          <Card className="py-2">
            <CardHeader className="py-2">
              <span className="font-semibold text-sm">Cost Details</span>
            </CardHeader>
            <CardContent className="py-2">
              <div className="border rounded-md bg-slate-50 text-xs mb-2 p-2">
                <div className="flex justify-between"><span>PCB Cost:</span><span>¥ 0.00</span></div>
                <div className="flex justify-between"><span>Shipping:</span><span>¥ 0.00</span></div>
                <div className="flex justify-between"><span>Tax:</span><span>¥ 0.00</span></div>
                <div className="flex justify-between"><span>Discount:</span><span className="text-green-600">-¥ 0.00</span></div>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Estimated Total:</span>
                <span className="text-lg font-bold text-red-600">¥ 0.00</span>
              </div>
              <div className="text-xs text-muted-foreground">For reference only, final price is subject to review.</div>
            </CardContent>
          </Card>
        </aside>
        {/* 主内容和右侧信息栏容器 */}
        <div className="flex-1 flex flex-row justify-center max-w-6xl mx-auto gap-8">
          <main className="flex-1 max-w-3xl ml-32">
            <Card>
              <CardHeader>
                <CardTitle>PCB Instant Quote</CardTitle>
              </CardHeader>
              <CardContent>
                <QuoteForm
                  form={form}
                  errors={errors}
                  setForm={setForm}
                  setErrors={setErrors}
                  sectionRefs={sectionRefs}
                />
              </CardContent>
            </Card>
          </main>
          {/* 右侧信息栏 */}
          <aside className="hidden md:block w-80">
            <SideInfoPanel />
          </aside>
        </div>
      </div>
      <Button className="w-full mt-2 text-xs" type="button">Estimate Shipping & Tax</Button>
    </div>
  );
} 