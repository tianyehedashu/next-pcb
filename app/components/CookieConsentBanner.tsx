'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { cookieConsent, type CookiePreferences } from '@/lib/analytics/cookie-consent';
import { X, Settings, Cookie, Shield, BarChart3, Target, Wrench } from 'lucide-react';

export default function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = cookieConsent.hasUserConsented();
    setShowBanner(!hasConsented);
    
    if (hasConsented) {
      setPreferences(cookieConsent.getCurrentPreferences());
    }
  }, []);

  const handleAcceptAll = () => {
    cookieConsent.acceptAll();
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleRejectAll = () => {
    cookieConsent.rejectAll();
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleSavePreferences = () => {
    cookieConsent.saveConsent(preferences);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handlePreferenceChange = (key: keyof CookiePreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
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

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Consent Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t shadow-lg">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Cookie className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Cookie Preferences
                </h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                We use cookies to enhance your browsing experience, analyze site traffic, and provide personalized content. 
                By clicking "Accept All", you consent to our use of cookies. You can customize your preferences or learn more in our{' '}
                <a href="/privacy-policy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 min-w-fit">
              <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="whitespace-nowrap">
                    <Settings className="w-4 h-4 mr-2" />
                    Customize
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Cookie className="w-5 h-5" />
                      Cookie Preferences
                    </DialogTitle>
                    <DialogDescription>
                      Choose which cookies you want to allow. You can change these settings at any time.
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
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRejectAll}
                className="whitespace-nowrap"
              >
                Reject All
              </Button>
              <Button 
                size="sm" 
                onClick={handleAcceptAll}
                className="whitespace-nowrap bg-blue-600 hover:bg-blue-700"
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 