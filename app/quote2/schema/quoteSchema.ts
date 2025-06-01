import { z } from "zod";
import { 
  PcbType, HdiType, TgType, ShipmentType, BorderType,
  CopperWeight, InnerCopperWeight, MinTrace, MinHole, SolderMask, Silkscreen, 
  SurfaceFinish, SurfaceFinishEnigType, MaskCover, TestMethod,
  ProductReport,
  WorkingGerber, CrossOuts, IPCClass, IfDataConflicts,
  EdgeCover
} from "./shared-types";

// 尺寸对象校验
const dimensionsSchema = z.object({
  length: z.number().positive("Length must be positive").max(100, "Length too large").default(5),
  width: z.number().positive("Width must be positive").max(100, "Width too large").default(5),
});

// 拼板尺寸校验
const panelDimensionsSchema = z.object({
  row: z.number().int().min(1, "Row must be at least 1").max(20, "Row too large").default(1),
  column: z.number().int().min(1, "Column must be at least 1").max(20, "Column too large").default(1),
});

// 地址校验 - 允许初始为空，提交时验证
const addressSchema = z.object({
  country: z.string().default(""),
  state: z.string().optional().default(""),
  city: z.string().default(""),
  address: z.string().default(""),
  zipCode: z.string().default(""),
  phone: z.string().optional().default(""),
  contactName: z.string().default(""),
});

// 报关信息校验
const customsDeclarationSchema = z.object({
  declarationMethod: z.string().optional().default(""),
  taxId: z.string().optional().default(""),
  personalId: z.string().optional().default(""),
  purpose: z.string().optional().default(""),
  declaredValue: z.string().optional().default(""),
  companyName: z.string().optional().default(""),
  customsNote: z.string().max(500, "Customs note too long").optional().default(""),
});

