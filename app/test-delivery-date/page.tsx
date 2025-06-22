'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar, Clock } from 'lucide-react';

export default function TestDeliveryDatePage() {
  const [productionDays, setProductionDays] = useState<string>('5');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [autoCalculate, setAutoCalculate] = useState(true);

  // 自动计算预计交期
  const calculateDeliveryDate = (days: string) => {
    if (!days || isNaN(Number(days))) return '';
    
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + Number(days));
    
    return targetDate.toISOString().split('T')[0];
  };

  // 处理生产天数变化
  const handleProductionDaysChange = (value: string) => {
    setProductionDays(value);
    
    if (autoCalculate) {
      const calculatedDate = calculateDeliveryDate(value);
      setDeliveryDate(calculatedDate);
    }
  };

  // 手动设置今天日期
  const setToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setDeliveryDate(today);
  };

  // 根据生产天数计算
  const calculateFromDays = () => {
    const calculatedDate = calculateDeliveryDate(productionDays);
    setDeliveryDate(calculatedDate);
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            预计交期设置测试
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 生产天数输入 */}
          <div className="space-y-2">
            <Label htmlFor="production-days" className="text-sm font-medium">
              生产天数
            </Label>
            <div className="flex gap-2">
              <Input
                id="production-days"
                type="number"
                min="1"
                value={productionDays}
                onChange={(e) => handleProductionDaysChange(e.target.value)}
                placeholder="输入生产天数"
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={calculateFromDays}
                className="flex items-center gap-1"
              >
                <Clock className="w-4 h-4" />
                计算
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              输入生产周期天数，系统会自动计算预计交期
            </p>
          </div>

          {/* 预计交期输入 */}
          <div className="space-y-2">
            <Label htmlFor="delivery-date" className="text-sm font-medium">
              预计交期 📅
            </Label>
            <div className="flex gap-2">
              <Input
                id="delivery-date"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={setToday}
                className="flex items-center gap-1"
              >
                <Calendar className="w-4 h-4" />
                今天
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              可以手动设置具体的交期日期
            </p>
          </div>

          {/* 自动计算开关 */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="auto-calculate"
              checked={autoCalculate}
              onChange={(e) => setAutoCalculate(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="auto-calculate" className="text-sm">
              自动根据生产天数计算预计交期
            </Label>
          </div>

          {/* 结果显示 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">设置结果</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">生产天数:</span>
                <span className="font-mono text-blue-900">{productionDays || '未设置'} 天</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">预计交期:</span>
                <span className="font-mono text-blue-900">
                  {deliveryDate ? new Date(deliveryDate).toLocaleDateString('zh-CN') : '未设置'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">ISO格式:</span>
                <span className="font-mono text-blue-900 text-xs">
                  {deliveryDate || '未设置'}
                </span>
              </div>
            </div>
          </div>

          {/* 使用说明 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">功能说明</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• 管理员可以设置生产天数，系统自动计算预计交期</li>
              <li>• 也可以直接手动设置具体的交期日期</li>
              <li>• 支持自动计算模式和手动设置模式</li>
              <li>• 日期格式为 YYYY-MM-DD，便于数据库存储</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 