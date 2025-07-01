"use client";

import React from "react";
import { createForm, Form, onFieldValueChange, Field } from "@formily/core";
import { FormProvider, FormConsumer, useForm } from "@formily/react";
import { useQuoteStore, useQuoteCalculated, useQuoteCalValues } from "@/lib/stores/quote-store";
import { useUserStore } from "@/lib/userStore";
import { supabase } from "@/lib/supabaseClient";
import SchemaField from "./FormilyComponents";
// import { pcbFormilySchema } from "../schema/pcbFormilySchema";
import { QuoteFormGroup } from "./QuoteFormGroup";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RotateCcw, Send, User, Mail, AlertCircle } from "lucide-react";
import { FormNotificationContainer } from "./FormNotificationSystem";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileUploadSection } from "./FileUploadSection";
import { Separator } from "@/components/ui/separator";
import { useFileUpload } from "../hooks/useFileUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// === 新增：产品类型支持 ===
import { ProductTypeSelector } from "./ProductTypeSelector";
import { ProductType } from "../schema/stencilTypes";
import { 
  getSchemaByProductType, 
  getFieldGroups, 
  getDefaultFormData,
  getProductTypeInfo,
  ProductTypeManager 
} from "../schema/productSchemas";
import { useProductCalculation } from "../hooks/useProductCalculation";

// 使用 React.memo 包装字段分组组件
interface QuoteFormGroupMemoProps {
  group: {
    title: string;
    fields: string[];
  };
  index: number;
  schema: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  SchemaField: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const QuoteFormGroupMemo = React.memo(({ group, index, schema, SchemaField }: QuoteFormGroupMemoProps) => (
  <div className="group" id={`form-step-${index}`}>
    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-200">
      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm">
        {index + 1}
      </div>
      <h3 className="text-lg font-semibold text-gray-900">
        {group.title}
      </h3>
    </div>
    <div className="pl-4">
      <QuoteFormGroup
        fields={group.fields}
        schema={schema}
        SchemaField={SchemaField}
      />
    </div>
  </div>
));
QuoteFormGroupMemo.displayName = 'QuoteFormGroupMemo';

// 使用 React.memo 包装游客联系信息表单
interface GuestContactFormProps {
  guestEmail: string;
  guestPhone: string;
  setGuestEmail: (email: string) => void;
  setGuestPhone: (phone: string) => void;
  setShowGuestForm: (show: boolean) => void;
  handleGuestSubmit: () => void;
  isSubmitting: boolean;
}

const GuestContactForm = React.memo(({ 
  guestEmail, 
  guestPhone, 
  setGuestEmail, 
  setGuestPhone, 
  setShowGuestForm, 
  handleGuestSubmit, 
  isSubmitting 
}: GuestContactFormProps) => (
  <Card className="border-blue-200 bg-blue-50/50">
    <CardContent className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-900">Contact Information</h3>
      </div>
      <p className="text-sm text-blue-700 mb-4">
        Please provide your contact information so we can send you the quote and follow up.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="guest-email" className="text-blue-800">Email Address *</Label>
          <Input
            id="guest-email"
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="guest-phone" className="text-blue-800">Phone Number</Label>
          <Input
            id="guest-phone"
            type="tel"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            placeholder="+1234567890"
            className="mt-1"
          />
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowGuestForm(false)}
          disabled={isSubmitting}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={() => {
            if (!isSubmitting && guestEmail) {
              handleGuestSubmit();
            }
          }}
          disabled={isSubmitting || !guestEmail}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Submit Quote Request
            </>
          )}
        </Button>
      </div>
    </CardContent>
  </Card>
));
GuestContactForm.displayName = 'GuestContactForm';

// 使用 React.memo 包装提交按钮区域
interface SubmitButtonSectionProps {
  user: {
    id: string;
    email?: string;
  } | null;
  isSubmitting: boolean;
  handleGuestSubmitWithSuggest: () => void;
  submitError: string | null;
  setSubmitError: (msg: string | null) => void;
}

