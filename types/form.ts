// PCB报价表单相关枚举类型

/**
 * PCB板材类型
 * 作用：决定PCB的基础材料特性，影响性能、工艺和价格。
 * 
 * 当前支持：
 * - FR4：阻燃玻璃纤维复合材料，应用最广，性价比高，适合大多数电子产品。
 * 
 * 未来扩展计划：
 * - Aluminum：铝基板，导热性好，适合LED、电源等大功率应用。
 * - Rogers：高频材料，信号损耗小，适合射频、微波等高频应用。
 * - Flex：柔性板材，可弯折，适合可穿戴设备、折叠产品等。
 * - Rigid-Flex：刚柔结合板，兼具刚性和柔性，适合复杂结构产品。
 * 
 * 注意：不同材料类型需要不同的表单字段和工艺选项，需要设计可扩展的表单架构。
 */
export enum PcbType {
  FR4 = 'FR-4', // 当前唯一支持的材料类型
}

/**
 * HDI工艺类型
 * 作用：决定PCB的高密度互连能力，影响布线密度、工艺难度和价格。
 * - none：普通板，无HDI工艺，适合常规设计。
 * - 1step/2step/3step：盲埋孔阶数，阶数越高，布线更密集，工艺更复杂，价格更高。
 */
export enum HdiType {
  None = 'None', // 普通板，工艺简单，成本低
  Step1 = '1step', // 一阶HDI，适合中高密度设计
  Step2 = '2step', // 二阶HDI，适合更高密度设计
  Step3 = '3step', // 三阶HDI，极高密度，工艺最复杂
}

/**
 * TG值（玻璃化转变温度）
 * 作用：决定PCB耐高温性能，影响可靠性和适用环境。
 * - TG170：高TG，耐热性好，适合高温环境。
 * - TG150：中等TG，适合一般工业环境。
 * - TG135：常规TG，适合普通消费电子。
 */
export enum TgType {
  TG135 = 'TG135', // 普通应用
  TG150 = 'TG150', // 工业级应用
  TG170 = 'TG170', // 高温环境首选
}

/**
 * Shipment Type
 * Determines the delivery form of PCB, affecting order quantity, panelization, and production efficiency.
 * - single: Single piece delivery, suitable for prototyping and small batches, high flexibility.
 * - panel_by_custom: Panel by custom, suitable for batch production, improves efficiency, reduces cost.
 * - panel_by_speedx: Panel by SpeedX, third-party panelization service, for special needs.
 */
export enum ShipmentType {
  Single = 'single', // Flexible, suitable for small batches
  PanelByCustom = 'panel_by_custom', // Batch production, custom panel
  PanelBySpeedx = 'panel_by_speedx', // Third-party panelization (SpeedX)
}


/**
 * Break-away Rail（工艺边）
 * 作用：用于PCB板边缘的辅助边框，便于自动化贴片、组装和分板工艺。
 * 影响：加工艺边可提升生产效率、保护PCB主体、便于分板，适用于小尺寸或异形PCB及有贴片需求的订单。
 * 注意：BreakAwayRail 是生产辅助用的"工艺边"，通常在分板后被去除，不属于成品PCB的一部分。
 * 与 EdgeCover 区别：BreakAwayRail 仅用于生产过程，EdgeCover 作用于成品PCB实际边缘。
 * true：需要Break-away Rail，适合自动化生产和特殊工艺需求。
 * false：不需要Break-away Rail，常规订单。
 */
export enum BreakAwayRail {
  None = 'None', // 无工艺边
  LeftRight = 'Left and Right', // 左右工艺边
  TopBottom = 'Top and Bottom', // 上下工艺边
  All = 'All', // 四边都有工艺边
}


/**
 * 工艺边宽度
 * 作用：决定PCB边缘工艺边的宽度，影响后续贴片、分板等工艺。
 * - 5：5mm工艺边，便于加工
 * - 10：10mm工艺边，适合大板
 */
export enum BorderType {
  Five = '5', // 5mm工艺边，便于加工
  Ten = '10', // 10mm工艺边，适合大板
}

/**
 * 工艺边切割方式
 * 作用：决定PCB工艺边的切割方式，影响分板效果和边缘质量。
 * - vcut：V型槽切割，适合直线分板，边缘平整
 * - tab：邮票孔切割，适合复杂形状分板，边缘有凸起
 * - routing：锣边切割，适合特殊形状分板，边缘较粗糙
 */
