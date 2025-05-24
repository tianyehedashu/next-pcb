import React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface RadioOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name?: string;
  options: RadioOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  className?: string;
}

export default function RadioGroup({ options, value, onChange, className }: RadioGroupProps) {
  return (
    <div className={`flex flex-wrap gap-2 w-full${className ? ` ${className}` : ''}`}>
      {options.map((opt) => {
        const isDisabled = !!opt.disabled;
        return (
          <Button
            type="button"
            key={opt.value}
            variant={value === opt.value ? "default" : "outline"}
            className={`relative flex items-center justify-center px-4 min-h-[44px] min-w-[80px] max-w-[200px] text-sm font-medium transition-all border border-gray-300 text-center whitespace-normal break-words
              rounded-lg shadow-sm
              ${value === opt.value ? "!border-blue-500 !bg-blue-500 !text-white z-10 shadow-md" : "hover:border-blue-400 bg-gray-50 text-gray-700"}
              ${isDisabled ? "opacity-50 cursor-not-allowed !bg-gray-100 !text-gray-400" : ""}
            `}
            onClick={() => !isDisabled && onChange(opt.value)}
            disabled={isDisabled}
          >
            <span className="w-full break-words text-center">{opt.label}</span>
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