'use client';

import { useEffect, useRef } from 'react';
import { CHATWOOT_CONFIG } from '@/lib/chatwoot';
import { ChatwootSDK, ChatwootSettings } from '@/types/chatwoot';
import { FloatingCustomerServiceButton } from '@/components/FloatingCustomerServiceButton';

declare global {
  interface Window {
    chatwootSettings?: ChatwootSettings;
    chatwootSDK?: ChatwootSDK;
    $chatwoot?: ChatwootSDK;
  }
}

export const ChatwootProvider = () => {
  const isLoaded = useRef(false);

  useEffect(() => {
    // 检查是否已经加载过，防止重复执行
    if (isLoaded.current || window.$chatwoot || window.chatwootSDK) {
      console.log('🔵 ChatwootProvider: Already loaded. Skipping.');
      return;
    }

    // 检查配置
    if (!CHATWOOT_CONFIG.websiteToken) {
      console.warn('🔵 ChatwootProvider: Website token is missing.');
      return;
    }
    if (!CHATWOOT_CONFIG.baseUrl) {
      console.warn('🔵 ChatwootProvider: Base URL is missing.');
      return;
    }

    console.log('🔵 ChatwootProvider: Initializing...');

    // 设置 Chatwoot 配置
    window.chatwootSettings = {
      hideMessageBubble: CHATWOOT_CONFIG.hideMessageBubble,
      position: CHATWOOT_CONFIG.position,
      locale: CHATWOOT_CONFIG.locale,
      type: CHATWOOT_CONFIG.type,
      launcherTitle: CHATWOOT_CONFIG.launcherTitle,
      showPopoutButton: CHATWOOT_CONFIG.showPopoutButton,
    };

    // 创建并加载脚本
    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    
    // 最终方案：直接从 public 目录加载本地脚本
    script.src = '/chatwoot-sdk.js';
    
    console.log('🔵 ChatwootProvider: Loading local script from:', script.src);
    
    script.onload = () => {
      console.log('🟢 ChatwootProvider: Script loaded successfully.');
      try {
        window.chatwootSDK?.run({
          websiteToken: CHATWOOT_CONFIG.websiteToken,
          baseUrl: CHATWOOT_CONFIG.baseUrl, // 这里的 baseUrl 仍然需要指向真实的 Chatwoot 服务器
        });
        console.log('🟢 ChatwootProvider: SDK initialized.');
        isLoaded.current = true; // 标记为已加载
      } catch (error) {
        console.error('🔴 ChatwootProvider: Failed to initialize SDK:', error);
      }
    };

    script.onerror = (error) => {
      console.error('🔴 ChatwootProvider: Failed to load script:', error);
    };

    document.head.appendChild(script);

    // 返回一个清理函数
    return () => {
      console.log('🟡 ChatwootProvider: Cleanup triggered.');
      // 在实际应用中，我们通常不希望在导航时卸载 Chatwoot
      // 但为了防止意外，可以添加清理逻辑
      if (script.parentNode) {
        // script.parentNode.removeChild(script); // 谨慎使用，可能导致重载问题
      }
    };
  }, []); // 空依赖数组确保只运行一次

  // 将浮动按钮也移到这里，以确保它和 Chatwoot 的生命周期一致
  return <FloatingCustomerServiceButton />;
}; 