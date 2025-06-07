// 🎯 简化版 Formily Schema - 直接使用枚举，避免复杂提取
import { ISchema } from "@formily/react";
import {
  PcbType, HdiType, TgType, ShipmentType, BorderType,
  CopperWeight, InnerCopperWeight,
  SolderMask, SurfaceFinishEnigType, CrossOuts, IPCClass, IfDataConflicts,
  DeliveryType, BreakAwayRail, BorderCutType
} from "./shared-types";
import { EdgeCover, ProductReport, WorkingGerber } from "../../../types/form";
import * as formilyHelpers from "./formilyHelpers";

// 🎯 简单的枚举转选项函数
function enumToOptions<T extends Record<string, string | number>>(enumObj: T) {
  return Object.values(enumObj).map(value => ({
    label: String(value),
    value
  }));
}

// === 辅助函数：标记字段为全宽显示 ===
function fullWidth(schema: ISchema): ISchema {
  return {
    ...schema,
    "x-decorator-props": {
      ...(schema["x-decorator-props"] || {}),
      fullWidth: true
    }
  };
}

// 🎯 导出辅助函数供 Formily reactions 使用
export const {
  getThicknessOptions,
  getThicknessOptionsForFormily,
  getMinTraceOptions,
  getMinHoleOptions,
  getSilkscreenOptions,
  getSurfaceFinishOptions,
  getMaskCoverOptions,
  getEdgeCoverOptions,
  getTestMethodOptions,
  getQualityAttachOptions,
  getProductReportOptions,

  runSmartAdjustment,
  runSmartAdjustmentWithCheck,
  runSmartAdjustmentSync,


} = formilyHelpers;

/**
 * 🚀 简化版 Formily Schema
 * - 直接使用枚举，避免复杂的 Zod 提取
 * - Formily 专注 UI 渲染和交互
 * - Zod 专注数据验证和类型安全
 */
