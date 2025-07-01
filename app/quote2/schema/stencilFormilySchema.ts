// 钢网报价表单 Formily Schema
import { ISchema } from "@formily/react";
import {
  BorderType,
  StencilType,
  StencilSide,
  StencilThickness,
  ExistingFiducials,
  Electropolishing,
  EngineeringRequirements,
  borderTypeOptions,
  stencilTypeOptions,
  stencilSideOptions,
  stencilThicknessOptions,
  existingFiducialsOptions,
  electropolishingOptions,
  engineeringRequirementsOptions,
  sizeOptions
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



/**
 * 钢网报价 Formily Schema
 * 严格按照图片中的字段设计
 */
export const stencilFormilySchema: ISchema = {
  type: "object",
  properties: {
    // === Border Type ===
    borderType: {
      type: "string",
      title: "Border Type",
      "x-component": "TabSelect",
      "x-component-props": {
        options: borderTypeOptions
      },
      default: BorderType.FRAMEWORK
    },

    // === Stencil Type ===
    stencilType: {
      type: "string",
      title: "Stencil Type",
      "x-component": "TabSelect",
      "x-component-props": {
        options: stencilTypeOptions
      },
      default: StencilType.SOLDER_PASTE
    },

    // === Size ===
    size: fullWidth({
      type: "string",
      title: "Size(mm)",
      "x-component": "Select",
      "x-component-props": {
        placeholder: "Select size",
        options: sizeOptions.framework
      },
      "x-reactions": [
        {
          dependencies: ["borderType"],
          when: "{{$deps[0] === 'framework'}}",
          fulfill: {
            state: {
              componentProps: {
                options: sizeOptions.framework
              }
            }
          },
          otherwise: {
            state: {
              componentProps: {
                options: sizeOptions.non_framework
              }
            }
          }
        }
      ],
      default: "420x520"
    }),

    // === Stencil Side ===
    stencilSide: {
      type: "string",
      title: "Stencil Side",
      "x-component": "TabSelect",
      "x-component-props": {
        options: stencilSideOptions
      },
      default: "top"
    },

    // === Quantity ===
    quantity: {
      type: "number",
      title: "Quantity",
      "x-component": "QuantityInput",
      "x-component-props": {
        placeholder: "Enter quantity",
        min: 1,
        max: 500,
        unit: "pcs"
      },
      default: 1
    },

    // === Thickness ===
    thickness: {
      type: "number", 
      title: "Thickness",
      "x-component": "TabSelect",
      "x-component-props": {
        options: stencilThicknessOptions
      },
      default: 0.12
    },

    // === Existing Fiducials ===
    existingFiducials: {
      type: "string",
      title: "Existing Fiducials",
      "x-component": "TabSelect",
      "x-component-props": {
        options: existingFiducialsOptions
      },
      default: "none"
    },

    // === Electropolishing ===
    electropolishing: {
      type: "string",
      title: "Electropolishing",
      "x-component": "TabSelect",
      "x-component-props": {
        options: electropolishingOptions
      },
      default: "grinding_polishing"
    },

    // === Engineering Requirements ===
    engineeringRequirements: {
      type: "string",
      title: "Engineering Requirements",
      "x-component": "TabSelect",
      "x-component-props": {
        options: engineeringRequirementsOptions
      },
      default: "nextpcb_spec"
    },

    // === Add PO No. ===
    addPoNo: fullWidth({
      type: "string",
      title: "Add PO No.",
      "x-component": "Input",
      "x-component-props": {
        placeholder: "Enter PO Number"
      },
      default: ""
    }),

    // === Special Requests ===
    specialRequests: fullWidth({
      type: "string",
      title: "Special Requests",
      "x-component": "TextArea",
      "x-component-props": {
        placeholder: "Please fill in your special requirements for the stencil order(within 5-1000 characters).",
        maxLength: 1000,
        rows: 4
      },
      default: ""
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
      "x-validator": [
        {
          required: true,
          message: "Shipping Address is required"
        }
      ],
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
    })
  }
};

// 钢网字段分组配置
export const stencilFieldGroups = [
  {
    title: "Stencil Configuration",
    fields: ["borderType", "stencilType",  "size", "stencilSide", "quantity"]
  },
  {
    title: "Manufacturing Process", 
    fields: ["thickness", "existingFiducials", "electropolishing", "engineeringRequirements"]
  },
  {
    title: "Order Information",
    fields: ["addPoNo", "specialRequests"]
  },
  {
    title: "Shipping Cost Estimation",
    fields: ["shippingCostEstimation"]
  },
  {
    title: "Shipping Information", 
    fields: ["shippingAddress"]
  }
];

// 钢网默认表单数据
export const stencilDefaultFormData = {
  productType: "stencil",
  borderType: BorderType.FRAMEWORK,
  stencilType: StencilType.SOLDER_PASTE,
  size: "420x520",
  stencilSide: StencilSide.TOP,
  quantity: 1,
  thickness: StencilThickness.T0_12,
  existingFiducials: ExistingFiducials.NONE,
  electropolishing: Electropolishing.GRINDING_POLISHING,
  engineeringRequirements: EngineeringRequirements.SPEEDX_SPEC,
  addPoNo: "",
  specialRequests: "",
  shippingCostEstimation: {
    country: "",
    courier: ""
  },
  shippingAddress: {
    country: "",
    state: "",
    city: "",
    address: "",
    zipCode: "",
    contactName: "",
    phone: "",
    courier: ""
  }
}; 