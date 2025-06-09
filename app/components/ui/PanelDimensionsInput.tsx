import * as React from "react";
import { Input } from "@/components/ui/input";
import type { PanelDimensions } from "@/types/pcbQuoteForm";

interface PanelDimensionsInputProps {
  value?: PanelDimensions;
  onChange?: (value: PanelDimensions) => void;
  className?: string;
  disabled?: boolean;
}

export function PanelDimensionsInput({
  value,
  onChange,
  className,
  disabled,
}: PanelDimensionsInputProps) {
  const handleRowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const row = val === '' ? undefined : parseInt(val);
    onChange?.({ ...value, row });
  };

  const handleColumnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const column = val === '' ? undefined : parseInt(val);
    onChange?.({ ...value, column });
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Input
        type="number"
        value={value?.row === undefined ? '' : value.row}
        onChange={handleRowChange}
        placeholder="Row"
        min={1}
        className="flex-1"
        disabled={disabled}
      />
      <span className="text-gray-500">×</span>
      <Input
        type="number"
        value={value?.column === undefined ? '' : value.column}
        onChange={handleColumnChange}
        placeholder="Column"
        min={1}
        className="flex-1"
        disabled={disabled}
      />
      <span className="text-sm text-gray-500">pcs</span>
    </div>
  );
} 