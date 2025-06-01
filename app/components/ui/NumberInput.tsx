import * as React from "react";
import { Input } from "@/components/ui/input";

interface NumberInputProps {
  value?: number | string;
  onChange?: (value: number | undefined) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

export function NumberInput({
  value,
  onChange,
  placeholder,
  min,
  max,
  step = 1,
  className,
  disabled,
  ...props
}: NumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange?.(undefined);
    } else {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        onChange?.(num);
      }
    }
  };

  return (
    <Input
      type="number"
      value={value ?? ''}
      onChange={handleChange}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      className={className}
      disabled={disabled}
      {...props}
    />
  );
} 