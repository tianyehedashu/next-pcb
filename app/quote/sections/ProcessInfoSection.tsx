import RadioGroup from "../RadioGroup";
import React, { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { pcbFieldRules } from "@/lib/pcbFieldRules";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { PcbQuoteForm } from "@/types/pcbQuoteForm";

export const processInfoKeys = [
  "copperWeight",
  "minTrace",
  "minHole",
  "solderMask",
  "silkscreen",
  "surfaceFinish",
  "surfaceFinishEnigType",
  "impedance",
  "castellated",
  "goldFingers",
  "edgePlating",
  "halfHole",
  "edgeCover",
  "maskCover",
  "useShengyiMaterial",
  "bga",
  "blueMask",
  "holeCu25um",
] as const;

// 阻焊色与真实颜色映射
const solderMaskColorMap: Record<string, string> = {
  green: '#22c55e',
  blue: '#3b82f6',
  red: '#ef4444',
  black: '#222',
  white: '#fff',
  yellow: '#fde047',
};

// 丝印色与真实颜色映射
const silkscreenColorMap: Record<string, string> = {
  white: '#fff',
  black: '#222',
  green: '#22c55e',
};

interface ProcessInfoSectionProps {
  form: PcbQuoteForm;
  errors: any;
  setForm: (form: Partial<PcbQuoteForm> | ((prev: PcbQuoteForm) => Partial<PcbQuoteForm> | PcbQuoteForm)) => void;
  sectionRef: React.RefObject<HTMLDivElement>;
}

export default function ProcessInfoSection({ form, errors, setForm, sectionRef }: ProcessInfoSectionProps) {
  const formData = form as Record<string, any>;
  // 统一依赖联动重置方案
  const prevDepsRef = useRef<any>({});
  useEffect(() => {
    let newForm = { ...formData };
    let changed = false;
    Object.entries(pcbFieldRules).forEach(([key, rule]) => {
      if (!rule.dependencies) return;
      const currentDeps = rule.dependencies.map(dep => formData[dep]);
      const prevDeps = prevDepsRef.current[key];
      if (!prevDeps || currentDeps.some((v, i) => v !== prevDeps[i])) {
        const defaultValue = typeof rule.default === "function"
          ? rule.default(formData as any)
          : rule.default;
        let options = typeof rule.options === "function"
          ? rule.options(formData as any)
          : rule.options;
        if (!options?.includes(newForm[key]) || newForm[key] !== defaultValue) {
          newForm[key] = defaultValue;
          changed = true;
        }
      }
      prevDepsRef.current[key] = currentDeps;
    });
    if (changed) {
      setForm(newForm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, setForm]);

  // 字段类型映射（可扩展）
  const fieldTypeMap: Record<string, "radio" | "select" | "input"> = {
    copperWeight: "radio",
    minTrace: "radio",
    minHole: "radio",
    solderMask: "radio",
    silkscreen: "radio",
    surfaceFinish: "radio",
    surfaceFinishEnigType: "radio",
    impedance: "radio",
    castellated: "radio",
    goldFingers: "radio",
    edgePlating: "radio",
    halfHole: "radio",
    edgeCover: "radio",
    maskCover: "radio"
  };

  return (
    <div ref={sectionRef} className="scroll-mt-32">
      <div className="flex flex-col gap-3 text-xs">
        {/* 自动渲染工艺字段（仅渲染fieldTypeMap中配置的） */}
        {processInfoKeys.map((key) => {
          const type = fieldTypeMap[key];
          if (!type) return null;
          const rule = pcbFieldRules[key];
          if (!rule) return null;
          if (rule.shouldShow && !rule.shouldShow(form)) return null;
          // 统一赋值，避免 undefined
          const options = (typeof rule.options === 'function' ? rule.options(form) : rule.options) || [];
          // Min Trace/Space从小到大排序
          const sortedOptions = key === 'minTrace'
            ? options.slice().sort((a, b) => {
                const getNum = (v: string) => parseFloat(v.split('/')[0]);
                return getNum(a) - getNum(b);
              })
            : options;
          return (
            <div className="flex items-center gap-4" key={key}>
              <Tooltip content={<div className="max-w-xs text-left">{rule.label}</div>}>
                <label className="w-32 text-xs font-normal text-right cursor-help">{rule.label}</label>
              </Tooltip>
              {type === "radio" && sortedOptions.length > 0 && (
                <RadioGroup
                  name={key}
                  options={sortedOptions.map((v: any) => ({
                    value: v,
                    label: key === 'solderMask' ? (
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: solderMaskColorMap[v] || v, boxShadow: v === 'white' ? '0 0 0 1px #ccc' : undefined }}
                        ></span>
                        {typeof v === 'string' ? v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, '-') : String(v)}
                      </span>
                    ) : key === 'silkscreen' ? (
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: silkscreenColorMap[v] || v, boxShadow: v === 'white' ? '0 0 0 1px #ccc' : undefined }}
                        ></span>
                        {typeof v === 'string' ? v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, '-') : String(v)}
                      </span>
                    ) : (typeof v === 'string' ? v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, '-') : String(v)),
                    disabled: rule.shouldDisable ? rule.shouldDisable({ ...form, [key]: v }) : false
                  }))}
                  value={formData[key] as string}
                  onChange={(v: string) => setForm((prev: any) => ({ ...prev, [key]: v }))}
                />
              )}
              {type === "select" && sortedOptions.length > 0 && (
                <Select value={formData[key] ?? ''} onValueChange={(v) => setForm((prev: any) => ({ ...prev, [key]: v }))}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={`Select ${rule.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedOptions.map((v: any) => (
                      <SelectItem key={v} value={v} disabled={rule.shouldDisable ? rule.shouldDisable({ ...form, [key]: v }) : false}>
                        {typeof v === 'string' ? v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, '-') : String(v)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {type === "input" && (
                <Input
                  value={formData[key] ?? ''}
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