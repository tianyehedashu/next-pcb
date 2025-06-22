"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { CreditCard, Calendar, Clock, CheckCircle, AlertTriangle, DollarSign, Info } from 'lucide-react';

export default function PaymentManagementTestPage() {
  const [orderData, setOrderData] = useState({
    status: 'reviewed',
    payment_status: 'unpaid',
    due_date: '',
    pay_time: '',
    admin_price: 125.50,
    currency: 'USD'
  });

  const [testResults, setTestResults] = useState<Array<{
    field: string;
    value: string;
    status: 'success' | 'warning' | 'error';
    message: string;
  }>>([]);

  // 支付状态选项
  const paymentStatusOptions = [
    { value: 'unpaid', label: '💰 未支付', color: 'text-amber-600 bg-amber-100' },
    { value: 'pending', label: '🔄 支付中', color: 'text-blue-600 bg-blue-100' },
    { value: 'paid', label: '✅ 已支付', color: 'text-green-600 bg-green-100' },
    { value: 'partially_paid', label: '💸 部分支付', color: 'text-purple-600 bg-purple-100' },
    { value: 'failed', label: '❌ 支付失败', color: 'text-red-600 bg-red-100' },
    { value: 'cancelled', label: '🚫 已取消', color: 'text-gray-600 bg-gray-100' },
    { value: 'refunded', label: '💵 已退款', color: 'text-indigo-600 bg-indigo-100' }
  ];

  // 订单状态选项
  const orderStatusOptions = [
    { value: 'created', label: '已创建' },
    { value: 'reviewed', label: '已审核' },
    { value: 'paid', label: '已付款' },
    { value: 'in_production', label: '生产中' },
    { value: 'shipped', label: '已发货' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' }
  ];

  const handleFieldChange = (field: string, value: string) => {
    setOrderData(prev => ({
      ...prev,
      [field]: value
    }));

    // 自动设置支付时间
    if (field === 'payment_status' && value === 'paid' && !orderData.pay_time) {
      const now = new Date().toISOString().slice(0, 16);
      setOrderData(prev => ({
        ...prev,
        pay_time: now
      }));
      toast.success('✅ 自动设置支付时间为当前时间');
    }

    // 清除支付时间（非已支付状态）
    if (field === 'payment_status' && value !== 'paid' && orderData.pay_time) {
      setOrderData(prev => ({
        ...prev,
        pay_time: ''
      }));
      toast.info('🔄 已清除支付时间');
    }
  };

  const validateData = () => {
    const results = [];

    // 验证支付状态和时间的一致性
    if (orderData.payment_status === 'paid' && !orderData.pay_time) {
      results.push({
        field: 'pay_time',
        value: '未设置',
        status: 'error' as const,
        message: '支付状态为已支付时必须设置支付时间'
      });
    } else if (orderData.payment_status !== 'paid' && orderData.pay_time) {
      results.push({
        field: 'pay_time',
        value: orderData.pay_time,
        status: 'warning' as const,
        message: '非已支付状态不应设置支付时间'
      });
    } else if (orderData.payment_status === 'paid' && orderData.pay_time) {
      results.push({
        field: 'pay_time',
        value: new Date(orderData.pay_time).toLocaleString('zh-CN'),
        status: 'success' as const,
        message: '支付时间设置正确'
      });
    }

    // 验证到期日
    if (orderData.due_date) {
      const dueDate = new Date(orderData.due_date);
      const now = new Date();
      const isOverdue = dueDate < now;
      
      results.push({
        field: 'due_date',
        value: dueDate.toLocaleDateString('zh-CN'),
        status: isOverdue ? 'warning' : 'success',
        message: isOverdue ? '订单已过期' : '到期日设置正常'
      });
    }

    // 验证订单状态和支付状态的匹配
    if (orderData.status === 'paid' && orderData.payment_status !== 'paid') {
      results.push({
        field: 'status_consistency',
        value: `订单:${orderData.status}, 支付:${orderData.payment_status}`,
        status: 'error' as const,
        message: '订单状态与支付状态不匹配'
      });
    } else if (orderData.status !== 'paid' && orderData.payment_status === 'paid') {
      results.push({
        field: 'status_consistency',
        value: `订单:${orderData.status}, 支付:${orderData.payment_status}`,
        status: 'warning' as const,
        message: '建议同步更新订单状态为已付款'
      });
    } else {
      results.push({
        field: 'status_consistency',
        value: `订单:${orderData.status}, 支付:${orderData.payment_status}`,
        status: 'success' as const,
        message: '订单状态与支付状态匹配'
      });
    }

    setTestResults(results);
    
    const hasErrors = results.some(r => r.status === 'error');
    const hasWarnings = results.some(r => r.status === 'warning');
    
    if (hasErrors) {
      toast.error('❌ 验证失败，存在错误');
    } else if (hasWarnings) {
      toast.warning('⚠️ 验证通过，但有警告');
    } else {
      toast.success('✅ 验证通过，所有设置正确');
    }
  };

  const resetData = () => {
    setOrderData({
      status: 'reviewed',
      payment_status: 'unpaid',
      due_date: '',
      pay_time: '',
      admin_price: 125.50,
      currency: 'USD'
    });
    setTestResults([]);
    toast.info('🔄 数据已重置');
  };

  const getPaymentStatusInfo = (status: string) => {
    return paymentStatusOptions.find(opt => opt.value === status);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">支付状态与到期日管理测试</h1>
          <p className="text-gray-600 mt-2">
            测试订单状态、支付状态和到期日的管理功能
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：管理面板 */}
          <div className="space-y-6">
            {/* 订单信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  订单基本信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>管理员价格</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={orderData.admin_price}
                      onChange={(e) => handleFieldChange('admin_price', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>币种</Label>
                    <select
                      value={orderData.currency}
                      onChange={(e) => handleFieldChange('currency', e.target.value)}
                      className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="USD">USD - 美元</option>
                      <option value="CNY">CNY - 人民币</option>
                      <option value="EUR">EUR - 欧元</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 状态管理 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  状态管理
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>订单状态</Label>
                    <select
                      value={orderData.status}
                      onChange={(e) => handleFieldChange('status', e.target.value)}
                      className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {orderStatusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>支付状态</Label>
                    <select
                      value={orderData.payment_status}
                      onChange={(e) => handleFieldChange('payment_status', e.target.value)}
                      className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {paymentStatusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>到期日</Label>
                    <Input
                      type="date"
                      value={orderData.due_date}
                      onChange={(e) => handleFieldChange('due_date', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="flex items-center gap-2">
                      支付时间
                      {orderData.payment_status === 'paid' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </Label>
                    <Input
                      type="datetime-local"
                      value={orderData.pay_time}
                      onChange={(e) => handleFieldChange('pay_time', e.target.value)}
                      disabled={orderData.payment_status !== 'paid'}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <Button onClick={validateData} className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                验证数据
              </Button>
              <Button variant="outline" onClick={resetData}>
                重置
              </Button>
            </div>
          </div>

          {/* 右侧：结果显示 */}
          <div className="space-y-6">
            {/* 当前状态展示 */}
            <Card>
              <CardHeader>
                <CardTitle>当前状态预览</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">订单金额:</span>
                    <span className="text-lg font-bold text-gray-900">
                      {orderData.currency === 'CNY' ? '¥' : '$'}{orderData.admin_price}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">订单状态:</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {orderStatusOptions.find(opt => opt.value === orderData.status)?.label}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">支付状态:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusInfo(orderData.payment_status)?.color}`}>
                      {getPaymentStatusInfo(orderData.payment_status)?.label}
                    </span>
                  </div>

                  {orderData.due_date && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">到期日:</span>
                      <span className="text-sm text-gray-900">
                        {new Date(orderData.due_date).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  )}

                  {orderData.pay_time && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">支付时间:</span>
                      <span className="text-sm text-green-600 font-medium">
                        {new Date(orderData.pay_time).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 验证结果 */}
            {testResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>验证结果</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {testResults.map((result, index) => (
                    <Alert key={index} className={
                      result.status === 'success' ? 'border-green-200 bg-green-50' :
                      result.status === 'warning' ? 'border-amber-200 bg-amber-50' :
                      'border-red-200 bg-red-50'
                    }>
                      <div className="flex items-start gap-2">
                        {result.status === 'success' && <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />}
                        {result.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />}
                        {result.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />}
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {result.field}: {result.value}
                          </div>
                          <AlertDescription className="mt-1">
                            {result.message}
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* 功能说明 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  功能说明
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600 space-y-2">
                  <div>
                    <strong className="text-gray-900">🎯 支付状态管理:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>支持7种支付状态：未支付、支付中、已支付等</li>
                      <li>状态切换时自动处理支付时间</li>
                      <li>支付状态与订单状态联动验证</li>
                    </ul>
                  </div>
                  
                  <div>
                    <strong className="text-gray-900">📅 到期日管理:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>可设置订单到期日期</li>
                      <li>自动检测过期状态</li>
                      <li>与支付状态关联提醒</li>
                    </ul>
                  </div>
                  
                  <div>
                    <strong className="text-gray-900">⚡ 智能验证:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>数据一致性检查</li>
                      <li>状态匹配验证</li>
                      <li>时间逻辑验证</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 