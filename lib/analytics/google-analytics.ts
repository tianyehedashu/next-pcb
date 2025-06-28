import { ANALYTICS_CONFIG, STANDARD_EVENTS } from './config';

// Google Analytics gtag function types
declare global {
  interface Window {
    gtag: (command: string, ...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

// Enhanced e-commerce item interface
interface GAItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_category2?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
  currency?: string;
  custom_parameters?: Record<string, unknown>;
}

// Standard event parameters
interface GAEventParams {
  event_category?: string;
  event_label?: string;
  value?: number;
  currency?: string;
  custom_parameters?: Record<string, unknown>;
}

class GoogleAnalytics {
  private initialized = false;

  constructor() {
    // Don't initialize in constructor for SSR compatibility
  }

  private initialize() {
    if (!ANALYTICS_CONFIG.GA4.enabled || this.initialized || typeof window === 'undefined') {
      return;
    }

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };

    // Configure GA4
    window.gtag('js', new Date());
    window.gtag('config', ANALYTICS_CONFIG.GA4.measurementId, {
      page_title: document.title,
      page_location: window.location.href,
      send_page_view: true,
      anonymize_ip: true,
      allow_google_signals: true,
      allow_ad_personalization_signals: false,
    });

    this.initialized = true;

    if (ANALYTICS_CONFIG.DEBUG) {
      console.log('✅ Google Analytics 4 initialized');
    }
  }

  // Ensure initialization before any tracking
  private ensureInitialized() {
    if (!this.initialized && typeof window !== 'undefined') {
      this.initialize();
    }
  }

  // Track page views
  trackPageView(url: string, title?: string) {
    this.ensureInitialized();
    if (!this.isEnabled()) return;

    window.gtag('config', ANALYTICS_CONFIG.GA4.measurementId, {
      page_path: url,
      page_title: title || (typeof document !== 'undefined' ? document.title : ''),
    });

    if (ANALYTICS_CONFIG.DEBUG) {
      console.log('📊 GA4 Page View:', { url, title });
    }
  }

  // Track custom events
  trackEvent(eventName: string, parameters: GAEventParams = {}) {
    this.ensureInitialized();
    if (!this.isEnabled()) return;

    const eventData = {
      event_category: parameters.event_category,
      event_label: parameters.event_label,
      value: parameters.value,
      currency: parameters.currency || 'USD',
      ...parameters.custom_parameters,
    };

    window.gtag('event', eventName, eventData);

    if (ANALYTICS_CONFIG.DEBUG) {
      console.log('📊 GA4 Event:', eventName, eventData);
    }
  }

  // E-commerce tracking
  trackPurchase(transactionId: string, items: GAItem[], value: number, currency = 'USD') {
    this.ensureInitialized();
    if (!this.isEnabled()) return;

    window.gtag('event', 'purchase', {
      transaction_id: transactionId,
      value: value,
      currency: currency,
      items: items,
    });

    if (ANALYTICS_CONFIG.DEBUG) {
      console.log('💳 GA4 Purchase:', { transactionId, value, currency, items });
    }
  }

  // Quote submission tracking
  trackQuoteSubmission(quoteData: {
    quote_id: string;
    pcb_type: string;
    layers: number;
    quantity: number;
    value: number;
    user_type: 'guest' | 'registered';
  }) {
    this.trackEvent(STANDARD_EVENTS.QUOTE_SUBMIT, {
      event_category: 'quote',
      event_label: `${quoteData.pcb_type}_${quoteData.layers}layer`,
      value: quoteData.value,
      custom_parameters: {
        quote_id: quoteData.quote_id,
        pcb_type: quoteData.pcb_type,
        layers: quoteData.layers,
        quantity: quoteData.quantity,
        user_type: quoteData.user_type,
      },
    });
  }

  // User authentication events
  trackUserSignup(method: string = 'email') {
    this.trackEvent(STANDARD_EVENTS.USER_SIGNUP, {
      event_category: 'user_interaction',
      event_label: method,
      custom_parameters: { method },
    });
  }

  trackUserLogin(method: string = 'email') {
    this.trackEvent(STANDARD_EVENTS.USER_LOGIN, {
      event_category: 'user_interaction',
      event_label: method,
      custom_parameters: { method },
    });
  }

  // Content engagement
  trackContentView(contentType: string, contentId: string, contentTitle: string) {
    this.trackEvent(STANDARD_EVENTS.CONTENT_VIEW, {
      event_category: 'content',
      event_label: contentType,
      custom_parameters: {
        content_type: contentType,
        content_id: contentId,
        content_title: contentTitle,
      },
    });
  }

  // Form interactions
  trackFormStart(formName: string) {
    this.trackEvent(STANDARD_EVENTS.FORM_START, {
      event_category: 'form',
      event_label: formName,
      custom_parameters: { form_name: formName },
    });
  }

  trackFormSubmit(formName: string, success: boolean = true) {
    this.trackEvent(success ? STANDARD_EVENTS.FORM_SUBMIT : STANDARD_EVENTS.FORM_ERROR, {
      event_category: 'form',
      event_label: formName,
      custom_parameters: { 
        form_name: formName,
        success: success,
      },
    });
  }

  // Error tracking
  trackError(errorType: string, errorMessage: string, errorPage?: string) {
    this.trackEvent(STANDARD_EVENTS.API_ERROR, {
      event_category: 'error',
      event_label: errorType,
      custom_parameters: {
        error_type: errorType,
        error_message: errorMessage,
        error_page: errorPage || window.location.pathname,
      },
    });
  }

  // Performance tracking
  trackPerformance(metricName: string, value: number, unit: string = 'ms') {
    this.trackEvent('performance_metric', {
      event_category: 'performance',
      event_label: metricName,
      value: value,
      custom_parameters: {
        metric_name: metricName,
        metric_value: value,
        metric_unit: unit,
      },
    });
  }

  // Chat interaction tracking
  trackChatOpen(source: string = 'widget') {
    this.trackEvent(STANDARD_EVENTS.CHAT_OPEN, {
      event_category: 'user_interaction',
      event_label: source,
      custom_parameters: { chat_source: source },
    });
  }

  trackChatMessage(messageType: 'sent' | 'received', source: string = 'widget') {
    this.trackEvent(STANDARD_EVENTS.CHAT_MESSAGE, {
      event_category: 'engagement',
      event_label: `${messageType}_${source}`,
      custom_parameters: {
        message_type: messageType,
        chat_source: source,
      },
    });
  }

  // Set user properties
  setUserProperties(properties: Record<string, unknown>) {
    this.ensureInitialized();
    if (!this.isEnabled()) return;

    window.gtag('config', ANALYTICS_CONFIG.GA4.measurementId, {
      custom_map: properties,
    });

    if (ANALYTICS_CONFIG.DEBUG) {
      console.log('👤 GA4 User Properties:', properties);
    }
  }

  // Set user ID for cross-device tracking
  setUserId(userId: string) {
    this.ensureInitialized();
    if (!this.isEnabled()) return;

    window.gtag('config', ANALYTICS_CONFIG.GA4.measurementId, {
      user_id: userId,
    });

    if (ANALYTICS_CONFIG.DEBUG) {
      console.log('🆔 GA4 User ID set:', userId);
    }
  }

  private isEnabled(): boolean {
    return ANALYTICS_CONFIG.GA4.enabled && this.initialized;
  }
}

// Export singleton instance
export const googleAnalytics = new GoogleAnalytics(); 