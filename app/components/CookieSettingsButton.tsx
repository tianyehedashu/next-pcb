'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cookieConsent, type CookiePreferences } from '@/lib/analytics/cookie-consent';
import { Cookie, Shield, BarChart3, Target, Wrench } from 'lucide-react';

export default function CookieSettingsButton() {
  const [showDialog, setShowDialog] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    // Only show the button if user has already consented
    const consented = cookieConsent.hasUserConsented();
    setHasConsented(consented);
    
    if (consented) {
      setPreferences(cookieConsent.getCurrentPreferences());
    }

    // Listen for consent changes
    const unsubscribe = cookieConsent.onConsentChange((consentData) => {
      setHasConsented(true);
      setPreferences(consentData.preferences);
    });

    return unsubscribe;
  }, []);

  const handlePreferenceChange = (key: keyof CookiePreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSavePreferences = () => {
    cookieConsent.saveConsent(preferences);
    setShowDialog(false);
  };

  const handleAcceptAll = () => {
    cookieConsent.acceptAll();
    setShowDialog(false);
  };

  const handleRejectAll = () => {
    cookieConsent.rejectAll();
    setShowDialog(false);
  };

  const cookieCategories = [
    {
      key: 'necessary' as const,
      title: 'Necessary Cookies',
      description: 'Essential for the website to function properly. These cannot be disabled.',
      icon: Shield,
      required: true,
      examples: 'Login status, shopping cart, security features',
    },
    {
      key: 'analytics' as const,
      title: 'Analytics Cookies',
      description: 'Help us understand how visitors interact with our website.',
      icon: BarChart3,
      required: false,
      examples: 'Google Analytics, Microsoft Clarity, page views, user behavior',
    },
    {
      key: 'marketing' as const,
      title: 'Marketing Cookies',
      description: 'Used to deliver personalized advertisements and measure their effectiveness.',
      icon: Target,
      required: false,
      examples: 'Ad targeting, conversion tracking, social media pixels',
    },
    {
      key: 'functional' as const,
      title: 'Functional Cookies',
      description: 'Enable enhanced functionality and personalization.',
      icon: Wrench,
      required: false,
      examples: 'Language preferences, region settings, chat widgets',
    },
  ];

  // Don't show the button if user hasn't consented yet (banner will handle first consent)
  if (!hasConsented) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white shadow-lg hover:shadow-xl border-gray-200"
          >
            <Cookie className="w-4 h-4 mr-2" />
            Cookie Settings
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5" />
              Manage Cookie Preferences
            </DialogTitle>
            <DialogDescription>
              Customize your cookie preferences. Changes will take effect immediately.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {cookieCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Card key={category.key} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-blue-600" />
                        <CardTitle className="text-base">{category.title}</CardTitle>
                        {category.required && (
                          <Badge variant="secondary" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <Switch
                        checked={preferences[category.key]}
                        onCheckedChange={(checked) => 
                          handlePreferenceChange(category.key, checked)
                        }
                        disabled={category.required}
                      />
                    </div>
                    <CardDescription className="text-sm">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xs text-gray-500">
                      <strong>Examples:</strong> {category.examples}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="flex justify-between gap-2 mt-6 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleRejectAll}
              className="flex-1"
            >
              Reject All
            </Button>
            <Button 
              onClick={handleSavePreferences}
              className="flex-1"
            >
              Save Preferences
            </Button>
            <Button 
              onClick={handleAcceptAll}
              className="flex-1"
            >
              Accept All
            </Button>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
            <strong>Current Settings:</strong> Analytics: {preferences.analytics ? 'Enabled' : 'Disabled'}, 
            Marketing: {preferences.marketing ? 'Enabled' : 'Disabled'}, 
            Functional: {preferences.functional ? 'Enabled' : 'Disabled'}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 