"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { RefreshCw, Database, Cloud, DollarSign, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export default function ExchangeRateTestPage() {
  const [adminOrderRate, setAdminOrderRate] = useState('7.25');
  const [cachedRate, setCachedRate] = useState('7.20');
  const [apiRate, setApiRate] = useState('7.30');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [forceRefresh, setForceRefresh] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    selectedRate: number;
    source: string;
    explanation: string;
    priority: number;
  } | null>(null);

  // 模拟汇率获取逻辑
  const simulateExchangeRateLogic = () => {
    setIsLoading(true);
    setTestResult(null);

    setTimeout(() => {
      let result;

      if (selectedCurrency === 'CNY') {
        result = {
          selectedRate: 1.0,
          source: 'CNY 固定汇率',
          explanation: 'CNY 汇率固定为 1.0，无需获取',
          priority: 0
        };
      } else if (!forceRefresh && adminOrderRate && Number(adminOrderRate) > 0) {
        result = {
          selectedRate: Number(adminOrderRate),
          source: '管理员订单表',
          explanation: '优先使用管理员订单表中已存储的汇率',
          priority: 1
        };
      } else if (!forceRefresh && cachedRate && Number(cachedRate) > 0) {
        result = {
          selectedRate: Number(cachedRate),
          source: '内存缓存',
          explanation: '使用缓存中的汇率（1分钟有效期内）',
          priority: 2
        };
      } else if (apiRate && Number(apiRate) > 0) {
        result = {
          selectedRate: Number(apiRate),
          source: '内部API',
          explanation: '从内部API获取最新汇率',
          priority: 3
        };
      } else {
        const defaultRate = selectedCurrency === 'EUR' ? 7.8 : 7.2;
        result = {
          selectedRate: defaultRate,
          source: '默认汇率',
          explanation: 'API失败时使用系统默认汇率',
          priority: 4
        };
      }

      setTestResult(result);
      setIsLoading(false);

      toast.success(`汇率获取成功: ${result.selectedRate} (${result.source})`);
    }, 1000);
  };

  const resetTest = () => {
    setTestResult(null);
    setForceRefresh(false);
    setAdminOrderRate('7.25');
    setCachedRate('7.20');
    setApiRate('7.30');
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 0: return 'text-purple-600 bg-purple-100';
      case 1: return 'text-green-600 bg-green-100';
      case 2: return 'text-blue-600 bg-blue-100';
      case 3: return 'text-orange-600 bg-orange-100';
      case 4: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityIcon = (priority: number) => {
    switch (priority) {
      case 0: return <DollarSign className="w-4 h-4" />;
      case 1: return <Database className="w-4 h-4" />;
      case 2: return <RefreshCw className="w-4 h-4" />;
      case 3: return <Cloud className="w-4 h-4" />;
      case 4: return <AlertTriangle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">汇率获取优先级测试</h1>
          <p className="text-gray-600 mt-2">
            测试不同场景下的汇率获取逻辑和优先级
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：控制面板 */}
          <div className="space-y-6">
            {/* 测试参数 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  测试参数设置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 币种选择 */}
                <div>
                  <Label>测试币种</Label>
                  <select 
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD - 美元</option>
                    <option value="EUR">EUR - 欧元</option>
                    <option value="CNY">CNY - 人民币</option>
                  </select>
                </div>

                {/* 汇率设置 */}
                {selectedCurrency !== 'CNY' && (
                  <>
                    <div>
                      <Label>管理员订单表汇率</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={adminOrderRate}
                        onChange={(e) => setAdminOrderRate(e.target.value)}
                        placeholder="7.25"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">优先级: 1 (最高)</p>
                    </div>

                    <div>
                      <Label>缓存汇率</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={cachedRate}
                        onChange={(e) => setCachedRate(e.target.value)}
                        placeholder="7.20"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">优先级: 2</p>
                    </div>

                    <div>
                      <Label>API汇率</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={apiRate}
                        onChange={(e) => setApiRate(e.target.value)}
                        placeholder="7.30"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">优先级: 3</p>
                    </div>
                  </>
                )}

                {/* 强制刷新选项 */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="forceRefresh"
                    checked={forceRefresh}
                    onChange={(e) => setForceRefresh(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="forceRefresh" className="text-sm">
                    强制刷新 (跳过订单表汇率和缓存)
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* 控制按钮 */}
            <div className="flex gap-3">
              <Button 
                onClick={simulateExchangeRateLogic} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    获取汇率中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    运行测试
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={resetTest}>
                重置
              </Button>
            </div>
          </div>

          {/* 右侧：结果显示 */}
          <div className="space-y-6">
            {/* 优先级说明 */}
            <Card>
              <CardHeader>
                <CardTitle>汇率获取优先级</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 px-3 py-1 rounded-full text-purple-600 bg-purple-100 text-sm font-medium">
                      <DollarSign className="w-4 h-4" />
                      CNY固定
                    </span>
                    <span className="text-sm text-gray-600">CNY汇率固定为1.0</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 px-3 py-1 rounded-full text-green-600 bg-green-100 text-sm font-medium">
                      <Database className="w-4 h-4" />
                      优先级 1
                    </span>
                    <span className="text-sm text-gray-600">管理员订单表中的汇率</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 px-3 py-1 rounded-full text-blue-600 bg-blue-100 text-sm font-medium">
                      <RefreshCw className="w-4 h-4" />
                      优先级 2
                    </span>
                    <span className="text-sm text-gray-600">内存缓存汇率 (1分钟有效期)</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 px-3 py-1 rounded-full text-orange-600 bg-orange-100 text-sm font-medium">
                      <Cloud className="w-4 h-4" />
                      优先级 3
                    </span>
                    <span className="text-sm text-gray-600">内部API最新汇率</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 px-3 py-1 rounded-full text-red-600 bg-red-100 text-sm font-medium">
                      <AlertTriangle className="w-4 h-4" />
                      优先级 4
                    </span>
                    <span className="text-sm text-gray-600">系统默认汇率</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 测试结果 */}
            {testResult && (
              <Card>
                <CardHeader>
                  <CardTitle>测试结果</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {testResult.selectedRate}
                    </div>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getPriorityColor(testResult.priority)}`}>
                      {getPriorityIcon(testResult.priority)}
                      {testResult.source}
                    </div>
                  </div>

                  <Alert>
                    <Info className="w-4 h-4" />
                    <AlertDescription>
                      {testResult.explanation}
                    </AlertDescription>
                  </Alert>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <h4 className="font-medium text-gray-900">测试条件：</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 币种: {selectedCurrency}</li>
                      <li>• 强制刷新: {forceRefresh ? '是' : '否'}</li>
                      {selectedCurrency !== 'CNY' && (
                        <>
                          <li>• 订单表汇率: {adminOrderRate || '未设置'}</li>
                          <li>• 缓存汇率: {cachedRate || '未设置'}</li>
                          <li>• API汇率: {apiRate || '未设置'}</li>
                        </>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* 使用说明 */}
        <Card>
          <CardHeader>
            <CardTitle>功能说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">🎯 设计原则</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 优先使用管理员订单表中已保存的汇率</li>
                  <li>• 避免不必要的API调用，提高性能</li>
                  <li>• 提供手动刷新功能获取最新汇率</li>
                  <li>• 多层级后备机制确保系统稳定性</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">⚡ 刷新机制</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 点击🔄按钮强制获取最新API汇率</li>
                  <li>• 切换币种时自动获取对应汇率</li>
                  <li>• 新建订单时自动获取当前汇率</li>
                  <li>• 缓存汇率有效期为1分钟</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 