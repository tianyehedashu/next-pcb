'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAnalytics } from '@/hooks/useAnalytics';
import { analytics } from '@/lib/analytics/analytics-manager';
import { ANALYTICS_CONFIG } from '@/lib/analytics/config';

export default function TestAnalyticsPage() {
  const {
    trackButtonClick,
    trackPageView,
    trackQuoteStart,
    trackFormStart,
    trackContentView,
    trackCustomEvent,
    identifyUser,
  } = useAnalytics();

  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [gtag, setGtag] = useState<typeof window.gtag | null>(null);

  // Check if gtag is available
  useEffect(() => {
    const checkGtag = () => {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        setGtag((window as any).gtag);
      }
    };
    
    checkGtag();
    const interval = setInterval(checkGtag, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // GA4 Configuration Diagnostics
  const runGADiagnostics = () => {
    const results: Record<string, any> = {};
    
    // Check environment variables
    results.measurementId = ANALYTICS_CONFIG.GA4.measurementId;
    results.gaEnabled = ANALYTICS_CONFIG.GA4.enabled;
    
    // Check if gtag is loaded
    results.gtagLoaded = typeof window !== 'undefined' && !!(window as any).gtag;
    
    // Check if dataLayer exists
    results.dataLayerExists = typeof window !== 'undefined' && !!(window as any).dataLayer;
    
    // Check GA config
    if ((window as any).gtag) {
      try {
        (window as any).gtag('get', ANALYTICS_CONFIG.GA4.measurementId, 'client_id', (clientId: string) => {
          console.log('GA4 Client ID:', clientId);
          results.clientId = clientId;
        });
      } catch (error) {
        console.error('GA4 Config Error:', error);
        results.configError = error;
      }
    }
    
    console.log('🔍 GA4 Diagnostics:', results);
    setTestResults(results);
  };

  const runBasicTests = () => {
    console.log('🧪 Running basic analytics tests...');
    
    // Test 1: Page view
    trackPageView('/test-analytics', 'Analytics Test Page');
    trackButtonClick('run-tests', 'test-page');
    
    // Test 2: User identification
    identifyUser({
      id: 'test-user-123',
      email: 'test@example.com',
      type: 'registered',
      company: 'Test Company',
      country: 'US',
    });
    
    // Test 3: Quote tracking
    trackQuoteStart();
    
    // Test 4: Form tracking
    trackFormStart('test-form');
    
    // Test 5: Content tracking
    trackContentView('article', 'test-article-123', 'Test Article');
    
    // Test 6: Custom event
    trackCustomEvent('test_event', {
      test_parameter: 'test_value',
      timestamp: new Date().toISOString(),
    });
    
    console.log('✅ Basic tests completed. Check browser console and GA4 Real-time reports.');
  };

  const testGAConnection = () => {
    if (!gtag) {
      console.error('❌ gtag not loaded');
      return;
    }
    
    // Send a test event directly via gtag
    gtag('event', 'test_ga_connection', {
      event_category: 'test',
      event_label: 'direct_gtag_call',
      custom_parameter_1: 'test_value',
    });
    
    console.log('📤 Test event sent directly via gtag');
  };

  const debugAnalytics = () => {
    const status = analytics.getStatus();
    console.log('📊 Analytics Status:', status);
    
    // Check all analytics tools
    console.log('🔧 Environment Check:', {
      GA4_ID: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
      CLARITY_ID: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID,
      NODE_ENV: process.env.NODE_ENV,
      window_gtag: typeof window !== 'undefined' ? !!(window as any).gtag : false,
      window_clarity: typeof window !== 'undefined' ? !!(window as any).clarity : false,
      window_dataLayer: typeof window !== 'undefined' ? !!(window as any).dataLayer : false,
    });
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Analytics Testing Dashboard</h1>
        <p className="text-muted-foreground">
          Test and debug analytics implementation
        </p>
      </div>

      {/* GA4 Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 GA4 Configuration Status
            <Badge variant={ANALYTICS_CONFIG.GA4.enabled ? 'default' : 'destructive'}>
              {ANALYTICS_CONFIG.GA4.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Current Google Analytics 4 configuration and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Measurement ID:</strong> 
              <code className="ml-2 bg-muted px-2 py-1 rounded">
                {ANALYTICS_CONFIG.GA4.measurementId}
              </code>
            </div>
            <div>
              <strong>gtag Loaded:</strong> 
              <Badge variant={gtag ? 'default' : 'destructive'} className="ml-2">
                {gtag ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <strong>dataLayer:</strong> 
              <Badge variant={typeof window !== 'undefined' && (window as any).dataLayer ? 'default' : 'destructive'} className="ml-2">
                {typeof window !== 'undefined' && (window as any).dataLayer ? 'Available' : 'Missing'}
              </Badge>
            </div>
            <div>
              <strong>Debug Mode:</strong> 
              <Badge variant={ANALYTICS_CONFIG.DEBUG ? 'secondary' : 'outline'} className="ml-2">
                {ANALYTICS_CONFIG.DEBUG ? 'On' : 'Off'}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={runGADiagnostics} variant="outline">
              🔍 Run GA Diagnostics
            </Button>
            <Button onClick={testGAConnection} variant="outline" disabled={!gtag}>
              📤 Test GA Connection
            </Button>
          </div>
          
          {Object.keys(testResults).length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Diagnostic Results:</h4>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Tools Status */}
      <Card>
        <CardHeader>
          <CardTitle>🛠️ Analytics Tools Status</CardTitle>
          <CardDescription>
            Status of all integrated analytics tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">📈</div>
              <div className="font-semibold">Google Analytics</div>
              <Badge variant={ANALYTICS_CONFIG.GA4.enabled ? 'default' : 'destructive'}>
                {ANALYTICS_CONFIG.GA4.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">👁️</div>
              <div className="font-semibold">Microsoft Clarity</div>
              <Badge variant={ANALYTICS_CONFIG.CLARITY.enabled ? 'default' : 'destructive'}>
                {ANALYTICS_CONFIG.CLARITY.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">🔄</div>
              <div className="font-semibold">Mixpanel</div>
              <Badge variant={ANALYTICS_CONFIG.MIXPANEL.enabled ? 'default' : 'destructive'}>
                {ANALYTICS_CONFIG.MIXPANEL.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">🦔</div>
              <div className="font-semibold">PostHog</div>
              <Badge variant={ANALYTICS_CONFIG.POSTHOG.enabled ? 'default' : 'destructive'}>
                {ANALYTICS_CONFIG.POSTHOG.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Actions */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 Analytics Testing</CardTitle>
          <CardDescription>
            Run various analytics tests and check browser console for results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Button onClick={runBasicTests} className="w-full">
              🚀 Run Basic Tests
            </Button>
            
            <Button onClick={debugAnalytics} variant="outline" className="w-full">
              🔧 Debug Analytics
            </Button>
            
            <Button 
              onClick={() => trackCustomEvent('manual_test', { trigger: 'button_click' })}
              variant="outline" 
              className="w-full"
            >
              📤 Send Test Event
            </Button>
          </div>
          
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ GA4 Console Errors</h4>
            <p className="text-sm text-yellow-700">
              如果你在 Google Analytics 控制台看到 400 错误，这通常是因为：
            </p>
            <ul className="text-sm text-yellow-700 mt-2 space-y-1">
              <li>• GA4 Measurement ID 配置错误</li>
              <li>• GA4 属性权限不足</li>
              <li>• GA4 属性还在初始化中（新创建的属性需要几小时）</li>
              <li>• 浏览器缓存问题</li>
            </ul>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">✅ 检查步骤</h4>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. 确认环境变量 NEXT_PUBLIC_GA4_MEASUREMENT_ID 已设置</li>
              <li>2. 检查 GA4 属性是否正确创建（格式：G-XXXXXXXXXX）</li>
              <li>3. 在 GA4 实时报告中查看是否有数据</li>
              <li>4. 打开浏览器开发者工具查看 Network 标签页中的 GA 请求</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 