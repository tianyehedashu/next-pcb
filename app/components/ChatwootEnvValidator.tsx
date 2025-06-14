'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface DiagnosticResult {
  envVarValue: string | null;
  isEnvVarSet: boolean;
  finalUrl: string;
  isUrlValid: boolean;
  networkStatus: 'pending' | 'success' | 'failed';
  httpStatusCode: number | null;
  error: string | null;
}

export const ChatwootEnvValidator = () => {
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const runTest = async () => {
    setIsTesting(true);

    // 1. 读取环境变量
    const envVarValue = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || null;
    const isEnvVarSet = !!envVarValue;

    // 2. 构建最终 URL
    const baseUrl = envVarValue || 'https://app.chatwoot.com';
    const finalUrl = `${baseUrl.replace(/\/$/, '')}/packs/js/sdk.js`;

    // 3. 验证 URL 格式
    let isUrlValid = false;
    try {
      new URL(finalUrl);
      isUrlValid = true;
    } catch {
      isUrlValid = false;
    }
    
    // 4. 进行网络穿透测试
    let networkStatus: 'pending' | 'success' | 'failed' = 'pending';
    let httpStatusCode: number | null = null;
    let error: string | null = null;
    
    if (isUrlValid) {
      try {
        const response = await fetch(finalUrl, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-store',
        });
        
        httpStatusCode = response.status;
        if (response.ok) {
          networkStatus = 'success';
        } else {
          networkStatus = 'failed';
          error = `服务器返回 HTTP ${response.status} 错误`;
        }
      } catch (e: unknown) {
        networkStatus = 'failed';
        if (e instanceof Error) {
            error = e.message || '未知网络错误';
            if (e.message.includes('Failed to fetch')) {
              error += ' (可能是 CORS, DNS, 或防火墙问题)';
            }
        } else {
            error = '发生了一个未知的网络错误';
        }
      }
    } else {
      networkStatus = 'failed';
      error = '构建的 URL 格式无效';
    }

    setResult({
      envVarValue,
      isEnvVarSet,
      finalUrl,
      isUrlValid,
      networkStatus,
      httpStatusCode,
      error,
    });
    
    setIsTesting(false);
  };

  useEffect(() => {
    runTest();
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Chatwoot 环境与网络穿透测试
          <Button
            variant="outline"
            size="sm"
            onClick={runTest}
            disabled={isTesting}
            className="ml-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isTesting ? 'animate-spin' : ''}`} />
            {isTesting ? '测试中...' : '重新测试'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {result && (
        <CardContent className="space-y-4 pt-6">
          {/* 环境变量检查 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">1. 环境变量检查</h3>
            <div className="flex items-center justify-between">
              <code className="text-sm">NEXT_PUBLIC_CHATWOOT_BASE_URL</code>
              {result.isEnvVarSet ? <Badge>已设置</Badge> : <Badge variant="outline" className="border-red-500 text-red-500">未设置</Badge>}
            </div>
            <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded">
              <strong>值:</strong> {result.envVarValue || '(未设置，使用默认值)'}
            </div>
          </div>

          {/* URL 构建 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">2. 最终脚本 URL</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm">URL 格式</span>
              {result.isUrlValid ? <Badge>有效</Badge> : <Badge variant="outline" className="border-red-500 text-red-500">无效</Badge>}
            </div>
            <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded break-all">
              <strong>URL:</strong> {result.finalUrl}
            </div>
          </div>

          {/* 网络测试 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">3. 网络穿透测试</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm">连接状态</span>
              {result.networkStatus === 'success' ? <Badge>success</Badge> : <Badge variant="outline" className="border-red-500 text-red-500">{result.networkStatus}</Badge>}
            </div>
            <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded">
              <p><strong>HTTP 状态码:</strong> {result.httpStatusCode || 'N/A'}</p>
              {result.error && <p className="text-red-600"><strong>错误信息:</strong> {result.error}</p>}
            </div>
          </div>
          
          {/* 结论 */}
          <div className={`p-4 rounded-lg border-2 ${
            result.networkStatus === 'success' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {result.networkStatus === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              <h3 className={`font-semibold ${
                result.networkStatus === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.networkStatus === 'success' ? '✅ 诊断通过' : '❌ 诊断失败'}
              </h3>
            </div>
            <p className={`text-sm ${
              result.networkStatus === 'success' ? 'text-green-700' : 'text-red-700'
            }`}>
              {result.networkStatus === 'success' 
                ? '你的客户端环境和网络连接均正常，问题可能在其他地方。'
                : `问题的根源是网络或环境配置。HTTP 状态码是 ${result.httpStatusCode || '未知'}。请检查你的网络设置或 .env.local 文件。`
              }
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}; 