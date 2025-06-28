import { googleAnalytics } from './google-analytics';
import { microsoftClarity } from './microsoft-clarity';
import { ANALYTICS_CONFIG, STANDARD_EVENTS } from './config';
import { cookieConsent } from './cookie-consent';

// Mixpanel integration (optional)
let mixpanel: any = null;
if (ANALYTICS_CONFIG.MIXPANEL.enabled && typeof window !== 'undefined') {
  import('mixpanel-browser').then((mp) => {
    mixpanel = mp.default;
    // Only initialize if analytics cookies are allowed
    if (cookieConsent.isAnalyticsAllowed()) {
      mixpanel.init(ANALYTICS_CONFIG.MIXPANEL.token, {
        debug: ANALYTICS_CONFIG.DEBUG,
        track_pageview: true,
        persistence: 'localStorage',
      });
    }
  }).catch(console.error);
}

// PostHog integration (optional)
let posthog: any = null;
if (ANALYTICS_CONFIG.POSTHOG.enabled && typeof window !== 'undefined') {
  import('posthog-js').then((ph) => {
    posthog = ph.default;
    // Only initialize if analytics cookies are allowed
    if (cookieConsent.isAnalyticsAllowed()) {
      posthog.init(ANALYTICS_CONFIG.POSTHOG.apiKey, {
        api_host: ANALYTICS_CONFIG.POSTHOG.apiHost,
        debug: ANALYTICS_CONFIG.DEBUG,
      });
    }
  }).catch(console.error);
}

// User data interface
interface UserData {
  id: string;
  email?: string;
  type: 'guest' | 'registered' | 'admin';
  company?: string;
  country?: string;
  signup_date?: string;
}

// E-commerce item interface
interface AnalyticsItem {
  id: string;
  name: string;
  category?: string;
  price?: number;
  quantity?: number;
  variant?: string;
}

// Quote data interface
interface QuoteData {
  quote_id: string;
  pcb_type: string;
  layers: number;
  quantity: number;
  value: number;
  user_type: 'guest' | 'registered';
  gerber_analyzed: boolean;
  delivery_option?: string;
}

class AnalyticsManager {
  private userIdentified = false;
  private initialized = false;

  constructor() {
    // Don't initialize in constructor for SSR compatibility
    // Set up consent change listener
    if (typeof window !== 'undefined') {
      cookieConsent.onConsentChange((consentData) => {
        if (consentData.preferences.analytics && !this.initialized) {
          this.ensureInitialized();
        } else if (!consentData.preferences.analytics && this.initialized) {
          // User revoked consent, disable analytics
          this.disableAnalytics();
        }
      });
    }
  }

  private ensureInitialized() {
    // Only initialize if analytics cookies are allowed
    if (!this.initialized && typeof window !== 'undefined' && cookieConsent.isAnalyticsAllowed()) {
      this.initialized = true; // Set this BEFORE calling initializeTracking to prevent circular calls
      this.initializeTracking();
    }
  }

  private initializeTracking() {
    if (typeof window === 'undefined' || !cookieConsent.isAnalyticsAllowed()) return;

    // Track initial page load
    this.trackPageView(window.location.pathname);

    // Track performance metrics
    this.trackWebVitals();

    // Track scroll depth
    this.trackScrollDepth();

    if (ANALYTICS_CONFIG.DEBUG) {
      console.log('📊 Analytics Manager initialized with cookie consent');
    }
  }

  private disableAnalytics() {
    this.initialized = false;
    this.userIdentified = false;
    
    if (ANALYTICS_CONFIG.DEBUG) {
      console.log('🚫 Analytics disabled due to cookie consent');
    }
  }

  // Check if analytics is allowed before any tracking
  private checkAnalyticsAllowed(): boolean {
    if (!cookieConsent.isAnalyticsAllowed()) {
      if (ANALYTICS_CONFIG.DEBUG) {
        console.log('🍪 Analytics tracking skipped: cookies not consented');
      }
      return false;
    }
    return true;
  }

  // User identification and properties
  identifyUser(userData: UserData) {
    if (!this.checkAnalyticsAllowed()) return;
    
    this.ensureInitialized();
    if (this.userIdentified) return;

    // Google Analytics
    googleAnalytics.setUserId(userData.id);
    googleAnalytics.setUserProperties({
      user_type: userData.type,
      user_email: userData.email,
      user_company: userData.company,
      user_country: userData.country,
      user_signup_date: userData.signup_date,
    });

    // Microsoft Clarity
    microsoftClarity.setUserId(userData.id);
    microsoftClarity.identifyUserType(userData.type);

    // Mixpanel
    if (mixpanel) {
      mixpanel.identify(userData.id);
      mixpanel.people.set({
        $email: userData.email,
        $created: userData.signup_date,
        user_type: userData.type,
        company: userData.company,
        country: userData.country,
      });
    }

    // PostHog
    if (posthog) {
      posthog.identify(userData.id, {
        email: userData.email,
        user_type: userData.type,
        company: userData.company,
        country: userData.country,
      });
    }

    this.userIdentified = true;

    if (ANALYTICS_CONFIG.DEBUG) {
      console.log('👤 User identified across all platforms:', userData);
    }
  }

