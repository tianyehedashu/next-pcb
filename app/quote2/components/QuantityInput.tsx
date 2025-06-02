"use client"
import React, { useState, useCallback } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Formily 组件的 props 类型 - 适配Formily接口
interface QuantityInputProps {
  value?: number | string | null;
  onChange?: (value: number | string | null) => void;
  placeholder?: string;
  unit?: string;
  className?: string;
}

// 预设的数量选项
const PRESET_QUANTITY_OPTIONS = [
  5, 10, 15, 20, 25,
  30, 40, 50, 75, 100,
  125, 150, 200, 250, 300,
  350, 400, 500, 600, 700,
  800, 900, 1000, 1500, 2000,
  2500, 3000, 4000, 5000, 6000
] as const;

const QuantityInput: React.FC<QuantityInputProps> = ({ 
  value, 
  onChange, 
  placeholder = "Select quantity",
  unit = "pcs",
  className
}) => {
  const [customValue, setCustomValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  
  // 转换数值
  const numericValue = value ? Number(value) : undefined;

  // 处理预设选项选择
  const handlePresetSelect = useCallback((selectedValue: string) => {
    const numValue = Number(selectedValue);
    onChange?.(numValue);
    setIsOpen(false);
  }, [onChange]);

  // 处理自定义输入确认
  const handleCustomConfirm = useCallback(() => {
    const numValue = Number(customValue);
    if (customValue && numValue > 0) {
      onChange?.(numValue);
      setCustomValue("");
      setIsOpen(false);
    }
  }, [customValue, onChange]);

  // 处理自定义输入变化
  const handleCustomInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setCustomValue(e.target.value);
  }, []);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomConfirm();
    }
  }, [handleCustomConfirm]);

  // 阻止事件冒泡的通用处理器
  const stopPropagation = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
  }, []);

  // 验证自定义输入
  const isCustomValueValid = customValue && Number(customValue) > 0;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Select
        open={isOpen}
        onOpenChange={setIsOpen}
        value=""
        onValueChange={handlePresetSelect}
      >
        <SelectTrigger className="w-36 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-200">
          <span className={cn(
            "text-sm",
            numericValue ? "text-gray-900 font-medium" : "text-gray-500"
          )}>
            {numericValue ? String(numericValue) : placeholder}
          </span>
        </SelectTrigger>
        
        <SelectContent className="max-h-80 w-80">
          {/* 预设选项网格 */}
          <div className="grid grid-cols-5 gap-1 p-3 max-h-60 overflow-y-auto">
            {PRESET_QUANTITY_OPTIONS.map((count) => (
              <SelectItem 
                key={count} 
                value={String(count)}
                className="text-center justify-center min-w-[60px] h-9 text-sm hover:bg-blue-50 focus:bg-blue-100"
              >
                {count}
              </SelectItem>
            ))}
          </div>
          
          {/* 自定义输入区域 */}
          <div 
            className="flex items-center gap-2 p-3 border-t bg-gray-50"
            onClick={stopPropagation}
          >
            <Input
              type="number"
              min={1}
              value={customValue}
              onChange={handleCustomInputChange}
              onClick={stopPropagation}
              onFocus={stopPropagation}
              onKeyDown={handleKeyDown}
              placeholder="Other quantity"
              className="flex-1 h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-200"
            />
            <Button
              size="sm"
              onClick={handleCustomConfirm}
              disabled={!isCustomValueValid}
              className="h-9 px-3 text-sm bg-gray-800 hover:bg-gray-900 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm
            </Button>
          </div>
        </SelectContent>
      </Select>
      
      {/* 单位显示 */}
      {unit && (
        <span className="text-sm font-medium text-gray-600 bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
          {unit}
        </span>
      )}
    </div>
  );
};

// 设置组件的 displayName
QuantityInput.displayName = "QuantityInput";

export default QuantityInput;
