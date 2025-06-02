import React from 'react';
import { cn } from '@/lib/utils';
import { ISchema } from '@formily/react';

interface FormFieldLayoutProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  layout?: 'horizontal' | 'vertical' | 'inline';
}

/**
 * 可复用的表单字段布局组件
 * 提供统一的标签和输入控件布局
 * 支持水平、垂直和内联三种布局模式
 */
export const FormFieldLayout: React.FC<FormFieldLayoutProps> = ({
  label,
  required = false,
  children,
  className,
  layout = 'vertical'
}) => {
  // 内联布局 - 标签和选项在同一行
  if (layout === 'inline') {
    return (
      <div className={cn("flex items-start gap-4", className)}>
        <label className={cn(
          "text-sm font-semibold text-gray-800 w-36 flex-shrink-0 text-right pt-2.5",
          required && "after:content-['*'] after:text-red-500 after:ml-1"
        )}>
          {label}:
        </label>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    );
  }

  if (layout === 'vertical') {
    return (
      <div className={cn("space-y-2", className)}>
        <label className={cn(
          "text-sm font-semibold text-gray-800 block",
          required && "after:content-['*'] after:text-red-500 after:ml-1"
        )}>
          {label}:
        </label>
        <div className="w-full">
          {children}
        </div>
      </div>
    );
  }

  // 水平布局（原有布局）
  return (
    <div className={cn("flex items-start gap-4 min-h-[44px]", className)}>
      <label className={cn(
        "text-sm font-semibold text-gray-800 w-36 flex-shrink-0 text-right pt-2.5",
        required && "after:content-['*'] after:text-red-500 after:ml-1"
      )}>
        {label}:
      </label>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

interface ResponsiveFormGroupProps {
  fields: string[];
  schema: ISchema;
  SchemaField: React.ComponentType<{ name: string; schema: ISchema }>;
  columns?: 1 | 2 | 3;
  className?: string;
  layout?: 'horizontal' | 'vertical' | 'inline';
}

/**
 * 响应式表单组布局组件
 * 支持单列或多列布局
 */
export const ResponsiveFormGroup: React.FC<ResponsiveFormGroupProps> = ({
  fields,
  schema,
  SchemaField,
  columns = 1,
  className,
  layout = 'vertical'
}) => {
  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 lg:grid-cols-2", 
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
  };

  return (
    <div className={cn("grid gap-4", gridClass[columns], className)}>
      {fields.map((fieldName) => {
        const properties = schema.properties as Record<string, ISchema> | undefined;
        const fieldSchema = properties?.[fieldName];
        if (!fieldSchema) return null;
        
        return (
          <FormFieldLayout
            key={fieldName}
            label={fieldSchema.title as string || fieldName}
            required={fieldSchema.required as boolean}
            layout={layout}
          >
            <SchemaField 
              name={fieldName}
              schema={fieldSchema}
            />
          </FormFieldLayout>
        );
      })}
    </div>
  );
};

export default FormFieldLayout; 