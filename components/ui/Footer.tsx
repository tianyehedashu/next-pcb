'use client';

import Link from "next/link";
import { useState } from "react";
import { MapPin, Phone, Mail, Cookie } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cookieConsent, type CookiePreferences } from '@/lib/analytics/cookie-consent';

export default function Footer() {
  const [showCookieDialog, setShowCookieDialog] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(() => 
    cookieConsent.getCurrentPreferences()
  );

  const handlePreferenceChange = (key: keyof CookiePreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSavePreferences = () => {
    cookieConsent.saveConsent(preferences);
    setShowCookieDialog(false);
  };

  const cookieCategories = [
    {
      key: 'necessary' as const,
      title: 'Necessary',
      description: 'Essential for website functionality',
      required: true,
    },
    {
      key: 'analytics' as const,
      title: 'Analytics',
      description: 'Help improve website performance',
      required: false,
    },
    {
      key: 'marketing' as const,
      title: 'Marketing',
      description: 'Personalized content',
      required: false,
    },
    {
      key: 'functional' as const,
      title: 'Functional',
      description: 'Enhanced features',
      required: false,
    },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 公司信息 */}
          <div>
            <h3 className="text-xl font-bold mb-4">SpeedXPCB</h3>
            <p className="text-gray-400">
              Your trusted partner in PCB manufacturing and assembly.
            </p>
          </div>

          {/* 联系信息 */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 mt-1 text-blue-400" />
                <div>
                  <p className="font-semibold">Head Office</p>
                  <p className="text-gray-400">2680 14th Avenue, Unit 1&2</p>
                  <p className="text-gray-400">Markham, ON L3R 5B2, Canada</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="font-semibold">Sales (Toll Free)</p>
                  <p className="text-gray-400">1-888-812-1949</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="font-semibold">Email</p>
                  <p className="text-gray-400">sales@speedxpcb.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* 快速链接 */}
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/quote2" className="text-gray-400 hover:text-white">
                  Get Quote
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-gray-400 hover:text-white">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/content" className="text-gray-400 hover:text-white">
                  Knowledge Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* 资源与服务 */}
          <div>
            <h3 className="text-xl font-bold mb-4">Resources & Services</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/content/guides" className="text-gray-400 hover:text-white">
                  Technical Guides
                </Link>
              </li>
              <li>
                <Link href="/content/news" className="text-gray-400 hover:text-white">
                  Industry News
                </Link>
              </li>
              <li>
                <Link href="/services/pcb-fabrication" className="text-gray-400 hover:text-white">
                  PCB Fabrication
                </Link>
              </li>
              <li>
                <Link href="/services/pcb-assembly" className="text-gray-400 hover:text-white">
                  PCB Assembly
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 版权信息 */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} SpeedXPCB. All rights reserved.</p>
            
            <div className="flex items-center gap-4 mt-2 sm:mt-0">
              <Link href="/privacy-policy" className="hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white">
                Terms
              </Link>
              
              <Dialog open={showCookieDialog} onOpenChange={setShowCookieDialog}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-1 hover:text-white">
                    <Cookie className="w-3 h-3" />
                    Cookie Settings
                  </button>
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
                    {cookieCategories.map((category) => (
                      <div key={category.key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{category.title}</span>
                            {category.required && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">Required</Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{category.description}</p>
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
                    ))}
                  </div>
                  
                  <div className="flex gap-2 mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        cookieConsent.rejectAll();
                        setShowCookieDialog(false);
                      }}
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
                      onClick={() => {
                        cookieConsent.acceptAll();
                        setShowCookieDialog(false);
                      }}
                      size="sm"
                      className="flex-1"
                    >
                      Accept All
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 