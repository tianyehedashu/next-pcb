import RadioGroup from "../RadioGroup";
import CheckboxGroup from "../CheckboxGroup";
import React, { useEffect, useRef } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { pcbFieldRules } from "@/lib/pcbFieldRules";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { PcbQuoteForm } from "@/types/pcbQuoteForm";
import { ProductReport } from "@/types/form";

// 统一字段配置
export const serviceInfoFields: { key: keyof PcbQuoteForm | 'productReport'; type: 'radio' | 'checkbox' | 'select' | 'input' }[] = [
  { key: "workingGerber", type: "radio" },
  { key: "testMethod", type: "radio" },
  { key: "productReport", type: "checkbox" },
  { key: "rejectBoard", type: "radio" },
  { key: "ulMark", type: "radio" },
  { key: "crossOuts", type: "radio" },
  { key: "ipcClass", type: "radio" },
  { key: "ifDataConflicts", type: "radio" },
  
  // 如有 input 类型字段可继续添加
  // { key: "holeCount", type: "input" },
] as const;

export const serviceInfoKeys = serviceInfoFields.map(f => f.key);

interface ServiceInfoSectionProps {
  form: Omit<PcbQuoteForm, 'productReport'> & { productReport?: ProductReport[] };
  setForm: (form: Partial<PcbQuoteForm> | ((prev: PcbQuoteForm) => Partial<PcbQuoteForm> | PcbQuoteForm)) => void;
  sectionRef: React.RefObject<HTMLDivElement>;
}

export default function ServiceInfoSection({ form, setForm, sectionRef }: ServiceInfoSectionProps) {
  // 统一依赖联动重置方案
  const prevDepsRef = useRef<Record<string, unknown[]>>({});
  useEffect(() => {
    const newForm: typeof form = { ...form };
    let changed = false;
    Object.entries(pcbFieldRules).forEach(([key, rule]) => {
      if (!rule.dependencies) return;
      const currentDeps = rule.dependencies.map(dep => form[dep as keyof typeof form]);
      const prevDeps = prevDepsRef.current[key];
      if (!prevDeps || currentDeps.some((v, i) => v !== prevDeps[i])) {
        const defaultValue = typeof rule.default === "function"
          ? rule.default(form)
          : rule.default;
        const options = typeof rule.options === "function"
          ? rule.options(form)
          : rule.options;
        if (!options?.includes(newForm[key as keyof typeof newForm]) || newForm[key as keyof typeof newForm] !== defaultValue) {
          (newForm as Record<string, unknown>)[key] = defaultValue;
          changed = true;
        }
      }
      prevDepsRef.current[key] = currentDeps;
    });
    // Product Report 联动逻辑：选了Not Required，其它选项自动清空
    if (Array.isArray(form.productReport)) {
      if (form.productReport.includes(ProductReport.None) && form.productReport.length > 1) {
        newForm.productReport = [ProductReport.None];
        changed = true;
      }
    }
    if (changed) {
      setForm(newForm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, setForm]);

  return (
    <div ref={sectionRef} className="scroll-mt-32">
      <div className="flex flex-col gap-3 text-xs">
        {/* 自动渲染服务字段 */}
        {serviceInfoFields.map(({ key, type }) => {
          const rule = pcbFieldRules[key as keyof typeof pcbFieldRules];
          if (!rule) return null;
          if (rule.shouldShow && !rule.shouldShow(form)) return null;
          const options = (typeof rule.options === 'function' ? rule.options(form) : rule.options) || [];
          return (
            <div className="flex items-center gap-4" key={key}>
              <Tooltip content={<div className="max-w-xs text-left">{rule.label}</div>}>
                <label className="w-32 text-sm font-medium font-sans text-right cursor-help">{rule.label}</label>
              </Tooltip>
              {type === "radio" && options.length > 0 && (
                <RadioGroup
                  name={key}
                  options={(() => {
                    let opts = options;
                    if (typeof options[0] === 'boolean') {
                      opts = [false, true];
                    }
                    return (opts as Array<string | number | boolean>).map((v) => ({
                      value: v,
                      label: typeof v === "boolean"
                        ? (v ? rule.trueLabel || "Yes" : rule.falseLabel || "No")
                        : (typeof v === 'string' || typeof v === 'number') && rule.unit
                          ? `${v} ${rule.unit}`
                          : (typeof v === 'string'
                            ? v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, '-')
                            : String(v)),
                      disabled: rule.shouldDisable ? rule.shouldDisable({ ...form, [key]: v }) : false
                    }));
                  })()}
                  value={form[key as keyof typeof form] as string | number | boolean | undefined}
                  onChange={(v: string | number | boolean) => setForm((prev) => ({ ...prev, [key]: v }))}
                />
              )}
              {type === "checkbox" && options.length > 0 && (
                <CheckboxGroup
                  name={key}
                  options={(options as ProductReport[]).map((v) => ({
                    value: v,
                    label: v === ProductReport.None
                      ? 'Not Required'
                      : typeof v === "boolean"
                      ? (v ? rule.trueLabel || "Yes" : rule.falseLabel || "No")
                      : typeof v === "string"
                      ? v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, '-')
                      : String(v),
                    disabled: false
                  }))}
                  value={Array.isArray(form[key as keyof typeof form]) ? (form[key as keyof typeof form] as ProductReport[]) : []}
                  onChange={(v: ProductReport[]) => {
                    // 互斥逻辑最终版：
                    if (v.includes(ProductReport.None) && v.length > 1) {
                      setForm((prev) => ({
                        ...prev,
                        productReport: v.filter(item => item !== ProductReport.None)
                      }));
                    } else if (v.length === 1 && v[0] === ProductReport.None) {
                      setForm((prev) => ({ ...prev, productReport: [ProductReport.None] }));
                    } else {
                      setForm((prev) => ({ ...prev, productReport: v }));
                    }
                  }}
                />
              )}
              {type === "select" && options.length > 0 && (
                <Select value={String(form[key as keyof typeof form] ?? '')} onValueChange={(v) => setForm((prev) => ({ ...prev, [key]: v }))}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={`Select ${rule.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(options as (string | number)[]).map((v) => (
                      <SelectItem key={v} value={String(v)} disabled={rule.shouldDisable ? rule.shouldDisable({ ...form, [key]: v }) : false}>
                        {(typeof v === 'string' || typeof v === 'number') && rule.unit ? `${v} ${rule.unit}` : (typeof v === 'string' ? v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, '-') : String(v))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {type === "input" && (
                <Input
                  value={String(form[key as keyof typeof form] ?? '')}
                  onChange={e => setForm((prev) => ({
                    ...prev,
                    [key]: e.target.value === '' ? undefined : Number(e.target.value)
                  }))}
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