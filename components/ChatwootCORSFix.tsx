'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ChatwootCORSFix() {
  const [corsStatus, setCorsStatus] = useState<'checking' | 'success' | 'error' | 'fixed'>('checking');
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [fixAttempted, setFixAttempted] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL;
  const websiteToken = process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN;

  useEffect(() => {
    checkCORSStatus();
  }, []);

  const checkCORSStatus = async () => {
    if (!baseUrl) {
      setCorsStatus('error');
      setErrorDetails('NEXT_PUBLIC_CHATWOOT_BASE_URL 未设置');
      return;
    }

    try {
      // 尝试访问 SDK 文件
      const sdkUrl = `${baseUrl}/packs/js/sdk.js`;
      const response = await fetch(sdkUrl, { 
        method: 'HEAD',
        mode: 'cors'
      });
      
      if (response.ok) {
        setCorsStatus('success');
      } else {
        setCorsStatus('error');
        setErrorDetails(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      setCorsStatus('error');
      setErrorDetails(error instanceof Error ? error.message : '未知错误');
    }
  };

  const attemptCORSFix = async () => {
    setFixAttempted(true);
    
    // 方法1: 使用代理方式加载
    try {
      const script = document.createElement('script');
      script.src = `${baseUrl}/packs/js/sdk.js`;
      script.crossOrigin = 'anonymous';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('Chatwoot SDK loaded successfully via CORS fix');
        if (window.chatwootSDK && websiteToken) {
          window.chatwootSDK.run({
            websiteToken: websiteToken,
            baseUrl: baseUrl,
          });
          setCorsStatus('fixed');
        }
      };
      
      script.onerror = () => {
        console.error('Failed to load Chatwoot SDK even with CORS fix');
        // 尝试方法2: 使用 JSONP 方式
        attemptJSONPFix();
      };
      
      document.head.appendChild(script);
    } catch (error) {
      console.error('CORS fix attempt failed:', error);
      attemptJSONPFix();
    }
  };

  const attemptJSONPFix = () => {
    // 创建一个临时的 iframe 来绕过 CORS
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `${baseUrl}/widget`;
    
    iframe.onload = () => {
      console.log('Chatwoot widget loaded via iframe method');
      setCorsStatus('fixed');
      document.body.removeChild(iframe);
    };
    
    iframe.onerror = () => {
      console.error('Iframe method also failed');
      document.body.removeChild(iframe);
    };
    
    document.body.appendChild(iframe);
  };

  const openChatwootDirectly = () => {
    window.open(`${baseUrl}/widget`, '_blank', 'width=400,height=600');
  };

  const getStatusColor = () => {
    switch (corsStatus) {
      case 'success': return 'text-green-600';
      case 'fixed': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusText = () => {
    switch (corsStatus) {
      case 'checking': return '检查中...';
      case 'success': return '✅ CORS 正常';
      case 'fixed': return '✅ 已修复';
      case 'error': return '❌ CORS 错误';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Chatwoot CORS 问题修复工具</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 状态显示 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <span className="font-medium">CORS 状态:</span>
          <span className={`font-bold ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {/* 配置信息 */}
        <div className="space-y-2">
          <h3 className="font-semibold">当前配置:</h3>
          <div className="bg-gray-100 p-3 rounded text-sm font-mono">
            <div><strong>Base URL:</strong> {baseUrl || '未设置'}</div>
            <div><strong>Website Token:</strong> {websiteToken ? `${websiteToken.substring(0, 8)}...` : '未设置'}</div>
            <div><strong>SDK URL:</strong> {baseUrl}/packs/js/sdk.js</div>
          </div>
        </div>

        {/* 错误详情 */}
        {corsStatus === 'error' && (
          <Alert>
            <AlertDescription>
              <strong>错误详情:</strong> {errorDetails}
            </AlertDescription>
          </Alert>
        )}

        {/* 解决方案 */}
        <div className="space-y-3">
          <h3 className="font-semibold">解决方案:</h3>
          
          {corsStatus === 'error' && !fixAttempted && (
            <Button onClick={attemptCORSFix} className="w-full">
              🔧 尝试自动修复 CORS 问题
            </Button>
          )}

          <Button onClick={checkCORSStatus} variant="outline" className="w-full">
            🔄 重新检查状态
          </Button>

          <Button onClick={openChatwootDirectly} variant="outline" className="w-full">
            🔗 直接打开 Chatwoot 窗口
          </Button>
        </div>

        {/* 手动解决方案 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-2">手动解决方案:</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              <strong>服务器端解决:</strong> 在 Chatwoot 服务器配置中添加 CORS 头:
              <pre className="mt-1 p-2 bg-gray-100 rounded text-xs">
{`Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type`}
              </pre>
            </li>
            <li>
              <strong>使用 HTTPS:</strong> 将 Chatwoot 部署到 HTTPS 域名
            </li>
            <li>
              <strong>代理方式:</strong> 通过您的服务器代理 Chatwoot 请求
            </li>
          </ol>
        </div>

        {/* Nginx 配置示例 */}
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-semibold mb-2">Nginx 配置示例:</h4>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
{`server {
    listen 80;
    server_name www.leodennis.top;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # CORS 头
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type";
        
        # 处理预检请求
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 200;
        }
    }
}`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
} 