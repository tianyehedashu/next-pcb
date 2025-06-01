import RadioGroup from "../RadioGroup";
import React from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { pcbFieldRules } from "@/lib/pcbFieldRules";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { PcbQuoteForm } from "@/types/pcbQuoteForm";
import { useFormDependencyEffects } from '@/lib/hooks/useFormDependencyEffects';

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
  // castellated: { type: "radio" },
  goldFingers: { type: "radio" },
  goldFingersBevel: { type: "radio" },
  edgePlating: { type: "radio" },
  // edgeCover: { type: "radio" },
  maskCover: { type: "radio" },
  holeCu25um: { type: "radio" },
} as const;

export type ProcessInfoFieldKey = keyof typeof processInfoFields;

// 阻焊色与真实颜色映射
const solderMaskColorMap: Record<string, string> = {
  green: '#22c55e',
  "Matt Green": '#4ade80', // 哑光绿，略浅
  blue: '#3b82f6',
  red: '#ef4444',
  black: '#222',
  "Matt Black": '#555', // 哑光黑，灰黑
  white: '#fff',
  yellow: '#fde047',
};

// 丝印色与真实颜色映射
const silkscreenColorMap: Record<string, string> = {
  white: '#fff',
  black: '#222',
  yellow: '#fde047',
};

interface ProcessInfoSectionProps {
  form: PcbQuoteForm;
  setForm: (form: Partial<PcbQuoteForm> | ((prev: PcbQuoteForm) => Partial<PcbQuoteForm> | PcbQuoteForm)) => void;
  sectionRef: React.RefObject<HTMLDivElement>;
}

export default function ProcessInfoSection({ form, setForm, sectionRef }: ProcessInfoSectionProps) {
  useFormDependencyEffects({ form, setForm: setForm as any }); // Cast setForm to any for now due to complex type

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
                  <label className="w-32 text-sm font-medium font-sans text-right cursor-help">{label}</label>
                </Tooltip>
                {type === "radio" && sortedOptions.length > 0 && (
                  <RadioGroup
                    name={key}
                    options={(() => {
                      let opts = sortedOptions;
                      if (typeof sortedOptions[0] === 'boolean') {
                        opts = [false, true];
                      }
                      return opts.map((v) => ({
                        value: v.toString(),
                        label: typeof v === "boolean"
                          ? (v ? rule.trueLabel || "Yes" : rule.falseLabel || "No")
                          : key === 'solderMask' ? (
                            <span className="flex items-center gap-2">
                              <span
                                className="inline-block w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: typeof v === 'string' ? (solderMaskColorMap[String(v)] || String(v)) : undefined, boxShadow: v === 'white' ? '0 0 0 1px #ccc' : undefined }}
                              ></span>
                              {typeof v === 'string' ?
                                (v === 'matt_green' ? 'Matt Green' : v === 'matt_black' ? 'Matt Black' : v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, ' '))
                                : String(v)}
                            </span>
                          ) : key === 'silkscreen' ? (
                            <span className="flex items-center gap-2">
                              <span
                                className="inline-block w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: typeof v === 'string' ? (silkscreenColorMap[String(v)] || String(v)) : undefined, boxShadow: v === 'white' ? '0 0 0 1px #ccc' : undefined }}
                              ></span>
                              {typeof v === 'string' ? String(v).charAt(0).toUpperCase() + String(v).slice(1).replace(/_/g, '-') : String(v)}
                            </span>
                          ) : (typeof v === 'string' || typeof v === 'number'
                            ? `${v}${rule.unit ? ` ${rule.unit}` : ''}`
                            : String(v)),
                        disabled: rule.shouldDisable ? rule.shouldDisable({ ...(form as PcbQuoteForm), [key]: v }) : false
                      }));
                    })()}
                    value={typeof form[key as keyof PcbQuoteForm] === 'string' || typeof form[key as keyof PcbQuoteForm] === 'number' || typeof form[key as keyof PcbQuoteForm] === 'boolean' ? String(form[key as keyof PcbQuoteForm]) : ''}
                    onChange={(v: string) => setForm((prev) => ({ ...prev, [key as keyof PcbQuoteForm]: typeof sortedOptions[0] === 'boolean' ? v === 'true' : v }))}
                  />
                )}
                {(type as string) === "select" && sortedOptions.length > 0 && (
                  <Select value={typeof form[key as keyof PcbQuoteForm] === 'string' || typeof form[key as keyof PcbQuoteForm] === 'number' || typeof form[key as keyof PcbQuoteForm] === 'boolean' ? String(form[key as keyof PcbQuoteForm]) : ''} onValueChange={(v) => setForm((prev) => ({ ...prev, [key as keyof PcbQuoteForm]: v }))}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder={`Select ${rule.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedOptions.map((v) => (
                        <SelectItem key={String(v)} value={String(v)} disabled={rule.shouldDisable ? rule.shouldDisable({ ...(form as PcbQuoteForm), [key]: v }) : false}>
                          {typeof v === 'string' || typeof v === 'number'
                            ? `${v}${rule.unit ? ` ${rule.unit}` : ''}`
                            : String(v)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {(type as string) === "input" && (
                  <Input
                    value={typeof form[key as keyof PcbQuoteForm] === 'string' || typeof form[key as keyof PcbQuoteForm] === 'number' || typeof form[key as keyof PcbQuoteForm] === 'boolean' ? String(form[key as keyof PcbQuoteForm]) : ''}
                    onChange={e => setForm((prev) => ({ ...prev, [key as keyof PcbQuoteForm]: e.target.value }))}
                    placeholder={`Enter ${rule.label}`}
                    className="w-48"
                  />
                )}
              </div>
              {/* 在 Gold Fingers 字段后插入 Bevel Gold Fingers 选项 */}
              {key === 'goldFingers' && pcbFieldRules.goldFingersBevel.shouldShow?.(form as PcbQuoteForm) && (
                <div className="flex items-center gap-4 ml-8">
                  <Tooltip content={<div className="max-w-xs text-left">{pcbFieldRules.goldFingersBevel.label}</div>}>
                    <label className="w-32 text-sm font-medium font-sans text-right cursor-help">{pcbFieldRules.goldFingersBevel.label}</label>
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