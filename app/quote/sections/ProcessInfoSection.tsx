import RadioGroup from "../RadioGroup";
import React, { useEffect, useRef } from "react";
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
  "goldFingersBevel",
  "edgePlating",
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
  setForm: (form: Partial<PcbQuoteForm> | ((prev: PcbQuoteForm) => Partial<PcbQuoteForm> | PcbQuoteForm)) => void;
  sectionRef: React.RefObject<HTMLDivElement>;
}

export default function ProcessInfoSection({ form, setForm, sectionRef }: ProcessInfoSectionProps) {
  const formData = form as Record<string, unknown>;
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
        const options = typeof rule.options === "function"
          ? rule.options(form as PcbQuoteForm)
          : rule.options;
        if (!options?.includes(newForm[key]) || newForm[key] !== defaultValue) {
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
    goldFingersBevel: "radio",
    edgeCover: "radio",
    maskCover: "radio",
    useShengyiMaterial: "radio",
    bga: "radio",
    blueMask: "radio",
    holeCu25um: "radio",
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
          if (rule.shouldShow && !rule.shouldShow(form as PcbQuoteForm)) return null;
          const options = (typeof rule.options === 'function' ? rule.options(form as PcbQuoteForm) : rule.options) as (string | number | boolean)[] || [];
          const sortedOptions = key === 'minTrace'
            ? options.slice().sort((a, b) => {
                const getNum = (v: string) => parseFloat((v as string).split('/')[0]);
                return getNum(a as string) - getNum(b as string);
              })
            : options;
          const label = key === 'copperWeight'
            ? `${rule.label} (oz)`
            : key === 'minTrace'
            ? `${rule.label} (mil)`
            : key === 'minHole'
            ? `${rule.label} (mm)`
            : rule.label;
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
                      label: [
                        'impedance',
                        'castellated',
                        'goldFingers',
                        'edgePlating',
                        'goldFingersBevel',
                      ].includes(key)
                        ? (v ? 'Yes' : 'No')
                        : key === 'solderMask' ? (
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: solderMaskColorMap[v as string] || v, boxShadow: v === 'white' ? '0 0 0 1px #ccc' : undefined }}
                            ></span>
                            {typeof v === 'string' ? v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, '-') : String(v)}
                          </span>
                        ) : key === 'silkscreen' ? (
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: silkscreenColorMap[v as string] || v, boxShadow: v === 'white' ? '0 0 0 1px #ccc' : undefined }}
                            ></span>
                            {typeof v === 'string' ? v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, '-') : String(v)}
                          </span>
                        ) : (typeof v === 'string' ? v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, '-') : String(v)),
                      disabled: rule.shouldDisable ? rule.shouldDisable({ ...(form as PcbQuoteForm), [key]: v }) : false
                    }))}
                    value={formData[key] !== undefined ? formData[key]?.toString() : ''}
                    onChange={(v: string) => setForm((prev) => ({ ...prev, [key]: typeof sortedOptions[0] === 'boolean' ? v === 'true' : v }))}
                  />
                )}
                {type === "select" && sortedOptions.length > 0 && (
                  <Select value={formData[key]?.toString() ?? ''} onValueChange={(v) => setForm((prev) => ({ ...prev, [key]: v }))}>
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
                {type === "input" && (
                  <Input
                    value={formData[key]?.toString() ?? ''}
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
                    options={pcbFieldRules.goldFingersBevel.options.map((v: boolean) => ({
                      value: v.toString(),
                      label: v ? 'Yes' : 'No',
                      disabled: pcbFieldRules.goldFingersBevel.shouldDisable ? pcbFieldRules.goldFingersBevel.shouldDisable({ ...(form as PcbQuoteForm), goldFingersBevel: v }) : false
                    }))}
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