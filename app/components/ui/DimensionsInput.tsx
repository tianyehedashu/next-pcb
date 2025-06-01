import * as React from "react";
import { Input } from "@/components/ui/input";
import type { PcbDimensions } from "@/types/pcbQuoteForm";

interface DimensionsInputProps {
  value?: PcbDimensions;
  onChange?: (value: PcbDimensions) => void;
  className?: string;
  disabled?: boolean;
}

export function DimensionsInput({
  value = { length: 0, width: 0 },
  onChange,
  className,
  disabled,
}: DimensionsInputProps) {
  const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const length = parseFloat(e.target.value) || 0;
    onChange?.({ ...value, length });
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const width = parseFloat(e.target.value) || 0;
    onChange?.({ ...value, width });
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Input
        type="number"
        value={value.length || ''}
        onChange={handleLengthChange}
        placeholder="Length"
        min={0}
        step={0.1}
        className="flex-1"
        disabled={disabled}
      />
      <span className="text-gray-500">×</span>
      <Input
        type="number"
        value={value.width || ''}
        onChange={handleWidthChange}
        placeholder="Width"
        min={0}
        step={0.1}
        className="flex-1"
        disabled={disabled}
      />
      <span className="text-sm text-gray-500">cm</span>
    </div>
  );
} 