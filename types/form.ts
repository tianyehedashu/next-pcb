// PCB报价表单相关枚举类型

/**
 * 板材类型
 * 作用：决定PCB的基材属性，直接影响工艺选择、价格、交期、可靠性等。
 * - fr4：最常用的玻璃纤维板，性价比高，适合绝大多数应用。
 * - aluminum：铝基板，散热性能好，常用于LED照明、功率器件等高发热场景。
 * - rogers：高频板，介电性能优异，适合射频/微波等高端应用，价格较高。
 * - flex：柔性板，可弯折，适合可穿戴、连接器等空间受限或需动态弯折场景。
 * - rigid-flex：刚挠结合板，兼具刚性和柔性，适合高集成度、复杂结构产品。
 */
export enum PcbType {
  FR4 = 'fr4' // 适用范围广，性价比高
  // Aluminum = 'aluminum', // 散热好，适合高功率
  // Rogers = 'rogers', // 高频性能优异，价格高
  // Flex = 'flex', // 可弯折，适合动态应用
  // RigidFlex = 'rigid-flex', // 刚柔结合，适合复杂结构
}

/**
 * HDI工艺类型
 * 作用：决定PCB的高密度互连能力，影响布线密度、工艺难度和价格。
 * - none：普通板，无HDI工艺，适合常规设计。
 * - 1step/2step/3step：盲埋孔阶数，阶数越高，布线更密集，工艺更复杂，价格更高。
 */
export enum HdiType {
  None = 'none', // 普通板，工艺简单，成本低
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
 * 出货方式
 * 作用：决定PCB交付形态，影响下单数量、拼板方式、生产效率。
 * - single：单片出货，适合打样、小批量，灵活性高。
 * - panel：拼板出货，适合批量生产，提高生产效率，降低成本。
 * - panel_agent：代理拼板，第三方拼板服务，适合特殊需求。
 */
export enum ShipmentType {
  Single = 'single', // 灵活，适合小批量
  Panel = 'panel', // 降低成本，适合量产
 
}

/**
 * 工艺边宽度
 * 作用：决定PCB边缘是否有工艺边，影响后续贴片、分板等工艺。
 * - none：无工艺边，适合无特殊工艺需求。
 * - 5/10：5mm/10mm工艺边，便于贴片、分板等。
 */
export enum BorderType {
  None = 'none', // 无工艺边，节省材料
  Five = '5', // 5mm工艺边，便于加工
  Ten = '10', // 10mm工艺边，适合大板
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

/**
 * 阻焊色
 * 作用：决定PCB外观和部分性能，不同颜色影响美观、识别和部分工艺。
 * - green：最常用，工艺成熟，成本低。
 * - blue/red/black/white/yellow：特殊需求或美观，部分颜色可能影响检测。
 */
export enum SolderMask {
  Green = 'green', // 工艺成熟，成本低
  Blue = 'blue', // 美观，特殊需求
  Red = 'red', // 美观，特殊需求
  Black = 'black', // 美观，特殊需求
  White = 'white', // 美观，特殊需求
  Yellow = 'yellow', // 美观，特殊需求
}

/**
 * 字符色
 * 作用：丝印颜色，影响可读性和外观。
 * - white：常规，易读。
 * - black：特殊需求，适合深色阻焊。
 */
export enum Silkscreen {
  White = 'white', // 易读，常规
  Black = 'black', // 适合深色阻焊
  Yellow = 'yellow', // 美观，特殊需求
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
  Enig = 'Enig', // 平整耐腐蚀，适合高端
  OSP = 'OSP', // 环保，适合SMT
  ImmersionSilver = 'Immersion Silver', // 高频信号，易氧化
  ImmersionTin = 'Immersion Tin', // 高密度，长期易变色
  // blueMask: 蓝胶（特殊蓝色阻焊或保护胶，特殊工艺需求）
  // holeCu25um: 孔铜25um（通孔内铜厚≥25微米，高可靠性或特殊行业标准）
}

/**
 * 阻焊覆盖工艺
 * 作用：决定阻焊覆盖方式，影响焊盘保护和后续工艺。
 * - cover：盖油，常规保护。
 * - plug：塞孔，保护孔内焊盘。
 * - plug_flat：塞平，表面更平整，适合特殊工艺。
 */
export enum MaskCover {
  Cover = 'cover', // 常规保护
  Plug = 'plug', // 孔内保护
  PlugFlat = 'plug_flat', // 表面平整，特殊需求
}

/**
 * 测试方式
 * 作用：决定成品电气测试方式，影响可靠性和成本。
 * - none：免测，极少用，风险高。
 * - flyingProbe：飞针测试，适合小批量/打样，灵活性高，成本低。
 * - fixture：测试架，适合大批量，测试效率高，成本高。
 */
export enum TestMethod {
  None = 'none', // 免测，风险高
  FlyingProbe = 'flyingProbe', // 小批量，灵活
  Fixture = 'fixture', // 大批量，效率高
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
  None = 'none', // 常规订单
  Add = 'add', // 加码，提升追溯
  AddPos = 'add_pos', // 指定位置加码
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
export type SurfaceFinishEnigType = 'enig_1u' | 'enig_2u' | 'enig_3u'; // 1u/2u/3u分别对应不同厚度和可靠性

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
  None = 'none', // 无工艺边
  LeftRight = 'left_right', // 左右工艺边
  TopBottom = 'top_bottom', // 上下工艺边
  All = 'all', // 四边都有工艺边
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
  None = 'none',
  Left = 'left',
  Right = 'right',
  Both = 'both'
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
  None = 'none',
  Left = 'left',
  Right = 'right',
  Both = 'both'
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
  None = 'none', // 不需要任何报告，常规订单
  ProductionReport = 'Production Report', // 生产报告，记录生产过程、工艺参数等
  MicrosectionAnalysisReport = 'Microsection Analysis Report', // 微切片分析报告，展示PCB截面结构、层压质量等
  ProductionFilms = 'Production Films', // 生产菲林，提供生产用底片资料
  ImpedanceReport = 'impedanceReport', // 阻抗测试报告，适用于有阻抗控制要求的订单
  TestReport = 'testReport', // 测试报告，适用于有测试要求的订单
} 