"use client";

import { Badge } from "@/components/ui/badge";

// 现代化选项卡式选择组件
function TabSelect({ value, onChange, options, dataSource, className }: {
  value?: string | number;
  onChange?: (val: string | number) => void;
  options?: Array<{ label: string; value: string | number }>;
  dataSource?: Array<{ label: string; value: string | number }>;
  className?: string;
}) {
  // 🛡️ 防御性编程：优先使用dataSource（Formily动态选项），然后使用options（静态选项）
  const safeOptions = dataSource || options || [];
  
  // 调试信息
  if (process.env.NODE_ENV === 'development') {
    console.log('TabSelect render:', { 
      value, 
      optionsLength: options?.length || 0, 
      dataSourceLength: dataSource?.length || 0,
      safeOptionsLength: safeOptions.length,
      safeOptions: safeOptions.slice(0, 3) // 只显示前3个避免日志过长
    });
  }
  
  // 如果没有选项，显示占位符
  if (safeOptions.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 bg-gray-100 rounded-lg border-2 border-dashed ${className || ""}`}>
        <span className="text-sm">No options available</span>
      </div>
    );
  }
  
  return (
    <div className={`flex gap-2 flex-wrap ${className || ""}`}>
      {safeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange?.(option.value)}
          className={`px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all duration-200 capitalize ${
            value === option.value
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20 transform scale-105"
              : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-md"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// 现代化布尔选项卡组件
function BooleanTabs({ value, onChange }: {
  value?: boolean;
  onChange?: (val: boolean) => void;
}) {
  const options = [
    { label: "No", value: false, icon: "❌" },
    { label: "Yes", value: true, icon: "✅" }
  ];

  return (
    <div className="flex gap-3">
      {options.map((option) => (
        <button
          key={option.label}
          type="button"
          onClick={() => onChange?.(option.value)}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border-2 transition-all duration-200 min-w-[80px] ${
            value === option.value
              ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/25 transform scale-105"
              : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 hover:shadow-md"
          }`}
        >
          <span className="text-base">{option.icon}</span>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

// 现代化单选组件
function RadioTabs({ value, onChange, options, dataSource }: {
  value?: string;
  onChange?: (val: string) => void;
  options?: Array<{ label: string; value: string; disabled?: boolean }>;
  dataSource?: Array<{ label: string; value: string; disabled?: boolean }>;
}) {
  // 🛡️ 防御性编程：优先使用dataSource（Formily动态选项），然后使用options（静态选项）
  const safeOptions = dataSource || options || [];
  
  // 调试信息
  if (process.env.NODE_ENV === 'development') {
    console.log('RadioTabs render:', { 
      value, 
      optionsLength: options?.length || 0, 
      dataSourceLength: dataSource?.length || 0,
      safeOptionsLength: safeOptions.length,
      safeOptions: safeOptions.slice(0, 3)
    });
  }
  
  // 如果没有选项，显示占位符
  if (safeOptions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 bg-gray-100 rounded-lg border-2 border-dashed">
        <span className="text-sm">No options available</span>
      </div>
    );
  }
  
  return (
    <div className="flex gap-3 flex-wrap">
      {safeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => !option.disabled && onChange?.(option.value)}
          disabled={option.disabled}
          className={`px-6 py-3 text-sm font-medium rounded-lg border-2 transition-all duration-200 capitalize
            ${value === option.value
              ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/25 transform scale-105"
              : "bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:shadow-md"}
            ${option.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// 现代化数量输入组件
function QuantityInput({ value, onChange, unit }: {
  value?: number;
  onChange?: (val: number) => void;
  unit?: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200">
      <input
        type="number"
        value={value || 40}
        onChange={(e) => onChange?.(parseInt(e.target.value) || 40)}
        className="w-28 px-4 py-2.5 text-sm font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
        min="1"
        step="1"
      />
      {unit && (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700 px-3 py-1">
          {unit}
        </Badge>
      )}
    </div>
  );
}

// 导出所有自定义组件
export const QuoteFormCustomComponents = {
  TabSelect,
  BooleanTabs,
  RadioTabs,
  QuantityInput,
}; 