'use client';

import { useCallback, useEffect } from 'react';
import { analytics } from '@/lib/analytics/analytics-manager';
import { useAuth } from '@/hooks/useAuth';

interface UseAnalyticsReturn {
  // User tracking
  identifyUser: (userData: {
    id: string;
    email?: string;
    type: 'guest' | 'registered' | 'admin';
    company?: string;
    country?: string;
  }) => void;

  // Page tracking
  trackPageView: (url?: string, title?: string) => void;

  // Quote tracking
  trackQuoteStart: () => void;
  trackQuoteSubmit: (quoteData: {
    quote_id: string;
    pcb_type: string;
    layers: number;
    quantity: number;
    value: number;
    user_type: 'guest' | 'registered';
    gerber_analyzed?: boolean;
    delivery_option?: string;
  }) => void;
  trackQuoteView: (quoteId: string) => void;
  trackQuoteDownload: (quoteId: string, format: string) => void;

  // E-commerce tracking
  trackPurchase: (orderId: string, items: any[], value: number, currency?: string) => void;
  trackAddToCart: (item: any) => void;
  trackCheckoutStart: (value: number, currency?: string) => void;

  // Form tracking
  trackFormStart: (formName: string) => void;
  trackFormSubmit: (formName: string, success?: boolean, additionalData?: any) => void;
  trackFormError: (formName: string, errorMessage: string) => void;

  // Content tracking
  trackContentView: (contentType: string, contentId: string, contentTitle: string) => void;
  trackContentShare: (contentId: string, method: string) => void;
  trackSearch: (searchTerm: string, resultCount?: number) => void;

  // Interaction tracking
  trackButtonClick: (buttonName: string, location?: string) => void;
  trackLinkClick: (linkText: string, url: string, location?: string) => void;
  trackDownload: (fileName: string, fileType: string) => void;

  // Chat tracking
  trackChatOpen: (source?: string) => void;
  trackChatMessage: (type: 'sent' | 'received', source?: string) => void;

  // Error tracking
  trackError: (errorType: string, errorMessage: string, additionalData?: any) => void;

  // Custom event tracking
  trackCustomEvent: (eventName: string, properties?: any) => void;
}

