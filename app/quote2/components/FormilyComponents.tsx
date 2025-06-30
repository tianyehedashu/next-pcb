"use client"
import React from "react";
import { createSchemaField, connect, mapProps } from "@formily/react";
import { isField } from "@formily/core";
import { Input } from "@/components/ui/input";
import { Select as UISelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ProductReport } from "@/types/form";
import * as formilyHelpers from "../schema/formilyHelpers";
import QuantityInput from "./QuantityInput";
import ColorSelector from "./ColorSelector";
import { cn } from "@/lib/utils";
import { AddressFormComponent } from "./AddressFormComponent";
import type { AddressFormValue } from "./AddressFormComponent";
import { BoardEdgeInput } from './BoardEdgeInput';
import { DimensionsInput } from "../../components/ui/DimensionsInput";
import { FormFieldLayout } from "./FormFieldLayout";
import { UrgentDeliverySelector } from "./UrgentDeliverySelector";
import { StencilProcessGuide } from "./StencilProcessGuide";


interface OptionWithDisabled {
  label: string;
  value: string | number | boolean;
  disabled?: boolean;
}

// 定义 Formily 组件的 props 类型
interface FormilyFieldProps {
  value?: string | number | boolean | object | null;
  onChange?: (value: string | number | boolean | object | null) => void;
  placeholder?: string;
  dataSource?: OptionWithDisabled[];
  enum?: OptionWithDisabled[];
  options?: OptionWithDisabled[];
  componentProps?: { 
    options?: OptionWithDisabled[];
    isProductReport?: boolean;
    userId?: string;
    productType?: string;
  };
  isProductReport?: boolean;
  userId?: string;
  min?: number;
  max?: number;
  accept?: string;
  unit?: string;
  rows?: number;
  title?: string;
  displayValue?: string;
  type?: string;
  readonly?: boolean;
  disabled?: boolean;
  [key: string]: unknown;
}

