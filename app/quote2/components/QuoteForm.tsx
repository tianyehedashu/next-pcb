"use client";

import React from "react";
import { createForm, Form } from "@formily/core";
import { FormProvider, FormConsumer } from "@formily/react";
import { useQuoteStore, DEFAULT_FORM_DATA } from "@/lib/stores/quote-store";
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

export function QuoteForm() {
  const { updateFormData, resetForm } = useQuoteStore();
  const user = useUserStore((state) => state.user);
  const router = useRouter();
  const [form, setForm] = React.useState<Form | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // 游客用户的联系信息
  const [guestEmail, setGuestEmail] = React.useState("");
  const [guestPhone, setGuestPhone] = React.useState("");
  const [showGuestForm, setShowGuestForm] = React.useState(false);

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

  // 等待 store 水合完成后创建表单
  React.useEffect(() => {
    const initializeForm = async () => {
      // 如果还没有水合，先等待水合完成
      if (!useQuoteStore.persist.hasHydrated()) {
        await useQuoteStore.persist.rehydrate();
      }
      
      // 水合完成后，使用恢复的数据创建表单
      const newForm = createForm({
        initialValues: useQuoteStore.getState().formData,
      });
      
      // 设置 AddressInput 组件的 userId
      newForm.setFieldState('shippingAddress', state => {
        state.componentProps = {
          ...state.componentProps,
          userId: user?.id
        };
      });
      
      setForm(newForm);
    };

    initializeForm();
  }, [user?.id]); // 添加 user?.id 作为依赖

  // 监听表单变化，等待联动完成后同步到 store
  React.useEffect(() => {
    if (!form) return;

    // 使用防抖，等待联动完成后再同步到 store
    let timeoutId: NodeJS.Timeout;
    let isUpdating = false;

    const syncToStore = () => {
      if (isUpdating) return;
      isUpdating = true;
      
      // 使用 requestAnimationFrame 确保在下一帧更新，让联动完全完成
      requestAnimationFrame(() => {
        updateFormData(form.values);
        isUpdating = false;
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptionId = form.subscribe((payload: any) => {
      if (payload.type === 'onFormValuesChange') {
        // 清除之前的定时器
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        // 设置新的定时器，等待联动完成
        timeoutId = setTimeout(syncToStore, 150); // 150ms 延迟，确保联动完成
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
        updateFormData(values);
        
        // 提取关键字段和地址信息
        const { phone: userPhone, shippingAddress, gerberUrl, ...pcbSpecData } = values;
        
        if (user) {
          // 已登录用户：保存到用户账户并跳转到确认页面
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
                gerberFileUrl: gerberUrl || null,
                ...pcbSpecData // 所有PCB规格作为平铺字段传递，后端会合并为JSON
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
  }, [form, updateFormData, user, router]);

  const handleGuestSubmit = React.useCallback(async () => {
    if (!form || !guestEmail) return;
    
    setIsSubmitting(true);
    
    try {
      // 提取关键字段和地址信息
      const { shippingAddress, gerberUrl, ...pcbSpecData } = form.values;
      
      const response = await fetch('/api/quote/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: guestEmail,
          phone: guestPhone || null,
          shippingAddress,
          gerberFileUrl: gerberUrl || null,
          ...pcbSpecData // 所有PCB规格作为平铺字段传递，后端会合并为JSON
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
  }, [form, guestEmail, guestPhone, router, resetForm]);

  const handleReset = React.useCallback(() => {
    if (!form) return;
    
    // 重置 store 到默认值
    resetForm();
    
    // 使用导入的默认值，确保与 store 中的默认值一致
    form.setValues(DEFAULT_FORM_DATA);
    
    // 清除表单的修改状态和错误
    form.setSubmitting(false);
    form.clearErrors();
  }, [form, resetForm]);

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
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-8">
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
            </form>
          )}
        </FormConsumer>
      </div>
    </FormProvider>
  );
}

export default QuoteForm;