// PCB报价表单类型定义（含详细注释）
import {
  PcbType,
  HdiType,
  TgType,
  ShipmentType,
  BorderType,
  CopperWeight,
  MinTrace,
  MinHole,
  SolderMask,
  Silkscreen,
  SurfaceFinish,
  MaskCover,
  TestMethod,
  ProdCap,
  YYPin,
  CustomerCode,
  PayMethod,
  QualityAttach,
  SMT,
  useShengyiMaterial,
  SurfaceFinishEnigType,
  ProductReport,
  EdgeCover,
} from './form';

/**
 * PCB报价表单类型（字段完全对齐实际表单）
 */
export interface PcbQuoteForm {
  pcbType: PcbType; // 板材类型
  layers: number; // 层数
  /**
   * 板厚（单位mm）
   */
  thickness: number; // 板厚（单位mm）
  hdi: HdiType; // HDI工艺
  tg: TgType; // TG值
  shipmentType: ShipmentType; // 出货方式
  singleLength: number; // 单片长(cm)
  singleWidth: number; // 单片宽(cm)
  singleCount: number; // 单片出货情况下单总数量
    /**
   * 拼板行数
   */
    panelRow?: number;
    /**
     * 拼板列数
     */
    panelColumn?: number;

  panelSet?: number; // 连板/大板下单数量
  differentDesignsCount?: number; // Number of different designs per panel (多款拼板数量)
  border?: BorderType; // 工艺边
  copperWeight: CopperWeight; // 铜厚
  minTrace: MinTrace; // 最小线宽线距
  minHole: MinHole; // 最小孔径
  solderMask: SolderMask; // 阻焊色
  silkscreen: Silkscreen; // 字符色
  surfaceFinish: SurfaceFinish; // 表面处理
  /**
   * 沉金厚度，仅在 surfaceFinish = 'enig' 时有效
   * - enig_1u：1微英寸
   * - enig_2u：2微英寸
   * - enig_3u：3微英寸
   */
  surfaceFinishEnigType?: SurfaceFinishEnigType;
  impedance: boolean; // 阻抗控制
  castellated: boolean; // 半孔
  goldFingers: boolean; // 金手指
  edgePlating: boolean; // 边镀金
  halfHole?: string; // 半孔数量（如需更细致可后续enum）
  edgeCover?: EdgeCover; // 边覆盖（如需更细致可后续enum）
  maskCover?: MaskCover; // 阻焊覆盖
  testMethod?: TestMethod; // 测试方式
  productReport?: ProductReport[]; // 支持多选
  isRejectBoard?: boolean; // 不良板（是否不接受打叉板）
  yyPin?: YYPin; // 阴阳针
  customerCode?: CustomerCode; // 客户加码
  payMethod?: PayMethod; // 付款方式
  qualityAttach?: QualityAttach; // 质检附件
  smt?: SMT; // SMT贴片
  useShengyiMaterial?: useShengyiMaterial; // 生益板材
  holeCount?: number; // 钻孔数
  /**
   * BGA≤0.25mm
   * 是否包含球间距小于等于0.25mm的BGA（Ball Grid Array，球栅阵列封装）器件。
   * 为什么需要：超细间距BGA对PCB制造精度、工艺控制要求极高，生产难度和成本显著提升。
   * 典型场景：高密度、高性能芯片（如高端CPU、FPGA、移动SoC等）常采用细间距BGA封装。
   * true：设计中包含间距≤0.25mm的BGA，需要特殊工艺。
   * false/未填写：无此类BGA，标准工艺即可。
   */
  bga?: boolean;
  prodCap?: ProdCap; // 产能确认
 
  /**
   * 孔铜25um
   * 是否需要通孔内铜厚≥25微米，适用于高可靠性或特殊行业标准。
   * true：需要孔铜25um。
   * false/未填写：不需要。
   */
  holeCu25um?: boolean;
  /**
   * Gerber 文件（用于前端上传展示，不参与后端存储）
   */
  gerber?: File;

} 