const SubmitButtonSection = React.memo(({ user, isSubmitting, handleGuestSubmitWithSuggest, submitError, setSubmitError }: SubmitButtonSectionProps) => {
  const form = useForm();

  // 监听表单验证状态
  React.useEffect(() => {
    if (!form) return;

    type FormEvent = {
      type: string;
      payload: Field;
    };

    const subscription = form.subscribe((event: FormEvent) => {
      if (event.type === 'onFieldValidateStart') {
        setSubmitError(null);
      } else if (event.type === 'onFieldValidateEnd') {
        if (event.payload.errors?.length > 0) {
          const err = event.payload.errors[0];
          // 获取字段 title
          const fieldTitle =
            event.payload.title ||
            (event.payload.decoratorProps && event.payload.decoratorProps.title) ||
            event.payload.address ||
            event.payload.path ||
            'Field';
          
          let msg = 'This field is required';
          
          if (err && typeof err === 'object') {
            const errorObj = err as Record<string, unknown>;
            // 尝试多种方式提取错误信息
            if (typeof errorObj.message === 'string' && errorObj.message) {
              msg = errorObj.message;
            } else if (Array.isArray(errorObj.issues) && errorObj.issues.length > 0) {
              const issue = errorObj.issues[0] as Record<string, unknown>;
              msg = typeof issue.message === 'string' ? issue.message : 'This field is required';
            } else if (Array.isArray(errorObj.messages) && errorObj.messages.length > 0) {
              msg = String(errorObj.messages[0]);
            } else {
              // 如果没有找到标准的错误信息，使用默认值
              msg = 'This field is required';
            }
          } else if (typeof err === 'string' && err) {
            msg = err;
          }
          
          setSubmitError(`${fieldTitle}: ${msg}`);
        }
      }
    });

    return () => {
      form.unsubscribe(subscription);
    };
  }, [form, setSubmitError]);

  return (
    <Card className="border-gray-200/60 shadow-sm bg-gradient-to-r from-gray-50/50 to-blue-50/50">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-sm text-gray-500">
                Ready to get your quote?
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={user ? undefined : (e => { 
                  e.preventDefault(); 
                  if (!isSubmitting) {
                    handleGuestSubmitWithSuggest(); 
                  }
                })}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {user ? 'Save & Continue' : 'Get Instant Quote'}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 错误提示 */}
          {submitError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{submitError}</span>
              </div>
            </div>
          )}

          {/* 用户状态提示 */}
          <div className="mt-4 pt-4 border-t border-gray-200/50">
            {user ? (
              <div className="flex flex-wrap gap-4 text-xs text-gray-500 justify-center">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  Logged in as {user.email}
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  Quote will be saved to your account
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 text-xs text-gray-500 justify-center">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  Instant pricing
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  No account required
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  Professional support
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
SubmitButtonSection.displayName = 'SubmitButtonSection';

// 使用 React.memo 包装错误提示弹窗
interface ErrorDialogProps {
  showErrorDialog: boolean;
  setShowErrorDialog: (show: boolean) => void;
  errorMessage: string | null;
}

const ErrorDialog = React.memo(({ 
  showErrorDialog, 
  setShowErrorDialog, 
  errorMessage 
}: ErrorDialogProps) => (
    <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Validation Error
          </DialogTitle>
          <DialogDescription className="text-gray-700">
            Please fix the following issue before submitting:
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">
            {errorMessage || 'Unknown validation error occurred'}
          </p>
        </div>
        <DialogFooter>
          <Button onClick={() => setShowErrorDialog(false)}>Got it</Button>
        </DialogFooter>
              </DialogContent>
      </Dialog>
));
ErrorDialog.displayName = 'ErrorDialog';

// 使用 React.memo 包装登录建议弹窗
interface LoginSuggestDialogProps {
  showLoginSuggestDialog: boolean;
  setShowLoginSuggestDialog: (show: boolean) => void;
  handleLoginRedirect: () => void;
  handleContinueAsGuest: () => void;
}

const LoginSuggestDialog = React.memo(({ 
  showLoginSuggestDialog, 
  setShowLoginSuggestDialog, 
  handleLoginRedirect, 
  handleContinueAsGuest 
}: LoginSuggestDialogProps) => (
  <Dialog open={showLoginSuggestDialog} onOpenChange={setShowLoginSuggestDialog}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Get a Better Experience</DialogTitle>
        <DialogDescription>
          Log in to manage your quotes, track orders, and enjoy faster checkout. Would you like to log in now?
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={handleLoginRedirect}>Log In</Button>
        <Button onClick={handleContinueAsGuest}>Continue as Guest</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
));
LoginSuggestDialog.displayName = 'LoginSuggestDialog';

export function QuoteForm({ editId }: { editId?: string }) {
  const { updateFormData, resetForm } = useQuoteStore();
  const user = useUserStore((state) => state.user);
  const router = useRouter();
  const [form, setForm] = React.useState<Form | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isUpdatingFromHydrationRef = React.useRef(false);
  const { uploadState } = useFileUpload();
  const calculated = useQuoteCalculated();
  const calValues = useQuoteCalValues();
  
  // === 新增：产品类型管理 ===
  useProductCalculation(); // 启用产品计算功能
  const [currentProductType, setCurrentProductType] = React.useState<ProductType>(ProductType.PCB);
  const [isProductTypeSwitching, setIsProductTypeSwitching] = React.useState(false);
  
  // === 产品类型初始化 ===
  React.useEffect(() => {
    // 从表单数据中获取产品类型
    const formData = useQuoteStore.getState().formData;
    const productType = ProductTypeManager.getProductTypeFromFormData(formData);
    setCurrentProductType(productType);
  }, []);

  // === 产品类型切换处理 ===
  const handleProductTypeChange = React.useCallback(async (newProductType: ProductType) => {
    if (newProductType === currentProductType || isProductTypeSwitching) {
      return;
    }

    setIsProductTypeSwitching(true);
    
    try {
      // 获取当前表单数据
      const currentFormData = form?.values || useQuoteStore.getState().formData;
      
      // 执行产品类型切换
      const newFormData = ProductTypeManager.switchProductType(
        currentFormData,
        currentProductType,
        newProductType
      );

      // 更新store
      updateFormData(newFormData);
      
      // 如果表单已创建，更新表单值
      if (form) {
        isUpdatingFromHydrationRef.current = true;
        form.setValues(newFormData);
        isUpdatingFromHydrationRef.current = false;
      }

      // 更新当前产品类型
      setCurrentProductType(newProductType);
      
      // 显示切换成功提示
      const productInfo = getProductTypeInfo(newProductType);
      toast.success(`Switched to ${productInfo.title}`, {
        description: `Form fields updated for ${productInfo.description.toLowerCase()}`
      });

    } catch (error) {
      console.error('产品类型切换失败:', error);
      toast.error('Failed to switch product type', {
        description: 'Please try again or refresh the page'
      });
    } finally {
      setIsProductTypeSwitching(false);
    }
  }, [currentProductType, form, updateFormData, isProductTypeSwitching]);
  
  // 编辑模式相关状态
  const [isEditMode] = React.useState(!!editId);
  const [editData, setEditData] = React.useState<Record<string, any> | null>(null);
  const [isLoadingEditData, setIsLoadingEditData] = React.useState(!!editId);
  const [editPermissionError, setEditPermissionError] = React.useState<string | null>(null);
  
  // 防抖相关状态
  const lastSubmitTimeRef = React.useRef<number>(0);
  const SUBMIT_DEBOUNCE_TIME = 2000; // 2秒防抖
  
  // 游客用户的联系信息
  const [guestEmail, setGuestEmail] = React.useState("");
  const [guestPhone, setGuestPhone] = React.useState("");
  const [showGuestForm, setShowGuestForm] = React.useState(false);
  const [showLoginSuggestDialog, setShowLoginSuggestDialog] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = React.useState(false);

  // 加载编辑数据
  React.useEffect(() => {
    if (editId && !editData) {
      loadEditData();
    }
  }, [editId, editData]);

  const loadEditData = async () => {
    if (!editId) return;
    
    setIsLoadingEditData(true);
    setEditPermissionError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const access_token = session?.access_token;

      const response = await fetch(`/api/quote/${editId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(access_token && { 'Authorization': `Bearer ${access_token}` })
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          setEditPermissionError('You do not have permission to edit this quote.');
        } else if (response.status === 404) {
          setEditPermissionError('Quote not found.');
        } else {
          setEditPermissionError('Failed to load quote data.');
        }
        return;
      }

      const data = await response.json();
      setEditData(data);
      
      // 编辑模式下不需要更新 store，表单会直接使用数据库数据初始化
      // 但需要设置 gerber 文件 URL 到 store 中以便文件上传组件使用
      if (data.gerber_file_url) {
        updateFormData({ gerberUrl: data.gerber_file_url });
      }
      
      // 设置联系信息（如果是游客编辑）
      if (!user && data.email) {
        setGuestEmail(data.email);
        setGuestPhone(data.phone || '');
      }
      
    } catch (error) {
      console.error('Error loading edit data:', error);
      setEditPermissionError('Failed to load quote data.');
    } finally {
      setIsLoadingEditData(false);
    }
  };

  // 检查编辑权限
  const canEdit = React.useMemo(() => {
    if (!editData) return false;
    
    // 管理员可以编辑所有订单
    if (user?.role === 'admin') {
      return true;
    }
    
    // 用户只能编辑自己的订单，且订单状态允许编辑
    if (user && editData.user_id === user.id) {
      // 检查订单状态是否允许用户编辑
      const allowedStatuses = ['pending', 'draft', 'created'];
      return allowedStatuses.includes(editData.status);
    }
    
    // 游客可以编辑自己的订单（通过邮箱匹配）
    if (!user && !editData.user_id && editData.email) {
      const allowedStatuses = ['pending', 'draft', 'created'];
      return allowedStatuses.includes(editData.status);
    }
    
    return false;
  }, [editData, user]);

  // 获取更新后的状态
  const getUpdatedStatus = (currentStatus: string, isAdmin: boolean) => {
    if (isAdmin) {
      // 管理员修改后保持原状态或设置为需要的状态
      return currentStatus;
    } else {
      // 用户修改后，如果原状态是quoted（已报价），则改为pending（待审核）
      if (currentStatus === 'quoted') {
        return 'pending';
      }
      return currentStatus;
    }
  };

  // 使用 useMemo 缓存表单实例
  const formInstance = React.useMemo(() => {
    // 编辑模式下使用数据库数据，否则使用 store 数据
    const initialValues = isEditMode && editData?.pcb_spec 
      ? editData.pcb_spec 
      : useQuoteStore.getState().formData;
      
    const newForm = createForm({
      initialValues,
      validateFirst: true, // 优化验证性能
      effects() {
        // 使用 effects 统一管理表单副作用
        onFieldValueChange('*', () => {
          if (isUpdatingFromHydrationRef.current) return;
          requestAnimationFrame(() => {
            const storeData = useQuoteStore.getState().formData;
            const formValues = formInstance.values;
            
            // 编辑模式下不自动同步到 store，避免覆盖数据库数据
            if (isEditMode) return;
            
            // 检查是否真的有变化
            if (JSON.stringify(formValues) !== JSON.stringify(storeData)) {
              // 保护 gerberUrl：如果表单中的 gerberUrl 为空，但 store 中有值，则保留 store 中的值
              const updatedValues = { ...formValues };
              if ((!updatedValues.gerberUrl || updatedValues.gerberUrl.trim() === '') && 
                  storeData.gerberUrl && storeData.gerberUrl.trim() !== '') {
                updatedValues.gerberUrl = storeData.gerberUrl;
              }
              
              updateFormData(updatedValues);
            }
          });
        });
      }
    });

    // 设置 AddressInput 组件的 userId
    newForm.setFieldState('shippingAddress', (state) => {
      state.componentProps = {
        ...state.componentProps,
        userId: user?.id,
      };
    });

    return newForm;
  }, [user?.id, updateFormData, isEditMode, editData]);

  // 使用 useEffect 处理表单实例的更新
  React.useEffect(() => {
    setForm(formInstance);

    // 编辑模式下，如果数据已加载，直接设置表单值
    if (isEditMode && editData?.pcb_spec && !isLoadingEditData) {
      isUpdatingFromHydrationRef.current = true;
      formInstance.setValues(editData.pcb_spec, undefined);
      isUpdatingFromHydrationRef.current = false;
    }

    const unsubscribe = useQuoteStore.persist.onFinishHydration(() => {
      // 编辑模式下不使用 store 数据覆盖表单
      if (isEditMode) return;
      
      isUpdatingFromHydrationRef.current = true;
      const storeData = useQuoteStore.getState().formData;
      
      // gerberUrl已经在store的onRehydrateStorage中被清空，直接同步即可
      formInstance.setValues(storeData, undefined);
      
      isUpdatingFromHydrationRef.current = false;
    });

    return () => {
      unsubscribe();
    };
  }, [formInstance, uploadState.file, uploadState.uploadStatus, uploadState.uploadUrl, isEditMode, editData, isLoadingEditData]); // 添加编辑相关依赖

  // 专门处理编辑数据加载完成后的表单初始化
  React.useEffect(() => {
    if (isEditMode && editData?.pcb_spec && form && !isLoadingEditData) {
      isUpdatingFromHydrationRef.current = true;
      
      // 设置表单值为数据库中的数据
      form.setValues(editData.pcb_spec, undefined);
      
      // 如果有 gerber 文件 URL，也设置到表单中
      if (editData.gerber_file_url) {
        form.setFieldState('gerberUrl', state => {
          state.value = editData.gerber_file_url;
        });
      }
      
      // 设置地址信息
      if (editData.shipping_address) {
        form.setFieldState('shippingAddress', state => {
          state.value = editData.shipping_address;
        });
      }
      
      isUpdatingFromHydrationRef.current = false;
    }
  }, [isEditMode, editData, form, isLoadingEditData]);

  // 专门监控 uploadState 的变化，确保 gerberUrl 被正确同步
  React.useEffect(() => {
    if (form && uploadState.uploadUrl && uploadState.uploadUrl.trim() !== '' && uploadState.uploadStatus === 'success') {
      // 强制同步到 store
      updateFormData({ gerberUrl: uploadState.uploadUrl });
      
      // 强制同步到表单
      form.setFieldState('gerberUrl', state => {
        state.value = uploadState.uploadUrl || '';
      });
    }
  }, [form, uploadState.uploadUrl, uploadState.uploadStatus, updateFormData]);

  // 使用 useMemo 缓存字段分组 - 动态根据产品类型获取
  const currentFieldGroups = React.useMemo(() => {
    return getFieldGroups(currentProductType);
  }, [currentProductType]);

  const getVisibleFieldGroups = React.useMemo(() => {
    return currentFieldGroups.filter(group => {
      // 根据用户登录状态决定显示哪些运费相关的字段组
      if (group.title === "Shipping Cost Estimation") {
        // 游客显示运费估算
        return !user;
      }
      if (group.title === "Shipping Information") {
        // 已登录用户显示收货地址
        return !!user;
      }
      // 其他字段组都显示
      return true;
    });
  }, [user, currentFieldGroups]);

  // 动态获取当前产品类型的schema
  const currentSchema = React.useMemo(() => {
    return getSchemaByProductType(currentProductType);
  }, [currentProductType]);

  // 使用 useCallback 优化事件处理函数
  const handleSubmit = React.useCallback(async () => {
    if (!form) return;
    
    // 防抖检查
    const now = Date.now();
    if (isSubmitting || (now - lastSubmitTimeRef.current < SUBMIT_DEBOUNCE_TIME)) {
      console.log('提交被防抖机制阻止');
      return;
    }
    
    // 在提交前检查当前的状态
    const currentStoreData = useQuoteStore.getState().formData;
    form.setFieldState('gerberUrl', state => {
      state.value = currentStoreData.gerberUrl || '';
    });
    
    // 设置提交状态和时间戳
    setIsSubmitting(true);
    lastSubmitTimeRef.current = now;

    try {
      await form.validate(); // 校验通过不抛异常
      
      // 已登录用户的额外验证：检查gerberUrl（仅对PCB产品）
      if (user && currentProductType !== ProductType.STENCIL) {
        const storeData = useQuoteStore.getState().formData;
        const gerberFileUrl = uploadState.uploadUrl || storeData.gerberUrl || form.values.gerberUrl;
        
        // 编辑模式下，如果数据库中已有文件URL，则不强制要求重新上传
        const hasExistingFile = isEditMode && editData?.gerber_file_url;
        
        if (!hasExistingFile && (!gerberFileUrl || gerberFileUrl.trim() === '')) {
          throw [{
            title: 'Gerber File',
            message: 'Gerber file is required for PCB quotes',
            address: 'gerberUrl',
            path: 'gerberUrl'
          }];
        }
        
        // 如果正在上传文件，需要等待上传完成
        if (uploadState.file && uploadState.uploadStatus !== 'success') {
          throw [{
            title: 'Gerber File',
            message: 'Please wait for file upload to complete before submitting',
            address: 'gerberUrl',
            path: 'gerberUrl'
          }];
        }
      }
      
      setSubmitError(null); // 校验通过清空错误
      await form.submit(async (values) => {
        // 从 store 中获取最新的 gerberUrl（最可靠），并提供多层备选
        const storeData = useQuoteStore.getState().formData;
        let gerberFileUrl: string | null = null;
        
        // 修改优先级：优先使用最新上传成功的URL，避免使用缓存的旧URL
        if (uploadState.uploadUrl && uploadState.uploadUrl.trim() !== '' && uploadState.uploadStatus === 'success') {
          gerberFileUrl = uploadState.uploadUrl;
          // 同时更新 store 以保持数据一致性
          updateFormData({ gerberUrl: uploadState.uploadUrl });
        } else if (storeData.gerberUrl && storeData.gerberUrl.trim() !== '') {
          // 只有在没有新上传文件时才使用store中的URL
          gerberFileUrl = storeData.gerberUrl;
        } else if (values.gerberUrl && values.gerberUrl.trim() !== '') {
          gerberFileUrl = values.gerberUrl;
        } else if (isEditMode && editData?.gerber_file_url) {
          // 编辑模式下，如果没有新上传的文件，使用数据库中的现有文件URL
          gerberFileUrl = editData.gerber_file_url;
        } else {
          gerberFileUrl = null;
        }

        // 提取关键字段和地址信息，确保 pcbSpecData 包含 gerberUrl
        const { phone: userPhone, shippingAddress, ...pcbSpecData } = values;
        // 确保 pcbSpecData 中有最新的 gerberUrl
        pcbSpecData.gerberUrl = gerberFileUrl || '';

        // 直接使用 store 中的 calValues
        const cal_values = calValues;

        if (user) {
          // 已登录用户：保存到用户账户并跳转到确认页面
          
          const { data: { session } } = await supabase.auth.getSession();
          const access_token = session?.access_token;

          if (access_token) {
                         // 编辑模式或新建模式
             const isAdmin = user.role === 'admin';
            const apiUrl = isEditMode && editId ? `/api/quote/${editId}` : '/api/quote';
            const method = isEditMode && editId ? 'PUT' : 'POST';
            
                         // 准备请求数据
             const requestData: Record<string, any> = {
              email: user.email,
              phone: userPhone || null,
              shippingAddress,
              gerberFileUrl,
              ...pcbSpecData,
              cal_values,
            };
            
            // 如果是编辑模式，添加状态更新逻辑
            if (isEditMode && editData) {
              requestData.status = getUpdatedStatus(editData.status, isAdmin);
            }

            const response = await fetch(apiUrl, {
              method,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`
              },
              body: JSON.stringify(requestData)
            });

            if (response.ok) {
              const result = await response.json();
              const successMessage = isEditMode ? 'Quote updated successfully!' : 'Quote saved successfully!';
              toast.success(successMessage);
              router.push(`/profile/orders/${result.id}`);
            } else {
              const errorData = await response.json().catch(() => ({}));
              if (response.status === 429) {
                throw new Error(errorData.error || 'Too many requests. Please wait before submitting again.');
              }
              const errorMessage = isEditMode ? 'Failed to update quote' : 'Failed to save quote';
              throw new Error(errorData.error || errorMessage);
            }
          }
        } else {
          // 游客用户：显示联系信息表单
          setShowGuestForm(true);
        }
      });
    } catch (err: unknown) {
      let errorMessage = 'Please fill in all required fields.';
      
      // Formily 验证错误通常是一个数组
      if (Array.isArray(err) && err.length > 0) {
        const firstError = err[0];
        if (firstError && typeof firstError === 'object') {
          const errorObj = firstError as Record<string, unknown>;
          
          // 提取字段标题和错误信息
          const fieldTitle = errorObj.title || errorObj.address || errorObj.path || 'Field';
          
          // 尝试提取错误消息
          let message = 'This field is required';
          if (typeof errorObj.message === 'string') {
            message = errorObj.message;
          } else if (Array.isArray(errorObj.messages) && errorObj.messages.length > 0) {
            message = String(errorObj.messages[0]);
          }
          
          errorMessage = `${fieldTitle}: ${message}`;
        }
      } else if (err && typeof err === 'object') {
        // 如果是验证错误对象，尝试提取有意义的信息
        const errorObj = err as Record<string, unknown>;
        
        // 检查是否有errors数组（Formily字段错误格式）
        if (Array.isArray(errorObj.errors) && errorObj.errors.length > 0) {
          const firstFieldError = errorObj.errors[0];
          if (typeof firstFieldError === 'object' && firstFieldError !== null) {
            const fieldErrorObj = firstFieldError as Record<string, unknown>;
            const fieldName = fieldErrorObj.address || fieldErrorObj.path || 'Unknown field';
            const message = fieldErrorObj.message || 'This field is required';
            errorMessage = `${fieldName}: ${message}`;
          }
        }
        // 检查是否直接是字段错误
        else if (errorObj.address || errorObj.path) {
          const fieldName = errorObj.address || errorObj.path || 'Unknown field';
          const message = errorObj.message || 'This field is required';
          errorMessage = `${fieldName}: ${message}`;
        }
        // 检查是否有message属性
        else if (typeof errorObj.message === 'string') {
          errorMessage = errorObj.message;
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setSubmitError(errorMessage);
      setShowErrorDialog(true); // 显示错误弹框
      
      // 智能滚动：如果是gerber文件错误，滚动到文件上传区域，否则滚动到表单顶部
      if (errorMessage.includes('Gerber File')) {
        // 滚动到文件上传区域
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // 滚动到第一个表单组
        const firstGroup = document.getElementById('form-step-0');
        if (firstGroup) {
          firstGroup.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [form, uploadState, router, user, calculated, setSubmitError, calValues, updateFormData, isSubmitting]);

  const handleGuestSubmit = React.useCallback(async () => {
    if (!form || !guestEmail || isSubmitting) return;
    
    // 防抖检查
    const now = Date.now();
    if (now - lastSubmitTimeRef.current < SUBMIT_DEBOUNCE_TIME) {
      console.log('游客提交被防抖机制阻止');
      return;
    }
    
    setIsSubmitting(true);
    lastSubmitTimeRef.current = now;

    try {
      // 从 store 中获取最新的 gerberUrl（最可靠），并提供多层备选
      const storeData = useQuoteStore.getState().formData;
      let gerberFileUrl: string | null = null;
      
      // 修改优先级：优先使用最新上传成功的URL，避免使用缓存的旧URL
      if (uploadState.uploadUrl && uploadState.uploadUrl.trim() !== '' && uploadState.uploadStatus === 'success') {
        gerberFileUrl = uploadState.uploadUrl;
        // 同时更新 store 以保持数据一致性
        updateFormData({ gerberUrl: uploadState.uploadUrl });
      } else if (storeData.gerberUrl && storeData.gerberUrl.trim() !== '') {
        // 只有在没有新上传文件时才使用store中的URL
        gerberFileUrl = storeData.gerberUrl;
      } else if (form.values.gerberUrl && form.values.gerberUrl.trim() !== '') {
        gerberFileUrl = form.values.gerberUrl;
      } else {
        gerberFileUrl = null;
      }

      // 验证邮箱
      if (!guestEmail.includes('@')) {
        toast.error("请输入有效的邮箱地址");
        return;
      }

      // 直接使用 store 中的 calValues
      const cal_values = calValues;

      const response = await fetch('/api/quote/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: guestEmail,
          phone: guestPhone || null,
          shippingAddress: form.values.shippingAddress,
          gerberFileUrl,
          ...form.values,
          cal_values,
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        router.push(`/quote2/success?id=${result.id}`);
        resetForm();
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error(errorData.error || 'Too many requests. Please wait before submitting again.');
        }
        throw new Error(errorData.error || 'Failed to submit guest quote');
      }
    } catch (error) {
      console.error('Guest submit error:', error);
      toast.error('Failed to submit quote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [form, uploadState, guestEmail, guestPhone, router, resetForm, calValues, updateFormData, isSubmitting]);

  const handleGuestSubmitWithSuggest = React.useCallback(() => {
    setShowLoginSuggestDialog(true);
  }, []);

  const handleContinueAsGuest = React.useCallback(() => {
    setShowLoginSuggestDialog(false);
    setShowGuestForm(true);
  }, []);

  const handleLoginRedirect = React.useCallback(() => {
    setShowLoginSuggestDialog(false);
    router.push("/auth?redirect=/quote2");
  }, [router]);

  // 重置表单处理
  const handleReset = React.useCallback(() => {
    if (isEditMode) {
      // 编辑模式下重置为原始数据
      if (editData?.pcb_spec && form) {
        isUpdatingFromHydrationRef.current = true;
        form.setValues(editData.pcb_spec);
        isUpdatingFromHydrationRef.current = false;
      }
    } else {
      // 新建模式下重置为默认数据
      const defaultData = getDefaultFormData(currentProductType);
      updateFormData(defaultData);
      if (form) {
        isUpdatingFromHydrationRef.current = true;
        form.setValues(defaultData);
        isUpdatingFromHydrationRef.current = false;
      }
    }
    
    toast.success("Form has been reset", {
      description: "All fields have been reset to default values"
    });
  }, [isEditMode, editData, form, currentProductType, updateFormData]);

  // 编辑模式加载状态
  if (isEditMode && isLoadingEditData) {
    return (
      <div className="quote-form p-6 lg:p-8 space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-center">
            <div className="h-8 w-48 bg-gray-200 rounded mb-4 mx-auto"></div>
            <div className="h-4 w-32 bg-gray-200 rounded mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading quote data...</p>
          </div>
        </div>
      </div>
    );
  }

  // 编辑权限错误
  if (isEditMode && editPermissionError) {
    return (
      <div className="quote-form p-6 lg:p-8 space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-red-600 text-lg font-semibold mb-2">Access Denied</div>
            <p className="text-gray-600 mb-4">{editPermissionError}</p>
            <Button onClick={() => router.push('/quote2')} variant="outline">
              Create New Quote
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 编辑模式权限检查
  if (isEditMode && editData && !canEdit) {
    return (
      <div className="quote-form p-6 lg:p-8 space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-yellow-600 text-lg font-semibold mb-2">Cannot Edit</div>
            <p className="text-gray-600 mb-4">
              This quote cannot be edited in its current status: <strong>{editData.status}</strong>
            </p>
            <div className="space-x-2">
              <Button onClick={() => router.push('/quote2')} variant="outline">
                Create New Quote
              </Button>
              <Button onClick={() => router.push(`/profile/orders/${editId}`)} variant="default">
                View Quote
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 在表单未初始化时显示加载状态
  if (!form) {
    return (
      <div className="quote-form p-6 lg:p-8 space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FormProvider form={form}>
      {/* 产品类型选择器 */}
      {!isEditMode && (
        <ProductTypeSelector
          value={currentProductType}
          onChange={handleProductTypeChange}
        />
      )}

      {/* 文件上传区块 */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-blue-900">
              Upload {currentProductType === ProductType.STENCIL ? 'Design' : 'Gerber'} File
            </h3>
          </div>
          <FileUploadSection 
            enableAnalysis={currentProductType !== ProductType.STENCIL}
            productType={currentProductType}
          /> 
        </CardContent>
      </Card>
      <Separator className="my-6" />

      <div className="quote-form p-6 lg:p-8 space-y-8">
        {/* 表单通知系统 */}
        <FormNotificationContainer />

        {/* 表单顶部操作区域 */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditMode 
                ? `Edit ${currentProductType === ProductType.STENCIL ? 'Stencil' : 'PCB'} Quote` 
                : `${currentProductType === ProductType.STENCIL ? 'Stencil' : 'PCB'} Quote Request`
              }
            </h2>
            <p className="text-blue-600 font-medium mt-2 text-base">
              {isEditMode 
                ? 'Modify your quote specifications below.' 
                : 'For reference only, final price is subject to review.'
              }
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="group hover:border-red-300 hover:text-red-600 transition-colors duration-200"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Form
          </Button>
        </div>

        <FormConsumer>
          {() => (
            <form onSubmit={(e) => { 
              e.preventDefault(); 
              handleSubmit(); 
            }} className="space-y-8">
              {/* 使用 React.memo 包装的字段分组组件 */}
              {getVisibleFieldGroups.map((group, index) => (
                <QuoteFormGroupMemo
                  key={group.title}
                  group={group}
                  index={index}
                  schema={currentSchema}
                  SchemaField={SchemaField}
                />
              ))}

              {/* 游客联系信息表单 */}
              {showGuestForm && !user && (
                <GuestContactForm
                  guestEmail={guestEmail}
                  guestPhone={guestPhone}
                  setGuestEmail={setGuestEmail}
                  setGuestPhone={setGuestPhone}
                  setShowGuestForm={setShowGuestForm}
                  handleGuestSubmit={handleGuestSubmit}
                  isSubmitting={isSubmitting}
                />
              )}

              {/* 表单提交按钮区域 */}
              {!showGuestForm && (
                <SubmitButtonSection
                  user={user}
                  isSubmitting={isSubmitting}
                  handleGuestSubmitWithSuggest={handleGuestSubmitWithSuggest}
                  submitError={submitError}
                  setSubmitError={setSubmitError}
                />
              )}

              {/* 游客建议登录弹窗 */}
              <LoginSuggestDialog
                showLoginSuggestDialog={showLoginSuggestDialog}
                setShowLoginSuggestDialog={setShowLoginSuggestDialog}
                handleLoginRedirect={handleLoginRedirect}
                handleContinueAsGuest={handleContinueAsGuest}
              />

              {/* 错误提示弹窗 */}
              <ErrorDialog
                showErrorDialog={showErrorDialog}
                setShowErrorDialog={setShowErrorDialog}
                errorMessage={submitError}
              />
            </form>
          )}
        </FormConsumer>
      </div>
    </FormProvider>
  );
}

export default QuoteForm;