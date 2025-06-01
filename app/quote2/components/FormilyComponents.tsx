"use client"
import React from "react";
import { createSchemaField } from "@formily/react";
import { Input } from "@/components/ui/input";
import { Select as UISelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import * as formilyHelpers from "../schema/formilyHelpers";
import QuantityInput from "./QuantityInput";
import { cn } from "@/lib/utils";

// 定义 Formily 组件的 props 类型
interface FormilyFieldProps {
  value?: string | number | boolean | object | null;
  onChange?: (value: string | number | boolean | object | null) => void;
  placeholder?: string;
  dataSource?: Array<{ label: string; value: string | number | boolean }>;
  enum?: Array<{ label: string; value: string | number | boolean }>;
  options?: Array<{ label: string; value: string | number | boolean }>;
  componentProps?: { options?: Array<{ label: string; value: string | number | boolean }> };
  min?: number;
  max?: number;
  accept?: string;
  unit?: string;
  rows?: number;
}

// Formily 组件映射配置
export const formilyComponents = {
  Input: (props: FormilyFieldProps) => {
    return (
      <Input
        value={String(props.value || '')}
        onChange={(e) => props.onChange?.(e.target.value)}
        placeholder={props.placeholder}
        className="transition-colors duration-150"
      />
    );
  },
  Select: (props: FormilyFieldProps) => {
    const options = props.dataSource || props.enum || props.options || [];

    return (
      <UISelect value={String(props.value || '')} onValueChange={props.onChange}>
        <SelectTrigger>
          <SelectValue placeholder={props.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={String(option.value)} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </UISelect>
    );
  },
  TextArea: Textarea,
  Checkbox,
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
              "px-4 py-2 min-w-[60px] rounded-lg border transition-colors duration-150",
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
          "px-4 py-2 min-w-[60px] rounded-lg border transition-colors duration-150",
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
          "px-4 py-2 min-w-[60px] rounded-lg border transition-colors duration-150",
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
            onClick={() => props.onChange?.(option.value)}
            className={cn(
              "px-4 py-2 min-w-[80px] rounded-lg border transition-colors duration-150",
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
  NumberInput: (props: FormilyFieldProps) => {
    const value = props.value as number;
    const hasError = value && (props.min && value < props.min || props.max && value > props.max);

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Input
            type="number"
            value={String(value || '')}
            onChange={(e) => props.onChange?.(e.target.value ? Number(e.target.value) : null)}
            placeholder={props.placeholder}
            min={props.min}
            max={props.max}
            className={cn(
              "w-32 transition-colors duration-150",
              hasError
                ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
            )}
          />
          {props.unit && (
            <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded-lg border border-gray-200">
              {props.unit}
            </span>
          )}
        </div>
        {hasError && (
          <div className="text-xs text-red-500">
            {props.min && value < props.min && `Minimum value is ${props.min}`}
            {props.max && value > props.max && `Maximum value is ${props.max}`}
          </div>
        )}
      </div>
    );
  },
  DimensionsInput: (props: FormilyFieldProps) => {
    const dimensions = (props.value as { length?: number; width?: number }) || {};
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="Length"
          value={String(dimensions.length || '')}
          onChange={(e) => props.onChange?.({
            ...dimensions,
            length: e.target.value ? Number(e.target.value) : 0
          })}
          className="w-24"
        />
        <span>×</span>
        <Input
          type="number"
          placeholder="Width"
          value={String(dimensions.width || '')}
          onChange={(e) => props.onChange?.({
            ...dimensions,
            width: e.target.value ? Number(e.target.value) : 0
          })}
          className="w-24"
        />
        <span className="text-xs text-muted-foreground">cm</span>
      </div>
    );
  },
  PanelDimensionsInput: (props: FormilyFieldProps) => {
    const panelDimensions = (props.value as { row?: number; column?: number }) || {};
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="Rows"
          value={String(panelDimensions.row || '')}
          onChange={(e) => props.onChange?.({
            ...panelDimensions,
            row: e.target.value ? Number(e.target.value) : 1
          })}
          className="w-20"
        />
        <span className="text-xs">pcs ×</span>
        <Input
          type="number"
          placeholder="Columns"
          value={String(panelDimensions.column || '')}
          onChange={(e) => props.onChange?.({
            ...panelDimensions,
            column: e.target.value ? Number(e.target.value) : 1
          })}
          className="w-20"
        />
        <span className="text-xs text-muted-foreground">pcs</span>
      </div>
    );
  },
  QuantityInput: (props: FormilyFieldProps) => (
    <QuantityInput
      value={props.value as number | string | null}
      onChange={(value) => props.onChange?.(value)}
      placeholder={props.placeholder}
      unit={props.unit}
    />
  ),
  FileUpload: (props: FormilyFieldProps) => (
    <Input
      type="file"
      accept={props.accept}
      onChange={(e) => props.onChange?.(e.target.files?.[0] || null)}
      placeholder={props.placeholder}
    />
  ),
  MultiSelect: (props: FormilyFieldProps) => {
    const arrayValue = Array.isArray(props.value) ? props.value : [];
    return (
      <Input
        value={arrayValue.join(', ')}
        onChange={(e) => props.onChange?.(e.target.value.split(', ').filter(Boolean))}
        placeholder={props.placeholder}
      />
    );
  },
  AddressInput: (props: FormilyFieldProps) => {
    const address = (props.value as Record<string, string>) || {};
    return (
      <div className="space-y-2">
        <Input
          placeholder="Country"
          value={address.country || ''}
          onChange={(e) => props.onChange?.({
            ...address,
            country: e.target.value
          })}
        />
        <Input
          placeholder="State/Province"
          value={address.state || ''}
          onChange={(e) => props.onChange?.({
            ...address,
            state: e.target.value
          })}
        />
        <Input
          placeholder="City"
          value={address.city || ''}
          onChange={(e) => props.onChange?.({
            ...address,
            city: e.target.value
          })}
        />
        <Textarea
          placeholder="Address"
          value={address.address || ''}
          onChange={(e) => props.onChange?.({
            ...address,
            address: e.target.value
          })}
          rows={2}
        />
        <Input
          placeholder="ZIP/Postal Code"
          value={address.zipCode || ''}
          onChange={(e) => props.onChange?.({
            ...address,
            zipCode: e.target.value
          })}
        />
        <Input
          placeholder="Contact Name"
          value={address.contactName || ''}
          onChange={(e) => props.onChange?.({
            ...address,
            contactName: e.target.value
          })}
        />
        <Input
          placeholder="Phone Number"
          value={address.phone || ''}
          onChange={(e) => props.onChange?.({
            ...address,
            phone: e.target.value
          })}
        />
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
          className="w-20 text-center font-medium"
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

        <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded border">
          designs
        </span>
      </div>
    );
  },
};

// 创建 SchemaField
export const SchemaField = createSchemaField({
  components: formilyComponents,
  scope: formilyHelpers
});

export default SchemaField; 