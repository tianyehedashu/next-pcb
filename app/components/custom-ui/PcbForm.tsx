"use client";
import React, { useState } from "react";
import { pcbFieldRules } from "@/lib/pcbFieldRules";
import { autoFixPcbForm } from "@/lib/autoFixPcbForm";
import { validatePcbForm } from "@/lib/validatePcbForm";

export default function PcbForm({ onSubmit }: { onSubmit?: (form: any) => void }) {
  const [form, setForm] = useState(() => autoFixPcbForm({}, pcbFieldRules));
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleChange(field: string, value: any) {
    const next = { ...form, [field]: value };
    // 自动修正
    const fixed = autoFixPcbForm(next, pcbFieldRules);
    setForm(fixed);
    setErrors(validatePcbForm(fixed, pcbFieldRules));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validatePcbForm(form, pcbFieldRules);
    setErrors(errs);
    if (Object.keys(errs).length === 0 && onSubmit) {
      onSubmit(form);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {Object.entries(pcbFieldRules).map(([field, rule]) => (
        <div key={field}>
          <label className="block mb-1 font-medium">{rule.label}</label>
          <select
            className="w-full border rounded px-2 py-1"
            value={form[field] ?? ''}
            onChange={e => handleChange(field, e.target.value)}
          >
            {rule.options.map((opt: any) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {errors[field] && <div className="text-red-500 text-xs mt-1">{errors[field]}</div>}
        </div>
      ))}
      <button type="submit" className="btn btn-primary w-full">Submit</button>
    </form>
  );
} 