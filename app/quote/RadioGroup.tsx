import React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RadioGroup({ name, options, value, onChange }: any) {
  return (
    <div className="flex flex-row gap-0">
      {options.map((opt: any, idx: number) => {
        let radius = "";
        if (idx === 0) radius = "rounded-r-none rounded-l-lg";
        else if (idx === options.length - 1) radius = "!rounded-l-none -ml-px";
        else radius = "rounded-none -ml-px";
        const isDisabled = !!opt.disabled;
        return (
          <Button
            type="button"
            key={opt.value}
            variant={value === opt.value ? "default" : "outline"}
            className={`relative px-3 py-1.5 h-8 min-w-[64px] text-[11px] font-medium transition-all border border-gray-300 ${radius}
              ${value === opt.value ? "!border-blue-600 !bg-blue-600 !text-white z-10" : "hover:border-blue-400 bg-white text-gray-700"}
              ${isDisabled ? "opacity-50 cursor-not-allowed !bg-gray-100 !text-gray-400" : ""}
            `}
            onClick={() => !isDisabled && onChange(opt.value)}
            disabled={isDisabled}
          >
            {opt.label}
            {value === opt.value && !isDisabled && (
              <span className="absolute right-1 bottom-1">
                <Check size={14} className="text-blue-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]" />
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
} 