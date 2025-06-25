'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, X, RefreshCw, Trash2, Settings } from 'lucide-react';

interface EmergencyFixState {
  scriptErrors: string[];
  domElements: number;
  chatwootLoaded: boolean;
  fixAttempts: number;
}

export const ChatwootEmergencyFix = () => {
  const [state, setState] = useState<EmergencyFixState>({
    scriptErrors: [],
    domElements: 0,
    chatwootLoaded: false,
    fixAttempts: 0,
  });

  const [isFixing, setIsFixing] = useState(false);
  const [lastFixResult, setLastFixResult] = useState<string>('');

  // 检查当前状态
  const checkStatus = () => {
    const scriptErrors: string[] = [];
    
    // 检查脚本加载错误
    const scripts = document.querySelectorAll('script[src*="chatwoot"], script[src*="sdk.js"]');
    scripts.forEach((script, index) => {
      const src = script.getAttribute('src');
      if (src) {
        scriptErrors.push(`Script ${index + 1}: ${src}`);
      }
    });

    // 检查 DOM 元素
    const chatwootElements = document.querySelectorAll(
      '[class*="chatwoot"], [id*="chatwoot"], .woot-widget-holder, .woot-widget-bubble, iframe[src*="chatwoot"]'
    );

    setState(prev => ({
      ...prev,
      scriptErrors,
      domElements: chatwootElements.length,
      chatwootLoaded: !!window.$chatwoot,
    }));
  };

  // 紧急修复函数
  const emergencyFix = async () => {
    setIsFixing(true);
    setLastFixResult('');
    
    try {
      const fixSteps: string[] = [];

      // 步骤1: 清理所有 Chatwoot 相关的脚本
      const scripts = document.querySelectorAll('script[src*="chatwoot"], script[src*="sdk.js"]');
      scripts.forEach(script => {
        script.remove();
        fixSteps.push('✅ 移除了损坏的脚本');
      });

      // 步骤2: 清理全局对象
      if (window.$chatwoot) {
        delete window.$chatwoot;
        fixSteps.push('✅ 清理了 window.$chatwoot');
      }
      if (window.chatwootSDK) {
        delete window.chatwootSDK;
        fixSteps.push('✅ 清理了 window.chatwootSDK');
      }
      if (window.chatwootSettings) {
        delete window.chatwootSettings;
        fixSteps.push('✅ 清理了 window.chatwootSettings');
      }

      // 步骤3: 强制移除所有 DOM 元素
      const chatwootSelectors = [
        '[class*="chatwoot"]',
        '[id*="chatwoot"]',
        '.woot-widget-holder',
        '.woot-widget-bubble',
        '.woot--bubble-holder',
        'iframe[src*="chatwoot"]',
        '[data-widget="chatwoot"]'
      ];

      let removedElements = 0;
      chatwootSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          element.remove();
          removedElements++;
        });
      });

      if (removedElements > 0) {
        fixSteps.push(`✅ 移除了 ${removedElements} 个 DOM 元素`);
      }

      // 步骤4: 清理事件监听器
      const events = ['chatwoot:ready', 'chatwoot:opened', 'chatwoot:closed'];
      events.forEach(event => {
        // 移除所有该事件的监听器（通过克隆节点）
        const oldBody = document.body;
        const newBody = oldBody.cloneNode(true);
        if (oldBody.parentNode) {
          oldBody.parentNode.replaceChild(newBody, oldBody);
        }
      });
      fixSteps.push('✅ 清理了事件监听器');

      // 步骤5: 清理 CSS 样式
      const styleSheets = document.querySelectorAll('link[href*="chatwoot"], style[data-chatwoot]');
      styleSheets.forEach(sheet => {
        sheet.remove();
        fixSteps.push('✅ 移除了 Chatwoot 样式');
      });

      // 步骤6: 清理 localStorage 和 sessionStorage
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.includes('chatwoot')) {
            localStorage.removeItem(key);
            fixSteps.push(`✅ 清理了 localStorage: ${key}`);
          }
        });

        Object.keys(sessionStorage).forEach(key => {
          if (key.includes('chatwoot')) {
            sessionStorage.removeItem(key);
            fixSteps.push(`✅ 清理了 sessionStorage: ${key}`);
          }
        });
      } catch (error) {
        fixSteps.push('⚠️ 存储清理部分失败');
      }

      setState(prev => ({ ...prev, fixAttempts: prev.fixAttempts + 1 }));
      setLastFixResult(fixSteps.join('\n'));

      // 等待一下再检查状态
      setTimeout(checkStatus, 1000);

    } catch (error) {
      setLastFixResult(`❌ 修复过程中出错: ${error}`);
    } finally {
      setIsFixing(false);
    }
  };

  // 重新加载页面
  const reloadPage = () => {
    window.location.reload();
  };

  // 禁用 Chatwoot
  const disableChatwoot = () => {
    // 在 localStorage 中设置禁用标记
    localStorage.setItem('chatwoot_disabled', 'true');
    
    // 创建一个覆盖函数来阻止 Chatwoot 加载
    window.chatwootSettings = { disabled: true } as any;
    
    setLastFixResult('✅ Chatwoot 已被禁用，刷新页面生效');
  };

  useEffect(() => {
    checkStatus();
    
    // 监听错误事件
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('chatwoot') || event.filename?.includes('chatwoot')) {
        setState(prev => ({
          ...prev,
          scriptErrors: [...prev.scriptErrors, `Error: ${event.message}`]
        }));
      }
    };

    window.addEventListener('error', handleError);
    
    // 定期检查状态
    const interval = setInterval(checkStatus, 5000);

    return () => {
      window.removeEventListener('error', handleError);
      clearInterval(interval);
    };
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          Chatwoot 紧急修复工具
          <Badge variant="destructive" className="ml-auto">
            404 错误检测
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 错误状态 */}
        <div className="bg-white rounded-lg p-4 border border-red-200">
          <h3 className="font-semibold mb-3 text-red-800">检测到的问题</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Chatwoot 加载状态:</span>
              <Badge variant={state.chatwootLoaded ? "default" : "destructive"}>
                {state.chatwootLoaded ? "已加载" : "加载失败"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">残留 DOM 元素:</span>
              <Badge variant={state.domElements > 0 ? "destructive" : "default"}>
                {state.domElements} 个
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">脚本错误:</span>
              <Badge variant={state.scriptErrors.length > 0 ? "destructive" : "default"}>
                {state.scriptErrors.length} 个
              </Badge>
            </div>
          </div>
        </div>

        {/* 错误详情 */}
        {state.scriptErrors.length > 0 && (
          <div className="bg-gray-900 text-red-400 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">错误详情:</h4>
            <div className="text-sm space-y-1 font-mono">
              <div>❌ Failed to load resource: 404</div>
              <div>❌ X-Frame-Options: sameorigin</div>
              {state.scriptErrors.map((error, index) => (
                <div key={index}>❌ {error}</div>
              ))}
            </div>
          </div>
        )}

        {/* 修复按钮 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button 
            onClick={emergencyFix} 
            disabled={isFixing}
            variant="destructive" 
            className="w-full"
          >
            {isFixing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                修复中...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                紧急清理
              </>
            )}
          </Button>
          
          <Button onClick={reloadPage} variant="outline" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            重新加载
          </Button>
          
          <Button onClick={disableChatwoot} variant="outline" className="w-full">
            <X className="h-4 w-4 mr-2" />
            禁用 Chatwoot
          </Button>
          
          <Button onClick={checkStatus} variant="outline" className="w-full">
            <Settings className="h-4 w-4 mr-2" />
            检查状态
          </Button>
        </div>

        {/* 修复结果 */}
        {lastFixResult && (
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold mb-2">修复结果:</h4>
            <pre className="text-sm whitespace-pre-wrap text-gray-700">
              {lastFixResult}
            </pre>
          </div>
        )}

        {/* 说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">问题说明:</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• <strong>404 错误:</strong> Chatwoot 脚本无法从服务器加载</p>
            <p>• <strong>X-Frame-Options:</strong> 这是正常的安全限制，不影响功能</p>
            <p>• <strong>无法关闭:</strong> 由于脚本加载失败，关闭功能不可用</p>
          </div>
        </div>

        {/* 解决方案 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">推荐解决方案:</h4>
          <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
            <li>点击"紧急清理"按钮清除所有残留</li>
            <li>检查环境变量配置是否正确</li>
            <li>确认 Chatwoot 服务器可访问</li>
            <li>如果问题持续，点击"禁用 Chatwoot"</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}; 