export function useAnalytics(): UseAnalyticsReturn {
  const { user } = useAuth();

  // Auto-identify user when auth state changes
  useEffect(() => {
    if (user) {
      analytics.identifyUser({
        id: user.id,
        email: user.email,
        type: user.role === 'admin' ? 'admin' : 'registered',
        company: user.company_name,
        // Add more user properties as needed
      });
    }
  }, [user]);

  const identifyUser = useCallback((userData: {
    id: string;
    email?: string;
    type: 'guest' | 'registered' | 'admin';
    company?: string;
    country?: string;
  }) => {
    analytics.identifyUser({
      ...userData,
      signup_date: userData.type === 'registered' ? new Date().toISOString() : undefined,
    });
  }, []);

  const trackPageView = useCallback((url?: string, title?: string) => {
    const currentUrl = url || window.location.pathname;
    const currentTitle = title || document.title;
    analytics.trackPageView(currentUrl, currentTitle);
  }, []);

  const trackQuoteStart = useCallback(() => {
    analytics.trackFormInteraction('quote_form', 'start');
  }, []);

  const trackQuoteSubmit = useCallback((quoteData: {
    quote_id: string;
    pcb_type: string;
    layers: number;
    quantity: number;
    value: number;
    user_type: 'guest' | 'registered';
    gerber_analyzed?: boolean;
    delivery_option?: string;
  }) => {
    analytics.trackQuoteSubmission({
      ...quoteData,
      gerber_analyzed: quoteData.gerber_analyzed || false,
    });
  }, []);

  const trackQuoteView = useCallback((quoteId: string) => {
    analytics.trackContentView('quote', quoteId, `Quote ${quoteId}`);
  }, []);

  const trackQuoteDownload = useCallback((quoteId: string, format: string) => {
    analytics.trackEvent('quote_download', {
      event_category: 'engagement',
      event_label: format,
      custom_parameters: {
        quote_id: quoteId,
        download_format: format,
      },
    });
  }, []);

  const trackPurchase = useCallback((orderId: string, items: any[], value: number, currency = 'USD') => {
    analytics.trackPurchase(orderId, items, value, currency);
  }, []);

  const trackAddToCart = useCallback((item: any) => {
    analytics.trackEvent('add_to_cart', {
      event_category: 'ecommerce',
      currency: 'USD',
      value: item.price || 0,
      custom_parameters: {
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
      },
    });
  }, []);

  const trackCheckoutStart = useCallback((value: number, currency = 'USD') => {
    analytics.trackEvent('begin_checkout', {
      event_category: 'ecommerce',
      currency,
      value,
    });
  }, []);

  const trackFormStart = useCallback((formName: string) => {
    analytics.trackFormInteraction(formName, 'start');
  }, []);

  const trackFormSubmit = useCallback((formName: string, success = true, additionalData?: any) => {
    analytics.trackFormInteraction(formName, success ? 'submit' : 'error', additionalData);
  }, []);

  const trackFormError = useCallback((formName: string, errorMessage: string) => {
    analytics.trackFormInteraction(formName, 'error', { error_message: errorMessage });
  }, []);

  const trackContentView = useCallback((contentType: string, contentId: string, contentTitle: string) => {
    analytics.trackContentView(contentType, contentId, contentTitle);
  }, []);

  const trackContentShare = useCallback((contentId: string, method: string) => {
    analytics.trackEvent('share', {
      event_category: 'engagement',
      event_label: method,
      custom_parameters: {
        content_id: contentId,
        share_method: method,
      },
    });
  }, []);

  const trackSearch = useCallback((searchTerm: string, resultCount?: number) => {
    analytics.trackEvent('search', {
      event_category: 'engagement',
      event_label: searchTerm,
      value: resultCount,
      custom_parameters: {
        search_term: searchTerm,
        result_count: resultCount,
      },
    });
  }, []);

  const trackButtonClick = useCallback((buttonName: string, location?: string) => {
    analytics.trackEvent('button_click', {
      event_category: 'user_interaction',
      event_label: buttonName,
      custom_parameters: {
        button_name: buttonName,
        button_location: location || window.location.pathname,
      },
    });
  }, []);

  const trackLinkClick = useCallback((linkText: string, url: string, location?: string) => {
    analytics.trackEvent('link_click', {
      event_category: 'user_interaction',
      event_label: linkText,
      custom_parameters: {
        link_text: linkText,
        link_url: url,
        click_location: location || window.location.pathname,
      },
    });
  }, []);

  const trackDownload = useCallback((fileName: string, fileType: string) => {
    analytics.trackEvent('file_download', {
      event_category: 'engagement',
      event_label: fileType,
      custom_parameters: {
        file_name: fileName,
        file_type: fileType,
      },
    });
  }, []);

  const trackChatOpen = useCallback((source = 'widget') => {
    analytics.trackChatInteraction('open', source);
  }, []);

  const trackChatMessage = useCallback((type: 'sent' | 'received', source = 'widget') => {
    analytics.trackChatInteraction(type === 'sent' ? 'message_sent' : 'message_received', source);
  }, []);

  const trackError = useCallback((errorType: string, errorMessage: string, additionalData?: any) => {
    analytics.trackError(errorType, errorMessage, additionalData);
  }, []);

  const trackCustomEvent = useCallback((eventName: string, properties?: any) => {
    analytics.trackEvent(eventName, {
      event_category: 'custom',
      custom_parameters: properties,
    });
  }, []);

  return {
    identifyUser,
    trackPageView,
    trackQuoteStart,
    trackQuoteSubmit,
    trackQuoteView,
    trackQuoteDownload,
    trackPurchase,
    trackAddToCart,
    trackCheckoutStart,
    trackFormStart,
    trackFormSubmit,
    trackFormError,
    trackContentView,
    trackContentShare,
    trackSearch,
    trackButtonClick,
    trackLinkClick,
    trackDownload,
    trackChatOpen,
    trackChatMessage,
    trackError,
    trackCustomEvent,
  };
} 