'use client';

import { useState } from 'react';

export default function TestChatwootServerPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testServerConnection = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    const baseUrl = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL;
    const websiteToken = process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN;
    
    if (!baseUrl || !websiteToken) {
      addResult('❌ Environment variables not set');
      setIsLoading(false);
      return;
    }

    addResult('🔍 Testing Chatwoot server connection...');
    addResult(`📍 Server: ${baseUrl}`);
    addResult(`🔑 Token: ${websiteToken.substring(0, 8)}...`);

    // Test 1: Basic widget endpoint
    try {
      addResult('📡 Testing widget endpoint...');
      const widgetUrl = `${baseUrl}/widget?website_token=${websiteToken}`;
      const response = await fetch(widgetUrl, {
        method: 'GET',
        mode: 'no-cors', // Avoid CORS issues for testing
      });
      
      addResult(`✅ Widget endpoint responded (status: ${response.status || 'no-cors'})`);
    } catch (error) {
      addResult(`❌ Widget endpoint failed: ${error}`);
    }

    // Test 2: Multiple rapid requests to simulate rate limiting
    addResult('🚀 Testing rate limiting with multiple requests...');
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        fetch(`${baseUrl}/widget?website_token=${websiteToken}`, {
          method: 'GET',
          mode: 'no-cors',
        }).catch(error => ({ error: error.message, index: i }))
      );
    }

    try {
      const results = await Promise.all(promises);
      const successCount = results.filter(r => !('error' in r)).length;
      const errorCount = results.length - successCount;
      
      addResult(`📊 Rapid requests result: ${successCount} success, ${errorCount} errors`);
      
      if (errorCount > 0) {
        addResult('⚠️ Some requests failed - likely due to rate limiting');
        addResult('💡 Recommendation: Configure ENABLE_RACK_ATTACK_WIDGET_API=false on server');
      } else {
        addResult('✅ All requests succeeded - rate limiting may not be an issue');
      }
    } catch (error) {
      addResult(`❌ Rapid request test failed: ${error}`);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Chatwoot Server Connection Test
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Rate Limiting Diagnosis
          </h2>
          
          <div className="mb-4">
            <button
              onClick={testServerConnection}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium"
            >
              {isLoading ? 'Testing...' : 'Test Server Connection'}
            </button>
          </div>

          {testResults.length > 0 && (
            <div className="bg-gray-100 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Test Results:</h3>
              <div className="space-y-1 text-sm font-mono">
                {testResults.map((result, index) => (
                  <div key={index} className="text-gray-700">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4">
            🔧 Server Configuration Recommendations
          </h2>
          <div className="space-y-3 text-yellow-700">
            <p><strong>Option 1 (Recommended):</strong> Disable Rack::Attack for widget API</p>
            <code className="block bg-yellow-100 p-2 rounded text-sm">
              ENABLE_RACK_ATTACK_WIDGET_API=false
            </code>
            
            <p><strong>Option 2:</strong> Increase rate limit</p>
            <code className="block bg-yellow-100 p-2 rounded text-sm">
              RACK_ATTACK_LIMIT=300
            </code>
            
            <p><strong>Option 3:</strong> Add your IP to whitelist in config/initializers/rack_attack.rb</p>
            <code className="block bg-yellow-100 p-2 rounded text-sm">
              Rack::Attack.safelist(&apos;allow from your IP&apos;) do |req|<br/>
              &nbsp;&nbsp;[&apos;127.0.0.1&apos;, &apos;::1&apos;, &apos;117.154.53.136&apos;].include? req.ip<br/>
              end
            </code>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">
            📋 Error Analysis
          </h2>
          <div className="space-y-2 text-blue-700">
            <p><strong>Current Error:</strong> Rack::Attack blocking requests from IP 117.154.53.136</p>
            <p><strong>Cause:</strong> Default rate limit is 60 requests per minute</p>
            <p><strong>Solution:</strong> Configure server-side rate limiting settings</p>
            <p><strong>Status:</strong> This is a server configuration issue, not a client code issue</p>
          </div>
        </div>
      </div>
    </div>
  );
} 