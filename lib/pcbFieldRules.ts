// PCB 表单字段规则配置
// 可扩展：依赖、校验、自动修正、加价等

import type { PcbQuoteForm } from '../types/pcbQuoteForm';
import { CustomerCode, SurfaceFinish, TgType, PcbType, HdiType, ShipmentType, BorderType, CopperWeight, SolderMask,MaskCover, Silkscreen, ProdCap, PayMethod, QualityAttach, ProductReport, EdgeCover, InnerCopperWeight } from '../types/form';

export type PCBFieldRule<T = unknown> = {
  label: string;
  options: T[] | ((form: PcbQuoteForm & { area?: number }) => T[]);
  default: T | ((form: PcbQuoteForm & { area?: number }) => T);
  required: boolean;
  shouldShow?: (form: PcbQuoteForm) => boolean;
  shouldDisable?: (form: PcbQuoteForm & { area?: number }) => boolean;
  dependencies?: (keyof PcbQuoteForm)[];
  unit?: string;
  [key: string]: unknown;
};

// 自动生成产品报告 options 和 optionLabels
const productReportOptions = Object.values(ProductReport);
const productReportOptionLabels: Record<string, string> = {
  [ProductReport.None]: 'Not Required',
  [ProductReport.ProductionReport]: 'Production Report',
  [ProductReport.MicrosectionAnalysisReport]: 'Microsection Analysis Report',
  [ProductReport.ProductionFilms]: 'Production Films',
  [ProductReport.ImpedanceReport]: 'Impedance Report',
  [ProductReport.TestReport]: 'Test Report',
};

