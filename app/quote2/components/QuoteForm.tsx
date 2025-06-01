"use client";

import React from "react";
import { createForm } from "@formily/core";
import { FormProvider, FormConsumer } from "@formily/react";
import { useQuoteStore } from "@/lib/stores/quote-store";
import SchemaField from "./FormilyComponents";
import { pcbFormilySchema, fieldGroups } from "../schema/pcbFormilySchema";
import { QuoteFormGroup } from "./QuoteFormGroup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, Send } from "lucide-react";

export function QuoteForm() {
  const { formData, updateFormData, resetForm } = useQuoteStore();

  // 创建 Formily 表单实例
  const form = React.useMemo(() => {
    return createForm({
      initialValues: formData,
    });
  }, [formData]);

  // 订阅表单变化并更新 Store
  React.useEffect(() => {
    const subscriptionId = form.subscribe(({ type, payload }) => {
      if (type === 'onFormValuesChange') {
        updateFormData(payload);
      }
    });

    return () => form.unsubscribe(subscriptionId);
  }, [form, updateFormData]);

  const handleSubmit = React.useCallback(() => {
    if (!form) return;
    
    form.submit((values) => {
      console.log('Form submitted:', values);
      // 处理表单提交逻辑
    });
  }, [form]);

  const handleReset = React.useCallback(() => {
    if (!form) return;
    
    // 使用 Store 的重置方法，会恢复到默认值
    resetForm();
    form.reset();
  }, [form, resetForm]);

  return (
    <FormProvider form={form}>
      <div className="quote-form p-6 lg:p-8 space-y-8">
        <FormConsumer>
          {() => (
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
              {/* 使用现有的QuoteFormGroup组件渲染分组表单 */}
              {fieldGroups.map((group, index) => (
                <div key={group.title} className="group">
                  <Card className="border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-200/60">
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
                        className="group hover:border-red-300 hover:text-red-600 transition-all duration-200"
                      >
                        <RotateCcw className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
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
                        className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        <Send className="h-4 w-4 mr-2 group-hover:translate-x-1 transition-transform duration-200" />
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