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

        return (
          <div key={fieldName} className="group">
            <FormFieldLayout
              label={fieldSchema.title as string || fieldName}
              required={fieldSchema.required as boolean}
              layout="inline"
              className="w-full transition-all duration-200 hover:scale-[1.01]"
            >
              <SchemaField
                name={fieldName}
                schema={fieldSchema}
              />
            </FormFieldLayout>
          </div>
        );
      })}
    </div>
  );
} 