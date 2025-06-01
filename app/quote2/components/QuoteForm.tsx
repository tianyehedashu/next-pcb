"use client";

import React from "react";
import { createForm } from "@formily/core";
import { FormProvider, FormConsumer } from "@formily/react";
import { useQuoteStore } from "@/lib/stores/quote-store";
import SchemaField from "./FormilyComponents";
import { pcbFormilySchema, fieldGroups } from "../schema/pcbFormilySchema";
import { QuoteFormGroup } from "./QuoteFormGroup";

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
      <div className="quote-form max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PCB Quote Request</h1>
          <p className="text-gray-600">Configure your PCB specifications and get an instant quote</p>
        </div>
        
        <FormConsumer>
          {() => (
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-8">
              {/* 使用现有的QuoteFormGroup组件渲染分组表单 */}
              {fieldGroups.map((group, index) => (
                <QuoteFormGroup
                  key={group.title}
                  title={group.title}
                  fields={group.fields}
                  schema={pcbFormilySchema}
                  SchemaField={SchemaField}
                  index={index}
                  isLast={index === fieldGroups.length - 1}
                />
              ))}
              
              {/* 表单操作按钮 */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <div className="flex gap-3">
                    <button 
                      type="button" 
                      onClick={handleReset}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Reset Form
                    </button>
                  </div>
                  
                  <button 
                    type="submit"
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Get Quote
                  </button>
                </div>
              </div>
            </form>
          )}
        </FormConsumer>
      </div>
    </FormProvider>
  );
}

export default QuoteForm;