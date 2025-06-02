import React from "react";
import { connect, mapProps } from "@formily/react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ProductReport } from "@/types/form";
import { cn } from "@/lib/utils";

interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  options?: Option[];
  disabled?: boolean;
  isProductReport?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ value = [], onChange, options = [], disabled, isProductReport = false }) => {
  const handleChange = (optionValue: string, checked: boolean) => {
    let newValue = [...value];
    
    if (isProductReport) {
      if (checked) {
        if (optionValue === ProductReport.None) {
          newValue = [ProductReport.None];
        } else {
          newValue = newValue.filter(v => v !== ProductReport.None);
          if (!newValue.includes(optionValue)) {
            newValue.push(optionValue);
          }
        }
      } else {
        newValue = newValue.filter(v => v !== optionValue);
        if (newValue.length === 0) {
          newValue = [ProductReport.None];
        }
      }
    } else {
      if (checked) {
        if (!newValue.includes(optionValue)) {
          newValue.push(optionValue);
        }
      } else {
        newValue = newValue.filter(v => v !== optionValue);
      }
    }
    
    onChange?.(newValue);
  };

  // 分离互斥选项和普通选项
  const noneOption = isProductReport ? options.find(opt => opt.value === ProductReport.None) : null;
  const reportOptions = isProductReport ? options.filter(opt => opt.value !== ProductReport.None) : options;
  const hasNoneSelected = value.includes(ProductReport.None);

  return (
    <div className="space-y-3">
      {isProductReport && noneOption && (
        <div className="pb-2 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={noneOption.value}
              checked={value.includes(noneOption.value)}
              onCheckedChange={(checked) => handleChange(noneOption.value, !!checked)}
              disabled={disabled}
            />
            <Label
              htmlFor={noneOption.value}
              className={cn(
                "text-sm font-medium cursor-pointer flex items-center gap-2",
                hasNoneSelected && "text-blue-600"
              )}
            >
              {noneOption.label}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                Default
              </span>
            </Label>
          </div>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            Select this if no specific reports are required
          </p>
        </div>
      )}

      {isProductReport && reportOptions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-700">Additional Reports</span>
            {hasNoneSelected && (
              <span className="text-xs text-gray-400">(disabled when &quot;None&quot; is selected)</span>
            )}
          </div>
          <div className="space-y-2">
            {reportOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={option.value}
                  checked={value.includes(option.value)}
                  onCheckedChange={(checked) => handleChange(option.value, !!checked)}
                  disabled={disabled || hasNoneSelected}
                />
                <Label
                  htmlFor={option.value}
                  className={cn(
                    "text-sm font-normal cursor-pointer",
                    hasNoneSelected && "text-gray-400 cursor-not-allowed"
                  )}
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
          {hasNoneSelected && (
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Uncheck &quot;None&quot; to enable additional report options
            </p>
          )}
        </div>
      )}

      {!isProductReport && (
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
      )}
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