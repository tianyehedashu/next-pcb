import React from 'react';
import { Tooltip } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import RadioGroup from '../RadioGroup';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

import { pcbFieldRules } from '@/lib/pcbFieldRules';
import type { PcbQuoteForm } from '@/types/pcbQuoteForm';
import type { PcbFieldRule } from '@/lib/pcbFieldRules'; // Assuming PcbFieldRule type exists or deriving it
import { Dispatch, SetStateAction } from 'react';

interface BasicFormFieldProps {
  fieldKey: keyof PcbQuoteForm | 'singleSize' | 'panelDimensions';
  fieldType: 'radio' | 'input' | 'group';
  form: PcbQuoteForm & { gerber?: File };
  setForm: Dispatch<SetStateAction<PcbQuoteForm & { gerber?: File }>>; // Corrected type for setForm
}

const BasicFormField: React.FC<BasicFormFieldProps> = ({
  fieldKey,
  fieldType,
  form,
  setForm,
}) => {
  // Retrieve rule based on fieldKey. Handle 'singleSize' and 'panelDimensions' specially if needed
  const rule = pcbFieldRules[fieldKey as keyof PcbQuoteForm]; // Cast needed because pcbFieldRules might not have 'singleSize' or 'panelDimensions' keys directly

  // Handle cases where rule is not found or field should not be shown
  if (!rule && fieldType !== 'group') return null; // Only allow group type if rule is missing (for custom groups like singleSize/panelDimensions)
  if (rule && rule.shouldShow && !rule.shouldShow(form)) return null;

  // Unified options handling
  const options = (rule && typeof rule.options === 'function' ? rule.options(form) : rule?.options) || [];

  const isPanel = form.shipmentType === "panel";

  // Custom rendering for 'singleSize' and 'panelDimensions' groups
  if (fieldKey === "singleSize") {
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

  if (fieldKey === "panelDimensions") {
    // Only show in panel mode
    if (!isPanel) return null;
    return (
      <div className="flex flex-wrap items-center gap-4" key="panelDimensions">
        <Tooltip content={<div className="max-w-xs text-left">Set the panelization type (e.g. 1 pcs × 2 pcs per panel).</div>}>
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
            }))}
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
            }))}
            className="w-24"
          />
          <span className="ml-2 text-xs text-muted-foreground">pcs</span>
        </div>
      </div>
    );
  }

  // Standard rendering for 'radio' and 'input' types
  return (
    <div className="flex flex-wrap items-center gap-4" key={fieldKey}>
      <Tooltip content={<div className="max-w-xs text-left">{fieldKey === 'tg' ? 'TG Rating' : rule.label}</div>}>
        <label className="w-32 text-sm font-medium font-sans text-right cursor-help shrink-0">{fieldKey === 'tg' ? 'TG Rating' : rule.label}</label>
      </Tooltip>
      <div className="flex-1 min-w-0 w-0 max-w-full">
        {fieldType === "radio" && options.length > 0 && (
          <RadioGroup
            name={fieldKey as string}
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
                disabled: rule.shouldDisable ? rule.shouldDisable({ ...form, [fieldKey]: value }) : false,
                radius: opts.length === 1 ? "rounded-lg" : idx === 0 ? "rounded-r-none rounded-l-lg" : idx === opts.length - 1 ? "rounded-r-lg !rounded-l-none -ml-px" : "rounded-none -ml-px"
              }));
            })()}
            value={
              typeof form[fieldKey as keyof PcbQuoteForm] === 'string' || typeof form[fieldKey as keyof PcbQuoteForm] === 'number'
                ? form[fieldKey as keyof PcbQuoteForm] as string | number
                : ''
            }
            onChange={(v: string | number) => setForm((prev) => ({
                ...prev,
                [fieldKey as keyof PcbQuoteForm]: v,
            }))}
            className="flex flex-wrap gap-2"
          />
        )}
        {false && options.length > 0 && ( // Keep false to disable Select for now
          <Select value={String(form[fieldKey as keyof PcbQuoteForm] ?? '')} onValueChange={(v) => setForm((prev: PcbQuoteForm & { gerber?: File }) => ({ ...prev, [fieldKey as keyof PcbQuoteForm]: v }))}>
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
        )}
        {fieldType === "input" && (
          <Input
            type={["differentDesignsCount", "panelRow", "panelColumn"].includes(fieldKey) ? "number" : "text"} // This logic needs refinement for panel dimensions
            value={
              typeof form[fieldKey as keyof PcbQuoteForm] === 'string' || typeof form[fieldKey as keyof PcbQuoteForm] === 'number'
                ? String(form[fieldKey as keyof PcbQuoteForm])
                : ''
            }
            onChange={e => setForm((prev) => ({
              ...prev,
              [fieldKey as keyof PcbQuoteForm]: e.target.value === '' ? undefined : Number(e.target.value) as any // Still using any here for simplicity, needs proper typing
            }))}
            placeholder={rule.label ? `Enter ${rule.label}` : ''}
            className="w-48"
          />
        )}
      </div>
    </div>
  );
};

export default BasicFormField; 