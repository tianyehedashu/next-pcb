'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { CHATWOOT_CONFIG, validateConfig, performanceMonitor } from '@/lib/chatwoot-optimized';
import { ChatwootSDK, ChatwootSettings } from '@/types/chatwoot';

declare global {
  interface Window {
    chatwootSettings?: ChatwootSettings;
    chatwootSDK?: ChatwootSDK;
    $chatwoot?: ChatwootSDK;
  }
}

interface ChatwootState {
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  retryCount: number;
}

export const ChatwootWidgetOptimized = () => {
  const [state, setState] = useState<ChatwootState>({
    isLoading: false,
    isLoaded: false,
    error: null,
    retryCount: 0,
  });
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const scriptRef = useRef<HTMLScriptElement>();
  const isInitializedRef = useRef(false);

  // 日志函数
  const log = useCallback((level: 'error' | 'warn' | 'info' | 'debug', message: string, ...args: any[]) => {
    if (!CHATWOOT_CONFIG.debug.enabled) return;
    
    const logLevels = { error: 0, warn: 1, info: 2, debug: 3 };
    const configLevel = logLevels[CHATWOOT_CONFIG.debug.logLevel];
    const messageLevel = logLevels[level];
    
    if (messageLevel <= configLevel) {
      console[level](`[Chatwoot] ${message}`, ...args);
    }
  }, []);

  // 清理函数
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (scriptRef.current?.parentNode) {
      scriptRef.current.parentNode.removeChild(scriptRef.current);
    }
    
    // 清理全局对象
    if (window.chatwootSDK) delete window.chatwootSDK;
    if (window.$chatwoot) delete window.$chatwoot;
    if (window.chatwootSettings) delete window.chatwootSettings;
    
    isInitializedRef.current = false;
  }, []);

  // 重试逻辑
  const retryInitialization = useCallback(() => {
    if (state.retryCount >= CHATWOOT_CONFIG.performance.retryAttempts) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Maximum retry attempts reached' 
      }));
      return;
    }

    log('info', `Retrying initialization (attempt ${state.retryCount + 1})`);
    
    setTimeout(() => {
      setState(prev => ({ 
        ...prev, 
        retryCount: prev.retryCount + 1,
        error: null 
      }));
      initializeChatwoot();
    }, CHATWOOT_CONFIG.performance.retryDelay * (state.retryCount + 1));
  }, [state.retryCount, log]);

  // 初始化 Chatwoot
  const initializeChatwoot = useCallback(async () => {
    if (isInitializedRef.current) {
      log('debug', 'Chatwoot already initialized');
      return;
    }

    // 验证配置
    const validation = validateConfig();
    if (!validation.isValid) {
      const errorMessage = `Configuration invalid: ${validation.errors.join(', ')}`;
      log('error', errorMessage);
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    performanceMonitor.start();

    try {
      // 检查是否已经加载
      if (window.$chatwoot || window.chatwootSDK) {
        log('info', 'Chatwoot already loaded');
        setState(prev => ({ ...prev, isLoaded: true, isLoading: false }));
        performanceMonitor.end('Chatwoot initialization (already loaded)');
        return;
      }

      // 设置 Chatwoot 配置
      window.chatwootSettings = {
        hideMessageBubble: CHATWOOT_CONFIG.hideMessageBubble,
        position: CHATWOOT_CONFIG.position,
        locale: CHATWOOT_CONFIG.locale,
        type: CHATWOOT_CONFIG.type,
        launcherTitle: CHATWOOT_CONFIG.launcherTitle,
        showPopoutButton: CHATWOOT_CONFIG.showPopoutButton,
      };

      // 创建脚本元素
      const script = document.createElement('script');
      script.async = true;
      script.defer = true;
      
      const baseUrl = CHATWOOT_CONFIG.baseUrl.replace(/\/$/, '');
      script.src = `${baseUrl}/packs/js/sdk.js`;
      
      // 预加载支持
      if (CHATWOOT_CONFIG.performance.preload) {
        script.rel = 'preload';
      }
      
      scriptRef.current = script;
      
      log('info', 'Loading Chatwoot script', { url: script.src });

      // 设置超时
      timeoutRef.current = setTimeout(() => {
        log('error', 'Chatwoot script loading timeout');
        setState(prev => ({ ...prev, error: 'Script loading timeout', isLoading: false }));
        retryInitialization();
      }, CHATWOOT_CONFIG.performance.timeout);

      // 脚本加载成功
      script.onload = () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        log('info', 'Chatwoot script loaded successfully');
        
        // 延迟初始化以确保 SDK 完全加载
        setTimeout(() => {
          try {
            if (window.chatwootSDK) {
              window.chatwootSDK.run({
                websiteToken: CHATWOOT_CONFIG.websiteToken,
                baseUrl: baseUrl,
              });
              
              log('info', 'Chatwoot SDK initialized successfully');
              setState(prev => ({ ...prev, isLoaded: true, isLoading: false }));
              isInitializedRef.current = true;
              performanceMonitor.end('Chatwoot initialization');
              
            } else if (window.$chatwoot) {
              log('info', 'Chatwoot already available as $chatwoot');
              setState(prev => ({ ...prev, isLoaded: true, isLoading: false }));
              isInitializedRef.current = true;
              performanceMonitor.end('Chatwoot initialization');
              
            } else {
              throw new Error('Chatwoot SDK not available after script load');
            }
          } catch (error) {
            log('error', 'Failed to initialize Chatwoot SDK', error);
            setState(prev => ({ ...prev, error: String(error), isLoading: false }));
            retryInitialization();
          }
        }, 100);
      };

      // 脚本加载失败
      script.onerror = (error) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        log('error', 'Failed to load Chatwoot script', error);
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to load script', 
          isLoading: false 
        }));
        retryInitialization();
      };

      // 添加脚本到文档
      document.head.appendChild(script);

    } catch (error) {
      log('error', 'Unexpected error during initialization', error);
      setState(prev => ({ 
        ...prev, 
        error: String(error), 
        isLoading: false 
      }));
      retryInitialization();
    }
  }, [log, retryInitialization]);

  // 组件挂载时初始化
  useEffect(() => {
    // 确保在客户端环境
    if (typeof window === 'undefined') return;
    
    initializeChatwoot();
    
    return cleanup;
  }, [initializeChatwoot, cleanup]);

  // 开发环境下的状态显示
  if (CHATWOOT_CONFIG.debug.enabled && process.env.NODE_ENV === 'development') {
    return (
      <div style={{ 
        position: 'fixed', 
        top: 10, 
        right: 10, 
        background: 'rgba(0,0,0,0.8)', 
        color: 'white', 
        padding: '8px', 
        borderRadius: '4px', 
        fontSize: '12px',
        zIndex: 9999 
      }}>
        <div>Chatwoot Status:</div>
        <div>Loading: {state.isLoading ? 'Yes' : 'No'}</div>
        <div>Loaded: {state.isLoaded ? 'Yes' : 'No'}</div>
        <div>Retries: {state.retryCount}</div>
        {state.error && <div style={{ color: 'red' }}>Error: {state.error}</div>}
      </div>
    );
  }

  return null;
}; 