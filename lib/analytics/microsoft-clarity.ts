import { ANALYTICS_CONFIG } from './config';

// Microsoft Clarity types
declare global {
  interface Window {
    clarity: (command: string, ...args: any[]) => void;
  }
}

class MicrosoftClarity {
  private initialized = false;

  constructor() {
    // Don't initialize in constructor for SSR compatibility
  }

  private ensureInitialized() {
    if (!this.initialized && typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize() {
    if (!ANALYTICS_CONFIG.CLARITY.enabled || this.initialized || typeof window === 'undefined') {
      return;
    }

    // Microsoft Clarity tracking code
    (function(c: any, l: any, a: any, r: any, i: any, t: any, y: any) {
      c[a] = c[a] || function() { 
        (c[a].q = c[a].q || []).push(arguments) 
      };
      t = l.createElement(r);
      t.async = 1;
      t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", ANALYTICS_CONFIG.CLARITY.projectId);

    this.initialized = true;

    if (ANALYTICS_CONFIG.DEBUG) {
      console.log('✅ Microsoft Clarity initialized');
    }
  }

  // Set user ID for session tracking
  setUserId(userId: string) {
    this.ensureInitialized();
    if (!this.isEnabled()) return;

    window.clarity('set', 'user_id', userId);

    if (ANALYTICS_CONFIG.DEBUG) {
      console.log('🆔 Clarity User ID set:', userId);
    }
  }

  // Set custom tags for filtering sessions
  setCustomTag(key: string, value: string) {
    this.ensureInitialized();
    if (!this.isEnabled()) return;

    window.clarity('set', key, value);

    if (ANALYTICS_CONFIG.DEBUG) {
      console.log('🏷️ Clarity Custom Tag:', { key, value });
    }
  }

  // Identify user type for better analysis
  identifyUserType(userType: 'guest' | 'registered' | 'admin') {
    this.setCustomTag('user_type', userType);
  }

  // Track page type for segmentation
  trackPageType(pageType: string) {
    this.setCustomTag('page_type', pageType);
  }

  // Track quote interactions
  trackQuoteInteraction(action: string, quoteId?: string) {
    this.setCustomTag('quote_action', action);
    if (quoteId) {
      this.setCustomTag('quote_id', quoteId);
    }
  }

  // Track form interactions
  trackFormInteraction(formName: string, action: 'start' | 'submit' | 'error') {
    this.setCustomTag('form_name', formName);
    this.setCustomTag('form_action', action);
  }

  // Track e-commerce events
  trackEcommerceEvent(event: string, value?: number) {
    this.setCustomTag('ecommerce_event', event);
    if (value) {
      this.setCustomTag('ecommerce_value', value.toString());
    }
  }

  // Track errors for debugging
  trackError(errorType: string, errorMessage: string) {
    this.setCustomTag('error_type', errorType);
    this.setCustomTag('error_message', errorMessage.substring(0, 100)); // Limit length
  }

  // Track user journey milestones
  trackMilestone(milestone: string) {
    this.setCustomTag('milestone', milestone);

    if (ANALYTICS_CONFIG.DEBUG) {
      console.log('🎯 Clarity Milestone:', milestone);
    }
  }

  // Get session replay URL (for debugging)
  getSessionUrl(): Promise<string | null> {
    return new Promise((resolve) => {
      if (!this.isEnabled()) {
        resolve(null);
        return;
      }

      // Microsoft Clarity doesn't provide direct session URL access
      // This would need to be implemented through their API
      resolve(null);
    });
  }

  private isEnabled(): boolean {
    return ANALYTICS_CONFIG.CLARITY.enabled && this.initialized;
  }
}

// Export singleton instance
export const microsoftClarity = new MicrosoftClarity(); 