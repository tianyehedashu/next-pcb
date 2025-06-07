// PCB 表单字段规则配置
// 可扩展：依赖、校验、自动修正、加价等

import { createForm } from '@formily/core';
import type { PcbQuoteForm } from '../types/pcbQuoteForm';
import { TestMethod, CustomerCode, SurfaceFinish, TgType, PcbType, HdiType, ShipmentType, BorderType, CopperWeight, MaskCover, Silkscreen, ProdCap, PayMethod, QualityAttach, ProductReport, EdgeCover, InnerCopperWeight, SurfaceFinishEnigType, WorkingGerber, CrossOuts, IPCClass, IfDataConflicts, PcbColor } from '../types/form';

export type ComponentType = 'Select' | 'Input' | 'Checkbox' | 'NumberInput' | 'DimensionsInput' | 'PanelDimensionsInput' | 'TextArea' | 'Radio';

export type PCBFieldRule<T = unknown> = {
  label: string;
  component: ComponentType;
  options: T[] | ((form: PcbQuoteForm & { area?: number }) => T[]);
  default: T | ((form: PcbQuoteForm & { area?: number }) => T);
  required: boolean;
  shouldShow?: (form: PcbQuoteForm) => boolean;
  shouldDisable?: (form: PcbQuoteForm & { area?: number }) => boolean;
  dependencies?: (keyof PcbQuoteForm)[];
  unit?: string;
  optionUnit?: (v: T) => string | undefined;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  trueLabel?: string;
  falseLabel?: string;
  [key: string]: unknown;
};

// 自动生成产品报告 options 和 optionLabels
const productReportOptions = [ProductReport.None, ProductReport.ProductionReport, ProductReport.ImpedanceReport];
const productReportOptionLabels: Record<string, string> = {
  [ProductReport.None]: 'Not Required',
  [ProductReport.ProductionReport]: 'Production Report',
  [ProductReport.ImpedanceReport]: 'Impedance Report',
};

