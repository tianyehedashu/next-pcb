'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Search, RefreshCw, Copy } from 'lucide-react';

interface DebugInfo {
  currentScripts: Array<{
    src: string;
    loaded: boolean;
    error?: string;
  }>;
  iframes: Array<{
    src: string;
    origin: string;
  }>;
  globalObjects: {
    chatwoot: boolean;
    chatwootSDK: boolean;
    chatwootSettings: boolean;
  };
  networkRequests: string[];
  consoleErrors: string[];
  possibleCause: string;
  solution: string;
}

export const ChatwootDebugTool = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    currentScripts: [],
    iframes: [],
    globalObjects: {
      chatwoot: false,
      chatwootSDK: false,
      chatwootSettings: false,
    },
    networkRequests: [],
    consoleErrors: [],
    possibleCause: '',
    solution: '',
  });

  const [isDebugging, setIsDebugging] = useState(false);

  // 拦截控制台错误
  useEffect(() => {
    const originalError = console.error;
    const errors: string[] = [];

    console.error = (...args) => {
      const errorMsg = args.join(' ');
      if (errorMsg.includes('chatwoot') || errorMsg.includes('X-Frame-Options')) {
        errors.push(errorMsg);
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
      setDebugInfo(prev => ({ ...prev, consoleErrors: errors }));
    };
  }, []);

  const runDiagnosis = () => {
    setIsDebugging(true);
    
    setTimeout(() => {
      // 检查当前脚本
      const scripts = Array.from(document.querySelectorAll('script')).filter(script => {
        const src = script.getAttribute('src');
        return src && (src.includes('chatwoot') || src.includes('sdk.js'));
      });

      const currentScripts = scripts.map(script => ({
        src: script.getAttribute('src') || '',
        loaded: script.readyState === 'complete' || !script.readyState,
        error: script.onerror ? 'Load error' : undefined,
      }));

      // 检查 iframe
      const iframes = Array.from(document.querySelectorAll('iframe')).map(iframe => ({
        src: iframe.getAttribute('src') || '',
        origin: new URL(iframe.src || 'about:blank').origin,
      }));

      // 检查全局对象
      const globalObjects = {
        chatwoot: !!window.$chatwoot,
        chatwootSDK: !!window.chatwootSDK,
        chatwootSettings: !!window.chatwootSettings,
      };

      // 分析可能的原因
      let possibleCause = '';
      let solution = '';

      // 检查是否有错误的 iframe 加载
      const wrongIframes = iframes.filter(iframe => 
        iframe.src.includes('app.chatwoot.com') && 
        !iframe.src.includes('/packs/js/sdk.js')
      );

      if (wrongIframes.length > 0) {
        possibleCause = '❌ 发现错误的 iframe 加载 - 正在尝试加载 Chatwoot 主页面而不是 SDK';
        solution = '需要修复代码，确保只加载 SDK 脚本，不要创建指向主页面的 iframe';
      } else if (currentScripts.length === 0) {
        possibleCause = '❌ 没有找到 Chatwoot 脚本 - SDK 可能没有正确加载';
        solution = '检查环境变量配置，确保 Chatwoot 组件被正确引入';
      } else if (currentScripts.some(s => s.error)) {
        possibleCause = '❌ Chatwoot 脚本加载失败 - 网络或配置问题';
        solution = '检查网络连接和 Base URL 配置';
      } else if (!globalObjects.chatwoot && !globalObjects.chatwootSDK) {
        possibleCause = '⚠️ Chatwoot 脚本已加载但未初始化 - 可能是 Token 或配置问题';
        solution = '检查 Website Token 是否正确，查看浏览器控制台的详细错误';
      } else {
        possibleCause = '✅ 基础配置看起来正常 - X-Frame-Options 错误可能是误报';
        solution = 'X-Frame-Options 是正常的安全限制，如果聊天功能正常工作，可以忽略此错误';
      }

      setDebugInfo({
        currentScripts,
        iframes,
        globalObjects,
        networkRequests: [], // 这里可以扩展网络请求监控
        consoleErrors: debugInfo.consoleErrors,
        possibleCause,
        solution,
      });

      setIsDebugging(false);
    }, 1000);
  };

  const copyDebugInfo = () => {
    const info = `
Chatwoot Debug Report
====================

Scripts:
${debugInfo.currentScripts.map(s => `- ${s.src} (${s.loaded ? 'loaded' : 'loading'}${s.error ? ', error' : ''})`).join('\n')}

IFrames:
${debugInfo.iframes.map(i => `- ${i.src} (origin: ${i.origin})`).join('\n')}

Global Objects:
- window.$chatwoot: ${debugInfo.globalObjects.chatwoot}
- window.chatwootSDK: ${debugInfo.globalObjects.chatwootSDK}
- window.chatwootSettings: ${debugInfo.globalObjects.chatwootSettings}

Console Errors:
${debugInfo.consoleErrors.join('\n')}

Analysis:
${debugInfo.possibleCause}

Solution:
${debugInfo.solution}
    `;

    navigator.clipboard.writeText(info);
    alert('调试信息已复制到剪贴板！');
  };

  const clearChatwoot = () => {
    // 清理所有 Chatwoot 相关元素
    const elements = document.querySelectorAll(`
      script[src*="chatwoot"],
      script[src*="sdk.js"],
      iframe[src*="chatwoot"],
      [class*="chatwoot"],
      [id*="chatwoot"],
      .woot-widget-holder,
      .woot-widget-bubble
    `);
    
    elements.forEach(el => el.remove());

    // 清理全局对象
    if (window.$chatwoot) delete window.$chatwoot;
    if (window.chatwootSDK) delete window.chatwootSDK;
    if (window.chatwootSettings) delete window.chatwootSettings;

    console.log('🧹 已清理所有 Chatwoot 元素');
    
    // 重新运行诊断
    setTimeout(runDiagnosis, 500);
  };

  useEffect(() => {
    runDiagnosis();
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Chatwoot X-Frame-Options 错误调试
          <Button
            variant="outline"
            size="sm"
            onClick={runDiagnosis}
            disabled={isDebugging}
            className="ml-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isDebugging ? 'animate-spin' : ''}`} />
            {isDebugging ? '诊断中...' : '重新诊断'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 问题分析 */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-2">问题分析</h3>
          <p className="text-sm text-red-700 mb-2">{debugInfo.possibleCause}</p>
          <p className="text-sm text-red-600"><strong>解决方案:</strong> {debugInfo.solution}</p>
        </div>

        {/* 当前脚本 */}
        <div>
          <h3 className="font-semibold mb-3">当前加载的脚本</h3>
          {debugInfo.currentScripts.length > 0 ? (
            <div className="space-y-2">
              {debugInfo.currentScripts.map((script, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <code className="text-sm flex-1">{script.src}</code>
                  <div className="flex gap-2">
                    <Badge variant={script.loaded ? "default" : "secondary"}>
                      {script.loaded ? '已加载' : '加载中'}
                    </Badge>
                    {script.error && (
                      <Badge variant="destructive">错误</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">没有找到 Chatwoot 相关脚本</p>
          )}
        </div>

        {/* IFrame 检查 */}
        <div>
          <h3 className="font-semibold mb-3">IFrame 检查</h3>
          {debugInfo.iframes.length > 0 ? (
            <div className="space-y-2">
              {debugInfo.iframes.map((iframe, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <code className="text-sm flex-1">{iframe.src}</code>
                  <Badge variant={iframe.src.includes('app.chatwoot.com') && !iframe.src.includes('sdk.js') ? "destructive" : "default"}>
                    {iframe.origin}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">没有找到相关 iframe</p>
          )}
        </div>

        {/* 全局对象状态 */}
        <div>
          <h3 className="font-semibold mb-3">全局对象状态</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">$chatwoot:</span>
              <Badge variant={debugInfo.globalObjects.chatwoot ? "default" : "secondary"}>
                {debugInfo.globalObjects.chatwoot ? '存在' : '不存在'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">chatwootSDK:</span>
              <Badge variant={debugInfo.globalObjects.chatwootSDK ? "default" : "secondary"}>
                {debugInfo.globalObjects.chatwootSDK ? '存在' : '不存在'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">chatwootSettings:</span>
              <Badge variant={debugInfo.globalObjects.chatwootSettings ? "default" : "secondary"}>
                {debugInfo.globalObjects.chatwootSettings ? '存在' : '不存在'}
              </Badge>
            </div>
          </div>
        </div>

        {/* 控制台错误 */}
        {debugInfo.consoleErrors.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">相关控制台错误</h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-40 overflow-y-auto">
              {debugInfo.consoleErrors.map((error, index) => (
                <div key={index} className="mb-1">{error}</div>
              ))}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={copyDebugInfo} variant="outline">
            <Copy className="h-4 w-4 mr-2" />
            复制调试信息
          </Button>
          
          <Button onClick={clearChatwoot} variant="outline">
            <AlertTriangle className="h-4 w-4 mr-2" />
            清理并重置
          </Button>
        </div>

        {/* 说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">关于 X-Frame-Options 错误:</h4>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li><strong>正常情况:</strong> 如果只是看到这个错误但聊天功能正常，可以忽略</li>
            <li><strong>异常情况:</strong> 如果代码试图在 iframe 中加载 Chatwoot 主页面，需要修复</li>
            <li><strong>安全限制:</strong> Chatwoot 设置此头部是为了防止点击劫持攻击</li>
            <li><strong>正确做法:</strong> 只加载 SDK 脚本，不要创建指向主页面的 iframe</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}; 