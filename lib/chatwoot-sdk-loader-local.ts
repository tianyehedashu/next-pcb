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
 * Loads the Chatwoot SDK from local file (no CORS issues)
 * @param {string} baseUrl - The base URL of your Chatwoot installation.
 * @param {string} websiteToken - The website token for your Chatwoot inbox.
 * @param {ChatwootSettings} settings - Additional Chatwoot settings.
 * @returns {Promise<{ sdk: ChatwootSDK }>} A promise that resolves with the Chatwoot SDK object.
 */
export function loadChatwootSdkLocal(
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
      console.log('[Chatwoot Local] SDK already available, reusing existing instance');
      resolve({ sdk: window.$chatwoot });
      return;
    }

    // Set global settings BEFORE loading/running the script
    if (settings) {
      console.log('[Chatwoot Local] Setting window.chatwootSettings:', settings);
      window.chatwootSettings = settings;
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector('script[src*="chatwoot/sdk.js"]');
    if (existingScript && window.chatwootSDK) {
      console.log('[Chatwoot Local] Local script already loaded, initializing...');
      initializeChatwoot(baseUrl, websiteToken, resolve, reject);
      return;
    }

    // Load from local file
    const script = document.createElement('script');
    const localSdkUrl = '/chatwoot/sdk.js'; // 从 public 目录加载
    
    script.src = localSdkUrl;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('[Chatwoot Local] SDK script loaded successfully from local file');
      initializeChatwoot(baseUrl, websiteToken, resolve, reject);
    };

    script.onerror = () => {
      console.error('[Chatwoot Local] Failed to load local SDK script');
      scriptLoadPromise = null;
      window.chatwootLoadPromise = undefined;
      reject(new Error(`Failed to load Chatwoot SDK from local file: ${localSdkUrl}`));
    };

    console.log('[Chatwoot Local] Loading SDK script from local file:', localSdkUrl);
    document.body.appendChild(script);
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
          console.log('[Chatwoot Local] SDK ready and available');
          resolve({ sdk: window.$chatwoot });
        } else {
          reject(new Error('Chatwoot SDK loaded but $chatwoot is not available.'));
        }
        window.removeEventListener('chatwoot:ready', onReady);
      };
      
      // Check if $chatwoot is already available (sometimes it's immediate)
      if (window.$chatwoot) {
        console.log('[Chatwoot Local] SDK ready immediately');
        resolve({ sdk: window.$chatwoot });
      } else {
        window.addEventListener('chatwoot:ready', onReady);
        
        // Fallback timeout in case the ready event doesn't fire
        setTimeout(() => {
          if (window.$chatwoot) {
            console.log('[Chatwoot Local] SDK ready (fallback check)');
            window.removeEventListener('chatwoot:ready', onReady);
            resolve({ sdk: window.$chatwoot });
          } else {
            window.removeEventListener('chatwoot:ready', onReady);
            reject(new Error('Chatwoot SDK initialization timeout'));
          }
        }, 5000);
      }
    } catch (error) {
      console.error('[Chatwoot Local] Error running SDK:', error);
      reject(error instanceof Error ? error : new Error('Unknown error occurred'));
    }
  } else {
    reject(new Error('Chatwoot SDK script loaded but window.chatwootSDK is not defined.'));
  }
} 