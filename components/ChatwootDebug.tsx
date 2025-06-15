'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CHATWOOT_CONFIG } from '@/lib/chatwoot';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Globe, Wifi, RefreshCw } from 'lucide-react';

export const ChatwootDebug = () => {
  const [debugInfo, setDebugInfo] = useState({
    hasToken: false,
    hasBaseUrl: false,
    scriptLoaded: false,
    chatwootSDKExists: false,
    chatwootAPIExists: false,
    networkTest: 'pending' as 'pending' | 'success' | 'failed',
    scriptUrl: '',
    consoleErrors: [] as string[],
  });

  const [manualTestResult, setManualTestResult] = useState<string>('');
  const [isTestingNetwork, setIsTestingNetwork] = useState(false);

  const testNetworkConnectivity = async () => {
    setIsTestingNetwork(true);
    try {
      const baseUrl = CHATWOOT_CONFIG.baseUrl.replace(/\/$/, '');
      const scriptUrl = `${baseUrl}/packs/js/sdk.js`;
      
      console.log('Testing network connectivity to:', scriptUrl);
      
      await fetch(scriptUrl, { 
        method: 'HEAD',
        mode: 'no-cors' // This will help avoid CORS issues for testing
      });
      
      setDebugInfo(prev => ({ ...prev, networkTest: 'success' }));
      console.log('Network test successful');
    } catch (error) {
      console.error('Network test failed:', error);
      setDebugInfo(prev => ({ ...prev, networkTest: 'failed' }));
    } finally {
      setIsTestingNetwork(false);
    }
  };

  useEffect(() => {
    const checkStatus = () => {
      const baseUrl = CHATWOOT_CONFIG.baseUrl.replace(/\/$/, '');
      const scriptUrl = `${baseUrl}/packs/js/sdk.js`;
      
      setDebugInfo(prev => ({
        ...prev,
        hasToken: !!CHATWOOT_CONFIG.websiteToken,
        hasBaseUrl: !!CHATWOOT_CONFIG.baseUrl,
        scriptLoaded: !!document.querySelector('script[src*="sdk.js"]'),
        chatwootSDKExists: !!window.chatwootSDK,
        chatwootAPIExists: !!window.$chatwoot,
        scriptUrl,
      }));
    };

    checkStatus();
    
    // Check every 2 seconds for updates
    const interval = setInterval(checkStatus, 2000);
    
    // Test network connectivity on mount
    testNetworkConnectivity();
    
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

  const getStatusBadge = (status: boolean, successText: string, failText: string) => {
    return (
      <Badge variant={status ? "default" : "warning"} className="flex items-center gap-1">
        {status ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
        {status ? successText : failText}
      </Badge>
    );
  };

  const getNetworkBadge = () => {
    switch (debugInfo.networkTest) {
      case 'success':
        return <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Connected
        </Badge>;
      case 'failed':
        return <Badge variant="warning" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Failed
        </Badge>;
      default:
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Wifi className="h-3 w-3" />
          Testing...
        </Badge>;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 Chatwoot Debug Information
          <Button
            variant="outline"
            size="sm"
            onClick={testNetworkConnectivity}
            disabled={isTestingNetwork}
            className="ml-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isTestingNetwork ? 'animate-spin' : ''}`} />
            Test Network
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Environment Variables */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Environment Variables
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Website Token:</span>
              {getStatusBadge(debugInfo.hasToken, "✅ Set", "❌ Missing")}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Base URL:</span>
              {getStatusBadge(debugInfo.hasBaseUrl, "✅ Set", "❌ Missing")}
            </div>
          </div>
        </div>

        {/* Network & Script Status */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            Network & Script Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Network Test:</span>
              {getNetworkBadge()}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Script Loaded:</span>
              {getStatusBadge(debugInfo.scriptLoaded, "✅ Yes", "❌ No")}
            </div>
            </div>
          </div>

        {/* Chatwoot SDK Status */}
        <div>
          <h3 className="font-semibold mb-3">Chatwoot SDK Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Chatwoot SDK:</span>
              {getStatusBadge(debugInfo.chatwootSDKExists, "✅ Available", "❌ Missing")}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Chatwoot API:</span>
              {getStatusBadge(debugInfo.chatwootAPIExists, "✅ Available", "❌ Missing")}
            </div>
          </div>
        </div>

        {/* Configuration Details */}
        <div>
          <h3 className="font-semibold mb-3">Configuration Details</h3>
          <div className="bg-gray-100 p-4 rounded-lg text-sm font-mono space-y-1">
            <div><strong>Token:</strong> {CHATWOOT_CONFIG.websiteToken ? `${CHATWOOT_CONFIG.websiteToken.substring(0, 8)}...` : 'undefined'}</div>
            <div><strong>Base URL:</strong> {CHATWOOT_CONFIG.baseUrl}</div>
            <div><strong>Script URL:</strong> {debugInfo.scriptUrl}</div>
            <div><strong>Hide Bubble:</strong> {CHATWOOT_CONFIG.hideMessageBubble.toString()}</div>
            <div><strong>Position:</strong> {CHATWOOT_CONFIG.position}</div>
            <div><strong>Locale:</strong> {CHATWOOT_CONFIG.locale}</div>
          </div>
        </div>

        {/* Manual Test */}
        <div>
          <h3 className="font-semibold mb-3">Manual Test</h3>
          <div className="space-y-3">
          <Button onClick={handleManualTest} className="w-full">
              🧪 Test: Open Chat Window
          </Button>
          
          {manualTestResult && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
              {manualTestResult}
            </div>
          )}
          </div>
        </div>

        {/* Actions */}
        <div>
          <h3 className="font-semibold mb-3">Actions</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleForceReload} variant="outline" className="flex-1">
            🔄 Force Reload Chatwoot
          </Button>
            <Button 
              onClick={() => window.open('/test-chatwoot', '_blank')} 
              variant="outline" 
              className="flex-1"
            >
              🔗 Open Test Page
            </Button>
          </div>
        </div>

        {/* Troubleshooting Tips */}
        <div>
          <h3 className="font-semibold mb-3">💡 Troubleshooting Tips</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <ul className="text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Check browser console for detailed error messages</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Ensure you have a valid Website Token from your Chatwoot dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Verify network connectivity to {CHATWOOT_CONFIG.baseUrl}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Make sure your Chatwoot inbox is active and properly configured</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>If using a custom Chatwoot instance, verify the base URL is correct</span>
              </li>
          </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 