import { useCallback, useEffect, useState } from 'react';
import { CHATWOOT_CONFIG } from '@/lib/chatwoot';

export const useChatwoot = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback((state?: 'open' | 'close') => {
    if (window.$chatwoot) {
      if (state === 'open') {
        window.$chatwoot.toggle('open');
        setIsOpen(true);
      } else if (state === 'close') {
        window.$chatwoot.toggle('close');
        setIsOpen(false);
      } else {
        window.$chatwoot.toggle();
        setIsOpen(!isOpen);
      }
    }
  }, [isOpen]);

  const setUser = useCallback((user: {
    identifier?: string;
    name?: string;
    email?: string;
    avatar_url?: string;
    phone_number?: string;
  }) => {
    if (window.$chatwoot) {
      window.$chatwoot.setUser(user);
    }
  }, []);

  const setCustomAttributes = useCallback((attributes: Record<string, any>) => {
    if (window.$chatwoot) {
      window.$chatwoot.setCustomAttributes(attributes);
    }
  }, []);

  const setLocale = useCallback((locale: string) => {
    if (window.$chatwoot) {
      window.$chatwoot.setLocale(locale);
    }
  }, []);

  const reset = useCallback(() => {
    if (window.$chatwoot) {
      window.$chatwoot.reset();
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    const checkChatwootLoaded = () => {
      if (window.$chatwoot) {
        setIsLoaded(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkChatwootLoaded()) {
      return;
    }

    // Set up interval to check periodically
    const interval = setInterval(() => {
      if (checkChatwootLoaded()) {
        clearInterval(interval);
      }
    }, 500);

    // Clean up after 15 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 15000);

    // Listen for Chatwoot events
    const handleChatwootReady = () => {
      setIsLoaded(true);
    };

    const handleChatwootOpen = () => {
      setIsOpen(true);
    };

    const handleChatwootClose = () => {
      setIsOpen(false);
    };

    // Add event listeners
    window.addEventListener('chatwoot:ready', handleChatwootReady);
    window.addEventListener('chatwoot:opened', handleChatwootOpen);
    window.addEventListener('chatwoot:closed', handleChatwootClose);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      
      // Clean up event listeners
      window.removeEventListener('chatwoot:ready', handleChatwootReady);
      window.removeEventListener('chatwoot:opened', handleChatwootOpen);
      window.removeEventListener('chatwoot:closed', handleChatwootClose);
    };
  }, []);

  return {
    isLoaded,
    isOpen,
    toggle,
    setUser,
    setCustomAttributes,
    setLocale,
    reset,
  };
}; 