"use client";

import React from "react";
import { ISchema } from "@formily/react";

import { FormFieldLayout } from './FormFieldLayout';

interface SchemaFieldComponent {
  (props: { name: string; schema: ISchema }): React.ReactElement;
}

interface QuoteFormGroupProps {
  fields: string[];
  schema: ISchema;
  SchemaField: SchemaFieldComponent;
}


export function QuoteFormGroup({
  fields,
  schema,
  SchemaField
}: QuoteFormGroupProps) {
  return (
    <div className="space-y-6">
      {fields.map((fieldName) => {
        const properties = schema.properties;
        if (!properties || typeof properties === 'string') return null;
        
        const fieldSchema = properties[fieldName];
        if (!fieldSchema) return null;

        // 对于 shippingCostEstimation 和 shippingAddress 字段，不添加 FormFieldLayout decorator
        if (fieldName === 'shippingCostEstimation' || fieldName === 'shippingAddress') {
          return (
            <div key={fieldName} className="group w-full">
              <SchemaField
                name={fieldName}
                schema={fieldSchema}
              />
            </div>
          );
        }

        // 创建带有 decorator 的 schema
        const fieldSchemaWithDecorator = {
          ...fieldSchema,
          "x-decorator": "FormFieldLayout",
          "x-decorator-props": {
            ...(fieldSchema["x-decorator-props"] || {}),
            layout: "inline",
            className: "w-full"
          }
        };

        return (
          <div key={fieldName} className="group">
            <SchemaField
              name={fieldName}
              schema={fieldSchemaWithDecorator}
            />
          </div>
        );
      })}
    </div>
  );
} 