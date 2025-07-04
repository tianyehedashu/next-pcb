"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useState } from "react";
import { quoteSchema, type QuoteFormData } from "../../app/quote2/schema/quoteSchema";
import { 
  PcbType, ShipmentType, BorderType, CopperWeight, InnerCopperWeight, 
  MinTrace, MinHole, SolderMask, Silkscreen, SurfaceFinish, 
  MaskCover, TestMethod, ProductReport, HdiType, TgType,
  SurfaceFinishEnigType, EdgeCover, WorkingGerber, CrossOuts, 
  IPCClass, IfDataConflicts, DeliveryType,
  BreakAwayRail,
  BorderCutType
} from "../../app/quote2/schema/shared-types";
import { calculateTotalPcbArea } from '../utils/precision';

// === 类型定义 ===
type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid';

// 错误状态接口
interface ErrorState {
  fieldErrors: Record<string, string[]>;
  formErrors: string[] | null;
  businessErrors: string[];
  systemErrors: string[];
}

// 计算属性接口
interface CalculatedProperties {
  totalQuantity: number;
  singlePcbArea: number;
  totalArea: number;
}

// === 产品专用计算值接口 ===
interface PcbCalculationDetails {
  pcbPrice: number; // PCB产品价格（不含运费）
  singlePcbArea: number; // 单片PCB面积
  totalArea: number; // 总PCB面积
  breakdown: Record<string, number>; // PCB价格明细
}

interface StencilCalculationDetails {
  stencilPrice: number; // 钢网产品价格（不含运费）
  stencilArea: number; // 钢网面积
  totalWeight: number; // 钢网总重量
  breakdown: Record<string, number>; // 钢网价格明细
}

interface SmtCalculationDetails {
  smtPrice: number; // SMT组装价格（不含运费）
  componentCount: number; // 元器件总数
  breakdown: Record<string, number>; // SMT价格明细
}

interface ComboCalculationDetails {
  comboPrice: number; // 组合产品总价格（不含运费）
  productBreakdown: {
    pcb?: Partial<PcbCalculationDetails>;
    stencil?: Partial<StencilCalculationDetails>;
    smt?: Partial<SmtCalculationDetails>;
  };
  breakdown: Record<string, number>; // 组合产品价格明细
}

// === 新增 计算值类型 ===
interface LeadTimeResult {
  cycleDays: number;
  reason: string[];
}

interface CalValues {
  // === 产品类型标识 ===
  product_type: 'pcb' | 'stencil' | 'smt' | 'combo';
  
  // === 通用计算值（所有产品类型共享） ===
  totalPrice: number; // 总价（产品价格 + 运费）
  unitPrice: number; // 单价
  totalCount: number; // 总数量
  minOrderQty: number; // 最小起订量
  
  // 交期相关
  leadTimeDays: number;
  leadTimeResult: LeadTimeResult | null;
  estimatedFinishDate: string;
  
  // 运费相关
  shippingCost: number;
  shippingWeight: number; // Chargeable weight
  shippingActualWeight: number;
  shippingVolumetricWeight: number;
  courier: string;
  courierDays: string;
  
  // 税费和折扣
  tax: number;
  discount: number;
  
  // 价格说明
  priceNotes: string[];
  
  // === 产品专用计算值（根据product_type只使用其中一个） ===
  pcb_calculation?: PcbCalculationDetails;
  stencil_calculation?: StencilCalculationDetails;
  smt_calculation?: SmtCalculationDetails;
  combo_calculation?: ComboCalculationDetails;
  
  // === 向后兼容字段（暂时保留，逐步迁移） ===
  // @deprecated 使用通用字段或对应的 product_calculation 字段
  pcbPrice?: number;
  breakdown?: Record<string, number>;
  singlePcbArea?: number;
  totalArea?: number;
}

// === 计算值辅助函数 ===
export const getCalculationDetails = (calValues: CalValues) => {
  switch (calValues.product_type) {
    case 'pcb':
      return calValues.pcb_calculation;
    case 'stencil':
      return calValues.stencil_calculation;
    case 'smt':
      return calValues.smt_calculation;
    case 'combo':
      return calValues.combo_calculation;
    default:
      return null;
  }
};

export const getTotalPrice = (calValues: CalValues): number => {
  // 总价现在是通用字段
  return calValues.totalPrice;
};

export const getUnitPrice = (calValues: CalValues): number => {
  // 单价现在是通用字段
  return calValues.unitPrice;
};

