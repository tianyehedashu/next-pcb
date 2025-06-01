"use client";

import React from "react";
import { createForm, Form } from "@formily/core";
import { FormProvider, FormConsumer } from "@formily/react";
import { useQuoteStore } from "@/lib/stores/quote-store";
import SchemaField from "./FormilyComponents";
import { pcbFormilySchema, fieldGroups } from "../schema/pcbFormilySchema";
import { QuoteFormGroup } from "./QuoteFormGroup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, Send } from "lucide-react";

export function QuoteForm() {
  const { updateFormData, resetForm } = useQuoteStore();
  const [form, setForm] = React.useState<Form | null>(null);

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
      setForm(newForm);
    };

    initializeForm();
  }, []);

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

  const handleSubmit = React.useCallback(() => {
    if (!form) return;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.submit((values: any) => {
      console.log('Form submitted:', values);
      updateFormData(values);
      // 处理表单提交逻辑
    });
  }, [form, updateFormData]);

  const handleReset = React.useCallback(() => {
    if (!form) return;
    
    // 重置 store 到默认值
    resetForm();
    // 重置表单到默认值
    form.reset();
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
        <FormConsumer>
          {() => (
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
              {/* 使用现有的QuoteFormGroup组件渲染分组表单 */}
              {fieldGroups.map((group, index) => (
                <div key={group.title} className="group">
                  <Card className="border-gray-200/60 shadow-sm hover:shadow-md transition-shadow duration-200 hover:border-blue-200/60">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        {group.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <QuoteFormGroup
                        fields={group.fields}
                        schema={pcbFormilySchema}
                        SchemaField={SchemaField}
                      />
                    </CardContent>
                  </Card>
                </div>
              ))}
              
              {/* 优化的表单操作按钮 */}
              <Card className="border-gray-200/60 shadow-sm bg-gradient-to-r from-gray-50/50 to-blue-50/50">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="flex gap-3">
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
                    
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:block text-sm text-gray-500">
                        Ready to get your quote?
                      </div>
                      <Button 
                        type="submit"
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Get Instant Quote
                      </Button>
                    </div>
                  </div>
                  
                  {/* 额外提示信息 */}
                  <div className="mt-4 pt-4 border-t border-gray-200/50">
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 justify-center">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        Instant pricing
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        No commitment required
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        Professional support
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          )}
        </FormConsumer>
      </div>
    </FormProvider>
  );
}

export default QuoteForm;