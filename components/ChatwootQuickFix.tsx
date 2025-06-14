'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Copy, ExternalLink } from 'lucide-react';

export const ChatwootQuickFix = () => {
  const [diagnosis, setDiagnosis] = useState<{
    issue: string;
    solution: string;
    configExample: string;
    status: 'checking' | 'found' | 'fixed';
  }>({
    issue: '',
    solution: '',
    configExample: '',
    status: 'checking'
  });

  useEffect(() => {
    // 快速诊断问题
    const diagnose = () => {
      const token = process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN;
      const baseUrl = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL;

      console.log('🔍 Chatwoot 配置诊断:');
      console.log('Token:', token ? `${token.substring(0, 8)}...` : '未设置');
      console.log('Base URL:', baseUrl || '未设置');

      // 检查常见问题
      if (!token || token === 'your_token_here' || token.length < 10) {
        setDiagnosis({
          issue: '❌ Website Token 未设置或无效',
          solution: '需要从 Chatwoot 后台获取正确的 Website Token',
          configExample: `# 在 .env.local 文件中添加:
NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=你的真实token
NEXT_PUBLIC_CHATWOOT_BASE_URL=https://app.chatwoot.com`,
          status: 'found'
        });
        return;
      }

      if (!baseUrl) {
        setDiagnosis({
          issue: '❌ Base URL 未设置',
          solution: '需要设置 Chatwoot 实例的 Base URL',
          configExample: `# 在 .env.local 文件中添加:
NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=${token}
NEXT_PUBLIC_CHATWOOT_BASE_URL=https://app.chatwoot.com`,
          status: 'found'
        });
        return;
      }

      // 检查 URL 是否正确
      if (baseUrl === 'https://app.chatwoot.com') {
        setDiagnosis({
          issue: '⚠️ 使用的是 Chatwoot 官方托管版本',
          solution: '如果你使用的是自托管版本，需要更改 Base URL',
          configExample: `# 如果使用自托管版本:
NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=${token}
NEXT_PUBLIC_CHATWOOT_BASE_URL=https://你的域名.com

# 如果使用官方托管版本，当前配置正确`,
          status: 'found'
        });
        return;
      }

      setDiagnosis({
        issue: '✅ 基础配置看起来正确',
        solution: '问题可能在于网络连接或 Chatwoot 实例状态',
        configExample: `当前配置:
NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=${token.substring(0, 8)}...
NEXT_PUBLIC_CHATWOOT_BASE_URL=${baseUrl}`,
        status: 'found'
      });
    };

    diagnose();
  }, []);

  const copyConfig = () => {
    navigator.clipboard.writeText(diagnosis.configExample);
    alert('配置已复制到剪贴板！');
  };

  const testConnection = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || 'https://app.chatwoot.com';
    const scriptUrl = `${baseUrl.replace(/\/$/, '')}/packs/js/sdk.js`;
    
    console.log('🧪 测试连接:', scriptUrl);
    
    try {
      await fetch(scriptUrl, { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      console.log('✅ 连接测试成功');
      alert('连接测试成功！');
    } catch (error) {
      console.error('❌ 连接测试失败:', error);
      alert(`连接测试失败: ${error}`);
    }
  };

  const forceReload = () => {
    // 清理现有的 Chatwoot
    const scripts = document.querySelectorAll('script[src*="chatwoot"], script[src*="sdk.js"]');
    scripts.forEach(script => script.remove());
    
    // 清理全局对象
    if (window.$chatwoot) delete window.$chatwoot;
    if (window.chatwootSDK) delete window.chatwootSDK;
    if (window.chatwootSettings) delete window.chatwootSettings;
    
    // 清理 DOM 元素
    const widgets = document.querySelectorAll('[class*="chatwoot"], [id*="chatwoot"], .woot-widget-holder, .woot-widget-bubble');
    widgets.forEach(widget => widget.remove());
    
    console.log('🧹 已清理所有 Chatwoot 元素');
    
    // 重新加载页面
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Chatwoot 问题快速修复
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">诊断结果:</h3>
          <p className="text-sm mb-3">{diagnosis.issue}</p>
          <p className="text-sm text-gray-600">{diagnosis.solution}</p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">推荐配置:</h4>
            <Button size="sm" variant="outline" onClick={copyConfig}>
              <Copy className="h-4 w-4 mr-1" />
              复制
            </Button>
          </div>
          <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
            {diagnosis.configExample}
          </pre>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={testConnection} variant="outline">
            <CheckCircle className="h-4 w-4 mr-2" />
            测试连接
          </Button>
          
          <Button onClick={forceReload} variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            强制重新加载
          </Button>
          
          <Button 
            onClick={() => window.open('https://app.chatwoot.com', '_blank')} 
            variant="outline"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            打开 Chatwoot
          </Button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">常见解决方案:</h4>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>检查 <code>.env.local</code> 文件是否存在于项目根目录</li>
            <li>确认 Website Token 是从 Chatwoot 后台正确复制的</li>
            <li>如果使用自托管版本，确认域名和端口正确</li>
            <li>检查网络连接和防火墙设置</li>
            <li>重启开发服务器</li>
          </ol>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            如果问题仍然存在，请检查浏览器控制台的详细错误信息
          </p>
        </div>
      </CardContent>
    </Card>
  );
}; 