import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { quoteSchema, type QuoteFormData } from "../../app/quote2/schema/quoteSchema";
import { 
  PcbType, ShipmentType, BorderType, CopperWeight, InnerCopperWeight, 
  MinTrace, MinHole, SolderMask, Silkscreen, SurfaceFinish, 
  MaskCover, TestMethod, ProductReport, HdiType, TgType,
  SurfaceFinishEnigType, EdgeCover, WorkingGerber, CrossOuts, 
  IPCClass, IfDataConflicts
} from "../../app/quote2/schema/shared-types";

// === 类型定义 ===
type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid';

// 错误状态接口
interface ErrorState {
  fieldErrors: Record<string, string[]>;
  formErrors: string[] | null;
  businessErrors: string[];
  systemErrors: string[];
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
  gerber: undefined,
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

// === Store 实现 ===
const useQuoteStore = create<QuoteStore>()(
  devtools(
    persist(
      subscribeWithSelector(
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

          // === 基础操作 ===
          updateFormData: (updates) => {
            set((state) => {
              // 更新表单数据
              Object.assign(state.formData, updates);
              
              // 更新状态
              state.isDirty = true;
              state.hasChanges = JSON.stringify(state.formData) !== JSON.stringify(state.originalData);
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
              state.hasChanges = JSON.stringify(state.formData) !== JSON.stringify(state.originalData);
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
        }))
      ),
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

// 选择器 hooks
export const useQuoteFormData = () => useQuoteStore((state) => state.formData);
export const useQuoteErrors = () => useQuoteStore((state) => state.errors);
export const useQuoteValidation = () => useQuoteStore((state) => ({
  isValid: state.isValid,
  validationState: state.validationState
}));

export { useQuoteStore, DEFAULT_FORM_DATA };
export type { QuoteStore, QuoteStoreState, QuoteStoreActions };