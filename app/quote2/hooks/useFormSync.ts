import React from 'react';
import { Form } from '@formily/core';
import { useQuoteStore } from '@/lib/stores/quote-store';

interface UseFormSyncOptions {
  debounceMs?: number;
  syncOnVisibilityChange?: boolean;
  syncOnBeforeUnload?: boolean;
}

export function useFormSync(
  form: Form,
  options: UseFormSyncOptions = {}
) {
  const {
    debounceMs = 500,
    syncOnVisibilityChange = true,
    syncOnBeforeUnload = true,
  } = options;

  const { formData, updateFormData } = useQuoteStore();
  const syncTimeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);
  const lastSyncedValuesRef = React.useRef<string>('');

  // 智能同步：只有数据真正变化时才同步
  const syncToStore = React.useCallback(() => {
    const currentValues = form.values;
    const currentValuesStr = JSON.stringify(currentValues);
    
    // 避免重复同步相同数据
    if (currentValuesStr !== lastSyncedValuesRef.current) {
      updateFormData(currentValues);
      lastSyncedValuesRef.current = currentValuesStr;
    }
  }, [form, updateFormData]);

  // 防抖同步
  const debouncedSync = React.useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      syncToStore();
    }, debounceMs);
  }, [syncToStore, debounceMs]);

  // 立即同步（用于关键时机）
  const immediateSync = React.useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncToStore();
  }, [syncToStore]);

  // 监听表单变化
  React.useEffect(() => {
    const subscriptionId = form.subscribe(({ type }) => {
      if (type === 'onFieldValueChange') {
        debouncedSync();
      }
    });

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      form.unsubscribe(subscriptionId);
    };
  }, [form, debouncedSync]);

  // Store数据变化时同步到表单
  React.useEffect(() => {
    if (form && formData) {
      const currentFormValuesStr = JSON.stringify(form.values);
      const storeValuesStr = JSON.stringify(formData);
      
      // 只有数据真正不同时才更新表单
      if (currentFormValuesStr !== storeValuesStr) {
        form.setValues(formData);
        lastSyncedValuesRef.current = storeValuesStr;
      }
    }
  }, [formData, form]);

  // 页面事件监听
  React.useEffect(() => {
    const handlers: Array<() => void> = [];

    // 页面失焦时同步
    if (syncOnVisibilityChange) {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          immediateSync();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      handlers.push(() => document.removeEventListener('visibilitychange', handleVisibilityChange));
    }

    // 页面卸载前同步
    if (syncOnBeforeUnload) {
      const handleBeforeUnload = () => {
        immediateSync();
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      handlers.push(() => window.removeEventListener('beforeunload', handleBeforeUnload));
    }

    return () => {
      handlers.forEach(cleanup => cleanup());
    };
  }, [immediateSync, syncOnVisibilityChange, syncOnBeforeUnload]);

  return {
    syncToStore: immediateSync,
    debouncedSync,
    isFormDirty: () => {
      const currentValues = JSON.stringify(form.values);
      return currentValues !== lastSyncedValuesRef.current;
    }
  };
} 