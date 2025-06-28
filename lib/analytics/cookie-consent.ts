// Cookie Consent Management System

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export interface CookieConsentData {
  hasConsent: boolean;
  preferences: CookiePreferences;
  timestamp: string;
  version: string;
}

class CookieConsentManager {
  private readonly CONSENT_KEY = 'speedx_cookie_consent';
  private readonly CONSENT_VERSION = '1.0';
  private listeners: ((consent: CookieConsentData) => void)[] = [];

  constructor() {
    // Initialize on client side only
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    // Check if consent was previously given
    const savedConsent = this.getSavedConsent();
    if (savedConsent) {
      // Apply saved preferences
      this.applyPreferences(savedConsent.preferences);
    }
  }

  // Get saved consent from localStorage
  getSavedConsent(): CookieConsentData | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const saved = localStorage.getItem(this.CONSENT_KEY);
      if (saved) {
        const consent = JSON.parse(saved) as CookieConsentData;
        // Check if version matches (for consent re-validation)
        if (consent.version === this.CONSENT_VERSION) {
          return consent;
        }
      }
    } catch (error) {
      console.error('Error reading cookie consent:', error);
    }
    return null;
  }

  // Check if user has made a choice
  hasUserConsented(): boolean {
    const consent = this.getSavedConsent();
    return consent !== null;
  }

  // Check if analytics cookies are allowed
  isAnalyticsAllowed(): boolean {
    const consent = this.getSavedConsent();
    return consent?.preferences.analytics || false;
  }

  // Check if marketing cookies are allowed
  isMarketingAllowed(): boolean {
    const consent = this.getSavedConsent();
    return consent?.preferences.marketing || false;
  }

  // Check if functional cookies are allowed
  isFunctionalAllowed(): boolean {
    const consent = this.getSavedConsent();
    return consent?.preferences.functional || false;
  }

  // Save user preferences
  saveConsent(preferences: CookiePreferences) {
    if (typeof window === 'undefined') return;

    const consentData: CookieConsentData = {
      hasConsent: true,
      preferences,
      timestamp: new Date().toISOString(),
      version: this.CONSENT_VERSION,
    };

    try {
      localStorage.setItem(this.CONSENT_KEY, JSON.stringify(consentData));
      this.applyPreferences(preferences);
      
      // Notify listeners
      this.listeners.forEach(listener => listener(consentData));
      
      console.log('🍪 Cookie preferences saved:', preferences);
    } catch (error) {
      console.error('Error saving cookie consent:', error);
    }
  }

  // Accept all cookies
  acceptAll() {
    this.saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    });
  }

  // Accept only necessary cookies
  rejectAll() {
    this.saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    });
  }

  // Apply preferences to analytics and other tools
  private applyPreferences(preferences: CookiePreferences) {
    // Store in window for analytics to check
    if (typeof window !== 'undefined') {
      (window as any).cookiePreferences = preferences;
    }

    // Enable/disable analytics based on preferences
    if (preferences.analytics) {
      this.enableAnalytics();
    } else {
      this.disableAnalytics();
    }

    // Enable/disable marketing tools
    if (preferences.marketing) {
      this.enableMarketing();
    } else {
      this.disableMarketing();
    }
  }

  private enableAnalytics() {
    // Enable Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'denied', // Keep denied unless marketing is also enabled
      });
    }
  }

  private disableAnalytics() {
    // Disable Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
      });
    }
  }

  private enableMarketing() {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
      });
    }
  }

  private disableMarketing() {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
    }
  }

  // Clear all consent data
  clearConsent() {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.CONSENT_KEY);
    
    // Reset to default (denied) state
    this.disableAnalytics();
    this.disableMarketing();
  }

  // Add listener for consent changes
  onConsentChange(callback: (consent: CookieConsentData) => void) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Get current preferences for UI display
  getCurrentPreferences(): CookiePreferences {
    const consent = this.getSavedConsent();
    return consent?.preferences || {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
  }
}

// Export singleton instance
export const cookieConsent = new CookieConsentManager(); 