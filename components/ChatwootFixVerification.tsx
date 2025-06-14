'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, RefreshCw, Settings } from 'lucide-react';

interface FixStatus {
  configFixed: boolean;
  noIframes: boolean;
  scriptsLoading: boolean;
  chatwootWorking: boolean;
  errors: string[];
  recommendations: string[];
}

export const ChatwootFixVerification = () => {
  const [status, setStatus] = useState<FixStatus>({
    configFixed: false,
    noIframes: false,
    scriptsLoading: false,
    chatwootWorking: false,
    errors: [],
    recommendations: [],
  });

  const [isChecking, setIsChecking] = useState(false);

  const verifyFix = () => {
    setIsChecking(true);
    
    setTimeout(() => {
      const errors: string[] = [];
      const recommendations: string[] = [];

      // 检查配置是否已修复
      const configFixed = !window.chatwootSettings?.showPopoutButton;
      if (!configFixed) {
        errors.push('showPopoutButton 仍然为 true');
        recommendations.push('确保 CHATWOOT_CONFIG 中 showPopoutButton 设置为 false');
      }

      // 检查是否还有错误的 iframe
      const iframes = Array.from(document.querySelectorAll('iframe')).filter(iframe => {
        const src = iframe.getAttribute('src') || '';
        return src.includes('app.chatwoot.com') && !src.includes('/packs/js/sdk.js');
      });
      
      const noIframes = iframes.length === 0;
      if (!noIframes) {
        errors.push(`发现 ${iframes.length} 个错误的 iframe`);
        recommendations.push('清理所有指向 Chatwoot 主页面的 iframe');
      }

      // 检查脚本加载
      const scripts = Array.from(document.querySelectorAll('script')).filter(script => {
        const src = script.getAttribute('src') || '';
        return src.includes('chatwoot') || src.includes('sdk.js');
      });
      
      const scriptsLoading = scripts.length > 0;
      if (!scriptsLoading) {
        errors.push('没有找到 Chatwoot SDK 脚本');
        recommendations.push('确保 ChatwootWidget 组件被正确加载');
      }

      // 检查 Chatwoot 是否工作
      const chatwootWorking = !!(window.$chatwoot || window.chatwootSDK);
      if (!chatwootWorking && scriptsLoading) {
        errors.push('Chatwoot SDK 已加载但未初始化');
        recommendations.push('检查 Website Token 和网络连接');
      }

      setStatus({
        configFixed,
        noIframes,
        scriptsLoading,
        chatwootWorking,
        errors,
        recommendations,
      });

      setIsChecking(false);
    }, 1000);
  };

  const clearAndReload = () => {
    // 清理所有 Chatwoot 元素
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

    console.log('🧹 已清理所有 Chatwoot 元素，准备重新加载...');
    
    // 重新加载页面以应用修复
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  useEffect(() => {
    verifyFix();
  }, []);

  const getStatusBadge = (status: boolean, successText: string, failText: string) => {
    return (
      <Badge variant={status ? "default" : "destructive"} className="flex items-center gap-1">
        {status ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
        {status ? successText : failText}
      </Badge>
    );
  };

  const overallStatus = status.configFixed && status.noIframes && status.scriptsLoading;

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          X-Frame-Options 修复验证
          <Button
            variant="outline"
            size="sm"
            onClick={verifyFix}
            disabled={isChecking}
            className="ml-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? '检查中...' : '重新检查'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 总体状态 */}
        <div className={`p-4 rounded-lg border-2 ${
          overallStatus 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {overallStatus ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
            <h3 className={`font-semibold ${
              overallStatus ? 'text-green-800' : 'text-red-800'
            }`}>
              {overallStatus ? '✅ 修复成功！' : '❌ 仍有问题需要解决'}
            </h3>
          </div>
          <p className={`text-sm ${
            overallStatus ? 'text-green-700' : 'text-red-700'
          }`}>
            {overallStatus 
              ? 'X-Frame-Options 错误已修复，Chatwoot 应该正常工作了。'
              : '还有一些问题需要解决，请查看下面的详细信息。'
            }
          </p>
        </div>

        {/* 详细检查结果 */}
        <div>
          <h3 className="font-semibold mb-3">修复状态检查</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">配置已修复:</span>
              {getStatusBadge(status.configFixed, "已修复", "未修复")}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">无错误 iframe:</span>
              {getStatusBadge(status.noIframes, "正常", "仍有问题")}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">脚本加载:</span>
              {getStatusBadge(status.scriptsLoading, "正常", "未加载")}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Chatwoot 工作:</span>
              {getStatusBadge(status.chatwootWorking, "正常", "未工作")}
            </div>
          </div>
        </div>

        {/* 错误列表 */}
        {status.errors.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 text-red-600">仍存在的问题</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <ul className="text-sm text-red-700 space-y-1">
                {status.errors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* 建议列表 */}
        {status.recommendations.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 text-blue-600">建议操作</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <ul className="text-sm text-blue-700 space-y-1">
                {status.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Settings className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={clearAndReload} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            清理并重新加载
          </Button>
          
          {overallStatus && (
            <Button variant="default">
              <CheckCircle className="h-4 w-4 mr-2" />
              修复完成！
            </Button>
          )}
        </div>

        {/* 修复说明 */}
        <div className="bg-gray-50 border rounded-lg p-4">
          <h4 className="font-semibold mb-2">修复内容说明:</h4>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            <li>将 <code>showPopoutButton</code> 设置为 <code>false</code></li>
            <li>这防止 Chatwoot 创建弹出按钮，避免 iframe 加载主页面</li>
            <li>聊天功能保持完整，只是没有弹出到新窗口的按钮</li>
            <li>如果需要弹出功能，可以自定义实现而不依赖 Chatwoot 的内置按钮</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}; 