export enum BorderCutType {
  VCut = 'vcut', // V型槽切割，边缘平整
  Tab = 'tab', // 邮票孔切割，边缘有凸起
  Routing = 'routing', // 锣边切割，边缘较粗糙
}

/**
 * 铜厚（oz）
 * 作用：影响PCB的载流能力和机械强度，铜厚越大，载流能力越强，成本越高。
 * - 0.5：薄铜，适合高密度、轻载流设计。
 * - 1：常规厚度，适合大多数应用。
 * - 2/3：大电流或特殊需求，增强机械强度。
 */
export enum CopperWeight {
  One = '1', // 常规载流能力
  Two = '2', // 增强载流能力
  Three = '3', // 大电流或特殊需求
  Four = '4', // 超大电流或极特殊需求
}


export enum InnerCopperWeight {
  Half = '0.5', // 薄铜，适合高密度、轻载流设计
  One = '1', // 常规载流能力
  Two = '2', // 增强载流能力
  Three = '3', // 大电流或特殊需求
  Four = '4', // 超大电流或极特殊需求
}

/**
 * 最小线宽线距（mil）
 * 作用：决定PCB布线密度，线宽线距越小，布线越密集，工艺难度和价格越高。
 * - 6/6：常规工艺，适合大多数设计。
 * - 5/5、4/4、3.5/3.5：高密度设计，适合高端产品。
 * - 8/8、10/10：低密度，易生产，成本低。
 */
export enum MinTrace {
  SixSix = '6/6', // 常规密度
  FiveFive = '5/5', // 中高密度
  FourFour = '4/4', // 高密度
  ThreeFive = '3.5/3.5', // 极高密度
  EightEight = '8/8', // 低密度，易生产
  TenTen = '10/10', // 超低密度，成本最低
}

/**
 * 最小孔径（mm）
 * 作用：影响钻孔工艺和成本，孔径越小，工艺难度越高，适合高密度设计。
 * - 0.3：常规，适合大多数应用。
 * - 0.25/0.2/0.15：高密度设计，难度递增，价格更高。
 */
export enum MinHole {
  ZeroOneFive = '0.15', // 极高密度，工艺最难
  ZeroTwo = '0.2', // 高密度
  ZeroTwoFive = '0.25', // 中等密度
  ZeroThree = '0.3', // 常规孔径
   
 
}

// 通用 PCB 颜色定义
export enum PcbColor {
  Green = 'Green',
  MattGreen = 'Matt Green',
  Blue = 'Blue',
  Red = 'Red',
  Black = 'Black',
  MattBlack = 'Matt Black',
  White = 'White',
  Yellow = 'Yellow',
}

// 阻焊色
export enum SolderMask {
  Green = PcbColor.Green,
  MattGreen = PcbColor.MattGreen,
  Blue = PcbColor.Blue,
  Red = PcbColor.Red,
  Black = PcbColor.Black,
  MattBlack = PcbColor.MattBlack,
  White = PcbColor.White,
  Yellow = PcbColor.Yellow,

}

// 字符色（仅允许部分颜色）
export enum Silkscreen {
  White = PcbColor.White,
  Black = PcbColor.Black,
  Yellow = PcbColor.Yellow,
}

/**
 * 表面处理
 * 作用：直接影响PCB的焊接性能、耐腐蚀性、可靠性和成本，是PCB工艺选型的重要参数。
 * - hasl：热风整平（有铅/无铅），主流工艺，性价比高，适合大多数通用电子产品。焊盘表面有一定厚度，适合手工焊接，但平整度一般。
 * - leadfree：无铅热风整平，环保要求下的主流选择，适合出口、RoHS产品。
 * - enig：沉金，表面平整、耐腐蚀性好，适合BGA、细间距、对焊盘平整度要求高的高端产品。成本较高，适合高可靠性场景。
 * - osp：有机保焊，环保、平整度高，适合SMT自动化贴装，但耐腐蚀性一般，不适合多次焊接。
 * - immersion_silver：沉银，适合高频信号、对焊接性能有特殊要求的产品，易氧化，需注意储存。
 * - immersion_tin：沉锡，适合高密度、细间距产品，焊接性能好，但长期储存易变色。
 */
