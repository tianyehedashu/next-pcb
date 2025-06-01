"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormFieldLayout } from "./FormFieldLayout";
import { ISchema } from "@formily/react";

interface SchemaFieldComponent {
  (props: { name: string; schema: ISchema }): React.ReactElement;
}

interface QuoteFormGroupProps {
  title: string;
  fields: string[];
  schema: ISchema;
  SchemaField: SchemaFieldComponent;
  index: number;
  isLast: boolean;
}

export function QuoteFormGroup({
  title,
  fields,
  schema,
  SchemaField,
  index,
  isLast
}: QuoteFormGroupProps) {
  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${!isLast ? 'mb-6' : ''}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
            {index + 1}
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {fields.map((fieldName) => {
            const properties = schema.properties;
            if (!properties || typeof properties === 'string') return null;
            
            const fieldSchema = properties[fieldName];
            if (!fieldSchema) return null;

            return (
              <FormFieldLayout
                key={fieldName}
                label={fieldSchema.title as string || fieldName}
                required={fieldSchema.required as boolean}
                layout="inline"
                className="w-full"
              >
                <SchemaField
                  name={fieldName}
                  schema={fieldSchema}
                />
              </FormFieldLayout>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 