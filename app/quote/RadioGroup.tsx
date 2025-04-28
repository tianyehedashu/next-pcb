import React from "react";
import { Check } from "lucide-react";

export default function RadioGroup({ name, options, value, onChange }: any) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((opt: any) => (
        <button
          type="button"
          key={opt.value}
          className={`relative px-4 py-2 rounded-md border text-xs font-normal transition-all
            ${value === opt.value
              ? "border-blue-400 bg-blue-50 text-blue-700"
              : "border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50"}
          `}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
          {value === opt.value && (
            <span className="absolute right-0.5 bottom-0.5">
              <Check size={14} className="text-blue-500" />
            </span>
          )}
        </button>
      ))}
    </div>
  );
} 