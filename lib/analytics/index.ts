// Analytics Library Entry Point
// 统一导出所有分析相关的工具和类型

// Core analytics manager
export { analytics } from './analytics-manager';

// Individual analytics tools (for advanced usage)
export { googleAnalytics } from './google-analytics';
export { microsoftClarity } from './microsoft-clarity';

// Configuration and constants
export { ANALYTICS_CONFIG, EVENT_CATEGORIES, STANDARD_EVENTS } from './config';
export type { EventCategory, StandardEvent } from './config';

// React hook for easy integration
export { useAnalytics } from '@/hooks/useAnalytics';

// Analytics provider component
export { AnalyticsProvider } from '@/app/components/AnalyticsProvider';

// Quick setup helper for common scenarios
export const quickSetup = {
  // Initialize analytics with user data
  identifyUser: (userData: {
    id: string;
    email?: string;
    type: 'guest' | 'registered' | 'admin';
    company?: string;
    country?: string;
  }) => {
    analytics.identifyUser(userData);
  },

  // Track common PCB business events
  pcb: {
    // Quote events
    quoteStarted: () => analytics.trackFormInteraction('quote_form', 'start'),
    quoteSubmitted: (quoteData: {
      quote_id: string;
      pcb_type: string;
      layers: number;
      quantity: number;
      value: number;
      user_type: 'guest' | 'registered';
    }) => analytics.trackQuoteSubmission({
      ...quoteData,
      gerber_analyzed: false,
    }),
    
    // Order events
    orderCompleted: (orderId: string, value: number, items: any[]) => 
      analytics.trackPurchase(orderId, items, value),
    
    // Engagement events
    gerberUploaded: (fileCount: number) => analytics.trackEvent('gerber_upload', {
      event_category: 'engagement',
      event_label: 'file_upload',
      value: fileCount,
      custom_parameters: { file_count: fileCount },
    }),
    
    calculatorUsed: (calculationType: string) => analytics.trackEvent('calculator_used', {
      event_category: 'engagement',
      event_label: calculationType,
      custom_parameters: { calculator_type: calculationType },
    }),
  },

  // Common website events
  website: {
    // Contact events
    contactFormSubmitted: (formType: string) => 
      analytics.trackFormInteraction(`contact_${formType}`, 'submit'),
    
    // Content events
    articleViewed: (articleId: string, title: string) => 
      analytics.trackContentView('article', articleId, title),
    
    downloadInitiated: (fileName: string, fileType: string) => 
      analytics.trackEvent('file_download', {
        event_category: 'engagement',
        event_label: fileType,
        custom_parameters: { file_name: fileName, file_type: fileType },
      }),
    
    // Navigation events
    ctaClicked: (ctaText: string, location: string) => 
      analytics.trackEvent('cta_click', {
        event_category: 'user_interaction',
        event_label: ctaText,
        custom_parameters: { cta_text: ctaText, location },
      }),
  },

  // Error tracking helpers
  errors: {
    apiError: (endpoint: string, errorCode: number, errorMessage: string) =>
      analytics.trackError('api_error', errorMessage, {
        endpoint,
        error_code: errorCode,
      }),
    
    formError: (formName: string, fieldName: string, errorMessage: string) =>
      analytics.trackError('form_error', errorMessage, {
        form_name: formName,
        field_name: fieldName,
      }),
    
    paymentError: (paymentMethod: string, errorCode: string) =>
      analytics.trackError('payment_error', `Payment failed: ${errorCode}`, {
        payment_method: paymentMethod,
        error_code: errorCode,
      }),
  },
};

// Analytics status checker
export const getAnalyticsStatus = () => analytics.getStatus();

// Debug helpers (development only)
export const debug = {
  // Test all analytics tools
  testAllTools: () => {
    analytics.trackEvent('debug_test', {
      event_category: 'debug',
      event_label: 'all_tools_test',
      custom_parameters: {
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
      },
    });
    console.log('📊 Analytics test event sent to all enabled tools');
  },

  // Get current configuration
  getConfig: () => ANALYTICS_CONFIG,

  // Check which tools are loaded
  checkToolsLoaded: () => {
    const status = {
      gtag: !!window.gtag,
      clarity: !!window.clarity,
      dataLayer: !!window.dataLayer,
    };
    console.log('🔍 Analytics tools status:', status);
    return status;
  },
}; 