import { Input } from "@/components/ui/input";
import RadioGroup from "@/app/quote/RadioGroup"; // Adjust path if necessary
import { Tooltip } from "@/components/ui/tooltip";
import React from "react";

import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import type { PcbQuoteForm } from "@/types/pcbQuoteForm";
import type { PcbFieldRule } from "@/lib/pcbFieldRules";

interface GenericFormFieldProps {
  fieldKey: keyof PcbQuoteForm;
  type: 'radio' | 'input' | 'group'; // Include group type though it's not handled generically
  form: PcbQuoteForm;
  setForm: React.Dispatch<React.SetStateAction<PcbQuoteForm & { gerber?: File }>>;
  rule: PcbFieldRule;
}

export default function GenericFormField({
  fieldKey,
  type,
  form,
  setForm,
  rule,
}: GenericFormFieldProps) {

  // Group type is handled specifically in the parent component
  if (type === 'group') return null;

  // Check if the field should be shown
  if (rule.shouldShow && !rule.shouldShow(form)) return null;

  // Determine options for radio/select
  const options = (typeof rule.options === 'function' ? rule.options(form) : rule.options) || [];

  const commonProps = {
    // Adjust label based on key if needed, e.g., TG Rating
    label: fieldKey === 'tg' ? 'TG Rating' : rule.label,
    tooltipContent: fieldKey === 'tg' ? 'TG Rating' : rule.label, // Use label as default tooltip content
  };

  return (
    <div className="flex flex-wrap items-center gap-4" key={fieldKey}>
      <Tooltip content={<div className="max-w-xs text-left">{commonProps.tooltipContent}</div>}>
        <label className="w-32 text-sm font-medium font-sans text-right cursor-help shrink-0">{commonProps.label}</label>
      </Tooltip>
      <div className="flex-1 min-w-0 w-0 max-w-full">
        {type === "radio" && options.length > 0 && (
          <RadioGroup
            name={fieldKey}
            options={(() => {
              let opts = options;
              if (typeof options[0] === 'boolean') {
                opts = [false, true];
              }
              return (opts as Array<string | number | boolean>).map((value, idx) => ({
                value: typeof value === 'boolean' ? String(value) : value,
                label: typeof value === 'boolean'
                  ? String(value ? rule.trueLabel || 'Yes' : rule.falseLabel || 'No')
                  : (typeof value === 'string' || typeof value === 'number') && rule.unit ? `${value} ${rule.unit}` : (typeof value === 'string' ? value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, '-') : String(value)),
                disabled: rule.shouldDisable ? rule.shouldDisable({ ...form, [fieldKey]: value as any }) : false, // Keep as any for now
                radius: opts.length === 1 ? "rounded-lg" : idx === 0 ? "rounded-r-none rounded-l-lg" : idx === opts.length - 1 ? "rounded-r-lg !rounded-l-none -ml-px" : "rounded-none -ml-px"
              }));
            })()}
            value={
              typeof form[fieldKey] === 'string' || typeof form[fieldKey] === 'number'
                ? form[fieldKey] as string | number
                : ''
            }
            onChange={(v: string | number) => setForm((prev) => ({ ...prev, [fieldKey]: v as any }))} // Keep as any for now
            className="flex flex-wrap gap-2"
          />
        )}
        {/* Select component is commented out in BasicInfoSection, keep it commented here */}
        {/* {false && options.length > 0 && ( 
          <Select value={String(form[fieldKey] ?? '')} onValueChange={(v) => setForm((prev: PcbQuoteForm & { gerber?: File }) => ({ ...prev, [fieldKey]: v }))}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={`Select ${rule.label}`} />
            </SelectTrigger>
            <SelectContent>
              {(options as Array<string | number>).map((value) => (
                <SelectItem key={value} value={String(value)} disabled={rule.shouldDisable ? rule.shouldDisable({ ...form, [fieldKey]: value }) : false}>
                  {(typeof value === 'string' || typeof value === 'number') && rule.unit ? `${value} ${rule.unit}` : (typeof value === 'string' ? value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, '-') : String(value))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}*/}
        {type === "input" && (
          <Input
            type={['differentDesignsCount'].includes(fieldKey) ? "number" : "text"} // Adjust type based on key
            value={
              typeof form[fieldKey] === 'string' || typeof form[fieldKey] === 'number'
                ? String(form[fieldKey])
                : ''
            }
            onChange={e => setForm((prev) => ({
              ...prev,
              [fieldKey]: e.target.value === '' ? undefined : Number(e.target.value) as any // Keep as any for now
            }))}
            placeholder={rule.label ? `Enter ${rule.label}` : ''}
            className="w-48"
          />
        )}
      </div>
    </div>
  );
} 