export const pcbFieldRules: Record<string, PCBFieldRule> = {
  pcbType: {
    label: 'Board Type',
    options: Object.values(PcbType),
    default: 'fr4',
    required: true,
    price: { fr4: 0 },
    shouldDisable: () => false,
  },
  layers: {
    label: 'Layers',
    options: [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
    default: 2,
    required: true,
    shouldDisable: () => false,
  },
  outerCopperWeight: {
    label: 'Outer Copper Weight',
    options: Object.values(CopperWeight),
    default: CopperWeight.One,
    required: true,
    shouldDisable: () => false,
    unit: 'oz',
  },
  innerCopperWeight: {
    label: 'Inner Copper Weight',
    options: Object.values(InnerCopperWeight),
    default: InnerCopperWeight.Half,
    required: true,
    shouldShow: (form: PcbQuoteForm) => (form.layers ?? 2) >= 4,
    shouldDisable: (form: PcbQuoteForm) => (form.layers ?? 2) < 4,
    unit: 'oz',
  },
  thickness: {
    label: 'Thickness',
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
        filtered = filtered.filter(v => [0.6, 0.8, 1.0, 1.2, 1.6, 2.0].includes(v));
      } else if (layers === 6) {
        filtered = filtered.filter(v => [0.8, 1.0, 1.2, 1.6, 2.0].includes(v));
      } else if (layers >= 12) {
        filtered = filtered.filter(v => v >= 1.6);
      } else if (layers >= 10) {
        filtered = filtered.filter(v => v >= 1.2);
      } else if (layers >= 8) {
        filtered = filtered.filter(v => v > 0.8);
      }

      // 铜厚限制
      if (outer === '3' || inner === '3') {
        if (layers >= 8) {
          filtered = filtered.filter(v => v >= 2.0);
        } else {
          filtered = filtered.filter(v => v >= 1.6);
        }
      } else if (outer === '2' || inner === '2') {
        filtered = filtered.filter(v => v >= 1.2);
      }

      return filtered;
    },
    default: (form: PcbQuoteForm) => {
      const opts = typeof pcbFieldRules.thickness.options === 'function'
        ? pcbFieldRules.thickness.options(form)
        : pcbFieldRules.thickness.options;
      const layers = form.layers ?? 2;
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
    options: Object.values(HdiType),
    default: 'none',
    required: true,
    shouldShow: (form: PcbQuoteForm) => (form.layers ?? 2) >= 4,
  },
  tg: {
    label: 'TG',
    options: Object.values(TgType),
    default: TgType.TG135,
    required: true,
  },
  shipmentType: {
    label: 'Board Type',
    options: Object.values(ShipmentType),
    default: 'single',
    required: true,
  },
  border: {
    label: 'Break-away Rail',
    options: Object.values(BorderType),
    default: 'none',
    required: false,
  },
  minTrace: {
    label: 'Min Trace/Space',
    options: (form: PcbQuoteForm) => {
      const layers = form.layers ?? 2;
      if (layers === 1 || layers === 2) {
        return ['6/6', '5/5', '4/4', '3.5/3.5', '8/8', '10/10'];
      } else if (layers === 4) {
        return ['6/6', '5/5', '4/4', '3.5/3.5', '8/8', '10/10'];
      } else if (layers >= 6) {
        return ['6/6', '5/5', '4/4', '3.5/3.5', '8/8', '10/10'];
      }
      return ['6/6', '5/5', '4/4', '3.5/3.5', '8/8', '10/10'];
    },
    default: (form: PcbQuoteForm) => {
      const layers = form.layers ?? 2;
      if (layers >= 4) return '4/4';
      return '6/6';
    },
    required: true,
    dependencies: ['layers'],
    shouldDisable: () => false,
    unit: 'mil',
  },
  minHole: {
    label: 'Min Hole',
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
    options: Object.values(SolderMask),
    default: 'green',
    required: true,
  },
  silkscreen: {
    label: 'Silkscreen',
    options: Object.values(Silkscreen),
    default: 'white',
    required: true,
  },
  surfaceFinish: {
    label: 'Surface Finish',
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
    options: ['enig_1u', 'enig_2u', 'enig_3u'],
    default: 'enig_1u',
    required: false,
    shouldShow: (form: PcbQuoteForm) => form.surfaceFinish === SurfaceFinish.Enig,
  },
  impedance: {
    label: 'Impedance',
    options: [true, false],
    default: false,
    required: false,
  },
  castellated: {
    label: 'Castellated Holes',
    options: [true, false],
    default: false,
    required: false,
  },
  goldFingers: {
    label: 'Gold Fingers',
    options: [true, false],
    default: false,
    required: false,
  },
  edgePlating: {
    label: 'Plated Half-holes/Edge Plating',
    options: [true, false],
    default: false,
    required: false,
  },
  maskCover: {
    label: 'Via Processing',
    options: Object.values(MaskCover),
    default: 'tented_vias',
    required: false,
  },
  /**
   * testMethod规则根据layers和面积动态调整：
   * - 单层板（layers=1）：允许'none'、'flyingProbe'、'fixture'，默认'none'
   * - 多层板（layers>1）：面积>5㎡只能'fixture'，<=5㎡只能'flyingProbe'或'fixture'，默认'flyingProbe'
   * - 面积area需由表单逻辑传入（form.area）
   */
  testMethod: {
    label: 'Test Method',
    options: (form: PcbQuoteForm & { area?: number }) => {
      if ((form.layers ?? 2) === 1) {
        return ['none', 'flyingProbe', 'fixture'];
      }
      if ((form.area ?? 0) > 5) {
        return ['fixture'];
      }
      return ['flyingProbe', 'fixture'];
    },
    default: (form: PcbQuoteForm & { area?: number }) => {
      if ((form.layers ?? 2) === 1) {
        return 'none';
      }
      if ((form.area ?? 0) > 5) {
        return 'fixture';
      }
      return 'flyingProbe';
    },
    required: true,
    dependencies: ['layers', 'singleLength', 'singleWidth', 'singleCount'],
    shouldDisable: (form: PcbQuoteForm & { area?: number }) => {
      if ((form.layers ?? 2) > 1 && form.testMethod === 'none') return true;
      if ((form.area ?? 0) > 5 && form.testMethod !== 'fixture') return true;
      return false;
    },
  },
  smt: {
    label: 'SMT',
    options: [true, false],
    default: false,
    required: false,
    shouldShow: (form: PcbQuoteForm) => form.shipmentType === 'panel',
    trueLabel: 'Yes',
    falseLabel: 'No',
  },
  useShengyiMaterial: {
    label: 'Shengyi Material',
    options: [true, false],
    default: false,
    required: false,
    shouldShow: (form: PcbQuoteForm) => form.pcbType === 'fr4',
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
    options: [true, false],
    default: false,
    required: false,
  },
  blueMask: {
    label: 'Blue Mask',
    options: [true, false],
    default: false,
    required: false,
    shouldShow: (form: PcbQuoteForm) => ['hasl', 'enig', 'osp'].includes(form.surfaceFinish as string),
  },
  holeCu25um: {
    label: 'Hole Cu 25um',
    options: [true, false],
    default: false,
    required: false,
    shouldShow: (form: PcbQuoteForm) => ['hasl', 'enig', 'osp'].includes(form.surfaceFinish as string),
  },
  prodCap: {
    label: 'Production Capacity',
    options: Object.values(ProdCap),
    default: 'auto',
    required: false,
  },
  productReport: {
    label: 'Product Report',
    options: productReportOptions,
    optionLabels: productReportOptionLabels,
    default: 'Not Required',
    required: false,
  },
  rejectBoard: {
    label: 'Reject Board',
    options: [true, false],
    default: false,
    required: false,
    trueLabel: 'Yes',
    falseLabel: 'No',
    shouldShow: (form) => (form.differentDesignsCount ?? 0) > 1,
    shouldDisable: (form) => (form.differentDesignsCount ?? 0) <= 1,
  },
  yyPin: {
    label: 'YY Pin',
    options: [true, false],
    default: false,
    required: false,
    trueLabel: 'Yes',
    falseLabel: 'No',
  },
  customerCode: {
    label: 'Customer Code',
    options: Object.values(CustomerCode),
    default: '',
    required: false,
  },
  qualityAttach: {
    label: 'Quality Attach',
    options: Object.values(QualityAttach),
    default: 'standard',
    required: false,
  },
  holeCount: {
    label: 'Hole Count',
    options: [],
    default: '',
    required: false,
  },
  singleLength: {
    label: 'Single Length (cm)',
    options: [],
    default: '',
    required: true,
  },
  singleWidth: {
    label: 'Single Width (cm)',
    options: [],
    default: '',
    required: true,
  },
  panelRow: {
    label: '',
    options: [],
    default: 1,
    required: true,
    shouldShow: (form: PcbQuoteForm) => form.shipmentType === 'panel',
  },
  panelColumn: {
    label: '',
    options: [],
    default: 1,
    required: true,
    shouldShow: (form: PcbQuoteForm) => form.shipmentType === 'panel',
  },
  singleCount: {
    label: 'Single Qty',
    options: [],
    default: '',
    required: true,
    shouldShow: (form: PcbQuoteForm) => form.shipmentType === 'single',
  },
  differentDesignsCount: {
    label: 'Different Designs',
    options: [],
    default: 1,
    required: true,
  },
  singleSize: {
    label: 'Single Size (cm)',
    options: [],
    default: '',
    required: true,
  },
  goldFingersBevel: {
    label: 'Bevel Gold Fingers',
    options: [true, false],
    default: false,
    required: false,
    shouldShow: (form) => !!form.goldFingers,
  },
  payMethod: {
    label: 'Pay Method',
    options: Object.values(PayMethod),
    default: 'auto',
    required: false,
  },
  edgeCover: {
    label: 'Edge Cover',
    options: Object.values(EdgeCover),
    default: 'none',
    required: false,
  },
  panelSet: {
    label: 'Panel Qty',
    options: [],
    default: '',
    required: false,
  },
}; 