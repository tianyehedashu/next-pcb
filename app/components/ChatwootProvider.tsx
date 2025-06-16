'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useRef } from 'react';
import { loadChatwootSdkLocal } from '@/lib/chatwoot-sdk-loader-local';
import { CHATWOOT_CONFIG } from '@/lib/constants/chatwoot';
import type { ChatwootSDK } from '@/types/chatwoot';
import { SmartCustomerServiceButton } from '@/components/custom-ui/SmartCustomerServiceButton';

interface ChatwootContextType {
  sdk: ChatwootSDK | null;
  isLoading: boolean;
  error: Error | null;
}

const ChatwootContext = createContext<ChatwootContextType | undefined>(undefined);

export function ChatwootProvider({ children }: { children: ReactNode }) {
  const [sdk, setSdk] = useState<ChatwootSDK | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const initializationRef = useRef<boolean>(false);

  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (initializationRef.current) {
      console.log('[ChatwootProvider] Skipping duplicate initialization');
      return;
    }
    
    initializationRef.current = true;
    
    const { websiteToken, baseUrl, ...settings } = CHATWOOT_CONFIG;
    
    if (!websiteToken || !baseUrl) {
      const msg = 'Chatwoot is not configured correctly. Check environment variables.';
      console.error(`[ChatwootProvider] ${msg}`);
      setError(new Error(msg));
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function init() {
      try {
        console.log('[ChatwootProvider] Initializing Chatwoot SDK from local file...');
        const { sdk: loadedSdk } = await loadChatwootSdkLocal(baseUrl, websiteToken, settings);
        if (isMounted) {
          console.log('[ChatwootProvider] Local SDK loaded successfully');
          setSdk(loadedSdk);
        }
      } catch (e) {
        if (isMounted) {
          console.error('[ChatwootProvider] Failed to load local SDK:', e);
          setError(e instanceof Error ? e : new Error('Failed to initialize Chatwoot SDK'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    // Add a small delay in development mode to avoid race conditions
    const isDev = process.env.NODE_ENV === 'development';
    const delay = isDev ? 100 : 0;
    
    const timeoutId = setTimeout(init, delay);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const contextValue = useMemo(() => ({
    sdk,
    isLoading,
    error,
  }), [sdk, isLoading, error]);

  // 只有在SDK加载完成且没有错误时才显示客服按钮
  const shouldShowButton = !!sdk && !isLoading && !error;

  return (
    <ChatwootContext.Provider value={contextValue}>
      {children}
      {/* 客服按钮只在Chatwoot完全初始化后显示 */}
      {shouldShowButton && <SmartCustomerServiceButton />}
    </ChatwootContext.Provider>
  );
}

export function useChatwoot() {
  const context = useContext(ChatwootContext);
  if (context === undefined) {
    throw new Error('useChatwoot must be used within a ChatwootProvider');
  }
  return context;
} 