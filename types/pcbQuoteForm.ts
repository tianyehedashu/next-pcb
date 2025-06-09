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

  CustomerCode,
  PayMethod,
  QualityAttach,
  SMT,

  SurfaceFinishEnigType,
  ProductReport,
  EdgeCover,
  InnerCopperWeight,
  WorkingGerber,
  CrossOuts,
  IPCClass,
  IfDataConflicts,
} from './form';
import { Address } from './address';

export interface PcbDimensions {
  length: number; // 单片长(mm)
  width: number; // 单片宽(mm)
}

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
  /**
   * 单片尺寸
   */
  singleDimensions: PcbDimensions;
  singleCount: number; // 单片出货情况下单总数量
  /**
 * 拼板行数
 */
  panelDimensions?: PanelDimensions; // 拼板尺寸 (行 x 列)
  /**
   * 拼板列数
   */
  panelSet?: number; // 连板/大板下单数量
  differentDesignsCount: number; // Number of different designs per panel (多款拼板数量)
  border?: BorderType; // 工艺边

  minTrace: MinTrace; // 最小线宽线距
  minHole: MinHole; // 最小孔径
  solderMask: SolderMask; // 阻焊色
  silkscreen: Silkscreen; // 字符色
  surfaceFinish: SurfaceFinish; // 表面处理
  /**
   * 沉金厚度，仅在 surfaceFinish = 'enig' 时有效
   * - ENIG 1U：1微英寸
   * - ENIG 2U：2微英寸
   * - ENIG 3U：3微英寸
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
  yyPin?: boolean; // 阴阳针
  customerCode?: CustomerCode; // 客户加码
  payMethod?: PayMethod; // 付款方式
  qualityAttach?: QualityAttach; // 质检附件
  smt?: SMT; // SMT贴片
  useShengyiMaterial?: boolean; // 生益板材
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


  goldFingersBevel?: boolean; // Bevel Gold Fingers（金手指斜边）
  /**
   * Outer copper weight (oz), for multilayer boards
   */
  outerCopperWeight?: CopperWeight;
  /**
   * Inner copper weight (oz), for multilayer boards
   */
  innerCopperWeight?: InnerCopperWeight;
  /**
   * Customs note (for customs declaration, optional)
   */
  customsNote?: string;
  /**
   * PCB note (for internal or production notes, optional)
   */
  pcbNote?: string;
  /**
   * User note (for user remarks, optional)
   */
  userNote?: string;
  /**
   * 收货地址
   */
  shippingAddress: Address;
  customs?: CustomsDeclaration;
    /**
   * Gerber 文件（用于前端上传展示，不参与后端存储）
   */
  gerber?: File;
  gerberUrl?: string;
  /**
   * 是否需要工作Gerber文件
   * Not Required: 不需要
   * Require Approval: 需要审批
   */
  workingGerber?: WorkingGerber;

  /**
   * 是否需要UL标识
   */
  ulMark?: boolean;
  /**
   * Cross Outs
   * - Not Accept: 不接受
   * - Accept: 接受
   */
  crossOuts?: CrossOuts;
  /**
   * IPC Class
   * - IPC Level 2 Standard
   * - IPC Level 3 Standard
   */
  ipcClass?: IPCClass;
  /**
   * If Data Conflicts
   * - Follow Order Parameters
   * - Follow Files
   * - Ask for Confirmation
   */
  ifDataConflicts?: IfDataConflicts;
  /**
   * Special Requests
   * 用户可填写PCB订单的特殊要求，5-1000字符
   */
  specialRequests?: string;
}

// 报关信息类型
export interface CustomsDeclaration {
  declarationMethod?: string;
  taxId?: string;
  personalId?: string;
  purpose?: string;
  declaredValue?: string;
  companyName?: string;
  customsNote?: string;
}

// 新增拼板尺寸类型
export interface PanelDimensions {
  row?: number; // 拼板行数
  column?: number; // 拼板列数
} 