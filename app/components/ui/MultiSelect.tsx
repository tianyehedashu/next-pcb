import React from "react";
import { connect, mapProps } from "@formily/react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  options?: Option[];
  disabled?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ value = [], onChange, options = [], disabled }) => {
  const handleChange = (optionValue: string, checked: boolean) => {
    let newValue = [...value];
    if (checked) {
      if (!newValue.includes(optionValue)) {
        newValue.push(optionValue);
      }
    } else {
      newValue = newValue.filter(v => v !== optionValue);
    }
    onChange?.(newValue);
  };

  return (
    <div className="space-y-2">
      {options.map((option) => (
        <div key={option.value} className="flex items-center space-x-2">
          <Checkbox
            id={option.value}
            checked={value.includes(option.value)}
            onCheckedChange={(checked) => handleChange(option.value, !!checked)}
            disabled={disabled}
          />
          <Label
            htmlFor={option.value}
            className="text-sm font-normal cursor-pointer"
          >
            {option.label}
          </Label>
        </div>
      ))}
    </div>
  );
};

export default connect(
  MultiSelect,
  mapProps((props) => {
    return {
      ...props,
    };
  })
); 