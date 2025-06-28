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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cookieConsent, type CookiePreferences } from '@/lib/analytics/cookie-consent';
import { Cookie, Shield, BarChart3, Target, Wrench } from 'lucide-react';

export default function CookieSettingsButton() {
  const [showDialog, setShowDialog] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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
      title: 'Necessary',
      description: 'Essential cookies for basic website functionality',
      icon: Shield,
      required: true,
    },
    {
      key: 'analytics' as const,
      title: 'Analytics',
      description: 'Help us improve the website performance',
      icon: BarChart3,
      required: false,
    },
    {
      key: 'marketing' as const,
      title: 'Marketing',
      description: 'Personalized content and advertisements',
      icon: Target,
      required: false,
    },
    {
      key: 'functional' as const,
      title: 'Functional',
      description: 'Enhanced features and personalization',
      icon: Wrench,
      required: false,
    },
  ];

  // Don't show the button if user hasn't consented yet (banner will handle first consent)
  if (!hasConsented) return null;

  return (
    <div 
      className="fixed bottom-4 left-4 z-40"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <div className={`transition-all duration-300 ${isHovered ? 'translate-x-0 opacity-100' : '-translate-x-16 opacity-60'}`}>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white shadow-md hover:shadow-lg border-gray-200 text-xs"
            >
              <Cookie className="w-3 h-3 mr-1" />
              {isHovered ? 'Cookie Settings' : '🍪'}
            </Button>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Cookie className="w-4 h-4" />
              Cookie Settings
            </DialogTitle>
            <DialogDescription className="text-sm">
              Manage your cookie preferences
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 mt-4">
            {cookieCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2 flex-1">
                    <Icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{category.title}</span>
                        {category.required && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">Required</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{category.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences[category.key]}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange(category.key, checked)
                    }
                    disabled={category.required}
                    className="ml-3"
                  />
                </div>
              );
            })}
          </div>
          
          <div className="flex gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={handleRejectAll}
              size="sm"
              className="flex-1"
            >
              Reject All
            </Button>
            <Button 
              onClick={handleSavePreferences}
              size="sm"
              className="flex-1"
            >
              Save
            </Button>
            <Button 
              onClick={handleAcceptAll}
              size="sm"
              className="flex-1"
            >
              Accept All
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 