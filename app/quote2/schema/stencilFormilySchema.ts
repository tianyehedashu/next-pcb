// 钢网报价表单 Formily Schema
import { ISchema } from "@formily/react";
import {
  StencilMaterial,
  StencilThickness, 
  StencilProcess,
  FrameType,
  SurfaceTreatment,
  StencilMaterialLabels,
  StencilThicknessLabels,
  StencilProcessLabels,
  FrameTypeLabels,
  SurfaceTreatmentLabels
} from "./stencilTypes";

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

// 枚举转选项函数
function enumToOptions<T extends Record<string, string | number>>(
  enumObj: T, 
  labels?: Record<string, string>
) {
  return Object.entries(enumObj).map(([key, value]) => ({
    label: labels?.[value as string] || String(value),
    value
  }));
}

/**
 * 钢网报价 Formily Schema
 * 专为钢网制造设计的表单字段配置
 */
export const stencilFormilySchema: ISchema = {
  type: "object",
  properties: {
    // === 钢网工艺指导 ===
    stencilGuide: {
      type: "void",
      title: "Manufacturing Process Guide",
      "x-decorator": "FormFieldLayout",
      "x-decorator-props": {
        title: "🔧 Manufacturing Process Guide",
        description: "Learn about different stencil manufacturing processes to make the best choice for your project",
      },
      "x-component": "StencilProcessGuide",
      "x-reactions": [
        {
          dependencies: ["stencilMaterial", "stencilThickness", "stencilProcess", "frameType"],
          fulfill: {
            state: {
              componentProps: {
                selectedProcess: "{{$deps[2]}}",
                selectedMaterial: "{{$deps[0]}}",
                selectedThickness: "{{$deps[1]}}",
                selectedFrameType: "{{$deps[3]}}"
              }
            }
          }
        }
      ]
    },

    // === 基础信息 ===
    stencilMaterial: {
      type: "string",
      title: "Stencil Material",
      "x-component": "TabSelect",
      "x-component-props": {
        options: enumToOptions(StencilMaterial, StencilMaterialLabels)
      },
      default: StencilMaterial.STAINLESS_STEEL_304
    },
    
    stencilThickness: {
      type: "number", 
      title: "Stencil Thickness",
      "x-component": "TabSelect",
      "x-component-props": {
        options: enumToOptions(StencilThickness, StencilThicknessLabels)
      },
      default: StencilThickness.T0_12
    },

    stencilProcess: {
      type: "string",
      title: "Manufacturing Process", 
      "x-component": "TabSelect",
      "x-component-props": {
        options: enumToOptions(StencilProcess, StencilProcessLabels)
      },
      default: StencilProcess.LASER_CUT
    },

    // === 框架配置 ===
    frameType: {
      type: "string",
      title: "Frame Type",
      "x-component": "TabSelect", 
      "x-component-props": {
        options: enumToOptions(FrameType, FrameTypeLabels)
      },
      default: FrameType.SMT_FRAME
    },

    frameSize: fullWidth({
      type: "string",
      title: "Frame Size",
      "x-component": "Select",
      "x-component-props": {
        placeholder: "Select standard frame size",
        options: [
          { label: "300×400mm (Hand printing)", value: "300x400" },
          { label: "370×470mm (Hand printing)", value: "370x470" },
          { label: "420×520mm (Semi-auto/Auto)", value: "420x520" },
          { label: "450×550mm (Semi-auto/Auto)", value: "450x550" },
          { label: "550×650mm (Standard)", value: "550x650" },
          { label: "584×584mm (23″×23″)", value: "584x584" },
          { label: "736×736mm (29″×29″)", value: "736x736" }
        ]
      },
      "x-reactions": {
        dependencies: ["frameType"],
        fulfill: {
          state: {
            visible: "{{$deps[0] !== 'no_frame'}}"
          }
        }
      },
      default: "550x650"
    }),

    // === 工艺要求 ===
    surfaceTreatment: {
      type: "string",
      title: "Surface Treatment",
      "x-component": "TabSelect",
      "x-component-props": {
        options: enumToOptions(SurfaceTreatment, SurfaceTreatmentLabels)
      },
      default: SurfaceTreatment.NONE
    },

    tensionMesh: {
      type: "boolean",
      title: "Tension Mesh Required",
      "x-component": "BooleanTabs",
      "x-component-props": {
        description: "Recommended for fine pitch components (≤0.4mm)"
      },
      default: false
    },

    fiducialMarks: {
      type: "boolean", 
      title: "Fiducial Marks",
      "x-component": "BooleanTabs",
      "x-component-props": {
        description: "Alignment marks for automated placement"
      },
      default: true
    },

    // === 尺寸和数量 ===
    singleDimensions: fullWidth({
      type: "object",
      title: "Stencil Size (mm)",
      "x-component": "DimensionsInput",
      "x-component-props": {
        placeholder: { length: "Length", width: "Width" },
        min: 5,
        max: 600,
        description: "Maximum size depends on frame selection"
      },
      default: { length: 100, width: 80 }
    }),

    singleCount: {
      type: "number",
      title: "Quantity",
      "x-component": "QuantityInput",
      "x-component-props": {
        placeholder: "Enter quantity",
        options: [1, 2, 3, 5, 10, 15, 20, 30, 50, 100],
        min: 1,
        max: 500
      },
      default: 1
    },

    // === 交期选项 ===
    deliveryOptions: {
      type: "object",
      title: "Delivery Options",
      "x-component": "DeliverySelector", 
      "x-component-props": {
        productType: "stencil"
      },
      properties: {
        delivery: {
          type: "string",
          title: "Delivery Type",
          "x-component": "TabSelect",
          "x-component-props": {
            options: [
              { label: "Standard (3-5 days)", value: "standard" },
              { label: "Express (1-2 days)", value: "express" },
              { label: "Same Day (24 hours)", value: "same_day" }
            ]
          },
          default: "standard"
        },
        urgentReduceDays: {
          type: "number",
          title: "Rush Days Reduction", 
          "x-component": "TabSelect",
          "x-component-props": {
            options: [
              { label: "No Rush", value: 0 },
              { label: "1 Day Rush (+30%)", value: 1 },
              { label: "2 Days Rush (+60%)", value: 2 }
            ]
          },
          "x-reactions": {
            dependencies: ["deliveryOptions.delivery"],
            fulfill: {
              state: {
                visible: "{{$deps[0] === 'standard'}}"
              }
            }
          },
          default: 0
        }
      },
      default: {
        delivery: "standard",
        urgentReduceDays: 0
      }
    },

    // === 文件上传 ===
    gerberUrl: fullWidth({
      type: "string",
      title: "Design File URL",
      "x-component": "Input",
      "x-component-props": {
        placeholder: "Design file URL will be automatically filled after upload...",
      },
      default: ""
    }),

    // === 运费估算 ===
    shippingCostEstimation: fullWidth({
      type: "object",
      title: "Shipping Cost Estimation",
      "x-component": "ShippingCostEstimation",
      properties: {
        country: {
          type: "string",
          title: "Destination Country",
          "x-component": "CountrySelect"
        },
        courier: {
          type: "string", 
          title: "Preferred Courier",
          "x-component": "CourierSelect"
        }
      },
      default: { country: "", courier: "" }
    }),

    // === 收货地址 ===
    shippingAddress: fullWidth({
      type: "object",
      title: "Shipping Address",
      "x-component": "AddressInput",
      "x-component-props": {
        productType: "stencil"
      }
    }),

    // === 特殊要求 ===
    specialRequests: fullWidth({
      type: "string",
      title: "Special Requirements",
      "x-component": "TextArea",
      "x-component-props": {
        placeholder: "Any special requirements for your stencil manufacturing...\n\nExample:\n- Custom aperture modifications\n- Specific cleaning requirements\n- Special packaging needs\n- Quality inspection requirements\n- Additional notes or questions",
        maxLength: 1000,
        rows: 4
      },
      default: ""
    })
  }
};

