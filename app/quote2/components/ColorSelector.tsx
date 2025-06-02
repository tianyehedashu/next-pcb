"use client";

import React from "react";
import { connect, mapProps } from "@formily/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ColorOption {
  label: string;
  value: string;
  color?: string;
  bgColor?: string;
}

interface ColorSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  options?: ColorOption[];
  disabled?: boolean;
  className?: string;
}

// 颜色映射配置
const COLOR_MAP: Record<string, { color: string; bgColor: string }> = {
  // Solder Mask Colors
  'Green': { color: '#ffffff', bgColor: '#22c55e' },
  'Matt Green': { color: '#ffffff', bgColor: '#16a34a' },
  'Blue': { color: '#ffffff', bgColor: '#3b82f6' },
  'Red': { color: '#ffffff', bgColor: '#ef4444' },
  'Black': { color: '#ffffff', bgColor: '#000000' },
  'Matt Black': { color: '#ffffff', bgColor: '#374151' },
  'White': { color: '#000000', bgColor: '#ffffff' },
  'Yellow': { color: '#000000', bgColor: '#eab308' },
  
  // // Silk Screen Colors
  // 'White': { color: '#000000', bgColor: '#ffffff' },
  // 'black': { color: '#ffffff', bgColor: '#000000' },
  // 'yellow': { color: '#000000', bgColor: '#eab308' },
};

const ColorSelector: React.FC<ColorSelectorProps> = ({
  value,
  onChange,
  options = [],
  disabled = false,
  className
}) => {
  const handleSelect = (optionValue: string) => {
    if (disabled) return;
    onChange?.(optionValue);
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const isSelected = value === option.value;
        const colorConfig = COLOR_MAP[option.value] || COLOR_MAP[option.label] || { color: '#000000', bgColor: '#ffffff' };
        
        return (
          <Button
            key={option.value}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSelect(option.value)}
            disabled={disabled}
            className={cn(
              "px-4 py-2 min-w-[80px] rounded-lg border transition-colors duration-150 relative",
              isSelected
                ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {/* 颜色圆点 */}
            <div 
              className="w-3 h-3 rounded-full border border-gray-300 mr-2 flex-shrink-0"
              style={{ backgroundColor: colorConfig.bgColor }}
            />
            
            {/* 标签文字 */}
            <span className="text-sm font-medium">
              {option.label}
            </span>
          </Button>
        );
      })}
    </div>
  );
};

// 使用 Formily 的 connect 和 mapProps 包装组件
export default connect(
  ColorSelector,
  mapProps((props) => {
    return {
      ...props,
      value: props.value,
      onChange: props.onChange,
    };
  })
); 