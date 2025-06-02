"use client";

import React from "react";
import { FormFieldLayout } from "./FormFieldLayout";
import { ISchema } from "@formily/react";

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

        // 创建带有 decorator 的 schema
        const fieldSchemaWithDecorator = {
          ...fieldSchema,
          "x-decorator": FormFieldLayout,
          "x-decorator-props": {
            label: fieldSchema.title as string || fieldName,
            required: fieldSchema.required as boolean,
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