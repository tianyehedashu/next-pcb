import RadioGroup from "../RadioGroup";
import CheckboxGroup from "../CheckboxGroup";
import React, { useEffect, useRef } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { pcbFieldRules } from "@/lib/pcbFieldRules";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { PcbQuoteForm } from "@/types/pcbQuoteForm";

export const serviceInfoKeys = [
  "testMethod",
  "prodCap",
  "productReport",
  "isRejectBoard",
  "yyPin",
  "customerCode",
  "payMethod",
  "qualityAttach",
  "smt",
  "holeCount",
] as const;

interface ServiceInfoSectionProps {
  form: Omit<PcbQuoteForm, 'productReport'> & { productReport?: string[] };
  errors: any;
  setForm: (form: Partial<PcbQuoteForm> | ((prev: PcbQuoteForm) => Partial<PcbQuoteForm> | PcbQuoteForm)) => void;
  sectionRef: React.RefObject<HTMLDivElement>;
}

export default function ServiceInfoSection({ form, errors, setForm, sectionRef }: ServiceInfoSectionProps) {
  // 统一依赖联动重置方案
  const prevDepsRef = useRef<any>({});
  useEffect(() => {
    let newForm = { ...form };
    let changed = false;
    Object.entries(pcbFieldRules).forEach(([key, rule]) => {
      if (!rule.dependencies) return;
      const currentDeps = rule.dependencies.map(dep => form[dep]);
      const prevDeps = prevDepsRef.current[key];
      if (!prevDeps || currentDeps.some((v, i) => v !== prevDeps[i])) {
        const defaultValue = typeof rule.default === "function"
          ? rule.default(form)
          : rule.default;
        let options = typeof rule.options === "function"
          ? rule.options(form)
          : rule.options;
        if (!options?.includes(newForm[key]) || newForm[key] !== defaultValue) {
          newForm[key] = defaultValue;
          changed = true;
        }
      }
      prevDepsRef.current[key] = currentDeps;
    });
    // Product Report 联动逻辑：选了Not Required，其它选项自动清空
    if (Array.isArray(form.productReport)) {
      if (form.productReport.includes('Not Required') && form.productReport.length > 1) {
        newForm.productReport = ['Not Required'];
        changed = true;
      }
    }
    if (changed) {
      setForm(newForm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, setForm]);

  // 字段类型映射（可扩展）
  const fieldTypeMap: Record<string, "radio" | "checkbox" | "select" | "input"> = {
    testMethod: "radio",
    prodCap: "radio",
    productReport: "checkbox",
    isRejectBoard: "radio",
    yyPin: "radio",
    customerCode: "input",
    payMethod: "radio",
    qualityAttach: "radio",
    smt: "radio",
    holeCount: "input"
  };

  return (
    <div ref={sectionRef} className="scroll-mt-32">
      <div className="flex flex-col gap-3 text-xs">
        {/* 自动渲染服务字段 */}
        {serviceInfoKeys.map((key) => {
          const rule = pcbFieldRules[key];
          if (!rule) return null;
          if (rule.shouldShow && !rule.shouldShow(form)) return null;
          const options = (typeof rule.options === 'function' ? rule.options(form) : rule.options) || [];
          const type = fieldTypeMap[key] || (options.length > 0 ? "radio" : "input");
          return (
            <div className="flex items-center gap-4" key={key}>
              <Tooltip content={<div className="max-w-xs text-left">{rule.label}</div>}>
                <label className="w-32 text-xs font-normal text-right cursor-help">{rule.label}</label>
              </Tooltip>
              {type === "radio" && options.length > 0 && (
                <RadioGroup
                  name={key}
                  options={options.map((v: any) => ({
                    value: v,
                    label: typeof v === 'string' ? v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, '-') : String(v),
                    disabled: rule.shouldDisable ? rule.shouldDisable({ ...form, [key]: v }) : false
                  }))}
                  value={form[key]}
                  onChange={(v: any) => setForm((prev: any) => ({ ...prev, [key]: v }))}
                />
              )}
              {type === "checkbox" && options.length > 0 && (
                <CheckboxGroup
                  name={key}
                  options={options.map((v: any) => ({
                    value: v,
                    label: typeof v === 'string' ? v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, '-') : String(v),
                    disabled: false
                  }))}
                  value={Array.isArray(form[key] as any) ? (form[key] as any) : []}
                  onChange={(v: string[]) => {
                    // 如果勾选了 Not Required，只保留 Not Required
                    if (v.includes('Not Required')) {
                      setForm((prev: any) => ({ ...prev, productReport: ['Not Required'] }));
                    } else {
                      // 只要没选 Not Required，就移除 Not Required
                      setForm((prev: any) => ({
                        ...prev,
                        productReport: v.filter(item => item !== 'Not Required')
                      }));
                    }
                  }}
                />
              )}
              {type === "select" && options.length > 0 && (
                <Select value={form[key] ?? ''} onValueChange={(v) => setForm((prev: any) => ({ ...prev, [key]: v }))}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={`Select ${rule.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((v: any) => (
                      <SelectItem key={v} value={v} disabled={rule.shouldDisable ? rule.shouldDisable({ ...form, [key]: v }) : false}>
                        {typeof v === 'string' ? v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, '-') : String(v)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {type === "input" && (
                <Input
                  value={form[key] ?? ''}
                  onChange={e => setForm((prev: any) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={`Enter ${rule.label}`}
                  className="w-48"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 