import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import React from "react";

import { pcbFieldRules, type PCBFieldRule } from "@/lib/pcbFieldRules";
import type { PcbQuoteForm } from "@/types/pcbQuoteForm";
import { useFormDependencyEffects } from '@/lib/hooks/useFormDependencyEffects';
import QuantityInput from "@/app/components/custom-ui/form/QuantityInput";
import GenericFormField from "@/app/components/custom-ui/GenericFormField";

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
  const basicFields: { key: keyof PcbQuoteForm | 'singleSize' | 'panelDimensions'; type: 'radio' | 'input' | 'group' }[] = [
    { key: "pcbType", type: "radio" },
    { key: "layers", type: "radio" },
    { key: "useShengyiMaterial", type: "radio" },
    { key: "thickness", type: "radio" },
    { key: "hdi", type: "radio" },
    { key: "tg", type: "radio" },
    { key: "differentDesignsCount", type: "input" },
    { key: "border", type: "radio" },
    { key: "singleDimensions", type: "group" }, // Special case
    { key: "shipmentType", type: "radio" },
    { key: "panelDimensions", type: "group" }, // Special case

  ];

  console.log("当前 PCB Quote Form 1 ：", form);

  // 统一依赖联动重置方案
  useFormDependencyEffects({ form, setForm }); // Removed 'as any'

  return (
    <div ref={sectionRef} className="scroll-mt-32">
      <div className="flex flex-col gap-3 text-xs">
        {/* 自动渲染基础字段（仅渲染basicFields中配置的） */}
        {basicFields.map(({ key, type }) => {
          // Handle special cases first
          if (key === "singleDimensions") {
            return (
              <div className="flex flex-wrap items-center gap-4" key="singleSize">
                <Tooltip content={<div className="max-w-xs text-left">Enter the finished size of your PCB in centimeters (cm).</div>}>
                  <label className="w-32 text-sm font-medium font-sans text-right cursor-help shrink-0">Single Size (cm)</label>
                </Tooltip>
                <div className="flex-1 min-w-0 w-0 max-w-full flex items-center gap-3 flex-wrap">
                  <Input
                    type="number"
                    placeholder="Length/x"
                    value={form.singleDimensions.length !== undefined && form.singleDimensions.length !== null ? String(form.singleDimensions.length) : ''}
                    onChange={e => {
                      const value = e.target.value === '' ? 0 : Number(e.target.value);
                      setForm((prev: PcbQuoteForm & { gerber?: File }) => ({
                        ...prev,
                        singleDimensions: { ...prev.singleDimensions, length: value }
                      }));
                    }}
                    className="w-24"
                  />
                  <span className="mx-1">×</span>
                  <Input
                    type="number"
                    placeholder="Width/y"
                    value={form.singleDimensions.width !== undefined && form.singleDimensions.width !== null ? String(form.singleDimensions.width) : ''}
                    onChange={e => {
                      const value = e.target.value === '' ? 0 : Number(e.target.value);
                      setForm((prev: PcbQuoteForm & { gerber?: File }) => ({
                        ...prev,
                        singleDimensions: { ...prev.singleDimensions, width: value }
                      }));
                    }}
                    className="w-24"
                  />
                  <span className="ml-2 text-xs text-muted-foreground">cm</span>
                </div>
              </div>
            );
          }
          if (key === "panelDimensions") {
            // Only show in panel mode
            if (!isPanel) return null;
            return (
              <div className="flex flex-wrap items-center gap-4" key="panelDimensions">
                <Tooltip content={<div className="max-w-xs text-left">Set the panelization type (e.g. 1 pcs × 2 pcs per panel).
                </div>}>
                  <label className="w-32 text-sm font-medium font-sans text-right cursor-help shrink-0">Panel Type</label>
                </Tooltip>
                <div className="flex-1 min-w-0 w-0 max-w-full flex items-center gap-3 flex-wrap">
                  <Input
                    type="number"
                    placeholder="Panel Rows"
                    value={form.panelDimensions?.row !== undefined && form.panelDimensions?.row !== null ? String(form.panelDimensions.row) : ''}
                    onChange={e => setForm((prev) => ({
                      ...prev,
                      panelDimensions: { ...prev.panelDimensions, row: e.target.value === '' ? undefined : Number(e.target.value) }
                    }))} // Corrected type
                    className="w-24"
                  />
                  <span className="mx-1">pcs ×</span>
                  <Input
                    type="number"
                    placeholder="Panel Columns"
                    value={form.panelDimensions?.column !== undefined && form.panelDimensions?.column !== null ? String(form.panelDimensions.column) : ''}
                    onChange={e => setForm((prev) => ({
                      ...prev,
                      panelDimensions: { ...prev.panelDimensions, column: e.target.value === '' ? undefined : Number(e.target.value) }
                    }))} // Corrected type
                    className="w-24"
                  />
                  <span className="ml-2 text-xs text-muted-foreground">pcs</span>
                </div>
              </div>
            );
          }

          // Handle generic fields using GenericFormField
          const rule = pcbFieldRules[key as keyof PcbQuoteForm]; // Cast key to PcbQuoteForm key
          if (!rule) return null;

          // Ensure type is compatible with GenericFormField's expected types
          if (type === 'group') return null; // GenericFormField doesn't handle 'group'

          return (
            <GenericFormField
              key={key}
              fieldKey={key as keyof PcbQuoteForm}
              type={type as 'radio' | 'input'} // Cast type to the union of types handled by GenericFormField
              form={form}
              setForm={setForm}
              rule={rule as PCBFieldRule} // Cast rule to PCBFieldRule
            />
          );
        })}
        {/* Quantity Input Component */}
        <QuantityInput
          isSingle={isSingle}
          form={form}
          setForm={setForm}
          countLabel={countLabel}
          countUnit={countUnit}
        />
        <div className="flex items-center gap-4">
          <Tooltip content={<div className="max-w-xs text-left">Add any special notes for production use..</div>}>
            <label className="w-32 text-sm font-medium font-sans text-right cursor-help">PCB Note</label>
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