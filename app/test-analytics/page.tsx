'use client';

import { useState } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAnalyticsStatus, debug } from '@/lib/analytics';

export default function TestAnalyticsPage() {
  const analytics = useAnalytics();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
  };

  const runBasicTests = () => {
    addResult('开始基础测试...');
    
    // 测试页面浏览
    analytics.trackPageView();
    addResult('✅ 页面浏览事件已发送');

    // 测试按钮点击
    analytics.trackButtonClick('测试按钮', 'test-page');
    addResult('✅ 按钮点击事件已发送');

    // 测试自定义事件
    analytics.trackCustomEvent('test_analytics_page', {
      test_type: 'basic_functionality',
      timestamp: new Date().toISOString(),
    });
    addResult('✅ 自定义事件已发送');
  };

  const testQuoteTracking = () => {
    addResult('测试报价追踪...');
    
    analytics.trackQuoteSubmit({
      quote_id: 'TEST-Q-' + Date.now(),
      pcb_type: 'rigid',
      layers: 4,
      quantity: 100,
      value: 299.99,
      user_type: 'guest',
      gerber_analyzed: false,
    });
    addResult('✅ 报价提交事件已发送');
  };

  const testErrorTracking = () => {
    addResult('测试错误追踪...');
    
    analytics.trackError('test_error', '这是一个测试错误', {
      test_page: '/test-analytics',
      error_severity: 'low',
    });
    addResult('✅ 错误事件已发送');
  };

  const checkAnalyticsStatus = () => {
    const status = getAnalyticsStatus();
    addResult(`📊 GA4: ${status.ga4_enabled ? '启用' : '禁用'}`);
    addResult(`📊 Clarity: ${status.clarity_enabled ? '启用' : '禁用'}`);
    addResult(`👤 用户识别: ${status.user_identified ? '是' : '否'}`);
    
    const toolsStatus = debug.checkToolsLoaded();
    addResult(`🔧 工具加载状态: gtag=${!!toolsStatus.gtag}, clarity=${!!toolsStatus.clarity}`);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Analytics Testing Dashboard
          </h1>
          <p className="text-gray-600">
            测试 Google Analytics 4 和 Microsoft Clarity 集成
          </p>
        </div>

        {/* 状态概览 */}
        <Card>
          <CardHeader>
            <CardTitle>集成状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Badge variant="secondary" className="mb-2">Google Analytics 4</Badge>
                <div className="text-2xl font-bold text-green-600">✅</div>
                <div className="text-sm text-gray-600">已集成</div>
              </div>
              
              <div className="text-center">
                <Badge variant="secondary" className="mb-2">Microsoft Clarity</Badge>
                <div className="text-2xl font-bold text-green-600">✅</div>
                <div className="text-sm text-gray-600">已集成</div>
              </div>
              
              <div className="text-center">
                <Badge variant="outline" className="mb-2">Mixpanel</Badge>
                <div className="text-2xl font-bold text-gray-400">➖</div>
                <div className="text-sm text-gray-600">未启用</div>
              </div>
              
              <div className="text-center">
                <Badge variant="outline" className="mb-2">PostHog</Badge>
                <div className="text-2xl font-bold text-gray-400">➖</div>
                <div className="text-sm text-gray-600">未启用</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 测试按钮 */}
        <Card>
          <CardHeader>
            <CardTitle>测试功能</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button onClick={runBasicTests} variant="default" className="w-full">
                基础测试
              </Button>
              
              <Button onClick={testQuoteTracking} variant="default" className="w-full">
                报价追踪
              </Button>
              
              <Button onClick={testErrorTracking} variant="default" className="w-full">
                错误追踪
              </Button>
              
              <Button onClick={checkAnalyticsStatus} variant="outline" className="w-full">
                检查状态
              </Button>
            </div>
            
            <div className="mt-4">
              <Button onClick={clearResults} variant="secondary" size="sm">
                清空日志
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 测试结果日志 */}
        <Card>
          <CardHeader>
            <CardTitle>测试日志</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500 text-center">点击上方按钮开始测试...</p>
              ) : (
                <div className="space-y-1">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-sm font-mono">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 验证指南 */}
        <Card>
          <CardHeader>
            <CardTitle>验证分析数据</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-green-700 mb-2">🔍 Google Analytics 4</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 登录 Google Analytics → 实时报告</li>
                  <li>• 查看"事件"部分，应该能看到测试事件</li>
                  <li>• 事件名称：page_view, button_click, quote_submit 等</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-blue-700 mb-2">📹 Microsoft Clarity</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 登录 Microsoft Clarity → 查看会话</li>
                  <li>• 点击最新的会话录屏</li>
                  <li>• 在录屏中应该能看到你的测试操作</li>
                  <li>• 检查自定义标签是否正确设置</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 开发提示 */}
        <Card>
          <CardHeader>
            <CardTitle>开发提示</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>浏览器控制台：</strong> 打开开发者工具查看详细日志</p>
              <p><strong>网络面板：</strong> 查看发送到 Google Analytics 的请求</p>
              <p><strong>调试面板：</strong> 页面右下角的蓝色"Analytics Debug"按钮</p>
              <p><strong>实时验证：</strong> 事件通常在 1-2 分钟内出现在 GA4 实时报告中</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 