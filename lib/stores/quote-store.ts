import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { quoteSchema, type QuoteFormData } from "../../app/quote2/schema/quoteSchema";
import { 
  PcbType, ShipmentType, BorderType, CopperWeight, InnerCopperWeight, 
  MinTrace, MinHole, SolderMask, Silkscreen, SurfaceFinish, 
  MaskCover, TestMethod, ProductReport, HdiType, TgType,
  SurfaceFinishEnigType, EdgeCover, WorkingGerber, CrossOuts, 
  IPCClass, IfDataConflicts
} from "../../app/quote2/schema/shared-types";
import { 
  calculateWeight, 
  calculateLeadTime, 
  calculateComplexityScore,
  calculateCostMultiplier
} from "./quote-calculations";

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
  isMultiLayer: boolean;
  isHDI: boolean;
  requiresImpedance: boolean;
  hasSpecialFinish: boolean;
  estimatedWeight: number;
  complexityLevel: 'Simple' | 'Standard' | 'Complex' | 'Advanced';
  priceCategory: 'Economy' | 'Standard' | 'Premium' | 'Ultra';
  hasAdvancedFeatures: boolean;
  productionDifficulty: number; // 1-10 scale
  estimatedLeadTime: number; // days
  materialCost: number;
  processingCost: number;
}

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
  singleDimensions: { length: 5, width: 5 },
  singleCount: 0,
  panelDimensions: { row: 1, column: 1 },
  panelSet: 0,
  differentDesignsCount: 1,
  border: BorderType.None,
  useShengyiMaterial: false,
  pcbNote: '',

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
  castellated: false,
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
  rejectBoard: false,
  workingGerber: WorkingGerber.RequireApproval,
  ulMark: false,
  crossOuts: CrossOuts.NotAccept,
  ipcClass: IPCClass.Level2,
  ifDataConflicts: IfDataConflicts.FollowOrder,
  specialRequests: '',

  // File Upload
  gerberUrl: '',

  // Shipping & Notes
  shippingAddress: {
    country: '',
    state: '',
    city: '',
    address: '',
    zipCode: '',
    phone: '',
    contactName: '',
  },
  customs: undefined,
  customsNote: '',
  userNote: '',
};

// === 计算属性辅助函数 ===
const calculateProperties = (formData: QuoteFormData): CalculatedProperties => {
  // 基础计算
  const totalQuantity = formData.singleCount;
  const singlePcbArea = formData.singleDimensions.length * formData.singleDimensions.width;
  const totalArea = singlePcbArea * totalQuantity;
  
  // 层数相关
  const isMultiLayer = formData.layers > 2;
  const isHDI = formData.hdi !== HdiType.None;
  
  // 特殊工艺判断
  const requiresImpedance = formData.impedance;
  const hasSpecialFinish = formData.surfaceFinish !== SurfaceFinish.HASL;
  const hasAdvancedFeatures = formData.castellated || formData.goldFingers || 
    formData.edgePlating || formData.bga || formData.holeCu25um || formData.blueMask;
  
  // 使用工具函数计算重量
  const estimatedWeight = calculateWeight(formData);
  
  // 使用工具函数计算交期
  const estimatedLeadTime = calculateLeadTime(formData);
  
  // 使用工具函数计算复杂度分数
  const complexityScore = calculateComplexityScore(formData);
  
  // 复杂度等级 - 基于分数
  let complexityLevel: CalculatedProperties['complexityLevel'] = 'Simple';
  if (complexityScore >= 80) {
    complexityLevel = 'Advanced';
  } else if (complexityScore >= 60) {
    complexityLevel = 'Complex';
  } else if (complexityScore >= 30) {
    complexityLevel = 'Standard';
  } else {
    complexityLevel = 'Simple';
  }
  
  // 价格类别 - 基于复杂度和特殊工艺
  let priceCategory: CalculatedProperties['priceCategory'] = 'Economy';
  if (complexityScore >= 80 || formData.hdi === HdiType.Step3) {
    priceCategory = 'Ultra';
  } else if (complexityScore >= 60 || hasSpecialFinish || isHDI) {
    priceCategory = 'Premium';
  } else if (complexityScore >= 30 || formData.layers > 4 || hasAdvancedFeatures) {
    priceCategory = 'Standard';
  } else {
    priceCategory = 'Economy';
  }
  
  // 生产难度评分 (1-10) - 基于复杂度分数
  const productionDifficulty = Math.max(1, Math.min(10, Math.ceil(complexityScore / 10)));
  
  // 使用工具函数计算成本系数
  const costMultiplier = calculateCostMultiplier(formData);
  
  // 成本估算 (相对值) - 更精确的计算
  const baseMaterialCost = singlePcbArea * formData.layers * 0.1;
  const materialCost = baseMaterialCost * costMultiplier * totalQuantity;
  const processingCost = productionDifficulty * 10 * costMultiplier * totalQuantity;
  
  return {
    totalQuantity,
    singlePcbArea,
    totalArea,
    isMultiLayer,
    isHDI,
    requiresImpedance,
    hasSpecialFinish,
    estimatedWeight,
    complexityLevel,
    priceCategory,
    hasAdvancedFeatures,
    productionDifficulty,
    estimatedLeadTime,
    materialCost,
    processingCost,
  };
};

