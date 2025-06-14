'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export const EnvCheck = () => {
  const hasToken = !!process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN;
  const hasBaseUrl = !!process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL;
  const [copied, setCopied] = useState(false);
  
  const envTemplate = `# Chatwoot Configuration
NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=your_website_token_here
NEXT_PUBLIC_CHATWOOT_BASE_URL=https://app.chatwoot.com`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(envTemplate);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Environment Variables Check
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Check */}
        <div className="space-y-3">
          <h3 className="font-semibold">Current Status</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {hasToken ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="text-sm font-medium">
                NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN
              </span>
              <span className={`text-xs px-2 py-1 rounded ${hasToken ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {hasToken ? 'Set' : 'Missing'}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {hasBaseUrl ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="text-sm font-medium">
                NEXT_PUBLIC_CHATWOOT_BASE_URL
              </span>
              <span className={`text-xs px-2 py-1 rounded ${hasBaseUrl ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {hasBaseUrl ? 'Set' : 'Missing'}
              </span>
            </div>
          </div>
        </div>

        {/* Current Values */}
        {(hasToken || hasBaseUrl) && (
          <div>
            <h3 className="font-semibold mb-2">Current Values</h3>
            <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm space-y-1">
              <div>
                <strong>Token:</strong> {hasToken ? `${process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN?.substring(0, 8)}...` : '✗ Not set'}
              </div>
              <div>
                <strong>Base URL:</strong> {process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || '✗ Not set'}
              </div>
            </div>
          </div>
        )}

        {/* Setup Instructions */}
        {(!hasToken || !hasBaseUrl) && (
          <div>
            <h3 className="font-semibold mb-3">Setup Instructions</h3>
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-800 mb-2">Create Environment File</h4>
                    <p className="text-sm text-yellow-700 mb-3">
                      Create a <code className="bg-yellow-100 px-1 rounded">.env.local</code> file in your project root directory.
                    </p>
                    <div className="bg-white border border-yellow-200 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-600 font-medium">.env.local</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyToClipboard}
                          className="h-6 px-2 text-xs"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          {copied ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                      <pre className="text-xs text-gray-800 whitespace-pre-wrap">{envTemplate}</pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-800 mb-2">Get Your Website Token</h4>
                    <div className="text-sm text-blue-700 space-y-2">
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Go to your Chatwoot dashboard</li>
                        <li>Navigate to <strong>Settings → Inboxes</strong></li>
                        <li>Create or select a <strong>Website</strong> inbox</li>
                        <li>Copy the <strong>Website Token</strong></li>
                        <li>Replace <code className="bg-blue-100 px-1 rounded">your_website_token_here</code> in your .env.local file</li>
                      </ol>
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open('https://app.chatwoot.com', '_blank')}
                          className="text-blue-600 border-blue-300 hover:bg-blue-100"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open Chatwoot Dashboard
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-green-800 mb-2">Restart Development Server</h4>
                    <p className="text-sm text-green-700 mb-2">
                      After creating the .env.local file, restart your development server:
                    </p>
                    <div className="bg-white border border-green-200 rounded p-2">
                      <code className="text-xs text-gray-800">
                        # Stop current server (Ctrl+C)<br/>
                        # Then restart:<br/>
                        pnpm dev
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {hasToken && hasBaseUrl && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium text-green-800">Environment Variables Configured!</h4>
                <p className="text-sm text-green-700 mt-1">
                  Your Chatwoot environment variables are properly set. You can now test the integration.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Additional Notes */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-2">📝 Important Notes</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• The .env.local file should be in your project root (same level as package.json)</li>
            <li>• Never commit .env.local to version control (it should be in .gitignore)</li>
            <li>• Environment variables starting with NEXT_PUBLIC_ are exposed to the browser</li>
            <li>• If using a self-hosted Chatwoot, replace the base URL accordingly</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}; 