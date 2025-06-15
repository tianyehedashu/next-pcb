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
 * Loads the Chatwoot SDK script with CORS proxy fallback
 * @param {string} baseUrl - The base URL of your Chatwoot installation.
 * @param {string} websiteToken - The website token for your Chatwoot inbox.
 * @param {ChatwootSettings} settings - Additional Chatwoot settings.
 * @returns {Promise<{ sdk: ChatwootSDK }>} A promise that resolves with the Chatwoot SDK object.
 */
export function loadChatwootSdkWithProxy(
  baseUrl: string, 
  websiteToken: string, 
  settings?: ChatwootSettings
): Promise<{ sdk: ChatwootSDK }> {
  // Check if we already have a promise stored on window
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
    if (settings) {
      console.log('[Chatwoot] Setting window.chatwootSettings:', settings);
      window.chatwootSettings = settings;
    }

    // Try direct loading first, then fallback to proxy
    const attemptDirectLoad = () => {
      const script = document.createElement('script');
      const directSdkUrl = `${baseUrl.replace(/\/$/, '')}/packs/js/sdk.js`;
      
      script.src = directSdkUrl;
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';

      script.onload = () => {
        console.log('[Chatwoot] SDK script loaded successfully (direct)');
        initializeChatwoot(baseUrl, websiteToken, resolve, reject);
      };

      script.onerror = () => {
        console.warn('[Chatwoot] Direct load failed, trying proxy...');
        document.body.removeChild(script);
        attemptProxyLoad();
      };

      console.log('[Chatwoot] Attempting direct load from:', directSdkUrl);
      document.body.appendChild(script);
    };

    const attemptProxyLoad = () => {
      const script = document.createElement('script');
      const proxySdkUrl = '/api/chatwoot-proxy/sdk';
      
      script.src = proxySdkUrl;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log('[Chatwoot] SDK script loaded successfully (proxy)');
        initializeChatwoot(baseUrl, websiteToken, resolve, reject);
      };

      script.onerror = () => {
        console.error('[Chatwoot] Both direct and proxy loading failed');
        scriptLoadPromise = null;
        window.chatwootLoadPromise = undefined;
        reject(new Error('Failed to load Chatwoot SDK via both direct and proxy methods'));
      };

      console.log('[Chatwoot] Attempting proxy load from:', proxySdkUrl);
      document.body.appendChild(script);
    };

    // Start with direct loading
    attemptDirectLoad();
  });

  // Store the promise on window
  window.chatwootLoadPromise = scriptLoadPromise;
  return scriptLoadPromise;
}

function initializeChatwoot(
  baseUrl: string,
  websiteToken: string,
  resolve: (value: { sdk: ChatwootSDK }) => void,
  reject: (reason?: Error) => void
) {
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
          } else {
            window.removeEventListener('chatwoot:ready', onReady);
            reject(new Error('Chatwoot SDK initialization timeout'));
          }
        }, 5000);
      }
    } catch (error) {
      console.error('[Chatwoot] Error running SDK:', error);
      reject(error instanceof Error ? error : new Error('Unknown error occurred'));
    }
  } else {
    reject(new Error('Chatwoot SDK script loaded but window.chatwootSDK is not defined.'));
  }
} 