// === Store 实现 ===
const useQuoteStore = create<QuoteStore>()(
  devtools(
    persist(
      immer((set, get) => ({
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

        // === 基础操作 ===
        updateFormData: (updates) => {
          set((state) => {
            // 直接更新表单数据，不需要特殊处理文件字段
            Object.assign(state.formData, updates);
            
            // 更新状态
            state.isDirty = true;
            state.hasChanges = get().hasFormChanges();
            state.validationState = 'idle';
            
            // 清除相关字段的错误
            Object.keys(updates).forEach(key => {
              delete state.errors.fieldErrors[key];
            });
          });
        },

        updateField: (field, value) => {
          set((state) => {
            (state.formData as Record<string, unknown>)[field as string] = value;
            
            state.isDirty = true;
            state.hasChanges = get().hasFormChanges();
            state.validationState = 'idle';
            
            // 清除字段错误
            delete state.errors.fieldErrors[field as string];
          });
        },

        resetForm: () => {
          set((state) => {
            state.formData = { ...DEFAULT_FORM_DATA };
            state.originalData = { ...DEFAULT_FORM_DATA };
            state.isDirty = false;
            state.hasChanges = false;
            state.validationState = 'idle';
            state.errors = {
              fieldErrors: {},
              formErrors: null,
              businessErrors: [],
              systemErrors: []
            };
          });
        },

        resetToOriginal: () => {
          set((state) => {
            state.formData = { ...state.originalData };
            state.isDirty = false;
            state.hasChanges = false;
            state.validationState = 'idle';
            state.errors = {
              fieldErrors: {},
              formErrors: null,
              businessErrors: [],
              systemErrors: []
            };
          });
        },

        // === 验证操作 ===
        validateForm: async () => {
          const { formData } = get();
          
          set((state) => {
            state.validationState = 'validating';
          });

          try {
            const result = quoteSchema.safeParse(formData);
            
            set((state) => {
              if (result.success) {
                state.validationState = 'valid';
                state.isValid = true;
                state.errors.fieldErrors = {};
                state.errors.formErrors = null;
              } else {
                state.validationState = 'invalid';
                state.isValid = false;
                
                // 处理验证错误
                const fieldErrors: Record<string, string[]> = {};
                result.error.errors.forEach(error => {
                  const path = error.path.join('.');
                  if (!fieldErrors[path]) {
                    fieldErrors[path] = [];
                  }
                  fieldErrors[path].push(error.message);
                });
                
                state.errors.fieldErrors = fieldErrors;
                state.errors.formErrors = result.error.errors.map(e => e.message);
              }
            });

            return result.success;
          } catch (error) {
            set((state) => {
              state.validationState = 'invalid';
              state.isValid = false;
              state.errors.systemErrors.push(
                error instanceof Error ? error.message : 'Validation failed'
              );
            });
            return false;
          }
        },

        validateField: async (field, value) => {
          try {
            // 创建临时对象进行字段验证
            const tempData = { ...get().formData, [field]: value };
            const result = quoteSchema.safeParse(tempData);
            
            set((state) => {
              if (result.success) {
                delete state.errors.fieldErrors[field as string];
              } else {
                const fieldErrors = result.error.errors
                  .filter(error => error.path.includes(field as string))
                  .map(error => error.message);
                
                if (fieldErrors.length > 0) {
                  state.errors.fieldErrors[field as string] = fieldErrors;
                }
              }
            });

            return result.success;
          } catch (error) {
            set((state) => {
              state.errors.fieldErrors[field as string] = [
                error instanceof Error ? error.message : 'Validation failed'
              ];
            });
            return false;
          }
        },

        clearErrors: () => {
          set((state) => {
            state.errors = {
              fieldErrors: {},
              formErrors: null,
              businessErrors: [],
              systemErrors: []
            };
          });
        },

        clearFieldError: (field) => {
          set((state) => {
            delete state.errors.fieldErrors[field];
          });
        },

        // === 提交操作 ===
        submitForm: async () => {
          const { formData, validateForm } = get();
          
          set((state) => {
            state.isSubmitting = true;
          });

          try {
            // 先验证表单
            const isValid = await validateForm();
            if (!isValid) {
              return { success: false, error: 'Form validation failed' };
            }

            // 这里可以添加实际的提交逻辑
            // const response = await submitQuote(formData);
            
            set((state) => {
              state.originalData = { ...state.formData };
              state.isDirty = false;
              state.hasChanges = false;
              state.lastSavedAt = new Date();
            });

            return { success: true, data: formData };
          } catch (error) {
            set((state) => {
              state.errors.systemErrors.push(
                error instanceof Error ? error.message : 'Submit failed'
              );
            });
            return { 
              success: false, 
              error: error instanceof Error ? error.message : 'Submit failed' 
            };
          } finally {
            set((state) => {
              state.isSubmitting = false;
            });
          }
        },

        saveProgress: async () => {
          try {
            // 这里可以添加自动保存逻辑
            // await saveProgress(formData);
            
            set((state) => {
              state.lastSavedAt = new Date();
              state.isDirty = false;
            });
          } catch (error) {
            console.warn('Auto-save failed:', error);
          }
        },

        // === 状态管理 ===
        setValidationState: (validationState: ValidationState) => {
          set((state) => {
            state.validationState = validationState;
          });
        },

        setSubmitting: (isSubmitting: boolean) => {
          set((state) => {
            state.isSubmitting = isSubmitting;
          });
        },

        markAsSaved: () => {
          set((state) => {
            state.lastSavedAt = new Date();
            state.isDirty = false;
          });
        },

        // === 调试和工具 ===
        toggleDebugMode: () => {
          set((state) => {
            state.debugMode = !state.debugMode;
          });
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
              set((state) => {
                state.formData = result.data;
                state.isDirty = true;
                state.hasChanges = true;
                state.validationState = 'valid';
                state.isValid = true;
              });
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
          
          // 现在可以直接比较，因为没有File对象了
          return JSON.stringify(formData) !== JSON.stringify(originalData);
        },

        // 计算属性相关方法
        updateCalculatedProperties: () => {
          const { formData } = get();
          set((state) => {
            state.calculated = calculateProperties(formData);
          });
        },

        getCalculatedProperty: (key) => {
          return get().calculated[key];
        },

        getAllCalculatedProperties: () => {
          return get().calculated;
        },
      })),
      {
        name: 'quote-form-storage',
        partialize: (state) => ({
          formData: state.formData,
          originalData: state.originalData,
          autoSaveEnabled: state.autoSaveEnabled,
        }),
      }
    ),
    { name: 'quote-store' }
  )
);

// 自动计算属性订阅器 - 在 store 创建后立即设置
useQuoteStore.subscribe(
  () => {
    // 当 store 状态变化时，自动更新计算属性
    const currentState = useQuoteStore.getState();
    useQuoteStore.setState({
      calculated: calculateProperties(currentState.formData)
    });
  }
);

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

export { useQuoteStore, DEFAULT_FORM_DATA, calculateProperties };
export type { QuoteStore, QuoteStoreState, QuoteStoreActions, CalculatedProperties };