  // Page tracking
  trackPageView(url: string, title?: string) {
    // If not initialized yet and not in browser, return early
    if (typeof window === 'undefined') return;
    
    // Check cookie consent first
    if (!this.checkAnalyticsAllowed()) return;
    
    // If not initialized yet, ensure initialization happens first
    // But only if we're not currently in the middle of initialization
    if (!this.initialized) {
      this.ensureInitialized();
      return; // Return early as ensureInitialized will call trackPageView again
    }
    
    googleAnalytics.trackPageView(url, title);
    
    if (mixpanel) {
      mixpanel.track('Page View', { page: url, title });
    }
    
    if (posthog) {
      posthog.capture('$pageview', { $current_url: url });
    }

    // Set page type for Clarity
    const pageType = this.getPageType(url);
    microsoftClarity.trackPageType(pageType);
  }

  // Quote tracking (業務核心功能)
  trackQuoteSubmission(quoteData: QuoteData) {
    if (!this.checkAnalyticsAllowed()) return;
    
    // Google Analytics with enhanced e-commerce
    googleAnalytics.trackQuoteSubmission(quoteData);

    // Microsoft Clarity
    microsoftClarity.trackQuoteInteraction('submit', quoteData.quote_id);
    microsoftClarity.trackMilestone('quote_submitted');

    // Mixpanel with detailed properties
    if (mixpanel) {
      mixpanel.track('Quote Submitted', {
        quote_id: quoteData.quote_id,
        pcb_type: quoteData.pcb_type,
        layers: quoteData.layers,
        quantity: quoteData.quantity,
        value: quoteData.value,
        user_type: quoteData.user_type,
        gerber_analyzed: quoteData.gerber_analyzed,
        delivery_option: quoteData.delivery_option,
      });
    }

    // PostHog
    if (posthog) {
      posthog.capture('quote_submitted', quoteData);
    }

    if (ANALYTICS_CONFIG.DEBUG) {
      console.log('💰 Quote submission tracked:', quoteData);
    }
  }

