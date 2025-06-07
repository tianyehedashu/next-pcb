import React from 'react';
import { cn } from '@/lib/utils';
import { ISchema, useField } from '@formily/react';

interface FormFieldLayoutProps {
  children: React.ReactNode;
  className?: string;
  layout?: 'horizontal' | 'vertical' | 'inline' | 'responsive';
}

/**
 * 可复用的表单字段布局组件
 * 提供统一的标签和输入控件布局
 * 支持水平、垂直、内联和响应式四种布局模式
 */
export const FormFieldLayout: React.FC<FormFieldLayoutProps> = ({
  children,
  className,
  layout = 'responsive'
}) => {
  // 动态获取 label 和 required
  let label = '';
  let required = false;
  try {
    const field = useField();
    label = field.decoratorProps?.title || field.title || '';
    required = typeof (field as any).required === 'boolean' ? (field as any).required : false;
  } catch {
    label = '';
    required = false;
  }

  // 响应式布局 - 小屏幕垂直，大屏幕水平
  if (layout === 'responsive') {
    return (
      <div className={cn("space-y-2 md:space-y-0 md:flex md:items-center md:gap-4 md:min-h-[44px]", className)}>
        <label className={cn(
          "text-sm font-semibold text-gray-800 block leading-relaxed",
          "md:w-32 lg:w-40 md:flex-shrink-0 md:text-right md:flex md:justify-end md:min-h-[40px] md:items-center",
          required && "after:content-['*'] after:text-red-500 after:ml-1"
        )}>
          <span className="leading-5">
            {label}:
          </span>
        </label>
        <div className="w-full md:flex-1 md:flex md:items-center md:min-h-[40px]">
          {children}
        </div>
      </div>
    );
  }

  // 内联布局 - 标签和选项在同一行
  if (layout === 'inline') {
    return (
      <div className={cn("flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4", className)}>
        <label className={cn(
          "text-sm font-semibold text-gray-800 leading-relaxed",
          "sm:w-32 md:w-40 sm:flex-shrink-0 sm:text-right sm:flex sm:justify-end sm:min-h-[40px] sm:items-center",
          required && "after:content-['*'] after:text-red-500 after:ml-1"
        )}>
          <span className="leading-5">
            {label}:
          </span>
        </label>
        <div className="flex-1 min-w-0 flex items-center min-h-[40px]">
          {children}
        </div>
      </div>
    );
  }

  if (layout === 'vertical') {
    return (
      <div className={cn("space-y-2", className)}>
        <label className={cn(
          "text-sm font-semibold text-gray-800 block leading-relaxed",
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
    <div className={cn("flex items-center gap-4 min-h-[44px]", className)}>
      <label className={cn(
        "text-sm font-semibold text-gray-800 w-32 md:w-40 flex-shrink-0 text-right leading-relaxed",
        "flex justify-end min-h-[40px] items-center",
        required && "after:content-['*'] after:text-red-500 after:ml-1"
      )}>
        <span className="leading-5">
          {label}:
        </span>
      </label>
      <div className="flex-1 flex items-center min-h-[40px]">
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
  layout?: 'horizontal' | 'vertical' | 'inline' | 'responsive';
}

/**
 * 响应式表单组布局组件
 * 支持单列或多列布局，自动适应屏幕尺寸
 */
export const ResponsiveFormGroup: React.FC<ResponsiveFormGroupProps> = ({
  fields,
  schema,
  SchemaField,
  columns = 1,
  className,
  layout = 'responsive'
}) => {
  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 lg:grid-cols-2", 
    3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
  };

  return (
    <div className={cn("grid gap-4 md:gap-6", gridClass[columns], className)}>
      {fields.map((fieldName) => {
        const properties = schema.properties as Record<string, ISchema> | undefined;
        const fieldSchema = properties?.[fieldName];
        if (!fieldSchema) return null;
        
        return (
          <FormFieldLayout
            key={fieldName}
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