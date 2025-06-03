'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const EnvCheck = () => {
  const hasToken = !!process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN;
  const hasBaseUrl = !!process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL;
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Environment Check
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {hasToken ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm">
              NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {hasBaseUrl ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm">
              NEXT_PUBLIC_CHATWOOT_BASE_URL
            </span>
          </div>
        </div>

        {(!hasToken || !hasBaseUrl) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Please create a <code className="bg-yellow-100 px-1 rounded">.env.local</code> file in your project root with the required environment variables.
              </p>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>Current values:</p>
          <div className="bg-gray-100 p-2 rounded mt-1 font-mono">
            <div>Token: {hasToken ? '✓ Set' : '✗ Not set'}</div>
            <div>Base URL: {process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || '✗ Not set'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 