  // Order tracking
  trackPurchase(orderId: string, items: AnalyticsItem[], value: number, currency = 'USD') {
    // Google Analytics enhanced e-commerce
    const gaItems = items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      item_category: item.category || 'PCB',
      price: item.price,
      quantity: item.quantity || 1,
      currency,
    }));
    
    googleAnalytics.trackPurchase(orderId, gaItems, value, currency);

    // Microsoft Clarity
    microsoftClarity.trackEcommerceEvent('purchase', value);
    microsoftClarity.trackMilestone('order_completed');

    // Mixpanel
    if (mixpanel) {
      mixpanel.track('Order Completed', {
        order_id: orderId,
        revenue: value,
        currency,
        items: items,
      });
    }

    // PostHog
    if (posthog) {
      posthog.capture('order_completed', {
        order_id: orderId,
        revenue: value,
        currency,
        items,
      });
    }
  }

  // Form tracking
  trackFormInteraction(formName: string, action: 'start' | 'submit' | 'error', additionalData?: any) {
    googleAnalytics.trackFormStart(formName);
    microsoftClarity.trackFormInteraction(formName, action);

    if (mixpanel) {
      mixpanel.track(`Form ${action}`, {
        form_name: formName,
        ...additionalData,
      });
    }

    if (posthog) {
      posthog.capture(`form_${action}`, {
        form_name: formName,
        ...additionalData,
      });
    }
  }

  // Error tracking
  trackError(errorType: string, errorMessage: string, additionalData?: any) {
    googleAnalytics.trackError(errorType, errorMessage);
    microsoftClarity.trackError(errorType, errorMessage);

    if (mixpanel) {
      mixpanel.track('Error Occurred', {
        error_type: errorType,
        error_message: errorMessage,
        ...additionalData,
      });
    }

    if (posthog) {
      posthog.capture('error_occurred', {
        error_type: errorType,
        error_message: errorMessage,
        ...additionalData,
      });
    }
  }

  // Content engagement
  trackContentView(contentType: string, contentId: string, contentTitle: string) {
    googleAnalytics.trackContentView(contentType, contentId, contentTitle);

    if (mixpanel) {
      mixpanel.track('Content View', {
        content_type: contentType,
        content_id: contentId,
        content_title: contentTitle,
      });
    }

    if (posthog) {
      posthog.capture('content_view', {
        content_type: contentType,
        content_id: contentId,
        content_title: contentTitle,
      });
    }
  }

  // Chat interactions
  trackChatInteraction(action: 'open' | 'message_sent' | 'message_received', source = 'widget') {
    if (action === 'open') {
      googleAnalytics.trackChatOpen(source);
    } else {
      const messageType = action === 'message_sent' ? 'sent' : 'received';
      googleAnalytics.trackChatMessage(messageType, source);
    }

    if (mixpanel) {
      mixpanel.track(`Chat ${action}`, { source });
    }

    if (posthog) {
      posthog.capture(`chat_${action}`, { source });
    }
  }

  // Generic event tracking
  trackEvent(eventName: string, parameters?: {
    event_category?: string;
    event_label?: string;
    value?: number;
    currency?: string;
    custom_parameters?: Record<string, any>;
  }) {
    if (!this.checkAnalyticsAllowed()) return;
    
    this.ensureInitialized();
    
    // Google Analytics with standard parameters
    googleAnalytics.trackEvent(eventName, {
      event_category: parameters?.event_category || 'general',
      event_label: parameters?.event_label,
      value: parameters?.value,
      ...parameters?.custom_parameters,
    });

    // Microsoft Clarity - use custom tags
    microsoftClarity.setCustomTag('event_name', eventName);
    if (parameters?.event_category) {
      microsoftClarity.setCustomTag('event_category', parameters.event_category);
    }
    if (parameters?.event_label) {
      microsoftClarity.setCustomTag('event_label', parameters.event_label);
    }
    if (parameters?.value) {
      microsoftClarity.setCustomTag('event_value', parameters.value.toString());
    }

    // Mixpanel
    if (mixpanel) {
      mixpanel.track(eventName, {
        event_category: parameters?.event_category,
        event_label: parameters?.event_label,
        value: parameters?.value,
        currency: parameters?.currency,
        ...parameters?.custom_parameters,
      });
    }

    // PostHog
    if (posthog) {
      posthog.capture(eventName, {
        event_category: parameters?.event_category,
        event_label: parameters?.event_label,
        value: parameters?.value,
        currency: parameters?.currency,
        ...parameters?.custom_parameters,
      });
    }

    if (ANALYTICS_CONFIG.DEBUG) {
      console.log(`📊 Event tracked: ${eventName}`, parameters);
    }
  }

  // Performance tracking
  private trackWebVitals() {
    if (typeof window === 'undefined') return;

    // Track Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const metricName = entry.name;
        // Use startTime for paint metrics, duration for others, or fallback to 0
        const value = Math.round(
          (entry as any).value || 
          entry.startTime || 
          (entry as any).duration || 
          0
        );

        googleAnalytics.trackPerformance(metricName, value);

        if (mixpanel) {
          mixpanel.track('Performance Metric', {
            metric_name: metricName,
            metric_value: value,
          });
        }

        if (ANALYTICS_CONFIG.DEBUG) {
          console.log(`⚡ Performance: ${metricName} = ${value}ms`);
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
    } catch (e) {
      // Ignore if not supported
    }
  }

  // Scroll depth tracking
  private trackScrollDepth() {
    if (typeof window === 'undefined') return;

    let maxScroll = 0;
    const thresholds = [25, 50, 75, 90, 100];

    const trackScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        
        const threshold = thresholds.find(t => t <= scrollPercent && t > (maxScroll - scrollPercent));
        if (threshold) {
          googleAnalytics.trackEvent(STANDARD_EVENTS.SCROLL, {
            event_category: 'engagement',
            event_label: `${threshold}%`,
            value: threshold,
          });

          if (mixpanel) {
            mixpanel.track('Scroll Depth', { percent: threshold });
          }
        }
      }
    };

    window.addEventListener('scroll', trackScroll, { passive: true });
  }

  // Utility method to determine page type
  private getPageType(url: string): string {
    if (url.includes('/quote')) return 'quote';
    if (url.includes('/admin')) return 'admin';
    if (url.includes('/profile')) return 'profile';
    if (url.includes('/payment')) return 'payment';
    if (url.includes('/content')) return 'content';
    if (url.includes('/about')) return 'about';
    if (url.includes('/contact')) return 'contact';
    if (url.includes('/auth')) return 'auth';
    if (url === '/') return 'home';
    return 'other';
  }

  // Debug method to check status
  getStatus() {
    return {
      ga4_enabled: ANALYTICS_CONFIG.GA4.enabled,
      clarity_enabled: ANALYTICS_CONFIG.CLARITY.enabled,
      mixpanel_enabled: ANALYTICS_CONFIG.MIXPANEL.enabled,
      posthog_enabled: ANALYTICS_CONFIG.POSTHOG.enabled,
      user_identified: this.userIdentified,
      debug_mode: ANALYTICS_CONFIG.DEBUG,
    };
  }
}

// Export singleton instance
export const analytics = new AnalyticsManager(); 