export enum SurfaceFinish {
  HASL = 'HASL', // 性价比高，适合通用
  LeadFree = 'Leadfree HASL', // 环保，适合出口
  Enig = 'ENIG', // 平整耐腐蚀，适合高端
  OSP = 'OSP', // 环保，适合SMT
  ImmersionSilver = 'Immersion Silver', // 高频信号，易氧化
  ImmersionTin = 'Immersion Tin', // 高密度，长期易变色
  // blueMask: 蓝胶（特殊蓝色阻焊或保护胶，特殊工艺需求）
  // holeCu25um: 孔铜25um（通孔内铜厚≥25微米，高可靠性或特殊行业标准）
}

/**
 * MaskCover - 阻焊覆盖工艺（过孔处理方式）
 * 定义阻焊对过孔的覆盖类型，影响焊盘保护、可靠性及后续工艺。
 *
 * - Tented Vias：过孔盖油。过孔被阻焊覆盖，不暴露、不填充。常用于基础保护、防止吃锡，是最常见的过孔处理方式。
 * - Opened Vias：过孔开窗。过孔不被阻焊覆盖，直接暴露。适用于需要测试、连线或散热的场景。
 * - Solder Mask Plug (IV-B)：阻焊塞孔（IV-B）。过孔用阻焊油墨从一侧或两侧塞孔后再覆盖，防止吃锡、提升平整度，常用于BGA等特殊组装需求。
 * - Non-Conductive Fill & Cap (VII)：非导电填充+盖油（VII）。过孔用非导电材料填充并阻焊覆盖，平整度和可靠性最高，适用于高密度、高可靠性或特殊工艺PCB（如BGA、CSP等埋盲孔、埋顶焊盘）。
 */
export enum MaskCover {
  /**
   * Tented Vias: Vias are covered with solder mask, not exposed or filled.
   * Typical use: General PCB, prevents solder wicking, basic protection.
   */
  TentedVias = 'Tented Vias',
  /**
   * Opened Vias: Vias are left open (exposed), no solder mask coverage.
   * Typical use: Test points, component connection, heat dissipation.
   */
  OpenedVias = 'Opened Vias',
  /**
   * Solder Mask Plug (IV-B): Vias are plugged (filled) with solder mask, then covered.
   * Typical use: Prevents solder wicking, improves flatness, BGA, special assembly.
   */
  SolderMaskPlug = 'Solder Mask Plug (IV-B)',
  /**
   * Non-Conductive Fill & Cap (VII): Vias are filled with non-conductive material and capped with solder mask.
   * Typical use: Via-in-pad, BGA, CSP, high-reliability/high-density PCB.
   */
  NonConductiveFillCap = ' Non-Conductive Fill & Cap (VII)',
}

/**
 * 测试方式
 * 作用：决定成品电气测试方式，影响可靠性和成本。
 * - none：免测，极少用，风险高。
 * - flyingProbe：飞针测试，适合小批量/打样，灵活性高，成本低。
 * - fixture：测试架，适合大批量，测试效率高，成本高。
 */
export enum TestMethod {
  None = 'None', // 免测，风险高
  FlyingProbe = '100% FPT for Batches', // 小批量，灵活
  Fixture = 'Test Fixture', // 大批量，效率高
}

/**
 * 产能确认
 * 作用：部分订单需人工或自动确认产能，影响订单处理效率。
 * - auto：自动，效率高。
 * - manual：人工，适合特殊订单。
 */
export enum ProdCap {
  Auto = 'auto', // 自动确认，效率高
  Manual = 'manual', // 人工确认，适合特殊情况
}

/**
 * 阴阳针（yypin）
 * 作用：用于特殊电气测试需求。阴阳针是一种特殊的测试探针结构，主要用于高密度或特殊结构PCB的电气测试，能够提升测试的准确性和可靠性。
 * 为什么需要：部分高端或特殊PCB产品在常规测试方式下难以保证测试覆盖率和准确性，使用阴阳针可满足更高的测试要求。
 *
 * true：需要阴阳针测试，适用于高密度或特殊结构PCB。
 * false：不需要阴阳针，常规订单。
 */
export type YYPin = boolean;

/**
 * 客户加码
 * 作用：客户定制编码需求，影响产品追溯和管理。
 * - none：不加码，常规订单。
 * - add：加码，提升追溯能力。
 * - add_pos：指定位置加码，满足特殊管理需求。
 */