// Formily 组件映射配置
export const formilyComponents = {
  Input: (props: FormilyFieldProps) => {
    const isReadOnly = props.readonly || props.disabled;
    return (
      <Input
        type={props.type || 'text'}
        value={String(props.value || '')}
        onChange={(e) => props.onChange?.(e.target.value)}
        placeholder={props.placeholder}
        readOnly={props.readonly}
        disabled={props.disabled}
        className={cn(
          "transition-colors duration-150 text-sm h-10",
          isReadOnly && "bg-gray-50 text-gray-600 cursor-not-allowed border-gray-200"
        )}
      />
    );
  },
  Select: (props: FormilyFieldProps) => {
    const options = props.dataSource || props.enum || props.options || [];

    return (
      <UISelect value={String(props.value || '')} onValueChange={props.onChange}>
        <SelectTrigger className="h-10 text-sm">
          <SelectValue placeholder={props.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={String(option.value)} value={String(option.value)} className="text-sm py-2">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </UISelect>
    );
  },
  TextArea: connect(Textarea, mapProps({
    className: true
  })),
  Checkbox: (props: FormilyFieldProps) => (
    <Checkbox 
      checked={Boolean(props.value)}
      onCheckedChange={(checked) => props.onChange?.(checked)}
      className="w-4 h-4"
    />
  ),
  ColorSelector: (props: FormilyFieldProps) => {
    const options = props.componentProps?.options || props.dataSource || props.enum || props.options || [];
    // 转换选项格式以匹配 ColorSelector 的 ColorOption 类型
    const colorOptions = options.map(option => ({
      label: String(option.label),
      value: String(option.value)
    }));
    return (
      <ColorSelector
        value={String(props.value || '')}
        onChange={props.onChange}
        options={colorOptions}
        disabled={false}
      />
    );
  },
  TabSelect: (props: FormilyFieldProps) => {
    // 支持多种选项数据源：componentProps（动态）、dataSource（动态）、enum（schema定义）、options（组件props）
    const options = props.componentProps?.options || props.dataSource || props.enum || props.options || [];

    return (
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={String(option.value)}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => props.onChange?.(option.value)}
            className={cn(
              "px-4 py-2 min-w-[70px] h-9 rounded-md border transition-colors duration-150 text-sm font-medium",
              props.value === option.value
                ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            )}
          >
            {option.label}
          </Button>
        ))}
      </div>
    );
  },
  BooleanTabs: (props: FormilyFieldProps) => (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => props.onChange?.(false)}
        className={cn(
          "px-4 py-2 min-w-[70px] h-9 rounded-md border transition-colors duration-150 text-sm font-medium",
          props.value === false
            ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        )}
      >
        No
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => props.onChange?.(true)}
        className={cn(
          "px-4 py-2 min-w-[70px] h-9 rounded-md border transition-colors duration-150 text-sm font-medium",
          props.value === true
            ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        )}
      >
        Yes
      </Button>
    </div>
  ),
  RadioTabs: (props: FormilyFieldProps) => {
    // 支持多种选项数据源
    const options = props.componentProps?.options || props.dataSource || props.enum || props.options || [];

    return (
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={String(option.value)}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => !option.disabled && props.onChange?.(option.value)}
            disabled={option.disabled}
            className={cn(
              "px-4 py-2 min-w-[80px] h-9 rounded-md border transition-colors duration-150 text-sm font-medium",
              props.value === option.value
                ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50",
              option.disabled ? "opacity-50 cursor-not-allowed" : ""
            )}
          >
            {option.label}
          </Button>
        ))}
      </div>
    );
  },
  NumberInput: (props: FormilyFieldProps) => {
    const value = props.value as number;
    const hasError = value && (props.min && value < props.min || props.max && value > props.max);

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Input
            type="number"
            value={String(value || '')}
            onChange={(e) => props.onChange?.(e.target.value ? Number(e.target.value) : null)}
            placeholder={props.placeholder}
            min={props.min}
            max={props.max}
            className={cn(
              "w-32 h-10 text-sm transition-colors duration-150 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]",
              hasError
                ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
            )}
          />
          {props.unit && (
            <span className="text-sm font-medium text-gray-600 bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
              {props.unit}
            </span>
          )}
        </div>
        {hasError && (
          <div className="text-sm text-red-500">
            {props.min && value < props.min && `Minimum value is ${props.min}`}
            {props.max && value > props.max && `Maximum value is ${props.max}`}
          </div>
        )}
      </div>
    );
  },
  DimensionsInput: (props: FormilyFieldProps) => {
    return <DimensionsInput value={props.value} onChange={props.onChange} label={props.title} />;
  },
  PanelDimensionsInput: (props: FormilyFieldProps) => {
    const panelDimensions = (props.value as { row?: number; column?: number }) || {};
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="Rows"
          value={panelDimensions.row === undefined ? '' : String(panelDimensions.row)}
          onChange={(e) => props.onChange?.({
            ...panelDimensions,
            row: e.target.value === '' ? undefined : Number(e.target.value)
          })}
          className="w-24 h-10 text-sm"
        />
        <span className="text-sm font-medium">pcs ×</span>
        <Input
          type="number"
          placeholder="Columns"
          value={panelDimensions.column === undefined ? '' : String(panelDimensions.column)}
          onChange={(e) => props.onChange?.({
            ...panelDimensions,
            column: e.target.value === '' ? undefined : Number(e.target.value)
          })}
          className="w-24 h-10 text-sm"
        />
        <span className="text-sm text-muted-foreground font-medium">pcs</span>
      </div>
    );
  },
  QuantityInput: (props: FormilyFieldProps) => (
    <QuantityInput
      value={props.value as number | string | null}
      onChange={(value) => props.onChange?.(value)}
      placeholder={props.placeholder}
      unit={props.unit}
      displayValue={props.displayValue}
    />
  ),
  FileUpload: (props: FormilyFieldProps) => (
    <Input
      type="file"
      accept={props.accept}
      onChange={(e) => props.onChange?.(e.target.files?.[0] || null)}
      placeholder={props.placeholder}
      className="h-10 text-sm file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
    />
  ),
  MultiSelect: ({ value, onChange, ...props }: FormilyFieldProps) => {
    // 检查是否有 isProductReport 属性在任何地方
    const isProductReport = props.componentProps?.isProductReport || 
                           props.isProductReport || 
                           (props as { isProductReport?: boolean }).isProductReport;
    
    // 获取选项数组
    const options = props.componentProps?.options || props.dataSource || props.enum || props.options || [];
    
    // 确保 value 是数组
    const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);
    
    const handleChange = (optionValue: string | number) => {
      if (isProductReport) {
        // 检查是否选择了 "None"
        const isNoneSelected = optionValue === ProductReport.None || optionValue === 'None';
        const isNoneCurrentlySelected = selectedValues.includes(ProductReport.None) || selectedValues.includes('None');
        
        let newValues: (string | number)[];
        
        if (isNoneSelected) {
          if (isNoneCurrentlySelected) {
            // 如果 "None" 已选中，取消选择它
            newValues = selectedValues.filter(v => v !== ProductReport.None && v !== 'None');
          } else {
            // 如果选择 "None"，清除其他所有选项
            newValues = [ProductReport.None];
          }
        } else {
          // 选择其他选项
          if (selectedValues.includes(optionValue)) {
            // 取消选择该选项
            newValues = selectedValues.filter(v => v !== optionValue);
          } else {
            // 添加该选项，并移除 "None"
            newValues = [...selectedValues.filter(v => v !== ProductReport.None && v !== 'None'), optionValue];
          }
        }
        
        // 如果没有选择任何选项，默认选择 "None"
        if (newValues.length === 0) {
          newValues = [ProductReport.None];
        }
        
        onChange?.(newValues);
      } else {
        // 普通多选逻辑
        const newValues = selectedValues.includes(optionValue)
          ? selectedValues.filter(v => v !== optionValue)
          : [...selectedValues, optionValue];
        onChange?.(newValues);
      }
    };
    
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => {
          // 处理选项格式：可能是 {label, value} 对象或直接的值
          const optionValue = typeof option === 'object' && option !== null && 'value' in option 
            ? option.value 
            : option;
          const optionLabel = typeof option === 'object' && option !== null && 'label' in option 
            ? option.label 
            : option;
          
          // 确保 optionValue 是 string 或 number 类型
          const safeOptionValue = typeof optionValue === 'boolean' ? String(optionValue) : optionValue;
          
          const isSelected = selectedValues.includes(safeOptionValue);
          
          return (
            <Button
              key={index}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleChange(safeOptionValue)}
              className={cn(
                "px-4 py-2 min-w-[80px] h-9 rounded-md border transition-colors duration-150 text-sm font-medium",
                isSelected
                  ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              )}
            >
              {optionLabel}
            </Button>
          );
        })}
      </div>
    );
  },
  AddressInput: (props: FormilyFieldProps) => {
    // 从 props 中获取 userId，如果没有则尝试从 form context 获取
    const userId = props.userId || props.componentProps?.userId;
    
    return (
      <div className="formily-address-input">
        <AddressFormComponent
          value={props.value as AddressFormValue}
          onChange={props.onChange}
          userId={userId}
        />
      </div>
    );
  },
  ShippingCostEstimation: (props: FormilyFieldProps) => {
    const shippingData = (props.value as Record<string, string>) || {};
    
    // 国家列表
    const countries = [
      { code: "US", name: "United States", flag: "🇺🇸" },
      { code: "CA", name: "Canada", flag: "🇨🇦" },
      { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
      { code: "DE", name: "Germany", flag: "🇩🇪" },
      { code: "FR", name: "France", flag: "🇫🇷" },
      { code: "JP", name: "Japan", flag: "🇯🇵" },
      { code: "AU", name: "Australia", flag: "🇦🇺" },
      { code: "SG", name: "Singapore", flag: "🇸🇬" },
      { code: "CN", name: "China", flag: "🇨🇳" },
      { code: "KR", name: "South Korea", flag: "🇰🇷" },
      { code: "IN", name: "India", flag: "🇮🇳" },
      { code: "BR", name: "Brazil", flag: "🇧🇷" },
      { code: "MX", name: "Mexico", flag: "🇲🇽" },
      { code: "IT", name: "Italy", flag: "🇮🇹" },
      { code: "ES", name: "Spain", flag: "🇪🇸" },
      { code: "NL", name: "Netherlands", flag: "🇳🇱" },
      { code: "SE", name: "Sweden", flag: "🇸🇪" },
      { code: "NO", name: "Norway", flag: "🇳🇴" },
      { code: "DK", name: "Denmark", flag: "🇩🇰" },
      { code: "FI", name: "Finland", flag: "🇫🇮" },
    ];

    // 快递公司列表
    const couriers = [
      { id: "dhl", name: "DHL", icon: "📦" },
      { id: "fedex", name: "FedEx", icon: "📮" },
      { id: "ups", name: "UPS", icon: "📫" },
      { id: "standard", name: "Standard Shipping", icon: "📪" },
    ];

    const selectedCountry = countries.find(c => c.code === shippingData.country);
    const selectedCourier = couriers.find(c => c.id === shippingData.courier);

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🚚</span>
          <h4 className="text-lg font-semibold text-blue-600">Shipping Cost Estimation</h4>
        </div>
        
        {/* Country and Courier Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Destination Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destination Country
            </label>
            <UISelect 
              value={shippingData.country || ""} 
              onValueChange={(value) => {
                const newShippingData = {
                  ...shippingData,
                  country: value
                };
                props.onChange?.(newShippingData);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select country">
                  {selectedCountry && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{selectedCountry.flag}</span>
                      <span>{selectedCountry.name}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{country.flag}</span>
                      <span>{country.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </UISelect>
          </div>

          {/* Courier Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Courier
            </label>
            <UISelect 
              value={shippingData.courier || ""} 
              onValueChange={(value) => {
                const newShippingData = {
                  ...shippingData,
                  courier: value
                };
                props.onChange?.(newShippingData);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select courier">
                  {selectedCourier && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{selectedCourier.icon}</span>
                      <span>{selectedCourier.name}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {couriers.map((courier) => (
                  <SelectItem key={courier.id} value={courier.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{courier.icon}</span>
                      <span>{courier.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </UISelect>
          </div>
        </div>

        {/* Status Display */}
        {shippingData.country && shippingData.courier ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">✅</span>
                <span className="text-sm font-medium text-green-700">
                  Ready for Shipping Calculation
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm text-green-600">
                  {selectedCountry?.name} via {selectedCourier?.name}
                </div>
                <div className="text-xs text-green-500">
                  Check Order Summary for precise cost
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
            <div className="text-gray-500 text-sm">
              Please select country and courier to enable shipping cost calculation.
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="text-xs text-gray-500 text-center mt-3">
          * Precise shipping costs will be calculated based on your PCB specifications and displayed in the Order Summary.
        </div>
      </div>
    );
  },
  DifferentDesignsInput: (props: FormilyFieldProps) => {
    const value = (props.value as number) || 1;

    const handleDecrease = () => {
      const newValue = Math.max(1, value - 1);
      props.onChange?.(newValue);
    };

    const handleIncrease = () => {
      const newValue = Math.min(20, value + 1);
      props.onChange?.(newValue);
    };

    return (
      <div className="flex items-center gap-3">
        {/* 减少按钮 */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDecrease}
          disabled={value <= 1}
          className="w-10 h-10 p-0 text-lg font-bold disabled:opacity-50"
        >
          −
        </Button>

        {/* 输入框 */}
        <Input
          type="number"
          value={String(value)}
          onChange={(e) => props.onChange?.(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
          min={1}
          max={20}
          className="w-20 text-center font-medium [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
          placeholder="1"
        />

        {/* 增加按钮 */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleIncrease}
          disabled={value >= 20}
          className="w-10 h-10 p-0 text-lg font-bold disabled:opacity-50"
        >
          +
        </Button>

        <span className="text-sm font-medium text-gray-600 bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
          qty
        </span>
      </div>
    );
  },
  UrgentDeliverySelector,
  BoardEdgeInput,
  FormFieldLayout,
  DeliverySelector: (props: FormilyFieldProps) => {
    const deliveryData = (props.value as { delivery?: string; urgentReduceDays?: number }) || {};
    const productType = props.componentProps?.productType || 'pcb';
    
    const deliveryOptions = productType === 'stencil' ? [
      { label: "Standard (5-7 days)", value: "standard", description: "Regular production timeline" },
      { label: "Express (3-4 days)", value: "express", description: "Priority processing (+25%)" },
      { label: "Rush (1-2 days)", value: "rush", description: "Expedited manufacturing (+50%)" }
    ] : [
      { label: "Standard (7-10 days)", value: "standard", description: "Regular production timeline" },
      { label: "Express (5-7 days)", value: "express", description: "Priority processing (+30%)" },
      { label: "Rush (3-5 days)", value: "rush", description: "Expedited manufacturing (+60%)" }
    ];

    const urgentOptions = [
      { label: "No Rush", value: 0, description: "Standard timeline" },
      { label: "1 Day Rush (+30%)", value: 1, description: "Reduce 1 day" },
      { label: "2 Days Rush (+60%)", value: 2, description: "Reduce 2 days" }
    ];

    return (
      <div className="space-y-4">
        {/* Delivery Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {deliveryOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant="outline"
                onClick={() => {
                  const newData = { ...deliveryData, delivery: option.value };
                  props.onChange?.(newData);
                }}
                className={cn(
                  "p-4 h-auto text-left flex flex-col items-start space-y-1 transition-colors",
                  deliveryData.delivery === option.value
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white border-gray-300 hover:border-blue-300"
                )}
              >
                <span className="font-medium">{option.label}</span>
                <span className={cn(
                  "text-xs",
                  deliveryData.delivery === option.value ? "text-blue-100" : "text-gray-500"
                )}>
                  {option.description}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Rush Options (only for standard delivery) */}
        {deliveryData.delivery === 'standard' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rush Options
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {urgentOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newData = { ...deliveryData, urgentReduceDays: option.value };
                    props.onChange?.(newData);
                  }}
                  className={cn(
                    "text-left flex flex-col items-start space-y-1",
                    deliveryData.urgentReduceDays === option.value
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white border-gray-300 hover:border-orange-300"
                  )}
                >
                  <span className="text-xs font-medium">{option.label}</span>
                  <span className={cn(
                    "text-xs",
                    deliveryData.urgentReduceDays === option.value ? "text-orange-100" : "text-gray-500"
                  )}>
                    {option.description}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },
  CountrySelect: (props: FormilyFieldProps) => {
    const commonCountries = [
      { code: "US", name: "United States", flag: "🇺🇸" },
      { code: "CA", name: "Canada", flag: "🇨🇦" },
      { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
      { code: "DE", name: "Germany", flag: "🇩🇪" },
      { code: "FR", name: "France", flag: "🇫🇷" },
      { code: "JP", name: "Japan", flag: "🇯🇵" },
      { code: "AU", name: "Australia", flag: "🇦🇺" },
      { code: "SG", name: "Singapore", flag: "🇸🇬" },
      { code: "HK", name: "Hong Kong", flag: "🇭🇰" },
      { code: "CN", name: "China", flag: "🇨🇳" },
    ];

    const selectedCountry = commonCountries.find(c => c.code === props.value);

    return (
      <UISelect 
        value={String(props.value || "")} 
        onValueChange={props.onChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select country">
            {selectedCountry && (
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedCountry.flag}</span>
                <span>{selectedCountry.name}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {commonCountries.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{country.flag}</span>
                <span>{country.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </UISelect>
    );
  },
  CourierSelect: (props: FormilyFieldProps) => {
    const couriers = [
      { id: "dhl", name: "DHL Express", icon: "📦", description: "3-5 business days" },
      { id: "fedex", name: "FedEx International", icon: "📮", description: "4-6 business days" },
      { id: "ups", name: "UPS Worldwide", icon: "📫", description: "5-7 business days" },
      { id: "standard", name: "Standard Shipping", icon: "📪", description: "7-15 business days" },
    ];

    const selectedCourier = couriers.find(c => c.id === props.value);

    return (
      <UISelect 
        value={String(props.value || "")} 
        onValueChange={props.onChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select courier">
            {selectedCourier && (
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedCourier.icon}</span>
                <span>{selectedCourier.name}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {couriers.map((courier) => (
            <SelectItem key={courier.id} value={courier.id}>
              <div className="flex items-center gap-2 text-left">
                <span className="text-lg">{courier.icon}</span>
                <div>
                  <div className="font-medium">{courier.name}</div>
                  <div className="text-xs text-gray-500">{courier.description}</div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </UISelect>
    );
  },
  StencilProcessGuide,
};

// 创建 SchemaField
export const SchemaField = createSchemaField({
  components: {
    ...formilyComponents,
    FormFieldLayout,
  },
  scope: formilyHelpers
});

export default SchemaField; 
