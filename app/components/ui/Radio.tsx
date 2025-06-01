import * as React from "react";

interface RadioOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface RadioProps {
  value?: string | number;
  onChange?: (value: string | number) => void;
  options?: RadioOption[];
  className?: string;
  disabled?: boolean;
}

export function Radio({
  value,
  onChange,
  options = [],
  className,
  disabled,
}: RadioProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((option) => (
        <label
          key={option.value}
          className={`
            flex items-center gap-2 px-3 py-2 border rounded cursor-pointer
            ${value === option.value ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-300'}
            ${option.disabled || disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
          `}
        >
          <input
            type="radio"
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={option.disabled || disabled}
            className="sr-only"
          />
          <span className="text-sm">{option.label}</span>
        </label>
      ))}
    </div>
  );
} 