export const quoteSchema = z.object({
  // === Basic Information ===
  pcbType: z.nativeEnum(PcbType, { required_error: "Material type is required" }).default(PcbType.FR4),
  layers: z.number().int().min(1, "Layers must be at least 1").max(20, "Max 20 layers").default(2),
  thickness: z.number().positive("Thickness must be positive").min(0.1).max(10).default(1.6),
  hdi: z.nativeEnum(HdiType).optional().default(HdiType.None),
  tg: z.nativeEnum(TgType, { required_error: "TG rating is required" }).default(TgType.TG135),
  shipmentType: z.nativeEnum(ShipmentType, { required_error: "Board type is required" }).default(ShipmentType.Single),
  singleDimensions: dimensionsSchema.default({ length: 5, width: 5 }),
  singleCount: z.number().int().min(0,"Single count  cannot be negative").default(0),
  panelDimensions: panelDimensionsSchema.optional().default({ row: 1, column: 1 }),
  panelSet: z.number().int().min(0, "Panel set cannot be negative").optional().default(0),
  differentDesignsCount: z.number().int().min(1, "Must have at least 1 design").max(100).default(1),
  border: z.nativeEnum(BorderType).default(BorderType.None),
  useShengyiMaterial: z.boolean().default(false),
  pcbNote: z.string().max(1000, "PCB note too long").optional().default(""),

  // === Process Information ===
  outerCopperWeight: z.nativeEnum(CopperWeight, { required_error: "Outer copper weight is required" }).default(CopperWeight.One),
  innerCopperWeight: z.nativeEnum(InnerCopperWeight).default(InnerCopperWeight.Half),
  minTrace: z.nativeEnum(MinTrace, { required_error: "Min trace/space is required" }).default(MinTrace.SixSix),
  minHole: z.nativeEnum(MinHole, { required_error: "Min hole is required" }).default(MinHole.ZeroTwo),
  solderMask: z.nativeEnum(SolderMask, { required_error: "Solder mask is required" }).default(SolderMask.Green),
  silkscreen: z.nativeEnum(Silkscreen, { required_error: "Silk screen is required" }).default(Silkscreen.White),
  surfaceFinish: z.nativeEnum(SurfaceFinish, { required_error: "Surface finish is required" }).default(SurfaceFinish.HASL),
  surfaceFinishEnigType: z.nativeEnum(SurfaceFinishEnigType).optional().default(SurfaceFinishEnigType.Enig1u),
  impedance: z.boolean().default(false),
  castellated: z.boolean().default(false),
  goldFingers: z.boolean().default(false),
  goldFingersBevel: z.boolean().default(false),
  edgePlating: z.boolean().default(false),
  halfHole: z.string().optional().default(""),
  edgeCover: z.nativeEnum(EdgeCover).optional().default(EdgeCover.None),
  maskCover: z.nativeEnum(MaskCover).default(MaskCover.TentedVias),
  bga: z.boolean().default(false),
  holeCu25um: z.boolean().default(false),
  blueMask: z.boolean().default(false),
  holeCount: z.number().int().min(0, "Hole count cannot be negative").optional(),

  // === Service Information ===
  testMethod: z.nativeEnum(TestMethod).default(TestMethod.FlyingProbe),
  productReport: z.array(z.nativeEnum(ProductReport)).optional().default([ProductReport.None]),
  rejectBoard: z.boolean().default(false),

  workingGerber: z.nativeEnum(WorkingGerber).optional().default(WorkingGerber.NotRequired),
  ulMark: z.boolean().default(false),
  crossOuts: z.nativeEnum(CrossOuts).optional().default(CrossOuts.NotAccept),
  ipcClass: z.nativeEnum(IPCClass).optional().default(IPCClass.Level2),
  ifDataConflicts: z.nativeEnum(IfDataConflicts).optional().default(IfDataConflicts.FollowOrder),
  specialRequests: z.string().max(1000, "Special requests cannot exceed 1000 characters").optional().default(""),

  // === File Upload ===
  gerber: z.any().optional(),
  gerberUrl: z.string().url("Invalid gerber URL").or(z.literal("")).optional().default(""),

  // === Shipping & Notes ===
  shippingAddress: addressSchema.default({
    country: "",
    state: "",
    city: "",
    address: "",
    zipCode: "",
    phone: "",
    contactName: "",
  }),
  customs: customsDeclarationSchema.optional(),
  customsNote: z.string().max(500, "Customs note too long").optional().default(""),
  userNote: z.string().max(1000, "User note too long").optional().default(""),
}).refine((data) => {
  // 条件校验：如果是拼板出货，必须有 panelDimensions 和 panelSet
  if (data.shipmentType === ShipmentType.Panel) {
    return data.panelDimensions && data.panelSet;
  }
  return true;
}, {
  message: "Panel dimensions and panel set are required when shipment type is panel",
  path: ["panelDimensions"],
}).refine((data) => {
  // 条件校验：如果选择了金手指，且 goldFingersBevel 为 true，则必须有 goldFingers
  if (data.goldFingersBevel && !data.goldFingers) {
    return false;
  }
  return true;
}, {
  message: "Gold fingers must be enabled when gold fingers bevel is selected",
  path: ["goldFingersBevel"],
}).refine((data) => {
  // 条件校验：如果表面处理是 ENIG，必须选择 ENIG 厚度
  if (data.surfaceFinish === SurfaceFinish.Enig && !data.surfaceFinishEnigType) {
    return false;
  }
  return true;
}, {
  message: "ENIG thickness is required when surface finish is ENIG",
  path: ["surfaceFinishEnigType"],
}).refine((data) => {
  // 条件校验：如果层数>=4，内层铜厚是必须的
  if (data.layers >= 4 && !data.innerCopperWeight) {
    return false;
  }
  return true;
}, {
  message: "Inner copper weight is required for layers >= 4",
  path: ["innerCopperWeight"],
}).refine((data) => {
  // 条件校验：如果选择了半孔，必须填写半孔数量
  if (data.castellated && !data.halfHole) {
    return false;
  }
  return true;
}, {
  message: "Half hole count is required when castellated holes is selected",
  path: ["halfHole"],
}).refine((data) => {
  // 条件校验：如果选择了边缘镀金，必须选择边缘覆盖方式
  if (data.edgePlating && !data.edgeCover) {
    return false;
  }
  return true;
}, {
  message: "Edge cover is required when edge plating is selected",
  path: ["edgeCover"],
});

// 提交时的严格验证 schema
export const quoteSubmitSchema = quoteSchema.refine((data) => {
  // 提交时地址信息必须完整
  const addr = data.shippingAddress;
  return addr.country.length > 0 && addr.city.length > 0 && 
         addr.address.length > 0 && addr.zipCode.length > 0 && 
         addr.contactName.length > 0;
}, {
  message: "Shipping address is required for submission",
  path: ["shippingAddress"],
}).refine((data) => {
  // 提交时：如果是单片出货，必须有 singleCount
  if (data.shipmentType === ShipmentType.Single && (!data.singleCount || data.singleCount <= 0)) {
    return false;
  }
  return true;
}, {
  message: "Single count is required when shipment type is single",
  path: ["singleCount"],
});

export type QuoteFormData = z.infer<typeof quoteSchema>; 