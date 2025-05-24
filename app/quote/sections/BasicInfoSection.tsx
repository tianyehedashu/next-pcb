import { Input } from "@/components/ui/input";
import RadioGroup from "../RadioGroup";
import { Tooltip } from "@/components/ui/tooltip";
import React, { useEffect, useRef } from "react";

import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import CustomNumberSelect from "@/app/components/custom-ui/CustomNumberSelect";
import { pcbFieldRules } from "@/lib/pcbFieldRules";
import type { PcbQuoteForm } from "@/types/pcbQuoteForm";

interface BasicInfoSectionProps {
  form: PcbQuoteForm & { gerber?: File };
  setForm: React.Dispatch<React.SetStateAction<PcbQuoteForm & { gerber?: File }>>;
  sectionRef: React.RefObject<HTMLDivElement>;
}

export default function BasicInfoSection({ form, setForm, sectionRef }: BasicInfoSectionProps) {
  // 联动配置
  const isSingle = form.shipmentType === "single";
  const isPanel = form.shipmentType === "panel" 

  const countLabel = isSingle ? "Quantity(single)" : "Quantity(panel)";
  const countUnit = isSingle ? "Pcs" : "Set";

  // 新的字段配置数组，顺序可控
  const basicFields: { key: keyof PcbQuoteForm | 'singleSize'; type: 'radio' | 'input' | 'group' }[] = [
    { key: "pcbType", type: "radio" },
    { key: "layers", type: "radio" },
    { key: "useShengyiMaterial", type: "radio" },
    { key: "thickness", type: "radio" },
    { key: "hdi", type: "radio" },
    { key: "tg", type: "radio" },    
    { key: "differentDesignsCount", type: "input" },
    { key: "border", type: "radio" },
    { key: "singleSize", type: "group" },
    { key: "shipmentType", type: "radio" },
    { key: "panelRow", type: "input" },
    { key: "panelColumn", type: "input" },
 
  ];

  console.log("当前 PCB Quote Form 1 ：", form);

  // 统一依赖联动重置方案
  const prevDepsRef = useRef<Record<string, unknown[]>>({});
  useEffect(() => {
    const newForm = { ...form };
    let changed = false;

    Object.entries(pcbFieldRules).forEach(([key, rule]) => {
      if (!rule.dependencies) return;
      // 获取当前依赖的值
      const currentDeps = rule.dependencies.map(dep => form[dep]);
      const prevDeps = prevDepsRef.current[key];
      // 如果依赖发生变化
      if (!prevDeps || currentDeps.some((v, i) => v !== prevDeps[i])) {
        // 计算新的 default
        const defaultValue = typeof rule.default === "function"
          ? rule.default(form)
          : rule.default;
        // 计算 options
        const options = typeof rule.options === "function"
          ? rule.options(form)
          : rule.options;
        // 只有当当前值不在 options 里，或者依赖变化时才重置
        if (!options?.includes(newForm[key as keyof PcbQuoteForm & string]) || newForm[key as keyof PcbQuoteForm & string] !== defaultValue) {
          (newForm as Record<string, unknown>)[key] = defaultValue;
          changed = true;
        }
      }
      // 记录本次依赖
      prevDepsRef.current[key] = currentDeps;
    });
    if (changed) {
      setForm(newForm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, setForm]);

  return (
    <div ref={sectionRef} className="scroll-mt-32">
      <div className="flex flex-col gap-3 text-xs">
        {/* 自动渲染基础字段（仅渲染basicFields中配置的） */}
        {basicFields.map(({ key, type }) => {
          const rule = pcbFieldRules[key];
          if (!rule) return null;
          if (rule.shouldShow && !rule.shouldShow(form)) return null;
          // 统一赋值，避免 undefined
          const options = (typeof rule.options === 'function' ? rule.options(form) : rule.options) || [];

          if (key === "singleSize") {
            return (
              <div className="flex flex-wrap items-start gap-4" key="singleSize">
                <Tooltip content={<div className="max-w-xs text-left">Enter the finished size of your PCB in centimeters (cm).</div>}>
                  <label className="w-32 text-xs font-normal text-right cursor-help shrink-0">Single Size (cm)</label>
                </Tooltip>
                <div className="flex-1 min-w-0 w-0 max-w-full flex items-center gap-3 flex-wrap">
                  <Input
                    type="number"
                    placeholder="Length/x"
                    value={form.singleLength !== undefined && form.singleLength !== null ? String(form.singleLength) : ''}
                    onChange={e => {
                      const value = e.target.value === '' ? 0 : Number(e.target.value);
                      setForm((prev: PcbQuoteForm & { gerber?: File }) => ({ ...prev, singleLength: value }));
                    }}
                    className="w-24"
                  />
                  <span className="mx-1">×</span>
                  <Input
                    type="number"
                    placeholder="Width/y"
                    value={form.singleWidth !== undefined && form.singleWidth !== null ? String(form.singleWidth) : ''}
                    onChange={e => {
                      const value = e.target.value === '' ? 0 : Number(e.target.value);
                      setForm((prev: PcbQuoteForm & { gerber?: File }) => ({ ...prev, singleWidth: value }));
                    }}
                    className="w-24"
                  />
                  <span className="ml-2 text-xs text-muted-foreground">cm</span>
                </div>
              </div>
            );
          }
          if (key === "panelRow" || key === "panelColumn") {
            // 只在panel和panel_agent模式下显示
            if (!isPanel) return null;
            // 合并为一行
            if (key === "panelRow") {
              return (
                <div className="flex flex-wrap items-start gap-4" key="panelRowCol">
                  <Tooltip content={<div className="max-w-xs text-left">Set the panelization type (e.g. 1 pcs × 2 pcs per panel).
                  </div>}>
                    <label className="w-32 text-xs font-normal text-right cursor-help shrink-0">Panel Type</label>
                  </Tooltip>
                  <div className="flex-1 min-w-0 w-0 max-w-full flex items-center gap-3 flex-wrap">
                    <Input
                      type="number"
                      placeholder="Panel Rows"
                      value={form.panelRow !== undefined && form.panelRow !== null ? String(form.panelRow) : ''}
                      onChange={e => setForm((prev) => ({ ...prev, panelRow: e.target.value === '' ? undefined : Number(e.target.value) }))}
                      className="w-24"
                    />
                    <span className="mx-1">pcs ×</span>
                    <Input
                      type="number"
                      placeholder="Panel Columns"
                      value={form.panelColumn !== undefined && form.panelColumn !== null ? String(form.panelColumn) : ''}
                      onChange={e => setForm((prev) => ({ ...prev, panelColumn: e.target.value === '' ? undefined : Number(e.target.value) }))}
                      className="w-24"
                    />
                    <span className="ml-2 text-xs text-muted-foreground">pcs</span>
                  </div>
                </div>
              );
            }
            // panelColumn单独渲染时跳过
            return null;
          }
          return (
            <div className="flex flex-wrap items-start gap-4" key={key}>
              <Tooltip content={<div className="max-w-xs text-left">{key === 'tg' ? 'TG Rating' : rule.label}</div>}>
                <label className="w-32 text-xs font-normal text-right cursor-help shrink-0">{key === 'tg' ? 'TG Rating' : rule.label}</label>
              </Tooltip>
              <div className="flex-1 min-w-0 w-0 max-w-full">
                {type === "radio" && options.length > 0 && (
                  <RadioGroup
                    name={key}
                    options={(() => {
                      let opts = options;
                      if (typeof options[0] === 'boolean') {
                        opts = [false, true];
                      }
                      return (opts as Array<string | number | boolean>).map((value, idx) => ({
                        value,
                        label: typeof value === 'boolean'
                          ? (value ? rule.trueLabel || 'Yes' : rule.falseLabel || 'No')
                          : (typeof value === 'string' || typeof value === 'number') && rule.unit ? `${value} ${rule.unit}` : (typeof value === 'string' ? value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, '-') : String(value)),
                        disabled: rule.shouldDisable ? rule.shouldDisable({ ...form, [key]: value }) : false,
                        radius: opts.length === 1 ? "rounded-lg" : idx === 0 ? "rounded-r-none rounded-l-lg" : idx === opts.length - 1 ? "rounded-r-lg !rounded-l-none -ml-px" : "rounded-none -ml-px"
                      }));
                    })()}
                    value={form[key as keyof PcbQuoteForm & string]}
                    onChange={(v: string | number) => setForm((prev) => ({ ...prev, [key as keyof PcbQuoteForm & string]: v }))}
                    className="flex flex-wrap gap-2"
                  />
                )}
                {type === "select" && options.length > 0 && (
                  <Select value={String(form[key as keyof PcbQuoteForm & string] ?? '')} onValueChange={(v) => setForm((prev: PcbQuoteForm & { gerber?: File }) => ({ ...prev, [key as keyof PcbQuoteForm & string]: v }))}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder={`Select ${rule.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {(options as Array<string | number>).map((value) => (
                        <SelectItem key={value} value={String(value)} disabled={rule.shouldDisable ? rule.shouldDisable({ ...form, [key]: value }) : false}>
                          {(typeof value === 'string' || typeof value === 'number') && rule.unit ? `${value} ${rule.unit}` : (typeof value === 'string' ? value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, '-') : String(value))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {type === "input" && (
                  <Input
                    type={["differentDesignsCount", "panelRow", "panelColumn", "singleLength", "singleWidth"].includes(key) ? "number" : "text"}
                    value={
                      typeof form[key as keyof PcbQuoteForm & string] === 'string' || typeof form[key as keyof PcbQuoteForm & string] === 'number'
                        ? String(form[key as keyof PcbQuoteForm & string])
                        : ''
                    }
                    onChange={e => setForm((prev) => ({
                      ...prev,
                      [key]: e.target.value === '' ? undefined : Number(e.target.value)
                    }))}
                    placeholder={rule.label ? `Enter ${rule.label}` : ''}
                    className="w-48"
                  />
                )}
              </div>
            </div>
          );
        })}
        {/* Single Count 区块（批量选项+自定义输入+确定） */}
        <div className="flex items-center gap-2 mb-2">
          <Tooltip content={<div className="max-w-xs text-left">Total quantity of boards or panels you need.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">{countLabel}</label>
          </Tooltip>
          <CustomNumberSelect
            value={isSingle ? form.singleCount ?? 0 : form.panelSet ?? 0}
            onChange={(v: number) => {
              if (isSingle) {
                setForm((prev: PcbQuoteForm & { gerber?: File }) => ({ ...prev, singleCount: v }));
              } else {
                setForm((prev: PcbQuoteForm & { gerber?: File }) => ({ ...prev, panelSet: v }));
              }
            }}
            options={[5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 125, 150, 200, 250, 300, 350, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 6500, 7000, 7500, 9000]}
            unit={countUnit}
            placeholder="Select"
          />
          <span className="ml-2 text-xs text-muted-foreground">{countUnit}</span>
        </div>
        <div className="flex items-center gap-4">
          <Tooltip content={<div className="max-w-xs text-left">Add any special notes for production use..</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">PCB Note</label>
          </Tooltip>
          <textarea
            className="w-96 min-h-[40px] max-h-32 rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
            placeholder="PCB Note (for production  use)"
            value={form.pcbNote || ''}
            onChange={e => setForm(prev => ({ ...prev, pcbNote: e.target.value }))}
          />
        </div>
      </div>
    </div>
  );
} 