export const getProductPrice = (calValues: CalValues): number => {
  const details = getCalculationDetails(calValues);
  if (details) {
    switch (calValues.product_type) {
      case 'pcb':
        return (details as PcbCalculationDetails).pcbPrice;
      case 'stencil':
        return (details as StencilCalculationDetails).stencilPrice;
      case 'smt':
        return (details as SmtCalculationDetails).smtPrice;
      case 'combo':
        return (details as ComboCalculationDetails).comboPrice;
      default:
        return 0;
    }
  }
  return calValues.pcbPrice || 0;
};

// === Store 状态类型 ===
interface QuoteStoreState {
  // 表单数据
  formData: QuoteFormData;
  originalData: QuoteFormData;
  
  // 状态管理
  validationState: ValidationState;
  isSubmitting: boolean;
  isDirty: boolean;
  
  // 错误处理
  errors: ErrorState;
  
  // 调试和配置
  debugMode: boolean;
  autoSaveEnabled: boolean;
  lastSavedAt: Date | null;
  
  // 计算属性
  isValid: boolean;
  hasChanges: boolean;
  calculated: CalculatedProperties;
  
  // 新增 计算值
  calValues: CalValues;
}

// === Store Actions 类型 ===
interface QuoteStoreActions {
  // 基础操作
  updateFormData: (updates: Partial<QuoteFormData>) => void;
  updateField: <K extends keyof QuoteFormData>(field: K, value: QuoteFormData[K]) => void;
  resetForm: () => void;
  resetToOriginal: () => void;
  
  // 验证操作
  validateForm: () => Promise<boolean>;
  validateField: <K extends keyof QuoteFormData>(field: K, value: QuoteFormData[K]) => Promise<boolean>;
  clearErrors: () => void;
  clearFieldError: (field: string) => void;
  
  // 提交操作
  submitForm: () => Promise<{ success: boolean; data?: QuoteFormData; error?: string }>;
  saveProgress: () => Promise<void>;
  
  // 状态管理
  setValidationState: (state: ValidationState) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  markAsSaved: () => void;
  
  // 调试和工具
  toggleDebugMode: () => void;
  exportFormData: () => string;
  importFormData: (jsonData: string) => boolean;
  getFormSummary: () => Record<string, unknown>;
  
  // 内部辅助方法
  hasFormChanges: () => boolean;
  
  // 计算属性相关方法
  updateCalculatedProperties: () => void;
  getCalculatedProperty: <K extends keyof CalculatedProperties>(key: K) => CalculatedProperties[K];
  getAllCalculatedProperties: () => CalculatedProperties;
  
  // 新增 计算值相关方法
  setCalValues: (values: Partial<CalValues>) => void;
}

type QuoteStore = QuoteStoreState & QuoteStoreActions;

// === 默认值定义 ===
// Store 拥有自己的默认值定义，不依赖 zod 提取
const DEFAULT_FORM_DATA: QuoteFormData = {
  // Basic Information
  pcbType: PcbType.FR4,
  layers: 2,
  thickness: 1.6,
  hdi: HdiType.None,
  tg: TgType.TG135,
  shipmentType: ShipmentType.Single,
  singleDimensions: { length: 50, width: 50 },
  singleCount: 0,
  panelDimensions: { row: 1, column: 1 },
  panelSet: 0,
  differentDesignsCount: 1,
  border: BorderType.Five,
  borderCutType: BorderCutType.VCut,
  breakAwayRail: BreakAwayRail.None,
  useShengyiMaterial: false,
  pcbNote: '',

  // Delivery Information
  deliveryOptions: {
    delivery: DeliveryType.Standard,
    urgentReduceDays: 0,
  },

  // Process Information
  outerCopperWeight: CopperWeight.One,
  innerCopperWeight: InnerCopperWeight.Half,
  minTrace: MinTrace.SixSix,
  minHole: MinHole.ZeroThree,
  solderMask: SolderMask.Green,
  silkscreen: Silkscreen.White,
  surfaceFinish: SurfaceFinish.HASL,
  surfaceFinishEnigType: SurfaceFinishEnigType.Enig1u,
  impedance: false,
  goldFingers: false,
  goldFingersBevel: false,
  edgePlating: false,
  halfHole: '',
  edgeCover: EdgeCover.None,
  maskCover: MaskCover.TentedVias,
  bga: false,
  holeCu25um: false,
  blueMask: false,
  holeCount: undefined,

  // Service Information
  testMethod: TestMethod.FlyingProbe,
  productReport: [ProductReport.None],
  workingGerber: WorkingGerber.NotRequired,
  ulMark: false,
  crossOuts: CrossOuts.Accept,
  ipcClass: IPCClass.Level2,
  ifDataConflicts: IfDataConflicts.FollowOrder,
  specialRequests: '',

  // File Upload
  gerberUrl: '',

  // Shipping & Notes
  shippingCostEstimation: {
    country: '',
    courier: '',
  },
  shippingAddress: {
    country: '',
    state: '',
    city: '',
    address: '',
    zipCode: '',
    phone: '',
    contactName: '',
    courier: '',
  },
  customs: undefined,
  customsNote: '',
  userNote: '',
};