export enum CustomerCode {
  None = 'None', // 常规订单
  Add = 'Add', // 加码，提升追溯
  AddPos = 'Add Pos', // 指定位置加码
}

/**
 * 付款方式
 * 作用：订单结算方式，影响订单处理流程。
 * - auto：自动，提升效率。
 * - manual：人工，适合特殊订单。
 */
export enum PayMethod {
  Auto = 'auto', // 自动结算，效率高
  Manual = 'manual', // 人工结算，特殊需求
}

/**
 * 质检附件
 * 作用：决定是否需要额外质检文件，影响交付文件内容。
 * - standard：标准，常规质检。
 * - full：全检，适合高要求订单。
 */
export enum QualityAttach {
  Standard = 'standard', // 常规质检
  Full = 'full', // 全检，要求高
}

/**
 * SMT贴片
 * true：需要贴片服务。
 * false：不需要贴片服务。
 */
export type SMT = boolean;

/**
 * 是否使用生益板材
 * true：指定使用生益品牌板材。
 * false：不指定，常规材料。
 */
export type useShengyiMaterial = boolean;

/**
 * 沉金厚度选项，仅在 surfaceFinish = 'enig' 时有效
 * 作用：决定沉金厚度，影响焊接性能、耐腐蚀性和成本。
 * - enig_1u：1微英寸，常规厚度，成本低。
 * - enig_2u：2微英寸，增强耐腐蚀性，适合高可靠性需求。
 * - enig_3u：3微英寸，最高耐腐蚀性，成本最高，适合特殊高端应用。
 */
export enum SurfaceFinishEnigType {
  Enig1u = 'ENIG 1U', // 1微英寸，常规厚度，成本低
  Enig2u = 'ENIG 2U', // 2微英寸，增强耐腐蚀性，适合高可靠性需求
  Enig3u = 'ENIG 3U', // 3微英寸，最高耐腐蚀性，成本最高，适合特殊高端应用
}


/**
 * HalfHole
 * 作用：决定PCB边缘是否有半孔，影响后续贴片、分板等工艺。
 * - none：无半孔，适合无特殊工艺需求。
 * - left：左侧有半孔，适合左侧有特殊工艺需求。
 * - right：右侧有半孔，适合右侧有特殊工艺需求。
 * - both：两侧都有半孔，适合两侧都有特殊工艺需求。
 */
export enum HalfHole {
  None = 'None',
  Left = 'Left',
  Right = 'Right',
  Both = 'Both'
}

/**
 * EdgeCover
 * 作用：决定PCB边缘是否有特殊覆盖工艺（如盖油、塞孔等），影响后续贴片、分板等工艺。
 * EdgeCover 处理的是成品PCB的实际边缘，不会被去除，是产品的一部分。
 * 常用于对PCB实际边缘进行额外保护或功能性处理，满足特殊焊接、装配、绝缘等需求。
 * 与 BreakAwayRail 区别：BreakAwayRail 是生产辅助用的工艺边，EdgeCover 是成品PCB实际边缘的特殊覆盖工艺。
 * 
 * | 字段           | 主要作用                  | 位置           | 是否成品保留 | 典型选项         |
 * |----------------|--------------------------|----------------|--------------|------------------|
 * | BreakAwayRail  | 生产辅助、分板、贴片      | PCB四周边框    | 否（分板后去除） | None, LeftRight, TopBottom, All |
 * | EdgeCover      | 边缘保护/特殊工艺         | PCB实际边缘    | 是           | None, Left, Right, Both         |
 *
 * - none：无边覆盖，适合无特殊工艺需求。
 * - left：左侧有边覆盖，适合左侧有特殊工艺需求。
 * - right：右侧有边覆盖，适合右侧有特殊工艺需求。
 * - both：两侧都有边覆盖，适合两侧都有特殊工艺需求。
 */
export enum EdgeCover {
  None = 'None',
  Left = 'Left',
  Right = 'Right',
  Both = 'Both'
}

