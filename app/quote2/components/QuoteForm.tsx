"use client";

import React from "react";
import { createForm, Form } from "@formily/core";
import { FormProvider, FormConsumer } from "@formily/react";
import { useQuoteStore, DEFAULT_FORM_DATA, useQuoteCalculated } from "@/lib/stores/quote-store";
import { useUserStore } from "@/lib/userStore";
import { supabase } from "@/lib/supabaseClient";
import SchemaField from "./FormilyComponents";
import { pcbFormilySchema, fieldGroups } from "../schema/pcbFormilySchema";
import { QuoteFormGroup } from "./QuoteFormGroup";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RotateCcw, Send, User, Mail } from "lucide-react";
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

  // 根据用户登录状态过滤字段分组
  const getVisibleFieldGroups = React.useMemo(() => {
    if (user) {
      // 登录用户：显示前3个分组 + Shipping Information（跳过 Shipping Cost Estimation）
      return fieldGroups.filter((group, index) => index < 3 || index === 4);
    } else {
      // 游客用户：显示前3个分组 + Shipping Cost Estimation（跳过 Shipping Information）
      return fieldGroups.filter((group, index) => index < 4);
    }
  }, [user]);

  // 创建表单实例并在水合完成后设置初始值
  React.useEffect(() => {
    const initialValues = useQuoteStore.getState().formData; // 获取当前 store 的数据，可能还未水合
    const newForm = createForm({
      initialValues: initialValues,
    });

    // 设置 AddressInput 组件的 userId
    newForm.setFieldState('shippingAddress', (state) => {
      state.componentProps = {
        ...state.componentProps,
        userId: user?.id,
      };
    });

    setForm(newForm);

    // 监听 zustand-persist 的水合完成事件
    const unsubscribe = useQuoteStore.persist.onFinishHydration(() => {
      // 设置标志位，暂时阻止来自表单的同步，避免循环
      isUpdatingFromHydrationRef.current = true;
      // 水合完成后，用最新的数据更新表单值
      newForm.setValues(useQuoteStore.getState().formData, undefined); 
      // 重置标志位
      isUpdatingFromHydrationRef.current = false;
    });

    // 清理函数
    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  // 监听表单变化，等待联动完成后同步到 store
  React.useEffect(() => {
    if (!form) return;
    let timeoutId: NodeJS.Timeout;
    let isUpdating = false;
    const syncToStore = () => {
      // 如果当前是由于 store 水合引起的更新，则跳过同步
      if (isUpdatingFromHydrationRef.current) {
        return;
      }
      if (isUpdating) return;
      isUpdating = true;
      requestAnimationFrame(() => {
        const storeData = useQuoteStore.getState().formData;
        if (JSON.stringify(form.values) !== JSON.stringify(storeData)) {
          updateFormData(form.values);
        }
        isUpdating = false;
      });
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptionId = form.subscribe((payload: any) => {
      if (payload.type === 'onFormValuesChange') {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(syncToStore, 150);
      }
    });
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      form.unsubscribe(subscriptionId);
    };
  }, [form, updateFormData]);

  const handleSubmit = React.useCallback(async () => {
    if (!form) return;

    setIsSubmitting(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await form.submit(async (values: any) => {
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
                gerberFileUrl, // 直接使用 Supabase 上传后的 URL
                ...pcbSpecData, // 所有PCB规格作为平铺字段传递，后端会合并为JSON
                cal_values, // 新增：所有计算字段统一放入cal_values
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
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit quote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [form, uploadState, router, user, calculated]);

  const handleGuestSubmit = React.useCallback(async () => {
    console.log('handleGuestSubmit called', {
      guestEmail,
      guestPhone,
      formValues: form?.values,
      isSubmitting,
      showGuestForm,
      showLoginSuggestDialog
    });
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
          gerberFileUrl, // 直接使用 Supabase 上传后的 URL
          ...form.values, // 所有PCB规格作为平铺字段传递，后端会合并为JSON
          cal_values, // 新增：所有计算字段统一放入cal_values
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        // 游客用户跳转到成功页面，携带报价ID作为查询参数
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

  // 游客提交前弹窗建议登录
  const handleGuestSubmitWithSuggest = React.useCallback(() => {
    setShowLoginSuggestDialog(true);
  }, []);

  const handleContinueAsGuest = React.useCallback(() => {
    console.log('handleContinueAsGuest called');
    setShowLoginSuggestDialog(false);
    setShowGuestForm(true);
  }, []);

  const handleLoginRedirect = React.useCallback(() => {
    setShowLoginSuggestDialog(false);
    router.push("/auth?redirect=/quote2");
  }, [router]);

  const handleReset = React.useCallback(() => {
    if (!form) return;
    // 只重置form，不再调用resetForm，避免互相触发
    form.setValues(DEFAULT_FORM_DATA);
    form.setSubmitting(false);
    form.clearErrors();
  }, [form]);

  // 在表单未初始化时显示加载状态
  if (!form) {
    return (
      <div className="quote-form p-6 lg:p-8 space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading form...</div>
        </div>
      </div>
    );
  }

  return (
    <FormProvider form={form}>
     
        {/* 文件上传区块，单独一个 Card，放在表单顶部 */}
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
          

        {/* 添加表单通知系统 */}
        <FormNotificationContainer />


        {/* 表单顶部操作区域 */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">PCB Quote Request</h2>
            <p className="text-gray-600 mt-1">Fill out the form below to get an instant quote</p>
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
              console.log('FormConsumer form onSubmit', { user, showGuestForm, showLoginSuggestDialog });
              handleSubmit(); 
            }} className="space-y-8">
              {/* 使用过滤后的字段分组渲染表单 */}
              {getVisibleFieldGroups.map((group, index) => {
                return (
                  <div key={group.title} className="group" id={`form-step-${index}`}>
                    {/* 简洁的分组标题 */}
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-200">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm">
                        {index + 1}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {group.title}
                      </h3>
                    </div>

                    {/* 表单字段内容 */}
                    <div className="pl-4">
                      <QuoteFormGroup
                        fields={group.fields}
                        schema={pcbFormilySchema}
                        SchemaField={SchemaField}
                      />
                    </div>
                  </div>
                );
              })}

              {/* 游客联系信息表单 */}
              {showGuestForm && !user && (
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
              )}

              {/* 优化的表单提交按钮区域 */}
              {!showGuestForm && (
                <Card className="border-gray-200/60 shadow-sm bg-gradient-to-r from-gray-50/50 to-blue-50/50">
                  <CardContent className="p-6">
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
                  </CardContent>
                </Card>
              )}

              {/* 游客建议登录弹窗 */}
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
            </form>
          )}
        </FormConsumer>
      </div>
    </FormProvider>
  );
}

export default QuoteForm;