export const pcbFormilySchema: ISchema = {
  type: "object",
  properties: {
    // === 基础信息 ===

    pcbType: {
      type: "string",
      title: "Material Type",
      "x-component": "TabSelect",
      "x-component-props": {
        options: enumToOptions(PcbType)
      }
    },

    useShengyiMaterial: {
      type: "boolean",
      title: "Shengyi Material",
      "x-component": "BooleanTabs",
      "x-reactions": {
        dependencies: ["pcbType"],
        fulfill: {
          state: {
            visible: "{{$deps[0] === PcbType.FR4}}"
          }
        }
      }
    },

    layers: {
      type: "number",
      title: "Layers",
      "x-component": "TabSelect",
      "x-component-props": {
        options: [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20].map(v => ({ label: `${v}`, value: v }))
      }
    },

    thickness: {
      type: "number",
      title: "Board Thickness",
      "x-component": "TabSelect",
      "x-reactions": [
        {
          dependencies: ["layers", "outerCopperWeight", "innerCopperWeight"],
          fulfill: {
            state: {
              componentProps: "{{getThicknessOptionsForFormily($deps)}}"
            }
          }
        },
        {
          dependencies: ["layers", "outerCopperWeight", "innerCopperWeight"],
          fulfill: {
            run: "{{setTimeout(() => runSmartAdjustment($self), 0)}}"
          }
        }
      ]
    },

    hdi: {
      type: "string",
      title: "HDI",
      "x-component": "TabSelect",
      "x-component-props": {
        options: enumToOptions(HdiType),
        parseNumber: true
      },
      "x-reactions": {
        dependencies: ["layers"],
        fulfill: {
          state: {
            visible: "{{$deps[0] >= 4}}"
          }
        }
      }
    },

    tg: {
      type: "string",
      title: "TG Rating",
      "x-component": "TabSelect",
      "x-component-props": {
        options: enumToOptions(TgType)
      }
    },

    differentDesignsCount: fullWidth({
      type: "number",
      title: "Different Designs",
      description: "Number of different PCB designs per panel",
      "x-component": "DifferentDesignsInput",
      default: 1
    }),

    // === 尺寸信息 ===

    singleDimensions: fullWidth({
      type: "object",
      title: "Single Size (cm)",
      "x-component": "DimensionsInput",
      "x-reactions": [
        {
          dependencies: ["shipmentType"],
          fulfill: {
            state: {
              "x-decorator-props": {
                title: "{{$deps[0] === 'panel_by_custom' ? 'Unit Size (cm)' : 'Single Size (cm)'}}"
              }
            }
          }
        }
      ]
    }),

    shipmentType: {
      type: "string",
      title: "Board Type",
      "x-component": "RadioTabs",
      "x-component-props": {
        options: [
          { label: "Single PCB", value: ShipmentType.Single },
          { label: "Panel by Custom", value: ShipmentType.PanelByCustom },
          { label: "Panel by SpeedX", value: ShipmentType.PanelBySpeedx },
        ]
      },
      "x-reactions": [
        {
          dependencies: ["differentDesignsCount"],
          fulfill: {
            state: {
              componentProps:
                "{{$deps[0] > 1 ? { options: [ { label: 'Single PCB', value: 'single', disabled: true }, { label: 'Panel by Custom', value: 'panel_by_custom' }, { label: 'Panel by SpeedX', value: 'panel_by_speedx' } ] } : { options: [ { label: 'Single PCB', value: 'single' }, { label: 'Panel by Custom', value: 'panel_by_custom' }, { label: 'Panel by SpeedX', value: 'panel_by_speedx' } ] } }}"
            }
          }
        },
        {
          dependencies: ["differentDesignsCount", "$self"],
          when: "{{$deps[0] > 1 && $self.value === 'single'}}",
          fulfill: {
            run: "{{$self.setValue('panel_by_custom')}}"
          }
        }
      ]
    },

    singleCount: {
      type: "number",
      title: "Quantity(single)",
      "x-component": "QuantityInput",
      "x-component-props": {
        placeholder: "Select",
        unit: "pcs"
      },
      "x-reactions": {
        dependencies: ["shipmentType"],
        fulfill: {
          state: {
            visible: "{{$deps[0] === 'single'}}",
            display: "{{$deps[0] === 'single' ? 'visible' : 'none'}}"
          }
        }
      }
    },

    panelDimensions: fullWidth({
      type: "object",
      title: "Panel Type (pcs)",
      "x-component": "PanelDimensionsInput",
      "x-reactions": {
        dependencies: ["shipmentType"],
        fulfill: {
          state: {
            visible: "{{$deps[0] === 'panel_by_custom' || $deps[0] === 'panel_by_speedx'}}"
          }
        }
      }
    }),

    panelSet: {
      type: "number",
      title: "Quantity(panel)",
      "x-component": "QuantityInput",
      "x-component-props": {
        unit: "set",
        placeholder: "Select"
      },
      "x-reactions": {
        dependencies: ["shipmentType"],
        fulfill: {
          state: {
            visible: "{{$deps[0] === 'panel_by_custom' || $deps[0] === 'panel_by_speedx'}}"
          }
        }
      }
    },

    pcbNote: fullWidth({
      type: "string",
      title: "PCB Note",
      "x-component": "TextArea",
      "x-component-props": {
        placeholder: "Additional notes for PCB manufacturing...",
        rows: 4
      }
    }),

    border: {
      type: 'string',
      title: 'Board Edge Width',
      'x-decorator': 'FormItem',
      'x-component': 'TabSelect',
      'x-component-props': {
        options: [
          { label: '5mm', value: BorderType.Five },
          { label: '10mm', value: BorderType.Ten },
        ]
      },
      'x-reactions': {
        dependencies: ['breakAwayRail'],
        fulfill: {
          state: {
            visible: '{{$deps[0] !== undefined && $deps[0] !== "None"}}',
          },
          run: '{{if($deps[0] !== undefined && $deps[0] !== "None" && !$self.value) { $self.setValue("5") }}}',
        },
      },
    },

    borderCutType: {
      type: 'string',
      title: 'Board Edge Type',
      'x-component': 'TabSelect',
      'x-component-props': {
        options: [
          { label: 'V-Cut', value: BorderCutType.VCut },
          { label: 'Tab Route', value: BorderCutType.Tab },
          { label: 'Routing', value: BorderCutType.Routing },
        ]
      },
      'x-reactions': {
        dependencies: ['breakAwayRail'],
        fulfill: {
          state: {
            visible: '{{$deps[0] !== undefined && $deps[0] !== "None"}}',
          },
          run: '{{if($deps[0] !== undefined && $deps[0] !== "None" && !$self.value) { $self.setValue("vcut") }}}',
        },
      },
    },

    // 新增 breakAwayRail 字段
    breakAwayRail: {
      type: 'string',
      title: 'Break-away Rail',
      'x-decorator': 'FormItem',
      'x-component': 'TabSelect',
      'x-component-props': {
        options: [
          { label: 'None', value: BreakAwayRail.None },
          { label: 'Left and Right', value: BreakAwayRail.LeftRight },
          { label: 'Top and Bottom', value: BreakAwayRail.TopBottom },
          { label: 'All', value: BreakAwayRail.All },
        ]
      },
      'x-reactions': {
        dependencies: ['shipmentType'],
        fulfill: {
          state: {
            visible: '{{$deps[0] === "panel_by_speedx"}}',
          },
          run: '{{if($deps[0] !== "panel_by_speedx") { $self.setValue("None") }}}',
        },
      },
    },

    // === 工艺信息 ===

    outerCopperWeight: {
      type: "string",
      title: "Outer Copper Weight",
      "x-component": "TabSelect",
      "x-component-props": {
        options: enumToOptions(CopperWeight).map(option => ({
          ...option,
          label: `${option.value}oz`
        })),
        unit: "oz"
      }
    },

    innerCopperWeight: {
      type: "string",
      title: "Inner Copper Weight",
      "x-component": "TabSelect",
      "x-component-props": {
        options: enumToOptions(InnerCopperWeight).map(option => ({
          ...option,
          label: `${option.value}oz`
        })),
        unit: "oz"
      },
      "x-reactions": {
        dependencies: ["layers"],
        fulfill: {
          state: {
            visible: "{{$deps[0] >= 4}}",
            disabled: "{{$deps[0] < 4}}"
          }
        }
      }
    },

    minTrace: {
      type: "string",
      title: "Min Trace/Space",
      "x-component": "TabSelect",
      "x-reactions": [
        {
          dependencies: ["layers", "outerCopperWeight", "innerCopperWeight"],
          fulfill: {
            state: {
              componentProps: "{{getMinTraceOptions($deps)}}"
            }
          }
        },
        {
          dependencies: ["layers", "outerCopperWeight", "innerCopperWeight"],
          fulfill: {
            run: "{{setTimeout(() => runSmartAdjustment($self), 0)}}"
          }
        }
      ]
    },

    minHole: {
      type: "string",
      title: "Min Hole",
      "x-component": "TabSelect",
      "x-reactions": [
        {
          dependencies: ["layers", "thickness"],
          fulfill: {
            state: {
              componentProps: "{{getMinHoleOptions($deps)}}"
            }
          }
        },
        {
          dependencies: ["layers", "thickness"],
          fulfill: {
            run: "{{setTimeout(() => runSmartAdjustment($self), 0)}}"
          }
        }
      ]
    },

    solderMask: {
      type: "string",
      title: "Solder Mask",
      "x-component": "ColorSelector",
      "x-component-props": {
        options: enumToOptions(SolderMask)
      }
    },

    silkscreen: {
      type: "string",
      title: "Silk Screen",
      "x-component": "ColorSelector",
      "x-reactions": [
        {
          dependencies: ["solderMask"],
          fulfill: {
            state: {
              componentProps: "{{getSilkscreenOptions($deps)}}"
            }
          }
        },
        {
          dependencies: ["solderMask"],
          fulfill: {
            run: "{{setTimeout(() => runSmartAdjustment($self), 0)}}"
          }
        }
      ]
    },

    surfaceFinish: {
      type: "string",
      title: "Surface Finish",
      "x-component": "TabSelect",
      "x-reactions": [
        {
          dependencies: ["layers", "thickness"],
          fulfill: {
            state: {
              componentProps: "{{getSurfaceFinishOptions($deps)}}"
            }
          }
        },
        {
          dependencies: ["layers", "thickness"],
          fulfill: {
            run: "{{setTimeout(() => runSmartAdjustment($self), 0)}}"
          }
        }
      ]
    },

    surfaceFinishEnigType: {
      type: "string",
      title: "ENIG Thickness",
      "x-component": "TabSelect",
      "x-component-props": {
        options: enumToOptions(SurfaceFinishEnigType)
      },
      "x-reactions": {
        dependencies: ["surfaceFinish"],
        fulfill: {
          state: {
            visible: "{{$deps[0] === 'ENIG'}}"
          }
        }
      }
    },

    maskCover: {
      type: "string",
      title: "Via Process",
      "x-component": "TabSelect",
      "x-reactions": [
        {
          dependencies: ["layers"],
          fulfill: {
            state: {
              componentProps: "{{getMaskCoverOptions($deps)}}"
            }
          }
        },
        {
          dependencies: ["layers"],
          fulfill: {
            run: "{{setTimeout(() => runSmartAdjustment($self), 0)}}"
          }
        }
      ]
    },

    edgePlating: {
      type: "boolean",
      title: "Edge Plating/Castellated Holes",
      "x-component": "BooleanTabs"
    },

    edgeCover: {
      type: "string",
      title: "Edge Cover",
      "x-component": "TabSelect",
      "x-component-props": {
        options: enumToOptions(EdgeCover)
      },
      "x-reactions": [
        {
          dependencies: ["edgePlating"],
          fulfill: {
            state: {
              visible: "{{$deps[0] === true}}",
              componentProps: "{{getEdgeCoverOptions($deps)}}"
            }
          }
        },
        {
          dependencies: ["edgePlating"],
          when: "{{$deps[0] === true}}",
          fulfill: {
            run: "{{setTimeout(() => runSmartAdjustmentWithCheck($self), 0)}}"
          }
        }
      ]
    },

    // === 特殊工艺 ===

    impedance: {
      type: "boolean",
      title: "Impedance Control",
      "x-component": "BooleanTabs"
    },



    goldFingers: {
      type: "boolean",
      title: "Gold Fingers",
      "x-component": "BooleanTabs"
    },

    goldFingersBevel: {
      type: "boolean",
      title: "Bevel Gold Fingers",
      "x-component": "BooleanTabs",
      "x-reactions": {
        dependencies: ["goldFingers"],
        fulfill: {
          state: {
            visible: "{{$deps[0] === true}}"
          }
        }
      }
    },

    specialRequests: fullWidth({
      type: "string",
      title: "Special Requests",
      "x-component": "TextArea",
      "x-component-props": {
        placeholder: "Any special requirements...",
        rows: 4
      }
    }),

    // === 测试与服务 ===

    testMethod: {
      type: "string",
      title: "Electrical Test",
      "x-component": "TabSelect",
      "x-reactions": [
        {
          dependencies: ["layers", "singleDimensions", "singleCount", "shipmentType", "panelDimensions", "panelSet"],
          fulfill: {
            state: {
              componentProps: "{{getTestMethodOptions($deps)}}"
            }
          }
        },
        {
          dependencies: ["layers", "singleDimensions", "singleCount", "shipmentType", "panelDimensions", "panelSet"],
          fulfill: {
            run: "{{setTimeout(() => runSmartAdjustment($self), 0)}}"
          }
        }
      ]
    },

    qualityAttach: {
      type: "string",
      title: "Quality Requirements",
      "x-component": "TabSelect",
      "x-reactions": {
        dependencies: [],
        fulfill: {
          state: {
            componentProps: "{{getQualityAttachOptions()}}"
          }
        }
      }
    },

    workingGerber: {
      type: "string",
      title: "Working Gerber",
      "x-component": "RadioTabs",
      "x-component-props": {
        options: enumToOptions(WorkingGerber)
      }
    },

    productReport: {
      type: "array",
      title: "Product Report(Electronic)",
      "x-component": "MultiSelect",
      "x-component-props": {
        placeholder: "Select reports...",
        allowClear: true,
        mode: "multiple",
        isProductReport: true,
        options: enumToOptions(ProductReport)
      },
      default: [ProductReport.None]
    },

    ulMark: {
      type: "boolean",
      title: "UL Mark",
      "x-component": "BooleanTabs"
    },

    crossOuts: {
      type: "string",
      title: "Cross Outs",
      "x-component": "RadioTabs",
      "x-component-props": {
        options: enumToOptions(CrossOuts).map(option => ({
          ...option,
          label: option.value === 'Not Accept' ? 'Not Accept Defective Boards' : 'Accept Defective Boards'
        }))
      }
    },

    ipcClass: {
      type: "string",
      title: "IPC Class",
      "x-component": "RadioTabs",
      "x-component-props": {
        options: enumToOptions(IPCClass)
      }
    },

    ifDataConflicts: {
      type: "string",
      title: "If Data Conflicts",
      "x-component": "RadioTabs",
      "x-component-props": {
        options: enumToOptions(IfDataConflicts)
      }
    },

    delivery: {
      type: "string",
      title: "Delivery Type",
      "x-component": "RadioTabs",
      "x-component-props": {
        options: [
          { label: "Standard", value: DeliveryType.Standard },
          { label: "Urgent ⚡", value: DeliveryType.Urgent }
        ]
      },
      default: DeliveryType.Standard
    },

    // === 文件上传 ===

    gerberUrl: fullWidth({
      type: "string",
      title: "Gerber File URL",
      "x-component": "Input",
      "x-component-props": {
        placeholder: "Gerber file URL will be automatically filled after upload...",
      }
    }),

    // === 运输信息 ===

    shippingCostEstimation: fullWidth({
      type: "object",
      "x-component": "ShippingCostEstimation",
      properties: {
        country: {
          type: "string",
          title: "Country",
          "x-component": "Select"
        },
        courier: {
          type: "string",
          title: "Courier",
          "x-component": "Select"
        }
      }
    }),

    shippingAddress: fullWidth({
      type: "object",
      title: "Shipping Address",
      "x-component": "AddressInput",
      "x-component-props": {
        // userId 将通过 form context 或 reactions 传递
      },
      required: true,
      default: {
        country: "",
        state: "",
        city: "",
        address: "",
        zipCode: "",
        contactName: "",
        phone: "",
        courier: ""
      }
    }),

  }
};

