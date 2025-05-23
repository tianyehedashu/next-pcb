// PCB报价表单类型定义（含详细注释）
import { z } from "zod";
import { SurfaceFinishEnigType, WorkingGerber } from "@/types/form";
import { ULMark, CrossOuts, IPCClass, IfDataConflicts } from "@/types/form";

/**
 * PCB报价表单类型（字段完全对齐实际表单）
 */
export const pcbQuoteFormSchema = z.object({
  // Basic Information
  pcbType: z.enum(["fr4"]).default("fr4").describe("Board Type"),
  layers: z.number().default(2).describe("Layers"),
  thickness: z.number().default(1.6).describe("Thickness"),
  hdi: z.enum(["none", "1step", "2step", "3step"]).default("none").describe("HDI"),
  tg: z.enum(["TG135", "TG150", "TG170"]).default("TG135").describe("TG"),
  singleLength: z.number().default(10).describe("Single Length (cm)"),
  singleWidth: z.number().default(10).describe("Single Width (cm)"),
  singleCount: z.number().optional().describe("Single Count"),
  shipmentType: z.enum(["single", "panel", "panel_agent"]).default("single").describe("Shipment Type"),
  panelRow: z.number().optional().describe("Panel Rows"),
  panelColumn: z.number().optional().describe("Panel Columns"),
  panelSet: z.number().optional().describe("Panel Set"),
  differentDesignsCount: z.number().optional().describe("Different Designs Count"),
  border: z.enum(["none", "5", "10"]).optional().describe("Break-away Rail"),

  // Process Information
  copperWeight: z.enum(["1", "2", "3"]).default("1").describe("Copper Weight"),
  minTrace: z.enum(["6/6", "5/5", "4/4", "3.5/3.5", "8/8", "10/10"]).default("6/6").describe("Min Trace/Space"),
  minHole: z.enum(["0.3", "0.25", "0.2", "0.15"]).default("0.3").describe("Min Hole"),
  solderMask: z.enum(["green", "blue", "red", "black", "white", "yellow"]).default("green").describe("Solder Mask"),
  silkscreen: z.enum(["white", "black", "green"]).default("white").describe("Silkscreen"),
  surfaceFinish: z.enum(["hasl", "leadfree", "enig", "osp", "immersion_silver", "immersion_tin"]).default("hasl").describe("Surface Finish"),
  surfaceFinishEnigType: z.nativeEnum(SurfaceFinishEnigType).optional().describe("ENIG Thickness"),
  impedance: z.boolean().default(false).describe("Impedance"),
  castellated: z.boolean().default(false).describe("Castellated"),
  goldFingers: z.boolean().default(false).describe("Gold Fingers"),
  edgePlating: z.boolean().default(false).describe("Edge Plating"),
  halfHole: z.string().optional().describe("Half Hole"),
  edgeCover: z.string().optional().describe("Edge Cover"),
  maskCover: z.enum(["cover", "plug", "plug_flat"]).optional().describe("Mask Cover"),
  testMethod: z.enum(["none", "flyingProbe", "fixture"]).optional().describe("Test Method"),

  // Service Information
  productReport: z.array(z.string()).optional().describe("Product Report"),
  isRejectBoard: z.boolean().optional().describe("Reject Board"),
  yyPin: z.boolean().optional().describe("YY Pin"),
  customerCode: z.enum(["none", "add", "add_pos"]).optional().describe("Customer Code"),
  payMethod: z.enum(["auto", "manual"]).optional().describe("Pay Method"),
  qualityAttach: z.enum(["standard", "full"]).optional().describe("Quality Attach"),
  smt: z.boolean().optional().describe("SMT"),
  useShengyiMaterial: z.boolean().optional().describe("Shengyi Material"),
  holeCount: z.number().optional().describe("Hole Count"),
  bga: z.boolean().optional().describe("BGA"),
  prodCap: z.enum(["auto", "manual"]).optional().describe("Production Capacity"),
  blueMask: z.boolean().optional().describe("Blue Mask"),
  holeCu25um: z.boolean().optional().describe("Hole Cu 25um"),
  gerber: z.any().optional().describe("Gerber"),
  workingGerber: z.nativeEnum(WorkingGerber).optional().describe("Working Gerber"),

  // Shipping Information
  ulMark: z.nativeEnum(ULMark).optional().describe("UL Mark"),
  crossOuts: z.nativeEnum(CrossOuts).optional().describe("Cross Outs"),
  ipcClass: z.nativeEnum(IPCClass).optional().describe("IPC Class"),
  ifDataConflicts: z.nativeEnum(IfDataConflicts).optional().describe("If Data Conflicts"),

  specialRequests: z.string().min(5).max(1000).optional().describe("Special Requests"),
});

export type PcbQuoteForm = z.infer<typeof pcbQuoteFormSchema>; 