"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { CheckCircle, XCircle, AlertTriangle, DollarSign, Banknote } from 'lucide-react';

export default function CurrencyValidationTestPage() {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [orderStatus, setOrderStatus] = useState('created');
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    result: 'pass' | 'fail' | 'warning';
    message: string;
  }>>([]);

  // 币种配置
  const currencies = [
    { code: 'USD', name: '美元', symbol: '$' },
    { code: 'CNY', name: '人民币', symbol: '¥' },
    { code: 'EUR', name: '欧元', symbol: '€' }
  ];

  const orderStatuses = [
    { value: 'created', label: '已创建' },
    { value: 'reviewed', label: '已审核' },
    { value: 'paid', label: '已付款' }
  ];

  // 模拟币种验证逻辑
  const validateCurrency = (currency: string, status: string) => {
    const results = [];

    // 测试1: 管理员订单保存检查
    if (status === 'reviewed' && currency !== 'USD') {
      results.push({
        test: '管理员订单保存检查',
        result: 'fail' as const,
        message: `订单状态设为已审核时，币种必须为美元，当前: ${currency}`
      });
    } else if (status === 'reviewed' && currency === 'USD') {
      results.push({
        test: '管理员订单保存检查',
        result: 'pass' as const,
        message: '✅ 币种检查通过，可以保存订单'
      });
    } else {
      results.push({
        test: '管理员订单保存检查',
        result: 'warning' as const,
        message: `状态为${status}时暂不检查币种`
      });
    }

    // 测试2: 支付前检查
    if (status === 'reviewed') {
      if (currency !== 'USD') {
        results.push({
          test: '支付前币种检查',
          result: 'fail' as const,
          message: `支付不被允许，订单币种必须为美元，当前: ${currency}`
        });
      } else {
        results.push({
          test: '支付前币种检查',
          result: 'pass' as const,
          message: '✅ 币种检查通过，允许创建支付意图'
        });
      }
    } else {
      results.push({
        test: '支付前币种检查',
        result: 'warning' as const,
        message: '订单未达到已审核状态，无法支付'
      });
    }

    // 测试3: 状态变更提醒
    if (status === 'reviewed' && currency !== 'USD') {
      results.push({
        test: '状态变更币种提醒',
        result: 'warning' as const,
        message: `⚠️ 提醒：设置为已审核状态时币种为${currency}，建议改为美元`
      });
    } else {
      results.push({
        test: '状态变更币种提醒',
        result: 'pass' as const,
        message: '无需提醒'
      });
    }

    return results;
  };

  // 运行测试
  const runTest = () => {
    const results = validateCurrency(selectedCurrency, orderStatus);
    setTestResults(results);

    // 显示toast通知
    const failedTests = results.filter(r => r.result === 'fail');
    const warningTests = results.filter(r => r.result === 'warning');

    if (failedTests.length > 0) {
      toast.error('❌ 币种检查失败', {
        description: `${failedTests.length}项检查未通过`,
        duration: 3000
      });
    } else if (warningTests.length > 0) {
      toast.warning('⚠️ 币种提醒', {
        description: `${warningTests.length}项检查有提醒`,
        duration: 3000
      });
    } else {
      toast.success('✅ 币种检查通过', {
        description: '所有检查项目都已通过',
        duration: 3000
      });
    }
  };

  // 模拟保存操作
  const simulateSave = () => {
    if (orderStatus === 'reviewed' && selectedCurrency !== 'USD') {
      toast.error('⚠️ 币种检查失败', {
        description: `订单提交前必须设置为美元(USD)，当前币种: ${selectedCurrency}`,
        duration: 5000
      });
      return;
    }
    
    toast.success('✅ 保存成功', {
      description: '订单已成功保存',
      duration: 3000
    });
  };

  // 模拟支付操作
  const simulatePayment = () => {
    if (orderStatus !== 'reviewed') {
      toast.error('❌ 支付失败', {
        description: '订单未达到已审核状态，无法支付',
        duration: 3000
      });
      return;
    }

    if (selectedCurrency !== 'USD') {
      toast.error('❌ 支付失败', {
        description: `Payment not allowed. Order currency must be USD, current currency: ${selectedCurrency}`,
        duration: 5000
      });
      return;
    }

    toast.success('✅ 支付成功', {
      description: '支付意图创建成功，可以进行支付',
      duration: 3000
    });
  };

  const getResultIcon = (result: 'pass' | 'fail' | 'warning') => {
    switch (result) {
      case 'pass': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'fail': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getResultColor = (result: 'pass' | 'fail' | 'warning') => {
    switch (result) {
      case 'pass': return 'border-green-200 bg-green-50';
      case 'fail': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
              <DollarSign className="w-8 h-8 text-blue-600" />
              Currency Validation Test
            </h1>
            <p className="text-lg text-gray-600">
              测试订单提交前的币种检查功能
            </p>
            <p className="text-sm text-gray-500 mt-2">
              验证管理员订单保存、支付创建等场景下的币种验证逻辑
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 测试配置面板 */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="w-5 h-5" />
                  测试配置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 币种选择 */}
                <div className="space-y-2">
                  <Label>订单币种</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {currencies.map((currency) => (
                      <button
                        key={currency.code}
                        onClick={() => setSelectedCurrency(currency.code)}
                        className={`p-3 border rounded-lg text-center transition-all ${
                          selectedCurrency === currency.code
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold">{currency.symbol}</div>
                        <div className="text-sm">{currency.name}</div>
                        <div className="text-xs text-gray-500">{currency.code}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 订单状态 */}
                <div className="space-y-2">
                  <Label>订单状态</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {orderStatuses.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => setOrderStatus(status.value)}
                        className={`p-3 border rounded-lg text-center transition-all ${
                          orderStatus === status.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-sm font-medium">{status.label}</div>
                        <div className="text-xs text-gray-500">{status.value}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 当前配置显示 */}
                <Alert>
                  <AlertDescription>
                    <strong>当前配置：</strong> {selectedCurrency} • {orderStatuses.find(s => s.value === orderStatus)?.label}
                  </AlertDescription>
                </Alert>

                {/* 测试按钮 */}
                <div className="space-y-3">
                  <Button onClick={runTest} className="w-full" size="lg">
                    🔍 运行币种检查测试
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={simulateSave} variant="outline" size="sm">
                      💾 模拟保存
                    </Button>
                    <Button onClick={simulatePayment} variant="outline" size="sm">
                      💳 模拟支付
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 测试结果面板 */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  测试结果
                </CardTitle>
              </CardHeader>
              <CardContent>
                {testResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-4">🧪</div>
                    <p>点击"运行币种检查测试"查看结果</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {testResults.map((result, index) => (
                      <div 
                        key={index}
                        className={`p-3 border rounded-lg ${getResultColor(result.result)}`}
                      >
                        <div className="flex items-start gap-3">
                          {getResultIcon(result.result)}
                          <div className="flex-1">
                            <div className="font-medium text-sm mb-1">{result.test}</div>
                            <div className="text-xs text-gray-600">{result.message}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 功能说明 */}
          <Card className="mt-8 shadow-lg">
            <CardHeader>
              <CardTitle>💡 功能说明</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">🔒 管理员订单保存检查</h4>
                  <p className="text-gray-600">
                    当管理员将订单状态设置为"已审核"时，系统会检查币种是否为美元，如果不是则阻止保存并显示错误提示。
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">💳 支付前币种检查</h4>
                  <p className="text-gray-600">
                    用户尝试支付时，API会验证订单币种是否为美元，只有美元订单才允许创建支付意图。
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">⚠️ 状态变更提醒</h4>
                  <p className="text-gray-600">
                    管理员在价格管理面板中将状态改为"已审核"时，如果币种不是美元会显示提醒，建议修改币种。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 