const DEFAULT_CAL_VALUES: CalValues = {
  // === 产品类型标识 ===
  product_type: 'pcb', // 默认PCB产品
  
  // === 通用计算值（所有产品类型共享） ===
  totalPrice: 0, // 总价（产品价格 + 运费）
  unitPrice: 0, // 单价
  totalCount: 0, // 总数量
  minOrderQty: 0, // 最小起订量
  
  // 交期相关
  leadTimeDays: 0,
  leadTimeResult: null,
  estimatedFinishDate: "",
  
  // 运费相关
  shippingCost: 0,
  shippingWeight: 0, // Chargeable weight
  shippingActualWeight: 0,
  shippingVolumetricWeight: 0,
  courier: "",
  courierDays: "",
  
  // 税费和折扣
  tax: 0,
  discount: 0,
  
  // 价格说明
  priceNotes: [],
  
  // === 向后兼容字段（暂时保留，逐步迁移） ===
  pcbPrice: 0,
  breakdown: {},
  singlePcbArea: 0,
  totalArea: 0,
};

// === 计算属性辅助函数 ===
const calculateProperties = (formData: QuoteFormData): CalculatedProperties => {
  let totalQuantity = 0;
  if (formData.shipmentType === ShipmentType.Single) {
    totalQuantity = (formData.singleCount || 0) * (formData.differentDesignsCount || 1);
  } else if (
    formData.shipmentType === ShipmentType.PanelByGerber ||
    formData.shipmentType === ShipmentType.PanelBySpeedx
  ) {
    const row = formData.panelDimensions?.row ?? 0;
    const column = formData.panelDimensions?.column ?? 0;
    const panelSet = formData.panelSet ?? 0;
    totalQuantity = row * column * panelSet;
  }
  const { singleArea, totalArea } = calculateTotalPcbArea(formData);
  return {
    totalQuantity,
    singlePcbArea: singleArea,
    totalArea,
  };
};

