'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Settings, RefreshCw, ExternalLink } from 'lucide-react';

interface ConfigDiagnostic {
  hasToken: boolean;
  hasBaseUrl: boolean;
  tokenValid: boolean;
  urlValid: boolean;
  scriptUrl: string;
  actualUrl: string;
  networkTest: 'pending' | 'success' | 'failed';
  configErrors: string[];
}

export const ChatwootConfigFix = () => {
  const [diagnostic, setDiagnostic] = useState<ConfigDiagnostic>({
    hasToken: false,
    hasBaseUrl: false,
    tokenValid: false,
    urlValid: false,
    scriptUrl: '',
    actualUrl: '',
    networkTest: 'pending',
    configErrors: [],
  });

  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<string>('');

  // 诊断配置问题
  const diagnoseConfig = async () => {
    const errors: string[] = [];
    
    // 检查环境变量
    const token = process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN;
    const baseUrl = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL;
    
    const hasToken = !!token;
    const hasBaseUrl = !!baseUrl;
    
    if (!hasToken) {
      errors.push('缺少 NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN 环境变量');
    }
    
    if (!hasBaseUrl) {
      errors.push('缺少 NEXT_PUBLIC_CHATWOOT_BASE_URL 环境变量');
    }

    // 验证 Token 格式
    const tokenValid = hasToken && token.length > 10 && !token.includes('your_token');
    if (hasToken && !tokenValid) {
      errors.push('Website Token 格式无效或为示例值');
    }

    // 验证 URL 格式
    let urlValid = false;
    let actualUrl = baseUrl || 'https://app.chatwoot.com';
    
    try {
      new URL(actualUrl);
      urlValid = true;
    } catch {
      errors.push('Base URL 格式无效');
      urlValid = false;
    }

    // 构建正确的脚本 URL
    const cleanBaseUrl = actualUrl.replace(/\/$/, '');
    const scriptUrl = `${cleanBaseUrl}/packs/js/sdk.js`;

    // 测试网络连接
    let networkTest: 'pending' | 'success' | 'failed' = 'pending';
    try {
      const response = await fetch(scriptUrl, { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      networkTest = 'success';
    } catch {
      networkTest = 'failed';
      errors.push(`无法访问脚本: ${scriptUrl}`);
    }

    setDiagnostic({
      hasToken,
      hasBaseUrl,
      tokenValid,
      urlValid,
      scriptUrl,
      actualUrl,
      networkTest,
      configErrors: errors,
    });
  };

  // 修复配置
  const fixConfiguration = () => {
    setIsFixing(true);
    setFixResult('');

    const fixes: string[] = [];

    try {
      // 检查当前加载的脚本
      const currentScripts = document.querySelectorAll('script[src*="chatwoot"], script[src*="sdk.js"]');
      currentScripts.forEach((script, index) => {
        const src = script.getAttribute('src');
        fixes.push(`发现脚本 ${index + 1}: ${src}`);
        
        // 如果脚本 URL 错误，移除它
        if (src && (src.includes('app.chatwoot.com') && !src.includes('/packs/js/sdk.js'))) {
          script.remove();
          fixes.push(`❌ 移除了错误的脚本: ${src}`);
        }
      });

      // 清理错误的全局设置
      if (window.chatwootSettings) {
        fixes.push('清理了现有的 chatwootSettings');
        delete window.chatwootSettings;
      }

      // 如果有有效配置，尝试重新加载
      if (diagnostic.tokenValid && diagnostic.urlValid && diagnostic.networkTest === 'success') {
        fixes.push('✅ 配置有效，尝试重新加载 Chatwoot');
        
        // 设置正确的配置
        window.chatwootSettings = {
          hideMessageBubble: true,
          position: 'right',
          locale: 'en',
          type: 'standard',
          launcherTitle: 'Customer Support',
          showPopoutButton: true,
        };

        // 加载正确的脚本
        const script = document.createElement('script');
        script.async = true;
        script.defer = true;
        script.src = diagnostic.scriptUrl;
        
        script.onload = () => {
          fixes.push('✅ Chatwoot 脚本加载成功');
          
          setTimeout(() => {
            if (window.chatwootSDK) {
              window.chatwootSDK.run({
                websiteToken: process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN!,
                baseUrl: diagnostic.actualUrl,
              });
              fixes.push('✅ Chatwoot SDK 初始化成功');
            }
          }, 100);
        };

        script.onerror = () => {
          fixes.push('❌ Chatwoot 脚本加载失败');
        };

        document.head.appendChild(script);
        fixes.push(`加载脚本: ${diagnostic.scriptUrl}`);
      } else {
        fixes.push('❌ 配置无效，无法重新加载');
      }

      setFixResult(fixes.join('\n'));
    } catch (error) {
      setFixResult(`修复过程出错: ${error}`);
    } finally {
      setIsFixing(false);
    }
  };

  // 生成正确的配置
  const generateCorrectConfig = () => {
    const config = `# 正确的 Chatwoot 配置
# 添加到 .env.local 文件中

NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=your_actual_website_token_here
NEXT_PUBLIC_CHATWOOT_BASE_URL=https://app.chatwoot.com

# 如果使用自托管的 Chatwoot，替换为你的域名：
# NEXT_PUBLIC_CHATWOOT_BASE_URL=https://your-chatwoot-domain.com`;

    navigator.clipboard.writeText(config).then(() => {
      setFixResult('✅ 配置模板已复制到剪贴板');
    }).catch(() => {
      setFixResult('❌ 复制失败，请手动复制配置');
    });
  };

  useEffect(() => {
    diagnoseConfig();
  }, []);

  const getStatusBadge = (status: boolean, successText: string, failText: string) => {
    return (
      <Badge variant={status ? "default" : "destructive"} className="flex items-center gap-1">
        {status ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
        {status ? successText : failText}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Chatwoot 配置诊断与修复
          <Button
            variant="outline"
            size="sm"
            onClick={diagnoseConfig}
            className="ml-auto"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            重新诊断
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 配置状态 */}
        <div>
          <h3 className="font-semibold mb-3">配置状态检查</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Website Token:</span>
              {getStatusBadge(diagnostic.hasToken, "已设置", "未设置")}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Base URL:</span>
              {getStatusBadge(diagnostic.hasBaseUrl, "已设置", "未设置")}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Token 有效性:</span>
              {getStatusBadge(diagnostic.tokenValid, "有效", "无效")}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">URL 有效性:</span>
              {getStatusBadge(diagnostic.urlValid, "有效", "无效")}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">网络连接:</span>
              <Badge variant={
                diagnostic.networkTest === 'success' ? "default" : 
                diagnostic.networkTest === 'failed' ? "destructive" : "secondary"
              }>
                {diagnostic.networkTest === 'success' ? '✅ 正常' : 
                 diagnostic.networkTest === 'failed' ? '❌ 失败' : '⏳ 测试中'}
              </Badge>
            </div>
          </div>
        </div>

        {/* 配置详情 */}
        <div>
          <h3 className="font-semibold mb-3">当前配置</h3>
          <div className="bg-gray-100 p-4 rounded-lg text-sm font-mono space-y-1">
            <div><strong>Token:</strong> {diagnostic.hasToken ? `${process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN?.substring(0, 8)}...` : '未设置'}</div>
            <div><strong>Base URL:</strong> {diagnostic.actualUrl}</div>
            <div><strong>脚本 URL:</strong> {diagnostic.scriptUrl}</div>
          </div>
        </div>

        {/* 错误列表 */}
        {diagnostic.configErrors.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 text-red-600">发现的问题</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <ul className="text-sm text-red-700 space-y-1">
                {diagnostic.configErrors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* 修复按钮 */}
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={fixConfiguration} 
            disabled={isFixing}
            variant="default"
          >
            {isFixing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                修复中...
              </>
            ) : (
              <>
                <Settings className="h-4 w-4 mr-2" />
                自动修复
              </>
            )}
          </Button>
          
          <Button onClick={generateCorrectConfig} variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            生成配置模板
          </Button>
          
          <Button 
            onClick={() => window.open('https://app.chatwoot.com', '_blank')} 
            variant="outline"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            打开 Chatwoot 后台
          </Button>
        </div>

        {/* 修复结果 */}
        {fixResult && (
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold mb-2">操作结果:</h4>
            <pre className="text-sm whitespace-pre-wrap text-gray-700">
              {fixResult}
            </pre>
          </div>
        )}

        {/* 解决方案指南 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">解决步骤:</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>确保在项目根目录有 <code>.env.local</code> 文件</li>
            <li>添加正确的 <code>NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN</code></li>
            <li>设置正确的 <code>NEXT_PUBLIC_CHATWOOT_BASE_URL</code></li>
            <li>重启开发服务器: <code>pnpm dev</code></li>
            <li>测试 Chatwoot 功能</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}; 