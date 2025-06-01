"use client";

import React from "react";
import { FormConsumer } from "@formily/react";
import { Card, CardContent } from "@/components/ui/card";

interface QuoteFormDebugInfoProps {
  validationState: 'idle' | 'validating' | 'valid' | 'invalid';
}

export function QuoteFormDebugInfo({ validationState }: QuoteFormDebugInfoProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // 避免 hydration 错误，只在客户端渲染
  if (!isMounted) {
    return null;
  }

  return (
    <Card className="border-dashed border-2 border-gray-300 bg-gray-50/50">
      <CardContent className="pt-6">
        <details>
          <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-4 hover:text-gray-900">
            🔧 Development Debug Info
          </summary>
          <FormConsumer>
            {(form) => {
              const formValues = form?.values || {};
              
              return (
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Architecture:</h4>
                    <pre className="text-blue-700 whitespace-pre-wrap">
• Single Data Source: Formily Form instance{'\n'}
• Zod: Type validation, default values, submit validation{'\n'}
• Formily: UI rendering, field interactions, real-time updates{'\n'}
• Context: Provides form instance access to child components{'\n'}
• No data duplication or sync issues
                    </pre>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">Form Values (Real-time):</h4>
                      <pre className="text-green-700 text-xs max-h-32 overflow-auto">
                        {JSON.stringify(formValues, null, 2)}
                      </pre>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-800 mb-2">Validation State:</h4>
                      <pre className="text-purple-700 text-xs">
                        {JSON.stringify({ 
                          state: validationState,
                          formValid: form?.valid,
                          formInvalid: form?.invalid,
                          errors: form?.errors,
                          fieldsCount: Object.keys(formValues).length
                        }, null, 2)}
                      </pre>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <h4 className="font-medium text-amber-800 mb-2">Form Statistics:</h4>
                    <pre className="text-amber-700 text-xs">
                      {JSON.stringify({
                        totalFields: Object.keys(formValues).length,
                        filledFields: Object.values(formValues).filter(v => v !== null && v !== undefined && v !== '').length,
                        emptyFields: Object.values(formValues).filter(v => v === null || v === undefined || v === '').length,
                        submitting: form?.submitting,
                        modified: form?.modified
                      }, null, 2)}
                    </pre>
                  </div>
                </div>
              );
            }}
          </FormConsumer>
        </details>
      </CardContent>
    </Card>
  );
} 