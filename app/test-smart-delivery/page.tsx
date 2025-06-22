'use client';

import React, { useState } from 'react';
import { Calendar, Clock, Zap, AlertCircle, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  calculateSmartDeliveryDate, 
  checkIsWorkingDay, 
  getNextWorkingDay,
  calculateWorkingDaysBetween 
} from '@/lib/utils/deliveryDateCalculator';

export default function TestSmartDeliveryPage() {
  const [productionDays, setProductionDays] = useState(5);
  const [isUrgent, setIsUrgent] = useState(false);
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [customDate, setCustomDate] = useState('');

  const handleCalculate = () => {
    try {
      const result = calculateSmartDeliveryDate(productionDays, new Date(), isUrgent);
      setCalculationResult(result);
      
      toast.success(`📅 交期计算完成${isUrgent ? ' (加急模式)' : ''}`, {
        description: `预计交期: ${new Date(result.deliveryDate).toLocaleDateString('zh-CN')}`,
        duration: 3000
      });
    } catch (error) {
      console.error('计算失败:', error);
      toast.error('计算失败，请重试');
    }
  };

  const checkCustomDate = () => {
    if (!customDate) return;
    
    const selectedDate = new Date(customDate);
    const isWorkingDay = checkIsWorkingDay(selectedDate);
    const nextWorkingDay = getNextWorkingDay(selectedDate);
    
    if (isWorkingDay) {
      toast.success(`✅ ${selectedDate.toLocaleDateString('zh-CN')} 是工作日`);
    } else {
      toast.warning(`⚠️ ${selectedDate.toLocaleDateString('zh-CN')} 是非工作日`, {
        description: `下一个工作日: ${nextWorkingDay.toLocaleDateString('zh-CN')}`,
        duration: 4000
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">智能交期计算测试</h1>
          <p className="text-gray-600">测试智能交期计算功能，考虑节假日和工作日</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 交期计算器 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              交期计算器
            </h2>

            <div className="space-y-4">
              {/* 生产天数 */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  生产天数
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={productionDays}
                  onChange={(e) => setProductionDays(Number(e.target.value))}
                  className="w-full"
                  placeholder="输入生产天数"
                />
              </div>

              {/* 加急选项 */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
                <label htmlFor="urgent" className="flex items-center gap-2 text-sm cursor-pointer">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span className="text-orange-600 font-medium">加急订单</span>
                  <span className="text-gray-500">(减少1-2个工作日)</span>
                </label>
              </div>

              {/* 计算按钮 */}
              <Button 
                onClick={handleCalculate}
                className="w-full"
                disabled={!productionDays || productionDays < 1}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                计算交期
              </Button>
            </div>

            {/* 计算结果 */}
            {calculationResult && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-3">📋 计算结果</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">预计交期:</span>
                    <span className="font-medium text-blue-700">
                      {new Date(calculationResult.deliveryDate).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">实际工作日:</span>
                    <span className="font-medium">{calculationResult.actualWorkingDays}天</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">总日历天数:</span>
                    <span className="font-medium">{calculationResult.totalCalendarDays}天</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">跳过的天数:</span>
                    <span className="font-medium text-orange-600">{calculationResult.skippedDays.length}天</span>
                  </div>
                  {calculationResult.isUrgent && (
                    <div className="flex items-center gap-1 text-orange-600">
                      <Zap className="w-3 h-3" />
                      <span className="text-xs">加急处理</span>
                    </div>
                  )}
                </div>

                {/* 计算详情 */}
                <div className="mt-4 p-3 bg-white border border-blue-100 rounded text-xs">
                  <div className="font-medium text-gray-700 mb-2">💡 计算过程:</div>
                  <div className="space-y-1 text-gray-600">
                    {calculationResult.reason.map((item: string, index: number) => (
                      <div key={index}>{item}</div>
                    ))}
                  </div>
                </div>

                {/* 跳过的日期 */}
                {calculationResult.skippedDays.length > 0 && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded text-xs">
                    <div className="font-medium text-orange-700 mb-2">⏭️ 跳过的日期:</div>
                    <div className="space-y-1 text-orange-600">
                      {calculationResult.skippedDays.slice(0, 5).map((day: string, index: number) => (
                        <div key={index}>{day}</div>
                      ))}
                      {calculationResult.skippedDays.length > 5 && (
                        <div className="text-orange-500">... 还有 {calculationResult.skippedDays.length - 5} 天</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 日期检查器 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-green-500" />
              工作日检查器
            </h2>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  选择日期
                </Label>
                <Input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full"
                />
              </div>

              <Button 
                onClick={checkCustomDate}
                variant="outline"
                className="w-full"
                disabled={!customDate}
              >
                检查是否为工作日
              </Button>

              {customDate && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">选中日期:</span>
                      <span className="font-medium">
                        {new Date(customDate).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'long'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">是否工作日:</span>
                      <span className={`font-medium ${checkIsWorkingDay(new Date(customDate)) ? 'text-green-600' : 'text-orange-600'}`}>
                        {checkIsWorkingDay(new Date(customDate)) ? '✅ 是' : '❌ 否'}
                      </span>
                    </div>
                    {!checkIsWorkingDay(new Date(customDate)) && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">下个工作日:</span>
                        <span className="font-medium text-blue-600">
                          {getNextWorkingDay(new Date(customDate)).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 节假日说明 */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-2">📅 节假日配置</h3>
              <div className="text-xs text-yellow-700 space-y-1">
                <div>• 包含2024-2025年中国法定节假日</div>
                <div>• 自动处理调休工作日</div>
                <div>• 排除周末（周六、周日）</div>
                <div>• 智能计算仅工作日</div>
              </div>
            </div>
          </div>
        </div>

        {/* 功能说明 */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">🚀 功能特性</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-medium text-blue-800 mb-2">🎯 智能计算</div>
              <div className="text-blue-700">
                自动排除节假日和周末，仅计算实际工作日，确保交期准确性
              </div>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="font-medium text-green-800 mb-2">⚡ 加急处理</div>
              <div className="text-green-700">
                支持加急订单，自动减少1-2个工作日，最少保证1天生产时间
              </div>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="font-medium text-purple-800 mb-2">📋 详细说明</div>
              <div className="text-purple-700">
                提供完整的计算过程和跳过的日期清单，便于确认和调整
              </div>
            </div>
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="font-medium text-orange-800 mb-2">🔄 自动更新</div>
              <div className="text-orange-700">
                修改生产天数或加急状态时，自动重新计算预计交期
              </div>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="font-medium text-yellow-800 mb-2">📅 节假日支持</div>
              <div className="text-yellow-700">
                内置2024-2025年中国法定节假日和调休工作日配置
              </div>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="font-medium text-gray-800 mb-2">⚠️ 智能提醒</div>
              <div className="text-gray-700">
                选择非工作日时自动提醒，帮助用户做出正确的交期安排
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 