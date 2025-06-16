// lib/hooks/useChatwoot.ts
// 统一的 Chatwoot hook，提供向后兼容的 API

'use client';

import { useState, useEffect } from 'react';
import { useChatwoot as useNewChatwoot } from '@/app/components/ChatwootProvider';

export interface ChatwootUser {
  identifier: string;
  name?: string;
  email?: string;
  avatar_url?: string;
}

export interface ChatwootHookReturn {
  isLoaded: boolean;
  isOpen: boolean;
  isVisible: boolean;
  unreadCount: number;
  toggle: (state?: 'open' | 'close') => void;
  show: () => void;
  hide: () => void;
  setUser: (user: ChatwootUser) => void;
  setCustomAttributes: (attributes: Record<string, string | number>) => void;
  reset: () => void;
  sendMessage: (message: string) => void;
  isReady: () => boolean;
}

export function useChatwoot(): ChatwootHookReturn {
  const { sdk, isLoading, error } = useNewChatwoot();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const isLoaded = !!sdk && !isLoading && !error;

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;

    // Listen for Chatwoot events
    const handleChatwootOpen = () => setIsOpen(true);
    const handleChatwootClose = () => setIsOpen(false);
    const handleUnreadCount = (event: CustomEvent) => {
      setUnreadCount(event.detail?.unreadMessageCount || 0);
    };

    window.addEventListener('chatwoot:opened', handleChatwootOpen);
    window.addEventListener('chatwoot:closed', handleChatwootClose);
    window.addEventListener('chatwoot:on-unread-message-count-changed', handleUnreadCount as EventListener);

    return () => {
      window.removeEventListener('chatwoot:opened', handleChatwootOpen);
      window.removeEventListener('chatwoot:closed', handleChatwootClose);
      window.removeEventListener('chatwoot:on-unread-message-count-changed', handleUnreadCount as EventListener);
    };
  }, [isLoaded]);

  const toggle = (state?: 'open' | 'close') => {
    if (!isLoaded || typeof window === 'undefined' || !window.$chatwoot) return;
    
    if (state) {
      window.$chatwoot.toggle(state);
    } else {
      window.$chatwoot.toggle();
    }
  };

  const show = () => {
    if (typeof window !== 'undefined' && window.$chatwoot && typeof window.$chatwoot.toggleBubbleVisibility === 'function') {
      window.$chatwoot.toggleBubbleVisibility('show');
    }
    setIsVisible(true);
  };

  const hide = () => {
    if (typeof window !== 'undefined' && window.$chatwoot && typeof window.$chatwoot.toggleBubbleVisibility === 'function') {
      window.$chatwoot.toggleBubbleVisibility('hide');
    }
    setIsVisible(false);
  };

  const setUser = (user: ChatwootUser) => {
    if (!sdk) return;
    
    sdk.setUser(user.identifier, {
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
    });
  };

  const setCustomAttributes = (attributes: Record<string, string | number>) => {
    if (!sdk) return;
    
    sdk.setCustomAttributes(attributes);
  };

  const reset = () => {
    if (typeof window !== 'undefined' && window.$chatwoot?.reset) {
      window.$chatwoot.reset();
    }
    setIsOpen(false);
    setUnreadCount(0);
  };

  const sendMessage = (message: string) => {
    // This would require additional implementation
    console.warn('sendMessage is not implemented yet', message);
  };

  const isReady = () => isLoaded;

  return {
    isLoaded,
    isOpen,
    isVisible,
    unreadCount,
    toggle,
    show,
    hide,
    setUser,
    setCustomAttributes,
    reset,
    sendMessage,
    isReady,
  };
} 