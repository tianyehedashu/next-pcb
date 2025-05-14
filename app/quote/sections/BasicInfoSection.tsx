import { Input } from "@/components/ui/input";
import RadioGroup from "../RadioGroup";
import { Tooltip } from "@/components/ui/tooltip";
import React, { useEffect, useRef } from "react";

import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import CustomNumberSelect from "@/app/components/custom-ui/CustomNumberSelect";
import { pcbFieldRules } from "@/lib/pcbFieldRules";

interface BasicInfoSectionProps {
  form: any;
  errors: any;
  setForm: (form: any) => void;
  sectionRef: React.RefObject<HTMLDivElement>;
}

export default function BasicInfoSection({ form, errors, setForm, sectionRef }: BasicInfoSectionProps) {
  // 联动配置
  const isSingle = form.shipmentType === "single";
  const isPanel = form.shipmentType === "panel" || form.shipmentType === "panel_agent";

  const countLabel = isSingle ? "Single Count" : "Panel Count";
  const countUnit = isSingle ? "Pcs" : "Set";

  const borderTip = isPanel ? "If panelization, set ≥5mm. No border may increase cost." : "If you need panelization, suggest set border ≥5mm.";

  // 新的字段配置数组，顺序可控
  const basicFields = [
    { key: "pcbType", type: "radio" },
    { key: "layers", type: "radio" },
    { key: "thickness", type: "radio" },
    { key: "hdi", type: "radio" },
    { key: "tg", type: "radio" },    
    { key: "differentDesignsCount", type: "input" },
    { key: "border", type: "radio" },
    { key: "singleSize", type: "group" },
    { key: "shipmentType", type: "radio" },
    { key: "panelRow", type: "input" },
    { key: "panelColumn", type: "input" }
  ];

  console.log("当前 PCB Quote Form：", form);

  // 统一依赖联动重置方案
  const prevDepsRef = useRef<any>({});
  useEffect(() => {
    let newForm = { ...form };
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
        let options = typeof rule.options === "function"
          ? rule.options(form)
          : rule.options;
        // 只有当当前值不在 options 里，或者依赖变化时才重置
        if (!options?.includes(newForm[key]) || newForm[key] !== defaultValue) {
          newForm[key] = defaultValue;
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
              <div className="flex items-center gap-4" key="singleSize">
                <Tooltip content={<div className="max-w-xs text-left">Enter the finished size of your PCB in centimeters (cm).</div>}>
                  <label className="w-32 text-xs font-normal text-right cursor-help">Single Size (cm)</label>
                </Tooltip>
                <div className="flex items-center gap-3 flex-1">
                  <Input
                    type="number"
                    min={0.1}
                    step={0.01}
                    placeholder="Length/x"
                    value={form.singleLength ?? ''}
                    onChange={e => setForm((prev: any) => ({ ...prev, singleLength: e.target.value }))}
                    className="w-24"
                  />
                  <span className="mx-1">×</span>
                  <Input
                    type="number"
                    min={0.1}
                    step={0.01}
                    placeholder="Width/y"
                    value={form.singleWidth ?? ''}
                    onChange={e => setForm((prev: any) => ({ ...prev, singleWidth: e.target.value }))}
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
                <div className="flex items-center gap-4" key="panelRowCol">
                  <Tooltip content={<div className="max-w-xs text-left">Set the panelization type (e.g. 1 pcs × 2 pcs per panel).
                  </div>}>
                    <label className="w-32 text-xs font-normal text-right cursor-help">Panel Type</label>
                  </Tooltip>
                  <div className="flex items-center gap-3 flex-1">
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      placeholder="Panel Rows"
                      value={form.panelRow ?? ''}
                      onChange={e => setForm((prev: any) => ({ ...prev, panelRow: e.target.value }))}
                      className="w-24"
                    />
                    <span className="mx-1">pcs ×</span>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      placeholder="Panel Columns"
                      value={form.panelColumn ?? ''}
                      onChange={e => setForm((prev: any) => ({ ...prev, panelColumn: e.target.value }))}
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
                  type={["differentDesignsCount", "panelRow", "panelColumn", "singleLength", "singleWidth"].includes(key) ? "number" : "text"}
                  min={["panelRow", "panelColumn", "differentDesignsCount"].includes(key) ? 1 : undefined}
                  step={["panelRow", "panelColumn", "differentDesignsCount"].includes(key) ? 1 : undefined}
                  value={form[key] ?? ''}
                  onChange={e => setForm((prev: any) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={`Enter ${rule.label}`}
                  className="w-48"
                />
              )}
              {key === 'border' && (
                <span className="text-xs text-muted-foreground">{borderTip}</span>
              )}
            </div>
          );
        })}
        {/* Single Count 区块（批量选项+自定义输入+确定） */}
        <div className="flex items-center gap-2 mb-2">
          <Tooltip content={<div className="max-w-xs text-left">Total quantity of boards or panels you need.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">{countLabel}</label>
          </Tooltip>
          <CustomNumberSelect
            value={isSingle ? form.singleCount : form.panelSet}
            onChange={(v: number) => {
              if (isSingle) {
                setForm((prev: any) => ({ ...prev, singleCount: v }));
              } else {
                setForm((prev: any) => ({ ...prev, panelSet: v }));
              }
            }}
            options={[5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 125, 150, 200, 250, 300, 350, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 6500, 7000, 7500, 9000]}
            unit={countUnit}
            placeholder="Select"
          />
          <span className="ml-2 text-xs text-muted-foreground">{countUnit}</span>
        </div>
      </div>
    </div>
  );
} 