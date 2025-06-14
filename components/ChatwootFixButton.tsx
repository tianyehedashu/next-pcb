'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle } from 'lucide-react';

export const ChatwootFixButton = () => {
  const [isFixed, setIsFixed] = useState(false);

  const forceCloseChatwoot = () => {
    try {
      // 方法1: 尝试所有可能的关闭方法
      if (window.$chatwoot) {
        // 尝试标准关闭方法
        if (typeof window.$chatwoot.toggle === 'function') {
          window.$chatwoot.toggle('close');
        }
        // 尝试其他可能的方法（使用 any 类型避免 TypeScript 错误）
        const chatwootAny = window.$chatwoot as any;
        if (typeof chatwootAny.close === 'function') {
          chatwootAny.close();
        }
        if (typeof chatwootAny.hideWidget === 'function') {
          chatwootAny.hideWidget();
        }
        if (typeof chatwootAny.hide === 'function') {
          chatwootAny.hide();
        }
      }

      // 方法2: DOM 强制隐藏
      const chatwootSelectors = [
        'div[data-widget="chatwoot"]',
        '.chatwoot-widget',
        '#chatwoot-widget',
        'iframe[src*="chatwoot"]',
        '.woot-widget-holder',
        '.woot-widget-bubble',
        '[class*="chatwoot"]',
        '[id*="chatwoot"]',
        '.woot--bubble-holder',
        '.woot-widget-bubble',
        '.woot-widget-holder'
      ];

      chatwootSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (element instanceof HTMLElement) {
            element.style.display = 'none !important';
            element.style.visibility = 'hidden !important';
            element.style.opacity = '0 !important';
            element.style.zIndex = '-9999 !important';
          }
        });
      });

      // 方法3: 查找并点击关闭按钮
      const closeButtonSelectors = [
        '[data-testid="close-button"]',
        '.close-button',
        '[aria-label*="close" i]',
        '[title*="close" i]',
        'button[class*="close"]',
        '.woot-widget-bubble__close-button'
      ];

      closeButtonSelectors.forEach(selector => {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach(button => {
          if (button instanceof HTMLElement) {
            button.click();
          }
        });
      });

      // 方法4: 移除所有 Chatwoot 相关的 DOM 元素
      setTimeout(() => {
        chatwootSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            element.remove();
          });
        });
      }, 100);

      setIsFixed(true);
      
      // 3秒后重置状态
      setTimeout(() => {
        setIsFixed(false);
      }, 3000);

      console.log('🔧 Chatwoot 强制关闭完成');
      
    } catch (error) {
      console.error('强制关闭 Chatwoot 时出错:', error);
    }
  };

  return (
    <Button
      onClick={forceCloseChatwoot}
      variant={isFixed ? "default" : "destructive"}
      size="sm"
      className="fixed top-4 right-4 z-[9999] shadow-lg"
    >
      {isFixed ? (
        <>
          <X className="h-4 w-4 mr-2" />
          已修复
        </>
      ) : (
        <>
          <AlertTriangle className="h-4 w-4 mr-2" />
          强制关闭聊天
        </>
      )}
    </Button>
  );
}; 