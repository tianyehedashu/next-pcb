'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CHATWOOT_CONFIG } from '@/lib/chatwoot';
import { Badge } from '@/components/ui/badge';

export const ChatwootDebug = () => {
  const [debugInfo, setDebugInfo] = useState({
    hasToken: false,
    hasBaseUrl: false,
    scriptLoaded: false,
    chatwootSDKExists: false,
    chatwootAPIExists: false,
    consoleErrors: [] as string[],
  });

  const [manualTestResult, setManualTestResult] = useState<string>('');

  useEffect(() => {
    const checkStatus = () => {
      setDebugInfo({
        hasToken: !!CHATWOOT_CONFIG.websiteToken,
        hasBaseUrl: !!CHATWOOT_CONFIG.baseUrl,
        scriptLoaded: !!document.querySelector('script[src*="sdk.js"]'),
        chatwootSDKExists: !!window.chatwootSDK,
        chatwootAPIExists: !!window.$chatwoot,
        consoleErrors: [], // We'll capture these separately
      });
    };

    checkStatus();
    
    // Check every 2 seconds for updates
    const interval = setInterval(checkStatus, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const handleManualTest = () => {
    try {
      if (window.$chatwoot) {
        window.$chatwoot.toggle('open');
        setManualTestResult('✅ Successfully called window.$chatwoot.toggle()');
      } else {
        setManualTestResult('❌ window.$chatwoot is not available');
      }
    } catch (error) {
      setManualTestResult(`❌ Error: ${error}`);
    }
  };

  const handleForceReload = () => {
    // Remove existing scripts
    const existingScripts = document.querySelectorAll('script[src*="sdk.js"]');
    existingScripts.forEach(script => script.remove());

    // Clear chatwoot objects
    if (window.chatwootSDK) delete window.chatwootSDK;
    if (window.$chatwoot) delete window.$chatwoot;
    if (window.chatwootSettings) delete window.chatwootSettings;

    // Reload the page to reinitialize
    window.location.reload();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🔧 Chatwoot Debug Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Website Token:</span>
              <Badge variant={debugInfo.hasToken ? "success" : "warning"}>
                {debugInfo.hasToken ? "✅ Set" : "❌ Missing"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Base URL:</span>
              <Badge variant={debugInfo.hasBaseUrl ? "success" : "warning"}>
                {debugInfo.hasBaseUrl ? "✅ Set" : "❌ Missing"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Script Loaded:</span>
              <Badge variant={debugInfo.scriptLoaded ? "success" : "warning"}>
                {debugInfo.scriptLoaded ? "✅ Yes" : "❌ No"}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Chatwoot SDK:</span>
              <Badge variant={debugInfo.chatwootSDKExists ? "success" : "warning"}>
                {debugInfo.chatwootSDKExists ? "✅ Available" : "❌ Missing"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Chatwoot API:</span>
              <Badge variant={debugInfo.chatwootAPIExists ? "success" : "warning"}>
                {debugInfo.chatwootAPIExists ? "✅ Available" : "❌ Missing"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Configuration Values:</h4>
          <div className="bg-gray-100 p-3 rounded text-xs font-mono">
            <div>Token: {CHATWOOT_CONFIG.websiteToken ? '***masked***' : 'undefined'}</div>
            <div>Base URL: {CHATWOOT_CONFIG.baseUrl}</div>
            <div>Hide Bubble: {CHATWOOT_CONFIG.hideMessageBubble.toString()}</div>
            <div>Position: {CHATWOOT_CONFIG.position}</div>
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <Button onClick={handleManualTest} className="w-full">
            🧪 Manual Test: Open Chat
          </Button>
          
          {manualTestResult && (
            <div className="p-2 bg-gray-50 rounded text-sm">
              {manualTestResult}
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <Button onClick={handleForceReload} variant="outline" className="w-full">
            🔄 Force Reload Chatwoot
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          <p>💡 Tips:</p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Check browser console for errors</li>
            <li>Ensure you have a valid Website Token</li>
            <li>Verify network connectivity to {CHATWOOT_CONFIG.baseUrl}</li>
            <li>Make sure your Chatwoot inbox is active</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}; 