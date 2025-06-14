'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Trash2, Search, RefreshCw } from 'lucide-react';

interface IframeInfo {
  element: HTMLIFrameElement;
  src: string;
  id: string;
  className: string;
  parentInfo: string;
  isProblematic: boolean;
}

export const ChatwootIframeCleaner = () => {
  const [iframes, setIframes] = useState<IframeInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string>('');

  const scanForIframes = () => {
    setIsScanning(true);
    setCleanupResult('');

    setTimeout(() => {
      // 查找所有 iframe
      const allIframes = Array.from(document.querySelectorAll('iframe'));
      
      const iframeInfos: IframeInfo[] = allIframes.map((iframe, index) => {
        const src = iframe.getAttribute('src') || iframe.src || '';
        const id = iframe.id || `iframe-${index}`;
        const className = iframe.className || '';
        const parentInfo = iframe.parentElement?.tagName || 'unknown';
        
        // 判断是否是有问题的 iframe
        const isProblematic = 
          src.includes('app.chatwoot.com') && !src.includes('/packs/js/sdk.js') ||
          src.includes('chatwoot') && !src.includes('sdk.js') ||
          className.includes('chatwoot') ||
          id.includes('chatwoot');

        return {
          element: iframe,
          src,
          id,
          className,
          parentInfo,
          isProblematic,
        };
      });

      setIframes(iframeInfos);
      setIsScanning(false);

      console.log('🔍 扫描结果:', {
        总数: iframeInfos.length,
        有问题的: iframeInfos.filter(i => i.isProblematic).length,
        详情: iframeInfos
      });
    }, 500);
  };

  const cleanupProblematicIframes = () => {
    const problematicIframes = iframes.filter(i => i.isProblematic);
    const results: string[] = [];

    problematicIframes.forEach((iframeInfo, index) => {
      try {
        // 记录要删除的 iframe 信息
        results.push(`删除 iframe ${index + 1}:`);
        results.push(`  - src: ${iframeInfo.src}`);
        results.push(`  - id: ${iframeInfo.id}`);
        results.push(`  - class: ${iframeInfo.className}`);
        results.push(`  - parent: ${iframeInfo.parentInfo}`);
        
        // 删除 iframe
        iframeInfo.element.remove();
        results.push(`  ✅ 已删除`);
      } catch (error) {
        results.push(`  ❌ 删除失败: ${error}`);
      }
      results.push('');
    });

    // 额外清理：使用选择器查找可能遗漏的元素
    const additionalSelectors = [
      'iframe[src*="chatwoot"]',
      'iframe[src*="app.chatwoot.com"]',
      'iframe[class*="chatwoot"]',
      'iframe[id*="chatwoot"]',
      '.woot-widget-holder iframe',
      '.woot-widget-bubble iframe',
    ];

    additionalSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        results.push(`通过选择器 "${selector}" 找到 ${elements.length} 个元素:`);
        elements.forEach((el, index) => {
          const src = el.getAttribute('src') || '';
          results.push(`  - 元素 ${index + 1}: ${src}`);
          el.remove();
          results.push(`  ✅ 已删除`);
        });
        results.push('');
      }
    });

    if (results.length === 0) {
      results.push('✅ 没有找到需要清理的 iframe');
    } else {
      results.push('🧹 清理完成！');
    }

    setCleanupResult(results.join('\n'));
    
    // 重新扫描
    setTimeout(scanForIframes, 1000);
  };

  const cleanupAllChatwoot = () => {
    const results: string[] = [];
    
    // 清理所有可能的 Chatwoot 元素
    const selectors = [
      'script[src*="chatwoot"]',
      'script[src*="sdk.js"]',
      'iframe[src*="chatwoot"]',
      'iframe[class*="chatwoot"]',
      'iframe[id*="chatwoot"]',
      '[class*="chatwoot"]',
      '[id*="chatwoot"]',
      '.woot-widget-holder',
      '.woot-widget-bubble',
      '.woot-widget-wrapper',
      '.woot--bubble-holder',
      '.woot-widget--without-bubble',
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        results.push(`清理 "${selector}": ${elements.length} 个元素`);
        elements.forEach(el => el.remove());
      }
    });

    // 清理全局对象
    const globalObjects = ['$chatwoot', 'chatwootSDK', 'chatwootSettings'];
    globalObjects.forEach(obj => {
      if ((window as any)[obj]) {
        delete (window as any)[obj];
        results.push(`清理全局对象: ${obj}`);
      }
    });

    if (results.length === 0) {
      results.push('没有找到需要清理的元素');
    } else {
      results.push('');
      results.push('🧹 完全清理完成！');
      results.push('建议刷新页面以重新加载正确的 Chatwoot 配置');
    }

    setCleanupResult(results.join('\n'));
    
    // 重新扫描
    setTimeout(scanForIframes, 1000);
  };

  const forceReload = () => {
    cleanupAllChatwoot();
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  useEffect(() => {
    scanForIframes();
  }, []);

  const problematicCount = iframes.filter(i => i.isProblematic).length;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Chatwoot IFrame 清理工具
          <Button
            variant="outline"
            size="sm"
            onClick={scanForIframes}
            disabled={isScanning}
            className="ml-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? '扫描中...' : '重新扫描'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 扫描结果概览 */}
        <div className={`p-4 rounded-lg border-2 ${
          problematicCount === 0 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {problematicCount === 0 ? (
              <div className="flex items-center gap-2 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-semibold">✅ 没有发现问题 iframe</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">❌ 发现 {problematicCount} 个问题 iframe</span>
              </div>
            )}
          </div>
          <p className={`text-sm ${
            problematicCount === 0 ? 'text-green-700' : 'text-red-700'
          }`}>
            总共扫描到 {iframes.length} 个 iframe，其中 {problematicCount} 个可能导致 X-Frame-Options 错误
          </p>
        </div>

        {/* IFrame 列表 */}
        {iframes.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">发现的 IFrame ({iframes.length})</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {iframes.map((iframe, index) => (
                <div key={index} className={`p-3 rounded border ${
                  iframe.isProblematic ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">IFrame {index + 1}</span>
                        <Badge variant={iframe.isProblematic ? "destructive" : "secondary"}>
                          {iframe.isProblematic ? "有问题" : "正常"}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div><strong>src:</strong> {iframe.src || '(空)'}</div>
                        <div><strong>id:</strong> {iframe.id || '(无)'}</div>
                        <div><strong>class:</strong> {iframe.className || '(无)'}</div>
                        <div><strong>parent:</strong> {iframe.parentInfo}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 清理操作 */}
        <div className="flex flex-wrap gap-3">
          {problematicCount > 0 && (
            <Button onClick={cleanupProblematicIframes} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              清理问题 IFrame ({problematicCount})
            </Button>
          )}
          
          <Button onClick={cleanupAllChatwoot} variant="outline">
            <Trash2 className="h-4 w-4 mr-2" />
            完全清理 Chatwoot
          </Button>
          
          <Button onClick={forceReload} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            清理并重新加载页面
          </Button>
        </div>

        {/* 清理结果 */}
        {cleanupResult && (
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-60 overflow-y-auto">
            <h4 className="text-white mb-2">清理结果:</h4>
            <pre className="whitespace-pre-wrap">{cleanupResult}</pre>
          </div>
        )}

        {/* 说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">问题 IFrame 识别标准:</h4>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>src 包含 "app.chatwoot.com" 但不是 SDK 脚本</li>
            <li>src 包含 "chatwoot" 但不是 "sdk.js"</li>
            <li>class 或 id 包含 "chatwoot"</li>
            <li>这些 iframe 可能导致 X-Frame-Options 错误</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}; 