// === Store 实现 ===
const useQuoteStore = create<QuoteStore>()(
  persist(
    (set, get) => ({
      // === 初始状态 ===
      formData: { ...DEFAULT_FORM_DATA },
      originalData: { ...DEFAULT_FORM_DATA },
      validationState: 'idle' as ValidationState,
      isSubmitting: false,
      isDirty: false,
      errors: {
        fieldErrors: {},
        formErrors: null,
        businessErrors: [],
        systemErrors: []
      },
      debugMode: false,
      autoSaveEnabled: true,
      lastSavedAt: null,
      isValid: false,
      hasChanges: false,
      calculated: calculateProperties(DEFAULT_FORM_DATA),
      calValues: { ...DEFAULT_CAL_VALUES },

      // === 基础操作 ===
      updateFormData: (updates: Partial<QuoteFormData>) => {
        set((state) => {
          const newFormData = { ...state.formData, ...updates };
          
          return {
            ...state,
            formData: newFormData,
            calculated: calculateProperties(newFormData),
            isDirty: true,
            hasChanges: true,
          };
        });
      },

      updateField: (field, value) => {
        set((state) => {
          const newFormData = { ...state.formData, [field]: value };
          const newFieldErrors = { ...state.errors.fieldErrors };
          delete newFieldErrors[field as string];
          const hasChanges = JSON.stringify(newFormData) !== JSON.stringify(state.originalData);
          return {
            ...state,
            formData: newFormData,
            calculated: calculateProperties(newFormData),
            isDirty: true,
            hasChanges,
            validationState: 'idle',
            errors: {
              ...state.errors,
              fieldErrors: newFieldErrors,
            },
          };
        });
      },

      resetForm: () => {
        set((state) => ({
          ...state,
          formData: { ...DEFAULT_FORM_DATA },
          originalData: { ...DEFAULT_FORM_DATA },
          calculated: calculateProperties(DEFAULT_FORM_DATA),
          isDirty: false,
          hasChanges: false,
          validationState: 'idle',
          errors: {
            fieldErrors: {},
            formErrors: null,
            businessErrors: [],
            systemErrors: []
          },
        }));
      },

      resetToOriginal: () => {
        set((state) => ({
          ...state,
          formData: { ...state.originalData },
          calculated: calculateProperties(state.originalData),
          isDirty: false,
          hasChanges: false,
          validationState: 'idle',
          errors: {
            fieldErrors: {},
            formErrors: null,
            businessErrors: [],
            systemErrors: []
          },
        }));
      },

      // === 验证操作 ===
      validateForm: async () => {
        const { formData } = get();
        set((state) => ({
          ...state,
          validationState: 'validating',
        }));
        try {
          const result = quoteSchema.safeParse(formData);
          if (result.success) {
            set((state) => ({
              ...state,
              validationState: 'valid',
              isValid: true,
              errors: {
                fieldErrors: {},
                formErrors: null,
                businessErrors: [],
                systemErrors: []
              },
            }));
          } else {
            set((state) => ({
              ...state,
              validationState: 'invalid',
              isValid: false,
              errors: {
                fieldErrors: Object.fromEntries(
                  result.error.errors.map(error => [error.path.join('.'), [error.message]])
                ),
                formErrors: result.error.errors.map(e => e.message),
                businessErrors: [],
                systemErrors: []
              },
            }));
          }
          return result.success;
        } catch (error) {
          set((state) => ({
            ...state,
            validationState: 'invalid',
            isValid: false,
            errors: {
              systemErrors: [
                error instanceof Error ? error.message : 'Validation failed'
              ],
              fieldErrors: {},
              formErrors: null,
              businessErrors: [],
            },
          }));
          return false;
        }
      },

      validateField: async (field, value) => {
        try {
          const tempData = { ...get().formData, [field]: value };
          const result = quoteSchema.safeParse(tempData);
          if (result.success) {
            set((state) => {
              const newFieldErrors = { ...state.errors.fieldErrors };
              delete newFieldErrors[field as string];
              return {
                ...state,
                errors: {
                  ...state.errors,
                  fieldErrors: newFieldErrors,
                },
              };
            });
          } else {
            set((state) => ({
              ...state,
              errors: {
                ...state.errors,
                fieldErrors: {
                  ...state.errors.fieldErrors,
                  [field]: result.error.errors
                    .filter(error => error.path.includes(field as string))
                    .map(error => error.message)
                },
              },
            }));
          }
          return result.success;
        } catch (error) {
          set((state) => ({
            ...state,
            errors: {
              ...state.errors,
              fieldErrors: {
                ...state.errors.fieldErrors,
                [field]: [
                  error instanceof Error ? error.message : 'Validation failed'
                ]
              },
            },
          }));
          return false;
        }
      },

      clearErrors: () => {
        set((state) => ({
          ...state,
          errors: {
            fieldErrors: {},
            formErrors: null,
            businessErrors: [],
            systemErrors: []
          },
        }));
      },

      clearFieldError: (field) => {
        set((state) => {
          const newFieldErrors = { ...state.errors.fieldErrors };
          delete newFieldErrors[field];
          return {
            ...state,
            errors: {
              ...state.errors,
              fieldErrors: newFieldErrors,
            },
          };
        });
      },

      // === 提交操作 ===
      submitForm: async () => {
        const { formData, validateForm } = get();
        set((state) => ({
          ...state,
          isSubmitting: true,
        }));
        try {
          const isValid = await validateForm();
          if (!isValid) {
            return { success: false, error: 'Form validation failed' };
          }
          set((state) => ({
            ...state,
            originalData: { ...state.formData },
            isDirty: false,
            hasChanges: false,
            lastSavedAt: new Date(),
          }));
          return { success: true, data: formData };
        } catch (error) {
          set((state) => ({
            ...state,
            errors: {
              ...state.errors,
              systemErrors: [
                error instanceof Error ? error.message : 'Submit failed'
              ],
            },
          }));
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Submit failed'
          };
        } finally {
          set((state) => ({
            ...state,
            isSubmitting: false,
          }));
        }
      },

      saveProgress: async () => {
        try {
          set((state) => ({
            ...state,
            lastSavedAt: new Date(),
            isDirty: false,
          }));
        } catch (error) {
          console.warn('Auto-save failed:', error);
        }
      },

      // === 状态管理 ===
      setValidationState: (validationState: ValidationState) => {
        set((state) => ({
          ...state,
          validationState,
        }));
      },

      setSubmitting: (isSubmitting: boolean) => {
        set((state) => ({
          ...state,
          isSubmitting,
        }));
      },

      markAsSaved: () => {
        set((state) => ({
          ...state,
          lastSavedAt: new Date(),
          isDirty: false,
        }));
      },

      // === 调试和工具 ===
      toggleDebugMode: () => {
        set((state) => ({
          ...state,
          debugMode: !state.debugMode,
        }));
      },

      exportFormData: () => {
        const { formData } = get();
        return JSON.stringify(formData, null, 2);
      },

      importFormData: (jsonData: string) => {
        try {
          const data = JSON.parse(jsonData);
          const result = quoteSchema.safeParse(data);
          if (result.success) {
            set((state) => ({
              ...state,
              formData: result.data,
              calculated: calculateProperties(result.data),
              isDirty: true,
              hasChanges: true,
              validationState: 'valid',
              isValid: true,
            }));
            return true;
          } else {
            console.warn('Invalid import data:', result.error);
            return false;
          }
        } catch (error) {
          console.warn('Failed to parse import data:', error);
          return false;
        }
      },

      getFormSummary: () => {
        const { formData } = get();
        return {
          pcbType: formData.pcbType,
          layers: formData.layers,
          thickness: formData.thickness,
          shipmentType: formData.shipmentType,
          dimensions: formData.singleDimensions,
          count: formData.singleCount,
          surfaceFinish: formData.surfaceFinish,
          solderMask: formData.solderMask,
        };
      },

      // 内部辅助方法
      hasFormChanges: () => {
        const { formData, originalData } = get();
        return JSON.stringify(formData) !== JSON.stringify(originalData);
      },

      // 计算属性相关方法
      updateCalculatedProperties: () => {
        const { formData } = get();
        set((state) => ({
          ...state,
          calculated: calculateProperties(formData),
        }));
      },

      getCalculatedProperty: (key) => {
        return get().calculated[key];
      },

      getAllCalculatedProperties: () => {
        return get().calculated;
      },

      // 新增 计算值相关方法
      setCalValues: (values) => {
        set((state) => ({
          ...state,
          calValues: { ...state.calValues, ...values },
        }));
      },
    }),
    {
      name: 'quote-form-storage',
      partialize: (state) => ({
        formData: state.formData,
        originalData: state.originalData,
        autoSaveEnabled: state.autoSaveEnabled,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // 获取当前会话ID
            const getCurrentSessionId = () => {
              return sessionStorage.getItem('upload-session-id');
            };
            
            // 检查 gerberUrl 是否属于当前会话且有效
            const isCurrentSessionUrl = (url: string) => {
              if (!url || !url.includes('supabase.co/storage') || !url.includes('gerber_uploads')) {
                return false;
              }
              
              const currentSessionId = getCurrentSessionId();
              if (!currentSessionId) {
                return false; // 没有会话ID，清空所有URL
              }
              
              // 从URL中提取会话ID（格式：timestamp-randomStr-sessionId-filename）
              const urlParts = url.split('/');
              const filename = urlParts[urlParts.length - 1];
              
              // 检查文件名是否包含当前会话ID
              return filename.includes(currentSessionId);
            };
            
            // 清空不属于当前会话的 URL
            if (!isCurrentSessionUrl(state.formData.gerberUrl)) {
              state.formData.gerberUrl = '';
            }
            
            if (!isCurrentSessionUrl(state.originalData.gerberUrl)) {
              state.originalData.gerberUrl = '';
            }
          }
        };
      },
    }
  )
);

