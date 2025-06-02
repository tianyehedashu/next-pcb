"use client";

import React from "react";
import { Field } from "@formily/core";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle, Info, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

// 字段状态指示器组件
const FieldStatusIndicator = ({ field }: { field: Field }) => {
  const [previousValue, setPreviousValue] = React.useState(field.value);
  const [showChangeIndicator, setShowChangeIndicator] = React.useState(false);

  React.useEffect(() => {
    if (previousValue !== field.value && !field.modified) {
      setShowChangeIndicator(true);
      const timer = setTimeout(() => setShowChangeIndicator(false), 2000);
      setPreviousValue(field.value);
      return () => clearTimeout(timer);
    }
  }, [field.value, field.modified, previousValue]);

  return (
    <AnimatePresence>
      {showChangeIndicator && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm"
          title="Value auto-adjusted"
        />
      )}
    </AnimatePresence>
  );
};

// 字段可见性指示器
const FieldVisibilityIndicator = ({ field }: { field: Field }) => {
  const [wasVisible, setWasVisible] = React.useState(field.visible);
  const [showVisibilityChange, setShowVisibilityChange] = React.useState(false);

  React.useEffect(() => {
    if (wasVisible !== field.visible) {
      setShowVisibilityChange(true);
      const timer = setTimeout(() => setShowVisibilityChange(false), 3000);
      setWasVisible(field.visible);
      return () => clearTimeout(timer);
    }
  }, [field.visible, wasVisible]);

  if (!showVisibilityChange) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "absolute top-0 left-0 right-0 px-2 py-1 text-xs rounded-t-md flex items-center gap-1 z-10",
        field.visible 
          ? "bg-green-100 text-green-700 border-green-200" 
          : "bg-gray-100 text-gray-600 border-gray-200"
      )}
    >
      {field.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
      {field.visible ? 'Now available' : 'No longer applicable'}
    </motion.div>
  );
};

// 字段验证状态指示器
const FieldValidationIndicator = ({ field }: { field: Field }) => {
  if (!field.errors?.length && !field.warnings?.length && !field.successes?.length) {
    return null;
  }

  const hasErrors = field.errors?.length > 0;
  const hasWarnings = field.warnings?.length > 0;
  const hasSuccess = field.successes?.length > 0;

  return (
    <div className="absolute top-2 right-2">
      {hasErrors && (
        <AlertCircle className="h-4 w-4 text-red-500" />
      )}
      {!hasErrors && hasWarnings && (
        <Info className="h-4 w-4 text-amber-500" />
      )}
      {!hasErrors && !hasWarnings && hasSuccess && (
        <CheckCircle className="h-4 w-4 text-green-500" />
      )}
    </div>
  );
};

// 简化的字段包装器
export const EnhancedFieldWrapper = ({ 
  children, 
  field, 
  className 
}: { 
  children: React.ReactNode; 
  field: Field; 
  className?: string;
}) => {
  return (
    <div className={cn("relative", className)}>
      {/* 可见性变化指示器 */}
      <FieldVisibilityIndicator field={field} />
      
      {/* 字段内容 */}
      <motion.div
        layout
        initial={false}
        animate={{
          opacity: field.visible ? 1 : 0.5,
          scale: field.visible ? 1 : 0.98,
        }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        {children}
        
        {/* 值变化指示器 */}
        <FieldStatusIndicator field={field} />
        
        {/* 验证状态指示器 */}
        <FieldValidationIndicator field={field} />
      </motion.div>
      
      {/* 字段描述和错误信息 */}
      <AnimatePresence>
        {(field.description || field.errors?.length > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 space-y-1"
          >
            {field.description && (
              <div className="text-xs text-gray-500">{field.description}</div>
            )}
            {field.errors?.map((error, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs text-red-600 flex items-center gap-1"
              >
                <AlertCircle className="h-3 w-3" />
                {String(error)}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 选项变化提示组件
export const OptionsChangeIndicator = ({ field }: { field: Field }) => {
  const [previousOptions, setPreviousOptions] = React.useState(field.dataSource || []);
  const [showOptionsChange, setShowOptionsChange] = React.useState(false);

  React.useEffect(() => {
    const currentOptions = field.dataSource || [];
    if (JSON.stringify(previousOptions) !== JSON.stringify(currentOptions)) {
      setShowOptionsChange(true);
      const timer = setTimeout(() => setShowOptionsChange(false), 3000);
      setPreviousOptions(currentOptions);
      return () => clearTimeout(timer);
    }
  }, [field.dataSource, previousOptions]);

  if (!showOptionsChange) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute -top-2 left-0 right-0 bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded border border-amber-200 flex items-center gap-1 z-10"
    >
      <Info className="h-3 w-3" />
      Options updated ({(field.dataSource || []).length} available)
    </motion.div>
  );
};

// 智能字段标签组件
export const SmartFieldLabel = ({ title, required, field }: { 
  title?: string; 
  required?: boolean; 
  field?: Field;
}) => {
  if (!title) return null;

  return (
    <div className="flex items-center gap-2 mb-2">
      <label className="text-sm font-medium text-gray-700">
        {title}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {field && (
        <div className="flex items-center gap-1">
          {/* 字段状态指示器 */}
          {field.loading && (
            <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
          
          {field.modified && (
            <div 
              className="w-2 h-2 bg-blue-500 rounded-full" 
              title="Modified by user"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedFieldWrapper; 