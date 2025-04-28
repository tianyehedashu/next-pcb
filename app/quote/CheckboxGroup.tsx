import React from "react";

export default function CheckboxGroup({ name, options, value, onChange }: any) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt: any) => (
        <label key={opt.value} className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={value.includes(opt.value)}
            onChange={() => {
              if (value.includes(opt.value)) {
                onChange(value.filter((v: any) => v !== opt.value));
              } else {
                onChange([...value, opt.value]);
              }
            }}
            className="accent-blue-600"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
} 