// 水合安全的hook
export const useQuoteStoreHydrated = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const store = useQuoteStore();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // 在水合完成前返回默认状态(gerberUrl始终为空)
  if (!isHydrated) {
    return {
      ...store,
      formData: { ...DEFAULT_FORM_DATA },
      originalData: { ...DEFAULT_FORM_DATA },
    };
  }

  return store;
};

// 选择器 hooks
export const useQuoteFormData = () => useQuoteStore((state) => state.formData);
export const useQuoteErrors = () => useQuoteStore((state) => state.errors);
export const useQuoteValidation = () => useQuoteStore((state) => ({
  isValid: state.isValid,
  validationState: state.validationState
}));

// 新增计算属性选择器 hooks
export const useQuoteCalculated = () => useQuoteStore((state) => state.calculated);
export const useQuoteCalculatedProperty = <K extends keyof CalculatedProperties>(key: K) => 
  useQuoteStore((state) => state.calculated[key]);

// 组合选择器 hooks
export const useQuoteSummary = () => useQuoteStore((state) => ({
  formData: state.formData,
  calculated: state.calculated,
  isValid: state.isValid,
  hasChanges: state.hasChanges,
  errors: state.errors
}));

export const useQuoteCalValues = () => useQuoteStore((state) => state.calValues);

export { useQuoteStore, DEFAULT_FORM_DATA, calculateProperties };
export type { QuoteStore, QuoteStoreState, QuoteStoreActions, CalculatedProperties };