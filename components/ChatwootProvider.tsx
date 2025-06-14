'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ChatwootWidgetOptimized } from './ChatwootWidgetOptimized';
import { useChatwootOptimized } from '@/lib/hooks/useChatwootOptimized';

interface ChatwootContextValue {
  isLoaded: boolean;
  isOpen: boolean;
  isVisible: boolean;
  unreadCount: number;
  toggle: (state?: 'open' | 'close') => void;
  show: () => void;
  hide: () => void;
  setUser: (user: any) => void;
  reset: () => void;
  sendMessage: (message: string) => void;
  isReady: () => boolean;
}

const ChatwootContext = createContext<ChatwootContextValue | null>(null);

interface ChatwootProviderProps {
  children: ReactNode;
  enableWidget?: boolean;
  autoLoad?: boolean;
}

export const ChatwootProvider: React.FC<ChatwootProviderProps> = ({
  children,
  enableWidget = true,
  autoLoad = true,
}) => {
  const chatwoot = useChatwootOptimized();
  const [isClient, setIsClient] = useState(false);

  // 确保在客户端环境
  useEffect(() => {
    setIsClient(true);
  }, []);

  const contextValue: ChatwootContextValue = {
    isLoaded: chatwoot.isLoaded,
    isOpen: chatwoot.isOpen,
    isVisible: chatwoot.isVisible,
    unreadCount: chatwoot.unreadCount,
    toggle: chatwoot.toggle,
    show: chatwoot.show,
    hide: chatwoot.hide,
    setUser: chatwoot.setUser,
    reset: chatwoot.reset,
    sendMessage: chatwoot.sendMessage,
    isReady: chatwoot.isReady,
  };

  return (
    <ChatwootContext.Provider value={contextValue}>
      {children}
      {isClient && enableWidget && autoLoad && <ChatwootWidgetOptimized />}
    </ChatwootContext.Provider>
  );
};

// Hook for using Chatwoot context
export const useChatwoot = () => {
  const context = useContext(ChatwootContext);
  if (!context) {
    throw new Error('useChatwoot must be used within a ChatwootProvider');
  }
  return context;
};

// HOC for components that need Chatwoot
export const withChatwoot = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent = (props: P) => (
    <ChatwootProvider>
      <Component {...props} />
    </ChatwootProvider>
  );
  
  WrappedComponent.displayName = `withChatwoot(${Component.displayName || Component.name})`;
  return WrappedComponent;
}; 