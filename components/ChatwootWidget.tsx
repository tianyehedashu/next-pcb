'use client';

import { useEffect } from 'react';
import { CHATWOOT_CONFIG } from '@/lib/chatwoot';

declare global {
  interface Window {
    chatwootSettings?: any;
    chatwootSDK?: any;
    $chatwoot?: any;
  }
}

export const ChatwootWidget = () => {
  useEffect(() => {
    // Check if website token is provided
    if (!CHATWOOT_CONFIG.websiteToken) {
      console.warn('Chatwoot website token is not provided');
      return;
    }

    // Check if Chatwoot is already loaded
    if (window.$chatwoot || window.chatwootSDK) {
      console.log('Chatwoot already loaded');
      return;
    }

    console.log('Loading Chatwoot with config:', {
      baseUrl: CHATWOOT_CONFIG.baseUrl,
      hasToken: !!CHATWOOT_CONFIG.websiteToken,
    });

    // Set Chatwoot settings before loading
    window.chatwootSettings = {
      hideMessageBubble: CHATWOOT_CONFIG.hideMessageBubble,
      position: CHATWOOT_CONFIG.position,
      locale: CHATWOOT_CONFIG.locale,
      type: CHATWOOT_CONFIG.type,
      launcherTitle: CHATWOOT_CONFIG.launcherTitle,
      showPopoutButton: CHATWOOT_CONFIG.showPopoutButton,
    };

    // Create and load the Chatwoot script
    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.src = `${CHATWOOT_CONFIG.baseUrl}/packs/js/sdk.js`;
    
    script.onload = () => {
      console.log('Chatwoot script loaded successfully');
      
      // Initialize Chatwoot
      if (window.chatwootSDK) {
        try {
          window.chatwootSDK.run({
            websiteToken: CHATWOOT_CONFIG.websiteToken,
            baseUrl: CHATWOOT_CONFIG.baseUrl,
          });
          console.log('Chatwoot SDK initialized successfully');
        } catch (error) {
          console.error('Failed to initialize Chatwoot SDK:', error);
        }
      } else {
        console.error('Chatwoot SDK not available after script load');
      }
    };

    script.onerror = (error) => {
      console.error('Failed to load Chatwoot script:', error);
    };

    // Add script to document
    document.head.appendChild(script);

    // Fallback: Try direct initialization after delay
    setTimeout(() => {
      if (!window.$chatwoot && window.chatwootSDK) {
        console.log('Attempting fallback Chatwoot initialization');
        try {
          window.chatwootSDK.run({
            websiteToken: CHATWOOT_CONFIG.websiteToken,
            baseUrl: CHATWOOT_CONFIG.baseUrl,
          });
        } catch (error) {
          console.error('Fallback initialization failed:', error);
        }
      }
    }, 3000);

    return () => {
      // Clean up if needed
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return null;
}; 