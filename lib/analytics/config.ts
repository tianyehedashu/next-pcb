// Analytics Configuration
export const ANALYTICS_CONFIG = {
  // Google Analytics 4
  GA4: {
    measurementId: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || 'G-XXXXXXXXXX',
    enabled: !!process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
  },
  
  // Google Tag Manager
  GTM: {
    containerId: process.env.NEXT_PUBLIC_GTM_CONTAINER_ID || 'GTM-XXXXXXXXX',
    enabled: !!process.env.NEXT_PUBLIC_GTM_CONTAINER_ID,
  },
  
  // Microsoft Clarity
  CLARITY: {
    projectId: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || '',
    enabled: !!process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID,
  },
  
  // Mixpanel
  MIXPANEL: {
    token: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '',
    enabled: !!process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
  },
  
  // Hotjar
  HOTJAR: {
    hjid: process.env.NEXT_PUBLIC_HOTJAR_ID || '',
    hjsv: process.env.NEXT_PUBLIC_HOTJAR_SV || '6',
    enabled: !!process.env.NEXT_PUBLIC_HOTJAR_ID,
  },
  
  // PostHog
  POSTHOG: {
    apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY || '',
    apiHost: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    enabled: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
  },
  
  // Vercel Analytics
  VERCEL: {
    enabled: process.env.NODE_ENV === 'production',
  },
  
  // Development settings
  DEBUG: process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true',
  PRODUCTION: process.env.NODE_ENV === 'production',
};

// Event categories for consistent tracking
export const EVENT_CATEGORIES = {
  USER_INTERACTION: 'user_interaction',
  E_COMMERCE: 'ecommerce',
  ENGAGEMENT: 'engagement',
  PERFORMANCE: 'performance',
  ERROR: 'error',
  NAVIGATION: 'navigation',
  FORM: 'form',
  QUOTE: 'quote',
  ORDER: 'order',
  CONTENT: 'content',
} as const;

// Standard events for tracking
export const STANDARD_EVENTS = {
  // Page events
  PAGE_VIEW: 'page_view',
  
  // User events
  USER_SIGNUP: 'sign_up',
  USER_LOGIN: 'login',
  USER_LOGOUT: 'logout',
  
  // E-commerce events
  VIEW_ITEM: 'view_item',
  ADD_TO_CART: 'add_to_cart',
  BEGIN_CHECKOUT: 'begin_checkout',
  PURCHASE: 'purchase',
  REFUND: 'refund',
  
  // Quote events
  QUOTE_REQUEST: 'quote_request',
  QUOTE_SUBMIT: 'quote_submit',
  QUOTE_VIEW: 'quote_view',
  QUOTE_DOWNLOAD: 'quote_download',
  
  // Engagement events
  SCROLL: 'scroll',
  SEARCH: 'search',
  SHARE: 'share',
  VIDEO_PLAY: 'video_play',
  FILE_DOWNLOAD: 'file_download',
  
  // Form events
  FORM_START: 'form_start',
  FORM_SUBMIT: 'form_submit',
  FORM_ERROR: 'form_error',
  
  // Contact events
  CONTACT_SUBMIT: 'contact_submit',
  CHAT_OPEN: 'chat_open',
  CHAT_MESSAGE: 'chat_message',
  
  // Content events
  CONTENT_VIEW: 'content_view',
  CONTENT_SHARE: 'content_share',
  
  // Error events
  ERROR_404: 'error_404',
  ERROR_500: 'error_500',
  API_ERROR: 'api_error',
} as const;

export type EventCategory = keyof typeof EVENT_CATEGORIES;
export type StandardEvent = keyof typeof STANDARD_EVENTS; 