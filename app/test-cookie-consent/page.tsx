'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cookieConsent, type CookieConsentData } from '@/lib/analytics/cookie-consent';
import { RefreshCw, Trash2, Eye, CheckCircle, XCircle } from 'lucide-react';

export default function TestCookieConsentPage() {
  const [consentData, setConsentData] = useState<CookieConsentData | null>(null);
  const [hasConsented, setHasConsented] = useState(false);

  const refreshStatus = () => {
    const consent = cookieConsent.getSavedConsent();
    const consented = cookieConsent.hasUserConsented();
    
    setConsentData(consent);
    setHasConsented(consented);
  };

  useEffect(() => {
    refreshStatus();
    
    // Listen for consent changes
    const unsubscribe = cookieConsent.onConsentChange(() => {
      refreshStatus();
    });

    return unsubscribe;
  }, []);

  const clearConsent = () => {
    cookieConsent.clearConsent();
    refreshStatus();
  };

  const acceptAll = () => {
    cookieConsent.acceptAll();
    refreshStatus();
  };

  const rejectAll = () => {
    cookieConsent.rejectAll();
    refreshStatus();
  };

  const checkMethods = [
    {
      name: 'hasUserConsented()',
      value: cookieConsent.hasUserConsented(),
      description: 'Has the user made any consent choice?'
    },
    {
      name: 'isAnalyticsAllowed()',
      value: cookieConsent.isAnalyticsAllowed(),
      description: 'Are analytics cookies allowed?'
    },
    {
      name: 'isMarketingAllowed()',
      value: cookieConsent.isMarketingAllowed(),
      description: 'Are marketing cookies allowed?'
    },
    {
      name: 'isFunctionalAllowed()',
      value: cookieConsent.isFunctionalAllowed(),
      description: 'Are functional cookies allowed?'
    },
  ];

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Cookie Consent Testing</h1>
        <p className="text-muted-foreground">
          Test and debug the cookie consent system
        </p>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Current Consent Status
            <Badge variant={hasConsented ? 'default' : 'secondary'}>
              {hasConsented ? 'Consented' : 'No Consent'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Current state of user consent and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {consentData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Consent Information</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Timestamp:</strong> {new Date(consentData.timestamp).toLocaleString()}</div>
                  <div><strong>Version:</strong> {consentData.version}</div>
                  <div><strong>Has Consent:</strong> {consentData.hasConsent ? 'Yes' : 'No'}</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Cookie Preferences</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    {consentData.preferences.necessary ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span>Necessary Cookies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {consentData.preferences.analytics ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span>Analytics Cookies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {consentData.preferences.marketing ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span>Marketing Cookies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {consentData.preferences.functional ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span>Functional Cookies</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <XCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No consent data found. User has not made a choice yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Methods Testing */}
      <Card>
        <CardHeader>
          <CardTitle>🔍 API Methods Testing</CardTitle>
          <CardDescription>
            Test various cookie consent API methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {checkMethods.map((method) => (
              <div key={method.name} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {method.name}
                  </code>
                  <Badge variant={method.value ? 'default' : 'secondary'}>
                    {method.value ? 'true' : 'false'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{method.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Testing Actions */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 Testing Actions</CardTitle>
          <CardDescription>
            Perform various consent actions for testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button onClick={refreshStatus} variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Status
            </Button>
            
            <Button onClick={acceptAll} className="w-full">
              <CheckCircle className="w-4 h-4 mr-2" />
              Accept All
            </Button>
            
            <Button onClick={rejectAll} variant="outline" className="w-full">
              <XCircle className="w-4 h-4 mr-2" />
              Reject All
            </Button>
            
            <Button onClick={clearConsent} variant="outline" className="w-full">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Consent
            </Button>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">💡 Testing Tips</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Use "Clear Consent" to reset and see the banner again</li>
              <li>• Check browser localStorage for 'speedx_cookie_consent' key</li>
              <li>• Open Network tab to see analytics requests when allowed</li>
              <li>• Test in incognito mode for fresh user experience</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Raw Data Viewer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Raw Data Viewer
          </CardTitle>
          <CardDescription>
            View the raw localStorage data structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto">
            <pre>
              {consentData 
                ? JSON.stringify(consentData, null, 2)
                : '// No consent data found in localStorage'
              }
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Integration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>📖 Integration Guide</CardTitle>
          <CardDescription>
            How to use the cookie consent system in your code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Check if analytics is allowed:</h4>
              <code className="block bg-gray-100 p-2 rounded text-sm">
                {`if (cookieConsent.isAnalyticsAllowed()) {
  // Run analytics code
  analytics.trackEvent('my_event');
}`}
              </code>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Listen for consent changes:</h4>
              <code className="block bg-gray-100 p-2 rounded text-sm">
                {`const unsubscribe = cookieConsent.onConsentChange((consentData) => {
  console.log('Consent changed:', consentData.preferences);
});`}
              </code>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Get current preferences:</h4>
              <code className="block bg-gray-100 p-2 rounded text-sm">
                {`const preferences = cookieConsent.getCurrentPreferences();
console.log('Analytics allowed:', preferences.analytics);`}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 