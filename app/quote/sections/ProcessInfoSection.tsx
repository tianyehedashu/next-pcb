import RadioGroup from "../RadioGroup";
import React, { useEffect, useRef } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { pcbFieldRules } from "@/lib/pcbFieldRules";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { PcbQuoteForm } from "@/types/pcbQuoteForm";

// 字段定义与类型统一
export const processInfoFields = {
  outerCopperWeight: { type: "radio" },
  innerCopperWeight: { type: "radio" },
  minTrace: { type: "radio" },
  minHole: { type: "radio" },
  solderMask: { type: "radio" },
  silkscreen: { type: "radio" },
  surfaceFinish: { type: "radio" },
  surfaceFinishEnigType: { type: "radio" },
  impedance: { type: "radio" },
  castellated: { type: "radio" },
  goldFingers: { type: "radio" },
  goldFingersBevel: { type: "radio" },
  edgePlating: { type: "radio" },
  edgeCover: { type: "radio" },
  maskCover: { type: "radio" },
  useShengyiMaterial: { type: "radio" },
  bga: { type: "radio" },
  holeCu25um: { type: "radio" },
} as const;

export type ProcessInfoFieldKey = keyof typeof processInfoFields;

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
  setForm: (form: Partial<PcbQuoteForm> | ((prev: PcbQuoteForm) => Partial<PcbQuoteForm> | PcbQuoteForm)) => void;
  sectionRef: React.RefObject<HTMLDivElement>;
}

