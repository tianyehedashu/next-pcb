import { useEffect, useRef } from 'react';
import type { PcbQuoteForm } from '@/types/pcbQuoteForm';
import { pcbFieldRules } from '@/lib/pcbFieldRules';
import type { PCBFieldRule } from '@/lib/pcbFieldRules';

// 深度比较函数，用于比较依赖项
function areDepsEqual(dep1: any, dep2: any): boolean {
  // Strict equality for primitives, null, and undefined
  if (dep1 === dep2) {
    return true;
  }

  // Check for null or non-object types
  if (typeof dep1 !== 'object' || dep1 === null || typeof dep2 !== 'object' || dep2 === null) {
    return false;
  }

  // Handle Arrays
  if (Array.isArray(dep1) && Array.isArray(dep2)) {
    if (dep1.length !== dep2.length) {
      return false;
    }
    // Recursively compare array elements
    for (let i = 0; i < dep1.length; i++) {
       if (!areDepsEqual(dep1[i], dep2[i])) {
         return false;
       } else if (typeof dep1[i] === 'object' && dep1[i] !== null) {
         // Explicitly check for object elements within arrays for deeper comparison
         if (!areDepsEqual(dep1[i], dep2[i])) {
           return false;
         }
       }
    }
    return true;
  }

  // Handle Objects (non-Array)
  const keys1 = Object.keys(dep1);
  const keys2 = Object.keys(dep2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    // Check if key exists in dep2 and recursively compare values
    if (!Object.prototype.hasOwnProperty.call(dep2, key) || !areDepsEqual(dep1[key], dep2[key])) {
      return false;
    }
  }

  return true;
}

interface UseFormDependencyEffectsProps {
  form: PcbQuoteForm;
  setForm: (updater: Partial<PcbQuoteForm> | ((form: PcbQuoteForm) => Partial<PcbQuoteForm>)) => void;
}

// 自定义 Hook，处理表单字段的依赖联动和默认值重置
export function useFormDependencyEffects({
  form,
  setForm,
}: UseFormDependencyEffectsProps) {
  const prevDepsRef = useRef<Record<string, unknown[]>>({});

  useEffect(() => {
    const newForm = { ...form };
    let changed = false;

    Object.entries(pcbFieldRules).forEach(([key, rule]: [string, PCBFieldRule]) => {
      if (!rule.dependencies) return;

      // 获取当前依赖的值
      // Note: Casting to keyof PcbQuoteForm & string to satisfy TypeScript, 
      // but runtime might access properties not strictly in PcbQuoteForm if rules are misconfigured.
      const currentDeps = rule.dependencies.map(dep => form[dep as keyof PcbQuoteForm]);
      const prevDeps = prevDepsRef.current[key];

      // 使用深度比较检查依赖是否发生变化
      if (!prevDeps || !areDepsEqual(currentDeps, prevDeps)) {
        // 计算新的 default
        const defaultValue = typeof rule.default === "function"
          ? rule.default(form)
          : rule.default;

        // 计算 options
        // Note: Casting to any[] for options as the rule definition allows T[], which could be anything.
        const options = (typeof rule.options === "function"
          ? rule.options(form)
          : rule.options) as any[] | undefined; // Cast to any[] | undefined

        // 检查当前值是否在新的 options 中或者与新的 default 值不同
        const currentValue = newForm[key as keyof PcbQuoteForm];
        // Note: Using loose equality (==) for includes check as options might contain numbers and currentValue strings (or vice-versa)
        // due to form state potentially storing numbers as strings depending on input component. 
        // Deep comparison is used for default value comparison.
        const isCurrentValueInOptions = options?.some(opt => opt == currentValue); // Use loose equality here
        const isCurrentValueDifferentFromDefault = !areDepsEqual(currentValue, defaultValue);

        // Only reset if the current value is NOT in the new options OR if it's different from the calculated default value.
        // This prevents unnecessary resets if the user manually set a valid option that is also the default.
        if ((options && !isCurrentValueInOptions) || isCurrentValueDifferentFromDefault) {
           (newForm as Record<string, unknown>)[key] = defaultValue;
           changed = true;
        }
      }

      // 记录本次依赖
      prevDepsRef.current[key] = currentDeps;
    });

    if (changed) {
      // Use the functional update form of setForm to ensure we are using the latest state
      setForm(() => newForm);
    }
    
  }, [form, setForm]); // Dependencies: form and setForm (should be stable or wrapped if needed)

  // The hook itself doesn't return state, it manages side effects on the form state
  // Optionally, you could return the modified form state if needed, but side effects are the primary goal here.
} 