// 产品报告类型
/**
 * 产品报告类型
 * 作用：客户可选的随货质检/生产报告类型，满足不同认证、追溯、品质需求。
 * - none：不需要任何报告，常规订单。
 * - ProductionReport：生产报告，记录生产过程、工艺参数等。
 * - MicrosectionAnalysisReport：微切片分析报告，展示PCB截面结构、层压质量等，适用于高可靠性或有认证需求的订单。
 * - ProductionFilms：生产菲林，提供生产用的底片资料，便于客户存档或复查。
 * - ImpedanceReport：阻抗测试报告，适用于有阻抗控制要求的高频/高速PCB。
 * - TestReport：测试报告，适用于有测试要求的订单。
 */
export enum ProductReport {
  None = 'None', // 不需要任何报告，常规订单
  ProductionReport = 'Production Report', // 生产报告，记录生产过程、工艺参数等
  ImpedanceReport = 'Impedance Report', // 阻抗测试报告，适用于有阻抗控制要求的订单
}

export enum WorkingGerber {
  NotRequired = 'Not Required', // 不需要工作Gerber文件
  RequireApproval = 'Require Approval', // 需要审批
}

export enum CrossOuts {
  NotAccept = 'Not Accept',
  Accept = 'Accept',
}

export enum IPCClass {
  Level2 = 'IPC Level 2 Standard',
  Level3 = 'IPC Level 3 Standard',
}

export enum IfDataConflicts {
  FollowOrder = 'Follow Order Parameters',
  FollowFiles = 'Follow Files',
  Ask = 'Ask for Confirmation',
}

/**
 * 订单状态
 * 作用：定义订单在整个生命周期中的各个状态，用于跟踪订单进度和管理。
 * 
 * 状态流转：
 * - Draft: 草稿状态，用户创建但未提交的订单
 * - Created: 已创建，订单已提交，等待审核
 * - Reviewed: 已审核，订单已通过审核，可以进入支付流程
 * - Unpaid: 未支付，订单已确认但未支付
 * - PaymentPending: 支付中，用户已发起支付但未完成
 * - PartiallyPaid: 部分支付，订单支持分期付款时的中间状态
 * - PaymentFailed: 支付失败，支付过程中出现错误
 * - PaymentCancelled: 支付已取消
 * - Paid: 已支付，订单已确认且支付完成，可以进入生产
 * - InProduction: 生产中，订单正在生产线上
 * - QualityCheck: 质检中，产品正在接受质量检查
 * - ReadyForShipment: 待发货，产品已通过质检等待发货
 * - Shipped: 已发货，产品已发出
 * - Delivered: 已送达，产品已送达客户
 * - Completed: 已完成，订单流程全部结束
 * - Cancelled: 已取消，订单被取消
 * - OnHold: 暂停，订单暂时搁置
 * - Rejected: 已拒绝，订单被拒绝
 * - Refunded: 已退款，订单已退款
 */
export enum OrderStatus {
  // 初始状态
  Draft = 'draft',
  Created = 'created', // 修改：从 Pending 改为 Created，更准确地表示订单已创建
  
  // 审核状态
  Reviewed = 'reviewed',
  
  // 支付相关状态
  Unpaid = 'unpaid',
  PaymentPending = 'payment_pending',
  PartiallyPaid = 'partially_paid',
  PaymentFailed = 'payment_failed',
  PaymentCancelled = 'payment_cancelled',
  Paid = 'paid',
  
  // 订单处理状态
  InProduction = 'in_production',
  QualityCheck = 'quality_check',
  ReadyForShipment = 'ready_for_shipment',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Completed = 'completed',
  
  // 终止状态
  Cancelled = 'cancelled',
  OnHold = 'on_hold',
  Rejected = 'rejected',
  Refunded = 'refunded'
}

/**
 * 支付状态
 * 作用：定义订单支付的状态，用于跟踪支付进度和管理。
 * 
 * 状态流转：
 * - Unpaid: 未支付，订单创建但未支付
 * - Pending: 支付中，用户已发起支付但未完成
 * - Paid: 已支付，支付已完成
 * - PartiallyPaid: 部分支付，订单支持分期付款时的中间状态
 * - Refunded: 已退款，订单已退款
 * - Failed: 支付失败，支付过程中出现错误
 * - Cancelled: 已取消，支付被取消
 */
export enum PaymentStatus {
  Unpaid = 'unpaid',
  Pending = 'pending',
  Paid = 'paid',
  PartiallyPaid = 'partially_paid',
  Refunded = 'refunded',
  Failed = 'failed',
  Cancelled = 'cancelled'
} 