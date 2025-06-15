// lib/chatwoot-sdk-loader.ts

import type { ChatwootSDK, ChatwootSettings } from '@/types/chatwoot';

declare global {
  interface Window {
    chatwootSettings?: ChatwootSettings;
    chatwootSDK?: ChatwootSDK;
    $chatwoot?: ChatwootSDK;
    chatwootLoadPromise?: Promise<{ sdk: ChatwootSDK }>;
  }
}

// Global state to ensure the script is loaded only once.
let scriptLoadPromise: Promise<{ sdk: ChatwootSDK }> | null = null;

/**
 * Loads the Chatwoot SDK script dynamically and ensures it only loads once.
 * @param {string} baseUrl - The base URL of your Chatwoot installation.
 * @param {string} websiteToken - The website token for your Chatwoot inbox.
 * @param {ChatwootSettings} settings - Additional Chatwoot settings.
 * @returns {Promise<{ sdk: ChatwootSDK }>} A promise that resolves with the Chatwoot SDK object.
 */
export function loadChatwootSdk(
  baseUrl: string, 
  websiteToken: string, 
  settings?: ChatwootSettings
): Promise<{ sdk: ChatwootSDK }> {
  // Check if we already have a promise stored on window (survives page refresh in dev mode)
  if (window.chatwootLoadPromise) {
    return window.chatwootLoadPromise;
  }
  
  if (scriptLoadPromise) {
    window.chatwootLoadPromise = scriptLoadPromise;
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    // If SDK is already available, resolve immediately.
    if (window.$chatwoot) {
      console.log('[Chatwoot] SDK already available, reusing existing instance');
      resolve({ sdk: window.$chatwoot });
      return;
    }

    // Set global settings BEFORE loading/running the script
    // This is crucial according to Chatwoot documentation
    if (settings) {
      console.log('[Chatwoot] Setting window.chatwootSettings:', settings);
      window.chatwootSettings = settings;
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector('script[src*="sdk.js"]');
    if (existingScript && window.chatwootSDK) {
      console.log('[Chatwoot] Script already loaded, initializing...');
      try {
        window.chatwootSDK.run({
          websiteToken: websiteToken,
          baseUrl: baseUrl,
        });
        
        // Wait for the ready event
        const onReady = () => {
          if (window.$chatwoot) {
            console.log('[Chatwoot] SDK ready (reused script)');
            resolve({ sdk: window.$chatwoot });
          } else {
            reject(new Error('Chatwoot SDK loaded but $chatwoot is not available.'));
          }
          window.removeEventListener('chatwoot:ready', onReady);
        };
        
        if (window.$chatwoot) {
          resolve({ sdk: window.$chatwoot });
        } else {
          window.addEventListener('chatwoot:ready', onReady);
        }
        return;
      } catch (error) {
        console.warn('[Chatwoot] Failed to reuse existing script, will reload:', error);
      }
    }

    const script = document.createElement('script');
    const sdkUrl = `${baseUrl.replace(/\/$/, '')}/packs/js/sdk.js`;
    
    script.src = sdkUrl;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('[Chatwoot] SDK script loaded successfully');
      // The SDK script adds the chatwootSDK object to the window.
      // We need to run it to get the $chatwoot instance.
      if (window.chatwootSDK) {
        try {
          window.chatwootSDK.run({
            websiteToken: websiteToken,
            baseUrl: baseUrl,
          });

          // The 'chatwoot:ready' event fires when the $chatwoot object is available.
          const onReady = () => {
            if (window.$chatwoot) {
              console.log('[Chatwoot] SDK ready and available');
              resolve({ sdk: window.$chatwoot });
            } else {
              reject(new Error('Chatwoot SDK loaded but $chatwoot is not available.'));
            }
            window.removeEventListener('chatwoot:ready', onReady);
          };
          
          // Check if $chatwoot is already available (sometimes it's immediate)
          if (window.$chatwoot) {
            console.log('[Chatwoot] SDK ready immediately');
            resolve({ sdk: window.$chatwoot });
          } else {
            window.addEventListener('chatwoot:ready', onReady);
            
            // Fallback timeout in case the ready event doesn't fire
            setTimeout(() => {
              if (window.$chatwoot) {
                console.log('[Chatwoot] SDK ready (fallback check)');
                window.removeEventListener('chatwoot:ready', onReady);
                resolve({ sdk: window.$chatwoot });
              }
            }, 2000);
          }
        } catch (error) {
          console.error('[Chatwoot] Error running SDK:', error);
          reject(error);
        }
      } else {
        reject(new Error('Chatwoot SDK script loaded but window.chatwootSDK is not defined.'));
      }
    };

    script.onerror = (error) => {
      console.error('[Chatwoot] SDK script failed to load:', error);
      scriptLoadPromise = null; // Allow retrying
      window.chatwootLoadPromise = undefined;
      reject(new Error(`Failed to load Chatwoot SDK from ${sdkUrl}`));
    };

    console.log('[Chatwoot] Loading SDK script from:', sdkUrl);
    document.body.appendChild(script);
  });

  // Store the promise on window to survive page refreshes in dev mode
  window.chatwootLoadPromise = scriptLoadPromise;
  return scriptLoadPromise;
} 