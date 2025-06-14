import { useCallback, useEffect, useState, useRef } from 'react';
import { CHATWOOT_CONFIG } from '@/lib/chatwoot-optimized';

interface ChatwootUser {
  identifier?: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  phone_number?: string;
}

interface ChatwootState {
  isLoaded: boolean;
  isOpen: boolean;
  isVisible: boolean;
  unreadCount: number;
  lastActivity: number;
}

interface UseChatwootReturn extends ChatwootState {
  // 基础控制
  toggle: (state?: 'open' | 'close') => void;
  show: () => void;
  hide: () => void;
  
  // 用户管理
  setUser: (user: ChatwootUser) => void;
  clearUser: () => void;
  
  // 属性管理
  setCustomAttributes: (attributes: Record<string, any>) => void;
  clearCustomAttributes: () => void;
  
  // 国际化
  setLocale: (locale: string) => void;
  
  // 会话管理
  reset: () => void;
  endSession: () => void;
  
  // 高级功能
  sendMessage: (message: string) => void;
  setLabel: (label: string) => void;
  removeLabel: (label: string) => void;
  
  // 状态查询
  isReady: () => boolean;
  getVisitorId: () => string | null;
}

export const useChatwootOptimized = (): UseChatwootReturn => {
  const [state, setState] = useState<ChatwootState>({
    isLoaded: false,
    isOpen: false,
    isVisible: true,
    unreadCount: 0,
    lastActivity: Date.now(),
  });

  const eventListenersRef = useRef<Set<() => void>>(new Set());
  const userDataRef = useRef<ChatwootUser | null>(null);

  // 安全执行 Chatwoot 方法
  const safeExecute = useCallback(<T extends any[]>(
    method: string,
    ...args: T
  ): boolean => {
    if (window.$chatwoot && typeof window.$chatwoot[method as keyof typeof window.$chatwoot] === 'function') {
      try {
        (window.$chatwoot[method as keyof typeof window.$chatwoot] as Function)(...args);
        setState(prev => ({ ...prev, lastActivity: Date.now() }));
        return true;
      } catch (error) {
        if (CHATWOOT_CONFIG.debug.enabled) {
          console.error(`[Chatwoot] Error executing ${method}:`, error);
        }
        return false;
      }
    }
    
    if (CHATWOOT_CONFIG.debug.enabled) {
      console.warn(`[Chatwoot] Method ${method} not available`);
    }
    return false;
  }, []);

  // 基础控制方法
  const toggle = useCallback((targetState?: 'open' | 'close') => {
    if (targetState === 'open') {
      safeExecute('toggle', 'open');
      setState(prev => ({ ...prev, isOpen: true, unreadCount: 0 }));
    } else if (targetState === 'close') {
      safeExecute('toggle', 'close');
      setState(prev => ({ ...prev, isOpen: false }));
    } else {
      safeExecute('toggle');
      setState(prev => ({ ...prev, isOpen: !prev.isOpen, unreadCount: prev.isOpen ? prev.unreadCount : 0 }));
    }
  }, [safeExecute]);

  const show = useCallback(() => {
    safeExecute('showWidget');
    setState(prev => ({ ...prev, isVisible: true }));
  }, [safeExecute]);

  const hide = useCallback(() => {
    safeExecute('hideWidget');
    setState(prev => ({ ...prev, isVisible: false }));
  }, [safeExecute]);

  // 用户管理
  const setUser = useCallback((user: ChatwootUser) => {
    if (safeExecute('setUser', user)) {
      userDataRef.current = user;
    }
  }, [safeExecute]);

  const clearUser = useCallback(() => {
    if (safeExecute('reset')) {
      userDataRef.current = null;
      setState(prev => ({ ...prev, isOpen: false, unreadCount: 0 }));
    }
  }, [safeExecute]);

  // 属性管理
  const setCustomAttributes = useCallback((attributes: Record<string, any>) => {
    safeExecute('setCustomAttributes', attributes);
  }, [safeExecute]);

  const clearCustomAttributes = useCallback(() => {
    safeExecute('deleteCustomAttribute');
  }, [safeExecute]);

  // 国际化
  const setLocale = useCallback((locale: string) => {
    safeExecute('setLocale', locale);
  }, [safeExecute]);

  // 会话管理
  const reset = useCallback(() => {
    if (safeExecute('reset')) {
      userDataRef.current = null;
      setState(prev => ({ 
        ...prev, 
        isOpen: false, 
        unreadCount: 0,
        lastActivity: Date.now()
      }));
    }
  }, [safeExecute]);

  const endSession = useCallback(() => {
    safeExecute('endConversation');
    setState(prev => ({ ...prev, isOpen: false, unreadCount: 0 }));
  }, [safeExecute]);

  // 高级功能
  const sendMessage = useCallback((message: string) => {
    if (message.trim()) {
      safeExecute('sendMessage', message);
    }
  }, [safeExecute]);

  const setLabel = useCallback((label: string) => {
    safeExecute('setLabel', label);
  }, [safeExecute]);

  const removeLabel = useCallback((label: string) => {
    safeExecute('removeLabel', label);
  }, [safeExecute]);

  // 状态查询
  const isReady = useCallback((): boolean => {
    return !!window.$chatwoot;
  }, []);

  const getVisitorId = useCallback((): string | null => {
    if (window.$chatwoot && window.$chatwoot.getVisitorId) {
      return window.$chatwoot.getVisitorId();
    }
    return null;
  }, []);

  // 事件监听器设置
  useEffect(() => {
    const checkChatwootLoaded = () => {
      if (window.$chatwoot && !state.isLoaded) {
        setState(prev => ({ ...prev, isLoaded: true }));
        
        // 如果有缓存的用户数据，重新设置
        if (userDataRef.current) {
          setUser(userDataRef.current);
        }
        
        return true;
      }
      return false;
    };

    // 立即检查
    if (checkChatwootLoaded()) {
      return;
    }

    // 定期检查
    const interval = setInterval(() => {
      if (checkChatwootLoaded()) {
        clearInterval(interval);
      }
    }, 500);

    // 超时清理
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (CHATWOOT_CONFIG.debug.enabled) {
        console.warn('[Chatwoot] Loading timeout - widget may not be available');
      }
    }, 15000);

    // 事件监听器
    const handleChatwootReady = () => {
      setState(prev => ({ ...prev, isLoaded: true }));
    };

    const handleChatwootOpen = () => {
      setState(prev => ({ ...prev, isOpen: true, unreadCount: 0 }));
    };

    const handleChatwootClose = () => {
      setState(prev => ({ ...prev, isOpen: false }));
    };

    const handleUnreadCountChanged = (event: CustomEvent) => {
      setState(prev => ({ ...prev, unreadCount: event.detail.count || 0 }));
    };

    // 添加事件监听器
    const addEventListener = (event: string, handler: EventListener) => {
      window.addEventListener(event, handler);
      const cleanup = () => window.removeEventListener(event, handler);
      eventListenersRef.current.add(cleanup);
      return cleanup;
    };

    addEventListener('chatwoot:ready', handleChatwootReady);
    addEventListener('chatwoot:opened', handleChatwootOpen);
    addEventListener('chatwoot:closed', handleChatwootClose);
    addEventListener('chatwoot:unread-count-changed', handleUnreadCountChanged as EventListener);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      
      // 清理所有事件监听器
      eventListenersRef.current.forEach(cleanup => cleanup());
      eventListenersRef.current.clear();
    };
  }, [state.isLoaded, setUser]);

  return {
    ...state,
    toggle,
    show,
    hide,
    setUser,
    clearUser,
    setCustomAttributes,
    clearCustomAttributes,
    setLocale,
    reset,
    endSession,
    sendMessage,
    setLabel,
    removeLabel,
    isReady,
    getVisitorId,
  };
}; 