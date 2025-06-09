"use client";

import React from "react";
import { createForm, Form, onFieldValueChange, Field } from "@formily/core";
import { FormProvider, FormConsumer, useForm } from "@formily/react";
import { useQuoteStore, DEFAULT_FORM_DATA, useQuoteCalculated } from "@/lib/stores/quote-store";
import { useUserStore } from "@/lib/userStore";
import { supabase } from "@/lib/supabaseClient";
import SchemaField from "./FormilyComponents";
import { pcbFormilySchema, fieldGroups } from "../schema/pcbFormilySchema";
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
import { calcPcbPriceV3 } from "@/lib/pcb-calc-v3";
import { calculateLeadTime } from '@/lib/stores/quote-calculations';

// 使用 React.memo 包装字段分组组件
interface QuoteFormGroupMemoProps {
  group: {
    title: string;
    fields: string[];
  };
  index: number;
  schema: any;
  SchemaField: any;
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
          onClick={handleGuestSubmit}
          disabled={isSubmitting || !guestEmail}
          className="bg-blue-600 hover:bg-blue-700"
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
          let msg = '';
          if (err && typeof err === 'object') {
            if (Array.isArray((err as any).issues) && (err as any).issues.length > 0) {
              msg = (err as any).issues[0].message;
            } else if (Array.isArray((err as any).messages) && (err as any).messages.length > 0) {
              msg = (err as any).messages[0];
            } else if ('message' in err) {
              msg = String((err as any).message);
            } else {
              msg = JSON.stringify(err);
            }
          } else if (typeof err === 'string') {
            msg = err;
          } else {
            msg = JSON.stringify(err);
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
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={user ? undefined : (e => { e.preventDefault(); handleGuestSubmitWithSuggest(); })}
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

export function QuoteForm() {
  const { updateFormData, resetForm } = useQuoteStore();
  const user = useUserStore((state) => state.user);
  const router = useRouter();
  const [form, setForm] = React.useState<Form | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isUpdatingFromHydrationRef = React.useRef(false);
  const { uploadState } = useFileUpload();
  const calculated = useQuoteCalculated();
  
  // 游客用户的联系信息
  const [guestEmail, setGuestEmail] = React.useState("");
  const [guestPhone, setGuestPhone] = React.useState("");
  const [showGuestForm, setShowGuestForm] = React.useState(false);
  const [showLoginSuggestDialog, setShowLoginSuggestDialog] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // 使用 useMemo 缓存表单实例
  const formInstance = React.useMemo(() => {
    const initialValues = useQuoteStore.getState().formData;
    const newForm = createForm({
      initialValues,
      validateFirst: true, // 优化验证性能
      effects() {
        // 使用 effects 统一管理表单副作用
        onFieldValueChange('*', () => {
          if (isUpdatingFromHydrationRef.current) return;
          requestAnimationFrame(() => {
            const storeData = useQuoteStore.getState().formData;
            if (JSON.stringify(formInstance.values) !== JSON.stringify(storeData)) {
              updateFormData(formInstance.values);
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
  }, [user?.id, updateFormData]);

  // 使用 useEffect 处理表单实例的更新
  React.useEffect(() => {
    setForm(formInstance);

    const unsubscribe = useQuoteStore.persist.onFinishHydration(() => {
      isUpdatingFromHydrationRef.current = true;
      formInstance.setValues(useQuoteStore.getState().formData, undefined);
      isUpdatingFromHydrationRef.current = false;
    });

    return () => {
      unsubscribe();
    };
  }, [formInstance]);

  // 使用 useMemo 缓存字段分组
  const getVisibleFieldGroups = React.useMemo(() => {
    if (user) {
      return fieldGroups.filter((group, index) => index < 3 || index === 4);
    }
    return fieldGroups.filter((group, index) => index < 4);
  }, [user]);

  // 使用 useCallback 优化事件处理函数
  const handleSubmit = React.useCallback(async () => {
    if (!form) return;
    setIsSubmitting(true);

    try {
      await form.validate(); // 校验通过不抛异常
      setSubmitError(null); // 校验通过清空错误
      await form.submit(async (values) => {
        console.log('Form submitted:', values);

        const gerberFileUrl: string | null = uploadState.uploadUrl || null;

        // 提取关键字段和地址信息
        const { phone: userPhone, shippingAddress, ...pcbSpecData } = values;

        // 计算前端价格、面积、交期
        const priceResult = calcPcbPriceV3(values);
        const leadTimeResult = calculateLeadTime(values, new Date(), values.delivery);

        // 组装cal_values
        const cal_values = {
          singlePcbArea: calculated.singlePcbArea,
          totalArea: calculated.totalArea,
          totalQuantity: calculated.totalQuantity,
          price: priceResult.total,
          priceDetail: priceResult.detail,
          priceNotes: priceResult.notes,
          leadTimeDays: leadTimeResult.cycleDays,
          leadTimeReason: leadTimeResult.reason,
        };

        if (user) {
          // 已登录用户：保存到用户账户并跳转到确认页面
          
          // 确保登录用户必须先完成文件上传才能继续（如果有选择文件）
          if (uploadState.file && (!gerberFileUrl || uploadState.uploadStatus !== 'success')) {
            toast.error("请等待文件上传完成后再提交。");
            setIsSubmitting(false);
            return; // 中止提交
          }
          
          const { data: { session } } = await supabase.auth.getSession();
          const access_token = session?.access_token;

          if (access_token) {
            const response = await fetch('/api/quote', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`
              },
              body: JSON.stringify({
                email: user.email,
                phone: userPhone || null,
                shippingAddress,
                gerberFileUrl,
                ...pcbSpecData,
                cal_values,
              })
            });

            if (response.ok) {
              const result = await response.json();
              toast.success('Quote saved successfully!');
              router.push(`/quote/orders/${result.id}`);
            } else {
              throw new Error('Failed to save quote');
            }
          }
        } else {
          // 游客用户：显示联系信息表单
          setShowGuestForm(true);
        }
      });
    } catch (err: any) {
      // 校验失败，优雅处理错误提示
      let msg = 'Please check the form fields';
      if (err && typeof err === 'object') {
        const fieldTitle =
          err.title ||
          (err.decoratorProps && err.decoratorProps.title) ||
          err.address ||
          err.path ||
          'Field';
        if (Array.isArray(err.issues) && err.issues.length > 0) {
          msg = `${fieldTitle}: ${err.issues[0].message}`;
        } else if (Array.isArray(err.messages) && err.messages.length > 0) {
          msg = `${fieldTitle}: ${err.messages[0]}`;
        } else if ('message' in err) {
          msg = `${fieldTitle}: ${String(err.message)}`;
        }
      }
      setSubmitError(msg);
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
  }, [form, uploadState, router, user, calculated, setSubmitError]);

  const handleReset = React.useCallback(() => {
    if (!form) return;
    form.setValues(DEFAULT_FORM_DATA);
    form.setSubmitting(false);
    form.clearErrors();
  }, [form]);

  const handleGuestSubmit = React.useCallback(async () => {
    if (!form || !guestEmail) return;
    setIsSubmitting(true);

    try {
      const gerberFileUrl: string | null = uploadState.uploadUrl || null;

      // 验证邮箱
      if (!guestEmail.includes('@')) {
        toast.error("请输入有效的邮箱地址");
        setIsSubmitting(false);
        return;
      }

      // 计算前端价格、面积、交期
      const priceResult = calcPcbPriceV3(form.values);
      const leadTimeResult = calculateLeadTime(form.values, new Date(), form.values.delivery);

      // 组装cal_values
      const cal_values = {
        singlePcbArea: calculated.singlePcbArea,
        totalArea: calculated.totalArea,
        totalQuantity: calculated.totalQuantity,
        price: priceResult.total,
        priceDetail: priceResult.detail,
        priceNotes: priceResult.notes,
        leadTimeDays: leadTimeResult.cycleDays,
        leadTimeReason: leadTimeResult.reason,
      };

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
        router.push(`/quote/success?id=${result.id}`);
        resetForm();
      } else {
        throw new Error('Failed to submit guest quote');
      }
    } catch (error) {
      console.error('Guest submit error:', error);
      toast.error('Failed to submit quote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [form, uploadState, guestEmail, guestPhone, router, resetForm, calculated]);

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
      {/* 文件上传区块 */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-blue-900">Upload Gerber File</h3>
          </div>
          <FileUploadSection /> 
        </CardContent>
      </Card>
      <Separator className="my-6" />

      <div className="quote-form p-6 lg:p-8 space-y-8">
        {/* 表单通知系统 */}
        <FormNotificationContainer />

        {/* 表单顶部操作区域 */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">PCB Quote Request</h2>
            <p className="text-blue-600 font-medium mt-2 text-base">For reference only, final price is subject to review.</p>
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
                  schema={pcbFormilySchema}
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
            </form>
          )}
        </FormConsumer>
      </div>
    </FormProvider>
  );
}

export default QuoteForm;