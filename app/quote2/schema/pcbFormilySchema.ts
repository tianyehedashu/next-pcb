// 🎯 简化版 Formily Schema - 直接使用枚举，避免复杂提取
import { ISchema } from "@formily/react";
import { 
  PcbType, HdiType, TgType, ShipmentType, BorderType,
  CopperWeight, InnerCopperWeight, 
  SolderMask, SurfaceFinishEnigType
} from "./shared-types";
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
      type: "string",
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
      "x-component": "Select",
      "x-component-props": {
        options: enumToOptions(HdiType)
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
      "x-component": "DimensionsInput"
    }),

    shipmentType: {
      type: "string",
      title: "Board Type",
      "x-component": "RadioTabs",
      "x-component-props": {
        options: enumToOptions(ShipmentType).map(option => ({
          ...option,
          label: option.value === "single" ? "Single PCB" : "Panel"
        }))
      }
    },

    singleCount: {
      type: "number",
      title: "Quantity(single)",
      "x-component": "QuantityInput",
      "x-component-props": {
        unit: "Pcs"
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
            visible: "{{$deps[0] === 'panel'}}"
          }
        }
      }
    }),

    panelSet: {
      type: "number",
      title: "Quantity(panel)",
      "x-component": "QuantityInput",
      "x-component-props": {
        unit: "Pcs",
        placeholder: "Select panel quantity"
      },
      "x-reactions": {
        dependencies: ["shipmentType"],
        fulfill: {
          state: {
            visible: "{{$deps[0] === 'panel'}}"
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
      type: "string",
      title: "Break-away Rail",
      "x-component": "TabSelect",
      "x-component-props": {
        options: enumToOptions(BorderType).map(option => ({
          ...option,
          label: option.value === 'none' ? 'None' : 
                 option.value === '5' ? '5mm' :
                 option.value === '10' ? '10mm' : 
                 option.label
        }))
      }
    },

    // === 工艺信息 ===
    
    outerCopperWeight: {
      type: "string",
      title: "Outer Copper Weight",
      "x-component": "Select",
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
      "x-component": "Select",
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
      "x-component": "TabSelect",
      "x-component-props": {
        options: enumToOptions(SolderMask)
      }
    },

    silkscreen: {
      type: "string", 
      title: "Silk Screen",
      "x-component": "TabSelect",
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
      "x-component": "Select",
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
      title: "Edge Plating",
      "x-component": "BooleanTabs"
    },

    edgeCover: {
      type: "string",
      title: "Edge Cover",
      "x-component": "Select",
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


    castellated: {
      type: "boolean", 
      title: "Castellated Holes",
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
        options: [
          { label: "Not Required", value: "not_required" },
          { label: "Require Approval", value: "require_approval" }
        ]
      }
    },

    productReport: {
      type: "array",
      title: "Product Report",
      "x-component": "MultiSelect",
      "x-component-props": {
        placeholder: "Select reports..."
      }
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
        options: [
          { label: "Not Accept", value: "not_accept" },
          { label: "Accept", value: "accept" }
        ]
      }
    },

    ipcClass: {
      type: "string",
      title: "IPC Class",
      "x-component": "RadioTabs",
      "x-component-props": {
        options: [
          { label: "IPC Level 2 Standard", value: "level2" },
          { label: "IPC Level 3 Standard", value: "level3" }
        ]
      }
    },

    ifDataConflicts: {
      type: "string",
      title: "If Data Conflicts",
      "x-component": "RadioTabs",
      "x-component-props": {
        options: [
          { label: "Follow Order Parameters", value: "follow_order" },
          { label: "Follow Files", value: "follow_files" },
          { label: "Ask for Confirmation", value: "ask_confirmation" }
        ]
      }
    },

    rejectBoard: {
      type: "boolean",
      title: "Reject Board",
      "x-component": "BooleanTabs"
    },

    // === 文件上传 ===
    
    gerberUrl: fullWidth({
      type: "string",
      title: "Gerber File URL",
      "x-component": "Input",
      "x-component-props": {
        placeholder: "Gerber file URL will be automatically filled after upload...",
        readOnly: true
      }
    }),

    // === 运输信息 ===
    
    shippingAddress: fullWidth({
      type: "object",
      title: "Shipping Address",
      "x-component": "AddressInput",
      required: true,
      properties: {
        country: {
          type: "string",
          title: "Country",
          "x-component": "Select",
          "x-component-props": {
            placeholder: "Select country..."
          }
        },
        state: {
          type: "string", 
          title: "State/Province",
          "x-component": "Input",
          "x-component-props": {
            placeholder: "Enter state or province..."
          }
        },
        city: {
          type: "string",
          title: "City",
          "x-component": "Input",
          "x-component-props": {
            placeholder: "Enter city..."
          }
        },
        address: {
          type: "string",
          title: "Address",
          "x-component": "TextArea",
          "x-component-props": {
            placeholder: "Enter detailed address...",
            rows: 2
          }
        },
        zipCode: {
          type: "string",
          title: "ZIP/Postal Code",
          "x-component": "Input",
          "x-component-props": {
            placeholder: "Enter ZIP or postal code..."
          }
        },
        contactName: {
          type: "string",
          title: "Contact Name",
          "x-component": "Input",
          "x-component-props": {
            placeholder: "Enter contact person name..."
          }
        },
        phone: {
          type: "string",
          title: "Phone Number",
          "x-component": "Input",
          "x-component-props": {
            placeholder: "Enter phone number..."
          }
        }
      }
    }),

    customsNote: fullWidth({
      type: "string",
      title: "Customs Note",
      "x-component": "TextArea",
      "x-component-props": {
        placeholder: "Additional customs information...",
        rows: 3
      }
    }),

    userNote: fullWidth({
      type: "string",
      title: "Additional Notes",
      "x-component": "TextArea", 
      "x-component-props": {
        placeholder: "Any additional requirements or notes...",
        rows: 4
      }
    })

  }
};

// 🎯 字段分组配置 - 参考 SpeedXPCB 网站结构
export const fieldGroups = [
  {
    title: "Basic Information",
    fields: [
      'pcbType', 'layers', 'useShengyiMaterial', 'thickness', 'tg', 
      'differentDesignsCount', 'singleDimensions', 'shipmentType', 
      'singleCount', 'panelDimensions', 'panelSet','border', 'pcbNote'
    ]
  },
  {
    title: "Process Information", 
    fields: [
      'outerCopperWeight', 'innerCopperWeight', 'minTrace', 'minHole',
      'solderMask', 'silkscreen', 'surfaceFinish', 'surfaceFinishEnigType',
      'impedance', 'impedanceNote', 'goldFingers', 'goldFingersBevel',
      'maskCover', 'edgePlating', 'edgeCover'
    ]
  },
  {
    title: "Service Information",
    fields: [
      'hdi', 'castellated', 'testMethod', 'qualityAttach', 'workingGerber',
      'productReport', 'ulMark', 'crossOuts', 'ipcClass', 'ifDataConflicts',
      'rejectBoard', 'specialRequests'
    ]
  },
  {
    title: "File Upload",
    fields: ['gerberUrl']
  },
  {
    title: "Shipping Information", 
    fields: [
      'shippingAddress', 'customsNote', 'userNote'
    ]
  }
]; 