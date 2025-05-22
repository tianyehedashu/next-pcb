import RadioGroup from "../RadioGroup";
import CheckboxGroup from "../CheckboxGroup";
import React, { useEffect, useRef } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { pcbFieldRules } from "@/lib/pcbFieldRules";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { PcbQuoteForm } from "@/types/pcbQuoteForm";
import { ProductReport } from "@/types/form";

export const serviceInfoKeys = [
  "testMethod",
  "prodCap",
  "productReport",
  "isRejectBoard",
  "yyPin",
  "customerCode",
  "payMethod",
  "qualityAttach",
  "smt"
] as const;

interface ServiceInfoSectionProps {
  form: Omit<PcbQuoteForm, 'productReport'> & { productReport?: ProductReport[] };
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

  // 字段类型映射（可扩展）
  const fieldTypeMap: Record<string, "radio" | "checkbox" | "select" | "input"> = {
    testMethod: "radio",
    prodCap: "radio",
    productReport: "checkbox",
    isRejectBoard: "radio",
    yyPin: "radio",
    customerCode: "radio",
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
                  options={(options as Array<string | number | boolean>).map((v) => ({
                    value: v,
                    label: ['isRejectBoard', 'yyPin', 'smt'].includes(key)
                      ? (v === true ? 'Yes' : v === false ? 'No' : String(v))
                      : typeof v === 'string'
                      ? v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, '-')
                      : String(v),
                    disabled: rule.shouldDisable ? rule.shouldDisable({ ...form, [key]: v }) : false
                  }))}
                  value={form[key] as string | number | boolean | undefined}
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
                      : typeof v === 'string'
                        ? v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, '-')
                        : String(v),
                    disabled: false
                  }))}
                  value={Array.isArray(form[key] as any) ? (form[key] as ProductReport[]) : []}
                  onChange={(v: ProductReport[]) => {
                    // 互斥逻辑最终版：
                    if (v.includes(ProductReport.None) && v.length > 1) {
                      setForm((prev: any) => ({
                        ...prev,
                        productReport: v.filter(item => item !== ProductReport.None)
                      }));
                    } else if (v.length === 1 && v[0] === ProductReport.None) {
                      setForm((prev: any) => ({ ...prev, productReport: [ProductReport.None] }));
                    } else {
                      setForm((prev: any) => ({ ...prev, productReport: v }));
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