export const pcbFieldRules: Record<string, PCBFieldRule> = {
  pcbType: {
    label: 'Material Type',
    component: 'Select',
    options: Object.values(PcbType),
    default: PcbType.FR4,
    required: true,
    price: { fr4: 0 },
    shouldDisable: () => false,
  },
  layers: {
    label: 'Layers',
    component: 'Select',
    options: [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
    default: 2,
    required: true,
    shouldDisable: () => false,
  },
  outerCopperWeight: {
    label: 'Outer Copper Weight',
    component: 'Select',
    options: Object.values(CopperWeight),
    default: CopperWeight.One,
    required: true,
    shouldDisable: () => false,
    unit: 'oz',
  },
  innerCopperWeight: {
    label: 'Inner Copper Weight',
    component: 'Select',
    options: Object.values(InnerCopperWeight),
    default: InnerCopperWeight.Half,
    required: true,
    shouldShow: (form: PcbQuoteForm) => (form.layers ?? 2) >= 4,
    shouldDisable: (form: PcbQuoteForm) => (form.layers ?? 2) < 4,
    unit: 'oz',
  },
  thickness: {
    label: 'Thickness',
    component: 'Select',
    options: (form: PcbQuoteForm) => {
      const all = [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.6, 2.0, 2.4, 3.0, 3.2];
      let filtered = all;
      const layers = form.layers ?? 2;
      const outer = form.outerCopperWeight;
      const inner = (layers >= 4) ? form.innerCopperWeight : undefined;

      // 层数限制
      if (layers >= 16) {
        filtered = filtered.filter(v => v >= 2);
      } else if (layers === 4) {
        filtered = filtered.filter(v => [0.6, 0.8, 1.0, 1.2, 1.6, 2.0,2.4].includes(v));
      } else if (layers === 6) {
        filtered = filtered.filter(v => [0.8, 1.0, 1.2, 1.6, 2.0,2.4].includes(v));
      } else if (layers >= 12) {
        filtered = filtered.filter(v => v >= 1.6);
      } else if (layers >= 10) {
        filtered = filtered.filter(v => v >= 1.2);
      } else if (layers >= 8) {
        filtered = filtered.filter(v => v > 0.8);
      }

      // 铜厚限制 - 先处理特殊情况，再处理一般情况
      // 业务特殊限制：铜厚=2OZ时，2L/4L/6L 仅允许0.8mm及以上
      if ((outer === '2' || inner === '2') && [2, 4, 6].includes(layers)) {
        filtered = filtered.filter(v => v >= 0.8);
      } else if (outer === '2' || inner === '2') {
        // 其他情况下，铜厚=2OZ时需要1.2mm及以上
        filtered = filtered.filter(v => v >= 1.2);
      }

      if (outer === '3' || inner === '3') {
        if (layers >= 8) {
          filtered = filtered.filter(v => v >= 2.0);
        } else {
          filtered = filtered.filter(v => v >= 1.6);
        }
      }

      // 铜厚=4OZ时，4L及以上仅允许1.6mm及以上
      if ((outer === '4' || inner === '4') && layers >= 4) {
        filtered = filtered.filter(v => v >= 1.6);
      }

      return filtered;
    },
    default: (form: PcbQuoteForm) => {
      const opts = typeof pcbFieldRules.thickness.options === 'function'
        ? pcbFieldRules.thickness.options(form)
        : pcbFieldRules.thickness.options;
      const layers = form.layers ?? 2;
      // 如果当前值在可选项内，直接返回当前值
      if (opts.includes(form.thickness)) {
        return form.thickness;
      }
      // 否则按推荐逻辑给默认值
      if (layers === 18 || layers === 20) {
        return opts.includes(2.4) ? 2.4 : opts[0];
      } else if (layers === 16) {
        return opts.includes(2.0) ? 2.0 : opts[0];
      } else if (layers < 16) {
        return opts.includes(1.6) ? 1.6 : opts[0];
      }
      return opts[0];
    },
    required: true,
    dependencies: ['layers', 'outerCopperWeight', 'innerCopperWeight'],
    shouldDisable: () => false,
    unit: 'mm',
  },
  hdi: {
    label: 'HDI',
    component: 'Select',
    options: Object.values(HdiType),
    default: 'none',
    required: true,
    shouldShow: (form: PcbQuoteForm) => (form.layers ?? 2) >= 4,
  },
  tg: {
    label: 'TG',
    component: 'Select',
    options: Object.values(TgType),
    default: TgType.TG135,
    required: true,
  },
  shipmentType: {
    label: 'Board Type',
    component: 'Radio',
    options: Object.values(ShipmentType),
    default: 'single',
    required: true,
    shouldShow: (form: PcbQuoteForm) => form.shipmentType === 'panel_by_custom' || form.shipmentType === 'panel_by_speedx',
  },
  border: {
    label: 'Break-away Rail',
    component: 'Select',
    options: Object.values(BorderType),
    default: BorderType.None,
    required: false,
    unit: 'mm',
    optionUnit: (v: unknown) => v === BorderType.None ? undefined : 'mm',
  },
  minTrace: {
    label: 'Min Trace/Space',
    component: 'Select',
    options: (form: PcbQuoteForm) => {
      const layers = form.layers ?? 2;
      // 层数可选范围
      let layerOptions: string[] = [];
      if (layers === 1 || layers === 2) {
        layerOptions = ['6/6', '5/5', '4/4', '3.5/3.5', '8/8', '10/10'];
      } else if (layers === 4) {
        layerOptions = ['6/6', '5/5', '4/4', '3.5/3.5', '8/8', '10/10'];
      } else if (layers >= 6) {
        layerOptions = ['6/6', '5/5', '4/4', '3.5/3.5', '8/8', '10/10'];
      } else {
        layerOptions = ['6/6', '5/5', '4/4', '3.5/3.5', '8/8', '10/10'];
      }

      // 铜厚下限
      const outer = form.outerCopperWeight;
      const inner = layers >= 4 ? form.innerCopperWeight : undefined;
      const allOptions = ['3.5/3.5', '4/4', '5/5', '6/6', '8/8', '10/10'];
      let minIndex = 0;
      const copperList = [outer, inner].filter(Boolean).map(String);
      let maxCopper = '1';
      if (copperList.includes('4')) maxCopper = '4';
      else if (copperList.includes('3')) maxCopper = '3';
      else if (copperList.includes('2')) maxCopper = '2';
      if (maxCopper === '2') minIndex = allOptions.indexOf('6/6');
      else if (maxCopper === '3' || maxCopper === '4') minIndex = allOptions.indexOf('10/10');
      else minIndex = allOptions.indexOf('3.5/3.5');
      const copperOptions = allOptions.slice(minIndex);

      // 取交集，始终返回 string[]
      return layerOptions.filter(opt => copperOptions.includes(opt));
    },
    default: (form: PcbQuoteForm) => {
      // 默认值逻辑：优先取 options 的第一个
      const opts = typeof pcbFieldRules.minTrace.options === 'function'
        ? pcbFieldRules.minTrace.options(form)
        : pcbFieldRules.minTrace.options;
      if (opts.includes(form.minTrace)) {
        return form.minTrace;
      }
      return opts[0];
    },
    required: true,
    dependencies: ['layers', 'outerCopperWeight', 'innerCopperWeight'],
    shouldDisable: () => false,
    unit: 'mil',
  },
  minHole: {
    label: 'Min Hole',
    component: 'Select',
    options: (form: PcbQuoteForm) => {
      const layers = form.layers ?? 2;
      const thickness = form.thickness ?? 1.6;
      if (layers === 1) {
        return ['0.3'];
      } else if (layers === 2) {
        if (thickness >= 1.6) {
          return ['0.2', '0.25', '0.3'];
        } else {
          return ['0.15', '0.2', '0.25', '0.3'];
        }
      } else if (layers === 4) {
        return ['0.15', '0.2', '0.25', '0.3'];
      } else if (layers === 6 || layers === 8 || layers >= 10) {
        return ['0.15', '0.2', '0.25', '0.3'];
      }
      return ['0.15', '0.2', '0.25', '0.3'];
    },
    default: (form: PcbQuoteForm) => {
      const layers = form.layers ?? 2;
      const thickness = form.thickness ?? 1.6;
      if (layers === 1) return '0.3';
      if (layers === 2 && thickness < 1.6) return '0.3';
      if (layers === 2 && thickness >= 1.6) return '0.3';
      if (layers === 4) return '0.3';
      if (layers >= 6) return '0.3';
      return '0.3';
    },
    required: true,
    dependencies: ['layers', 'thickness'],
    shouldDisable: (form: PcbQuoteForm) => {
      const layers = form.layers ?? 2;
      const thickness = form.thickness ?? 1.6;
      const minHole = form.minHole as string;
      if (layers === 1 && minHole !== '0.3') return true;
      if (layers === 2 && thickness >= 1.6 && minHole === '0.15') return true;
      if (layers === 2 && thickness >= 1.6 && parseFloat(minHole) < 0.2) return true;
      if (layers === 2 && thickness < 1.6 && parseFloat(minHole) < 0.15) return true;
      if (layers === 4 && parseFloat(minHole) < 0.15) return true;
      if ((layers === 6 || layers === 8 || layers >= 10) && parseFloat(minHole) < 0.15) return true;
      return false;
    },
    unit: 'mm',
  },
  solderMask: {
    label: 'Solder Mask',
    component: 'Select',
    options: Object.values(PcbColor),
    default: PcbColor.Green,
    required: true,
  },
  silkscreen: {
    label: 'Silk Screen',
    component: 'Select',
    options: (form: PcbQuoteForm) => {
      const maskShouldDisableBlack: string[] = [
        PcbColor.Black,
        PcbColor.MattBlack,
        PcbColor.Blue,
        PcbColor.Red,
      ];
      const mask = String(form.solderMask);
      let opts = Object.values(Silkscreen);
      // 禁止同色
      opts = opts.filter(silk => String(silk) !== mask);
      // 指定阻焊色时禁用black字符色
      if (maskShouldDisableBlack.includes(mask)) {
        opts = opts.filter(silk => silk !== Silkscreen.Black);
      }
      return opts;
    },
    default: (form: PcbQuoteForm) => {
      // 跟随options联动，只有当前值冲突时才重置，否则保持原值
      const opts = typeof pcbFieldRules.silkscreen.options === 'function'
        ? pcbFieldRules.silkscreen.options(form)
        : pcbFieldRules.silkscreen.options;
      const current = form.silkscreen;
      if (opts.includes(current)) {
        return current;
      }
      return opts[0];
    },
    required: true,
    dependencies: ['solderMask'],
  },
  surfaceFinish: {
    label: 'Surface Finish',
    component: 'Select',
    options: (form: PcbQuoteForm) => {
      const layers = form.layers ?? 2;
      const thickness = form.thickness ?? 1.6;
      if ((layers === 1 || layers === 2) && thickness < 0.6) {
        return [SurfaceFinish.Enig];
      }
      return Object.values(SurfaceFinish);
    },
    default: (form: PcbQuoteForm) => {
      const layers = form.layers ?? 2;
      const thickness = form.thickness ?? 1.6;
      if ((layers === 1 || layers === 2) && thickness < 0.6) {
        return SurfaceFinish.Enig;
      }
      return SurfaceFinish.HASL;
    },
    required: true,
    dependencies: ['bga', 'thickness', 'layers'],
  },
  surfaceFinishEnigType: {
    label: 'ENIG Thickness',
    component: 'Select',
    options: Object.values(SurfaceFinishEnigType),
    default: SurfaceFinishEnigType.Enig1u,
    required: false,
    shouldShow: (form: PcbQuoteForm) => form.surfaceFinish === SurfaceFinish.Enig,
  },
  impedance: {
    label: 'Impedance',
    component: 'Checkbox',
    options: [true, false],
    default: false,
    required: false,
  },
  castellated: {
    label: 'Castellated Holes',
    component: 'Checkbox',
    options: [true, false],
    default: false,
    required: false,
  },
  goldFingers: {
    label: 'Gold Fingers',
    component: 'Checkbox',
    options: [true, false],
    default: false,
    required: false,
  },
  edgePlating: {
    label: 'Plated Half-holes/Edge Plating',
    component: 'Checkbox',
    options: [true, false],
    default: false,
    required: false,
  },
  maskCover: {
    label: 'Via Processing',
    component: 'Select',
    options: (form: PcbQuoteForm) => {
      const { layers = 2 } = form;
      if (layers === 1) {
        return [
          MaskCover.TentedVias,
          MaskCover.OpenedVias,
        ];
      } else if (layers === 2) {
        return [
          MaskCover.TentedVias,
          MaskCover.OpenedVias,
          MaskCover.SolderMaskPlug,
        ];
      }
      return [
        MaskCover.TentedVias,
        MaskCover.OpenedVias,
        MaskCover.SolderMaskPlug,
        MaskCover.NonConductiveFillCap,
      ];
    },
    default: (form: PcbQuoteForm) => {
      const opts = typeof pcbFieldRules.maskCover.options === 'function'
        ? pcbFieldRules.maskCover.options(form)
        : pcbFieldRules.maskCover.options;
      const current = form.maskCover;
      if (opts.includes(current)) {
        return current;
      }
      return opts[0];
    },
    required: false,
  },
  /**
   * testMethod规则根据layers和面积动态调整：
   * - 单层板（layers=1）：允许'none'、'flyingProbe'、'fixture'，默认'none'
   * - 多层板（layers>1）：面积>5㎡只能'fixture'，<=5㎡只能'flyingProbe'或'fixture'，默认'flyingProbe'
   * - 面积area需由表单逻辑传入（form.area）
   */
  testMethod: {
    label: 'Electrical Test',
    component: 'Select',
    options: (form: PcbQuoteForm & { area?: number }) => {
      const { layers = 2, area = 0 } = form;
      if (layers === 1) {
        return [TestMethod.None, TestMethod.FlyingProbe, TestMethod.Fixture];
      }
      if (area > 5) {
        return [TestMethod.Fixture];
      }
      return [TestMethod.FlyingProbe, TestMethod.Fixture];
    },
    default: (form: PcbQuoteForm & { area?: number }) => {
      const { layers = 2, area = 0 } = form;
      if (layers === 1) return TestMethod.None;
      if (area > 5) return TestMethod.Fixture;
      return TestMethod.FlyingProbe;
    },
    required: true,
    dependencies: ['layers', 'singleDimensions',  'singleCount', 'shipmentType', 'panelDimensions','panelSet'],
    shouldDisable: (form: PcbQuoteForm & { area?: number }) => {
      const { layers = 2, area = 0, testMethod } = form;
      if (layers > 1 && testMethod === TestMethod.None) return true;
      if (area > 5 && testMethod !== TestMethod.Fixture) return true;
      return false;
    },
  },
  smt: {
    label: 'SMT',
    component: 'Checkbox',
    options: [true, false],
    default: false,
    required: false,
    shouldShow: (form: PcbQuoteForm) => form.shipmentType === 'panel_by_custom' || form.shipmentType === 'panel_by_speedx',
    trueLabel: 'Yes',
    falseLabel: 'No',
  },
  useShengyiMaterial: {
    label: 'Shengyi Material',
    component: 'Checkbox',
    options: [true, false],
    default: false,
    required: false,
    shouldShow: (form: PcbQuoteForm) => form.pcbType === PcbType.FR4,
  },
  /**
   * BGA（Ball Grid Array）封装规则
   * - options: [true, false]
   * - default: false
   * - shouldShow: 始终显示（如有特殊业务可扩展）
   * - shouldDisable: 始终可用（如有特殊业务可扩展）
   * - dependencies: 无（如后续只对部分板型/层数开放可扩展）
   * - 业务说明：如勾选，表示有BGA且间距≤0.25mm，报价自动加价50元
   */
  bga: {
    label: 'BGA ≤0.25mm',
    component: 'Checkbox',
    options: [true, false],
    default: false,
    required: false,
  },
  blueMask: {
    label: 'Blue Mask',
    component: 'Checkbox',
    options: [true, false],
    default: false,
    required: false,
    shouldShow: (form: PcbQuoteForm) => ['hasl', 'enig', 'osp'].includes(form.surfaceFinish as string),
  },
  holeCu25um: {
    label: 'Hole Cu 25um',
    component: 'Checkbox',
    options: [true, false],
    default: false,
    required: false,
    shouldShow: (form: PcbQuoteForm) => ['hasl', 'enig', 'osp'].includes(form.surfaceFinish as string),
  },
  prodCap: {
    label: 'Production Capacity',
    component: 'Select',
    options: Object.values(ProdCap),
    default: 'auto',
    required: false,
  },
  productReport: {
    label: 'Product Report(Electronic)',
    component: 'Select',
    options: productReportOptions,
    optionLabels: productReportOptionLabels,
    default: 'Not Required',
    required: false,
    description: 'Only electronic reports are provided.',
  },
  yyPin: {
    label: 'YY Pin',
    component: 'Checkbox',
    options: [true, false],
    default: false,
    required: false,
    trueLabel: 'Yes',
    falseLabel: 'No',
  },
  customerCode: {
    label: 'Customer Code',
    component: 'Input',
    options: Object.values(CustomerCode),
    default: '',
    required: false,
  },
  qualityAttach: {
    label: 'Quality Attach',
    component: 'Select',
    options: Object.values(QualityAttach),
    default: 'standard',
    required: false,
  },
  holeCount: {
    label: 'Hole Count',
    component: 'NumberInput',
    options: [],
    default: '',
    required: false,
  },
  singleCount: {
    label: 'Single Qty',
    component: 'NumberInput',
    options: [],
    default: '',
    required: true,
    shouldShow: (form: PcbQuoteForm) => form.shipmentType === 'single',
  },
  differentDesignsCount: {
    label: 'Different Designs',
    component: 'NumberInput',
    options: [],
    default: 1,
    required: true,
  },
  singleDimensions: {
    label: 'Single Size (cm)',
    component: 'DimensionsInput',
    options: [],
    default: { length: 5, width: 5 },
    required: true,
  },
  panelDimensions: {
    label: 'Panel Type (pcs)',
    component: 'PanelDimensionsInput',
    options: [],
    default: { row: 1, column: 1 },
    required: true,
    shouldShow: (form: PcbQuoteForm) => form.shipmentType === 'panel_by_custom' || form.shipmentType === 'panel_by_speedx',
  },
  goldFingersBevel: {
    label: 'Bevel Gold Fingers',
    component: 'Checkbox',
    options: [true, false],
    default: false,
    required: false,
    shouldShow: (form) => !!form.goldFingers,
  },
  payMethod: {
    label: 'Pay Method',
    component: 'Select',
    options: Object.values(PayMethod),
    default: 'auto',
    required: false,
  },
  edgeCover: {
    label: 'Edge Cover',
    component: 'Select',
    options: Object.values(EdgeCover),
    default: 'none',
    required: false,
  },
  panelSet: {
    label: 'Panel Qty',
    component: 'NumberInput',
    options: [],
    default: '',
    required: false,
  },
  workingGerber: {
    label: 'Working Gerber',
    component: 'Select',
    options: Object.values(WorkingGerber),
    default: WorkingGerber.NotRequired,
    required: false,
  },
  ulMark: {
    label: 'UL Mark',
    component: 'Checkbox',
    options: [true, false],
    default: false,
    required: false,
  },
  crossOuts: {
    label: 'Cross Outs',
    component: 'Select',
    options: Object.values(CrossOuts),
    default: CrossOuts.NotAccept,
    required: false,
  },
  ipcClass: {
    label: 'IPC Class',
    component: 'Select',
    options: Object.values(IPCClass),
    default: IPCClass.Level2,
    required: false,
  },
  ifDataConflicts: {
    label: 'If Data Conflicts',
    component: 'Select',
    options: Object.values(IfDataConflicts),
    default: IfDataConflicts.FollowOrder,
    required: false,
  },
  specialRequests: {
    label: 'Special Requests',
    component: 'TextArea',
    options: [],
    default: '',
    required: false,
    placeholder: 'Please fill in your special requirements for the PCB order(within 5-1000 characters).',
    minLength: 5,
    maxLength: 1000,
  },
}; 