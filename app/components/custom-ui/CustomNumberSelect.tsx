import React, { useState } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CustomNumberSelectProps {
  value: number;
  onChange: (v: number) => void;
  options: number[];
  unit?: string;
  placeholder?: string;
}

const CustomNumberSelect: React.FC<CustomNumberSelectProps> = ({ value, onChange, options, unit, placeholder }) => {
  const [customValue, setCustomValue] = useState("");
  const [open, setOpen] = useState(false);
  const displayValue = options.includes(value) ? String(value) : (value ? String(value) : "");

  return (
    <Select
      open={open}
      onOpenChange={setOpen}
      value={options.includes(value) ? String(value) : ""}
      onValueChange={v => {
        onChange(Number(v));
        setOpen(false);
      }}
    >
      <SelectTrigger className="w-40 text-xs">
        {displayValue ? `${displayValue}` : (placeholder || "Select")}
      </SelectTrigger>
      <SelectContent>
        <div className="grid grid-cols-5 gap-2 p-2 max-h-56 overflow-y-auto">
          {options.map(count => (
            <SelectItem key={count} value={String(count)}>{count}</SelectItem>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2 p-2 border-t">
          <Input
            type="number"
            min={1}
            value={customValue}
            onChange={e => setCustomValue(e.target.value)}
            placeholder="Other quantity"
            className="w-24"
          />
          <Button
            size="sm"
            onClick={() => {
              if (customValue) {
                onChange(Number(customValue));
                setCustomValue("");
                setOpen(false);
              }
            }}
          >
            Confirm
          </Button>
        </div>
      </SelectContent>
    </Select>
  );
};

export default CustomNumberSelect; 