export default function ProcessInfoSection({ form, setForm, sectionRef }: ProcessInfoSectionProps) {
  const formData = form as unknown as Record<string, unknown>;
  const prevDepsRef = useRef<Record<string, unknown[]>>({});
  useEffect(() => {
    const newForm: Record<string, unknown> = { ...formData };
    let changed = false;
    Object.entries(pcbFieldRules).forEach(([key, rule]) => {
      if (!rule.dependencies) return;
      const currentDeps = rule.dependencies.map(dep => formData[dep]);
      const prevDeps = prevDepsRef.current[key];
      if (!prevDeps || currentDeps.some((v, i) => v !== prevDeps[i])) {
        const defaultValue = typeof rule.default === "function"
          ? rule.default(form as PcbQuoteForm)
          : rule.default;
        const options = ('options' in pcbFieldRules[key] && pcbFieldRules[key].options ? pcbFieldRules[key].options : (typeof rule.options === 'function' ? rule.options(form as PcbQuoteForm) : rule.options)) as (string | number | boolean)[] || [];
        if (!Array.isArray(options) || !options.includes(newForm[key] as string | number | boolean) || newForm[key] !== defaultValue) {
          newForm[key] = defaultValue;
          changed = true;
        }
      }
      prevDepsRef.current[key] = currentDeps;
    });
    if (changed) {
      setForm(newForm as Partial<PcbQuoteForm>);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, setForm]);

  return (
    <div ref={sectionRef} className="scroll-mt-32">
      <div className="flex flex-col gap-3 text-xs">
        {/* 自动渲染工艺字段（仅渲染processInfoFields中配置的） */}
        {Object.entries(processInfoFields).map(([key, field]) => {
          const type = field.type;
          const rule = pcbFieldRules[key];
          if (!rule) return null;
          if (rule.shouldShow && !rule.shouldShow(form as PcbQuoteForm)) return null;
          // 优先用 processInfoFields 的 options，否则用 rule.options
          const options = ('options' in field && field.options ? field.options : (typeof rule.options === 'function' ? rule.options(form as PcbQuoteForm) : rule.options)) as (string | number | boolean)[] || [];
          const sortedOptions = key === 'minTrace'
            ? (options as (string | number | boolean)[]).slice().sort((a, b) => {
                const getNum = (v: string | number | boolean) => parseFloat(String(v).split('/')[0]);
                return getNum(a) - getNum(b);
              })
            : options;
          const label = rule.label;
          return (
            <React.Fragment key={key}>
              <div className="flex items-center gap-4">
                <Tooltip content={<div className="max-w-xs text-left">{label}</div>}>
                  <label className="w-32 text-xs font-normal text-right cursor-help">{label}</label>
                </Tooltip>
                {type === "radio" && sortedOptions.length > 0 && (
                  <RadioGroup
                    name={key}
                    options={sortedOptions.map((v) => ({
                      value: v.toString(),
                      label: typeof v === "boolean"
                        ? (v ? rule.trueLabel || "Yes" : rule.falseLabel || "No")
                        : key === 'solderMask' ? (
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: typeof v === 'string' ? (solderMaskColorMap[String(v)] || String(v)) : undefined, boxShadow: v === 'white' ? '0 0 0 1px #ccc' : undefined }}
                            ></span>
                            {typeof v === 'string' ? String(v).charAt(0).toUpperCase() + String(v).slice(1).replace(/_/g, '-') : String(v)}
                          </span>
                        ) : key === 'silkscreen' ? (
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: typeof v === 'string' ? (silkscreenColorMap[String(v)] || String(v)) : undefined, boxShadow: v === 'white' ? '0 0 0 1px #ccc' : undefined }}
                            ></span>
                            {typeof v === 'string' ? String(v).charAt(0).toUpperCase() + String(v).slice(1).replace(/_/g, '-') : String(v)}
                          </span>
                        ) : (typeof v === 'string' ? String(v).charAt(0).toUpperCase() + String(v).slice(1).replace(/_/g, '-') : String(v)),
                      disabled: rule.shouldDisable ? rule.shouldDisable({ ...(form as PcbQuoteForm), [key]: v }) : false
                    }))}
                    value={typeof formData[key] === 'string' || typeof formData[key] === 'number' || typeof formData[key] === 'boolean' ? formData[key].toString() : ('default' in field && field.default !== undefined ? field.default.toString() : '')}
                    onChange={(v: string) => setForm((prev) => ({ ...prev, [key]: typeof sortedOptions[0] === 'boolean' ? v === 'true' : v }))}
                  />
                )}
                {(type as string) === "select" && sortedOptions.length > 0 && (
                  <Select value={typeof formData[key] === 'string' || typeof formData[key] === 'number' || typeof formData[key] === 'boolean' ? formData[key].toString() : ''} onValueChange={(v) => setForm((prev) => ({ ...prev, [key]: v }))}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder={`Select ${rule.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedOptions.map((v) => (
                        <SelectItem key={v.toString()} value={v.toString()} disabled={rule.shouldDisable ? rule.shouldDisable({ ...(form as PcbQuoteForm), [key]: v }) : false}>
                          {typeof v === 'string' ? v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, '-') : String(v)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {(type as string) === "input" && (
                  <Input
                    value={typeof formData[key] === 'string' || typeof formData[key] === 'number' || typeof formData[key] === 'boolean' ? formData[key].toString() : ''}
                    onChange={e => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder={`Enter ${rule.label}`}
                    className="w-48"
                  />
                )}
              </div>
              {/* 在 Gold Fingers 字段后插入 Bevel Gold Fingers 选项 */}
              {key === 'goldFingers' && pcbFieldRules.goldFingersBevel.shouldShow?.(form as PcbQuoteForm) && (
                <div className="flex items-center gap-4 ml-8">
                  <Tooltip content={<div className="max-w-xs text-left">{pcbFieldRules.goldFingersBevel.label}</div>}>
                    <label className="w-32 text-xs font-normal text-right cursor-help">{pcbFieldRules.goldFingersBevel.label}</label>
                  </Tooltip>
                  <RadioGroup
                    name="goldFingersBevel"
                    options={(() => {
                      const opts = typeof pcbFieldRules.goldFingersBevel.options === 'function'
                        ? pcbFieldRules.goldFingersBevel.options(form as PcbQuoteForm)
                        : pcbFieldRules.goldFingersBevel.options;
                      return (opts as boolean[]).map((v: boolean) => ({
                        value: v.toString(),
                        label: typeof v === "boolean"
                          ? (v ? pcbFieldRules.goldFingersBevel.trueLabel || "Yes" : pcbFieldRules.goldFingersBevel.falseLabel || "No")
                          : typeof v === 'string'
                          ? String(v).charAt(0).toUpperCase() + String(v).slice(1).replace(/_/g, '-')
                          : String(v),
                        disabled: pcbFieldRules.goldFingersBevel.shouldDisable ? pcbFieldRules.goldFingersBevel.shouldDisable({ ...(form as PcbQuoteForm), goldFingersBevel: v }) : false
                      }));
                    })()}
                    value={form.goldFingersBevel?.toString() ?? 'false'}
                    onChange={(v: string) => setForm((prev) => ({ ...prev, goldFingersBevel: v === 'true' }))}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
} 