// 钢网字段分组配置
export const stencilFieldGroups = [
  {
    title: "Basic Specifications",
    fields: ["stencilMaterial", "stencilThickness", "stencilProcess"]
  },
  {
    title: "Frame Configuration", 
    fields: ["frameType", "frameSize"]
  },
  {
    title: "Surface & Quality",
    fields: ["surfaceTreatment", "tensionMesh", "fiducialMarks"]
  },
  {
    title: "Dimensions & Quantity",
    fields: ["singleDimensions", "singleCount"]
  },
  {
    title: "Delivery Options",
    fields: ["deliveryOptions"]
  },
  {
    title: "File Upload",
    fields: ["gerberUrl"]
  },
  {
    title: "Shipping Cost Estimation",
    fields: ["shippingCostEstimation"]
  },
  {
    title: "Shipping Information",
    fields: ["shippingAddress"]
  },
  {
    title: "Additional Information",
    fields: ["specialRequests"]
  }
];

// 钢网默认表单数据
export const stencilDefaultFormData = {
  productType: "stencil",
  stencilMaterial: StencilMaterial.STAINLESS_STEEL_304,
  stencilThickness: StencilThickness.T0_12,
  stencilProcess: StencilProcess.LASER_CUT,
  frameType: FrameType.SMT_FRAME,
  frameSize: "550x650",
  surfaceTreatment: SurfaceTreatment.NONE,
  tensionMesh: false,
  fiducialMarks: true,
  singleDimensions: { length: 100, width: 80 },
  singleCount: 1,
  deliveryOptions: {
    delivery: "standard",
    urgentReduceDays: 0
  },
  gerberUrl: "",
  shippingCostEstimation: { country: "", courier: "" },
  shippingAddress: {
    country: "",
    state: "",
    city: "",
    address: "",
    zipCode: "",
    phone: "",
    contactName: "",
    courier: ""
  },
  specialRequests: ""
}; 