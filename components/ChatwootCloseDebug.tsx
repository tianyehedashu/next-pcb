'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, X, RefreshCw, Bug } from 'lucide-react';

interface ChatwootCloseDebugState {
  chatwootLoaded: boolean;
  chatwootOpen: boolean;
  toggleMethodExists: boolean;
  closeMethodExists: boolean;
  hideMethodExists: boolean;
  lastError: string | null;
  debugLogs: string[];
}

export const ChatwootCloseDebug = () => {
  const [state, setState] = useState<ChatwootCloseDebugState>({
    chatwootLoaded: false,
    chatwootOpen: false,
    toggleMethodExists: false,
    closeMethodExists: false,
    hideMethodExists: false,
    lastError: null,
    debugLogs: [],
  });

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setState(prev => ({
      ...prev,
      debugLogs: [...prev.debugLogs.slice(-9), `[${timestamp}] ${message}`]
    }));
  };

  const checkChatwootStatus = () => {
    try {
      const chatwootLoaded = !!window.$chatwoot;
      const chatwootOpen = chatwootLoaded && window.$chatwoot.isOpen ? window.$chatwoot.isOpen() : false;
      const toggleMethodExists = chatwootLoaded && typeof window.$chatwoot.toggle === 'function';
      const closeMethodExists = chatwootLoaded && typeof window.$chatwoot.close === 'function';
      const hideMethodExists = chatwootLoaded && typeof window.$chatwoot.hideWidget === 'function';

      setState(prev => ({
        ...prev,
        chatwootLoaded,
        chatwootOpen,
        toggleMethodExists,
        closeMethodExists,
        hideMethodExists,
        lastError: null,
      }));

      addLog(`Status check: Loaded=${chatwootLoaded}, Open=${chatwootOpen}`);
    } catch (error) {
      setState(prev => ({
        ...prev,
        lastError: String(error),
      }));
      addLog(`Error checking status: ${error}`);
    }
  };

  // 方法1: 使用 toggle('close')
  const tryToggleClose = () => {
    try {
      if (window.$chatwoot && typeof window.$chatwoot.toggle === 'function') {
        window.$chatwoot.toggle('close');
        addLog('✅ Called window.$chatwoot.toggle("close")');
        setTimeout(checkChatwootStatus, 500);
      } else {
        addLog('❌ toggle method not available');
      }
    } catch (error) {
      addLog(`❌ toggle('close') failed: ${error}`);
    }
  };

  // 方法2: 使用 close() 方法
  const tryDirectClose = () => {
    try {
      if (window.$chatwoot && typeof window.$chatwoot.close === 'function') {
        window.$chatwoot.close();
        addLog('✅ Called window.$chatwoot.close()');
        setTimeout(checkChatwootStatus, 500);
      } else {
        addLog('❌ close method not available');
      }
    } catch (error) {
      addLog(`❌ close() failed: ${error}`);
    }
  };

  // 方法3: 使用 hideWidget()
  const tryHideWidget = () => {
    try {
      if (window.$chatwoot && typeof window.$chatwoot.hideWidget === 'function') {
        window.$chatwoot.hideWidget();
        addLog('✅ Called window.$chatwoot.hideWidget()');
        setTimeout(checkChatwootStatus, 500);
      } else {
        addLog('❌ hideWidget method not available');
      }
    } catch (error) {
      addLog(`❌ hideWidget() failed: ${error}`);
    }
  };

  // 方法4: DOM 操作强制关闭
  const tryDOMClose = () => {
    try {
      // 查找 Chatwoot 相关的 DOM 元素
      const chatwootElements = [
        'div[data-widget="chatwoot"]',
        '.chatwoot-widget',
        '#chatwoot-widget',
        'iframe[src*="chatwoot"]',
        '.woot-widget-holder',
        '.woot-widget-bubble'
      ];

      let found = false;
      chatwootElements.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (element instanceof HTMLElement) {
            element.style.display = 'none';
            found = true;
            addLog(`✅ Hidden element: ${selector}`);
          }
        });
      });

      if (!found) {
        addLog('❌ No Chatwoot DOM elements found');
      }

      setTimeout(checkChatwootStatus, 500);
    } catch (error) {
      addLog(`❌ DOM close failed: ${error}`);
    }
  };

  // 方法5: 事件触发关闭
  const tryEventClose = () => {
    try {
      // 尝试触发关闭事件
      const closeEvent = new CustomEvent('chatwoot:close');
      window.dispatchEvent(closeEvent);
      addLog('✅ Dispatched chatwoot:close event');

      // 尝试点击关闭按钮
      const closeButtons = document.querySelectorAll('[data-testid="close-button"], .close-button, [aria-label*="close" i]');
      closeButtons.forEach((button, index) => {
        if (button instanceof HTMLElement) {
          button.click();
          addLog(`✅ Clicked close button ${index + 1}`);
        }
      });

      setTimeout(checkChatwootStatus, 500);
    } catch (error) {
      addLog(`❌ Event close failed: ${error}`);
    }
  };

  // 方法6: 重置 Chatwoot
  const tryReset = () => {
    try {
      if (window.$chatwoot && typeof window.$chatwoot.reset === 'function') {
        window.$chatwoot.reset();
        addLog('✅ Called window.$chatwoot.reset()');
        setTimeout(checkChatwootStatus, 1000);
      } else {
        addLog('❌ reset method not available');
      }
    } catch (error) {
      addLog(`❌ reset() failed: ${error}`);
    }
  };

  // 清除日志
  const clearLogs = () => {
    setState(prev => ({ ...prev, debugLogs: [] }));
  };

  useEffect(() => {
    checkChatwootStatus();
    
    // 定期检查状态
    const interval = setInterval(checkChatwootStatus, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: boolean, successText: string, failText: string) => {
    return (
      <Badge variant={status ? "default" : "destructive"} className="flex items-center gap-1">
        {status ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
        {status ? successText : failText}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Chatwoot 关闭问题调试器
          <Button
            variant="outline"
            size="sm"
            onClick={checkChatwootStatus}
            className="ml-auto"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            刷新状态
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 当前状态 */}
        <div>
          <h3 className="font-semibold mb-3">当前状态</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Chatwoot 已加载:</span>
              {getStatusBadge(state.chatwootLoaded, "是", "否")}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">聊天窗口打开:</span>
              {getStatusBadge(state.chatwootOpen, "是", "否")}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">toggle 方法:</span>
              {getStatusBadge(state.toggleMethodExists, "可用", "不可用")}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">close 方法:</span>
              {getStatusBadge(state.closeMethodExists, "可用", "不可用")}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">hideWidget 方法:</span>
              {getStatusBadge(state.hideMethodExists, "可用", "不可用")}
            </div>
          </div>
          
          {state.lastError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                <strong>错误:</strong> {state.lastError}
              </p>
            </div>
          )}
        </div>

        {/* 关闭方法测试 */}
        <div>
          <h3 className="font-semibold mb-3">尝试关闭方法</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button onClick={tryToggleClose} variant="outline" className="w-full">
              方法1: toggle('close')
            </Button>
            
            <Button onClick={tryDirectClose} variant="outline" className="w-full">
              方法2: close()
            </Button>
            
            <Button onClick={tryHideWidget} variant="outline" className="w-full">
              方法3: hideWidget()
            </Button>
            
            <Button onClick={tryDOMClose} variant="outline" className="w-full">
              方法4: DOM 隐藏
            </Button>
            
            <Button onClick={tryEventClose} variant="outline" className="w-full">
              方法5: 事件触发
            </Button>
            
            <Button onClick={tryReset} variant="destructive" className="w-full">
              方法6: 重置
            </Button>
          </div>
        </div>

        {/* 调试日志 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">调试日志</h3>
            <Button onClick={clearLogs} variant="outline" size="sm">
              清除日志
            </Button>
          </div>
          
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-60 overflow-y-auto">
            {state.debugLogs.length === 0 ? (
              <div className="text-gray-500">暂无日志...</div>
            ) : (
              state.debugLogs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 手动检查 */}
        <div>
          <h3 className="font-semibold mb-3">手动检查</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm mb-3">
              <strong>请在浏览器控制台中运行以下命令来手动检查:</strong>
            </p>
            <div className="bg-white p-3 rounded border font-mono text-sm space-y-2">
              <div>console.log('Chatwoot loaded:', !!window.$chatwoot);</div>
              <div>console.log('Chatwoot methods:', window.$chatwoot ? Object.keys(window.$chatwoot) : 'Not loaded');</div>
              <div>window.$chatwoot && window.$chatwoot.toggle('close');</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 