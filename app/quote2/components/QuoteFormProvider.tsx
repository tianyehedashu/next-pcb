"use client";

import { createContext, useContext, ReactNode } from "react";
import { Form } from "@formily/core";

// 表单上下文类型
interface QuoteFormContextType {
  form: Form | null;
  validationState: 'idle' | 'validating' | 'valid' | 'invalid';
  setValidationState: (state: 'idle' | 'validating' | 'valid' | 'invalid') => void;
}

// 创建上下文
const QuoteFormContext = createContext<QuoteFormContextType | null>(null);

// 上下文提供者组件
export function QuoteFormProvider({ 
  children, 
  form,
  validationState = 'idle',
  setValidationState 
}: { 
  children: ReactNode;
  form: Form;
  validationState?: 'idle' | 'validating' | 'valid' | 'invalid';
  setValidationState?: (state: 'idle' | 'validating' | 'valid' | 'invalid') => void;
}) {
  const contextValue: QuoteFormContextType = {
    form,
    validationState,
    setValidationState: setValidationState || (() => {}),
  };

  return (
    <QuoteFormContext.Provider value={contextValue}>
      {children}
    </QuoteFormContext.Provider>
  );
}

// 自定义 Hook 来使用上下文
export function useQuoteForm() {
  const context = useContext(QuoteFormContext);
  if (!context) {
    throw new Error('useQuoteForm must be used within a QuoteFormProvider');
  }
  return context;
}

// 便捷的 Hook 来获取表单值
export function useQuoteFormValues() {
  const { form } = useQuoteForm();
  return form?.values || {};
} 