// 🎯 字段分组配置 - 参考 SpeedXPCB 网站结构
export const fieldGroups = [
  {
    title: "Basic Information",
    icon: "Info",
    fields: [
      'pcbType', 'layers', 'useShengyiMaterial', 'thickness', 'tg',
      'differentDesignsCount', 'singleDimensions', 'shipmentType',
      'singleCount', 'panelDimensions', 'panelSet', 'breakAwayRail','borderCutType', 'border', 'pcbNote'
    ]
  },
  {
    title: "Process Information",
    icon: "Settings",
    fields: [
      'outerCopperWeight', 'innerCopperWeight', 'minTrace', 'minHole',
      'solderMask', 'silkscreen', 'surfaceFinish', 'surfaceFinishEnigType',
      'impedance', 'goldFingers', 'goldFingersBevel',
      'maskCover', 'edgePlating', 'edgeCover'
    ]
  },
  {
    title: "Service Information",
    icon: "Wrench",
    fields: [
      'hdi', 'castellated', 'testMethod', 'workingGerber',
      'productReport', 'ulMark', 'crossOuts', 'ipcClass', 'ifDataConflicts',
      'delivery', 'specialRequests'
    ]
  },
  {
    title: "Shipping Cost Estimation",
    icon: "Calculator",
    fields: [
      'shippingCostEstimation'
    ]
  },
  {
    title: "Shipping Information",
    icon: "Truck",
    fields: [
      'shippingAddress'
    ]
  }
]; 