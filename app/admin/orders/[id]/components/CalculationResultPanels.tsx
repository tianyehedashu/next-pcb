import React from 'react';
import { DollarSign, Clock, AlertCircle, Calculator, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { QuoteFormData } from '@/app/quote2/schema/quoteSchema';
import { calcPcbPriceV3 } from '@/lib/pcb-calc-v3';
import { calcProductionCycle } from '@/lib/productCycleCalc-v3';

interface CalculationResultPanelsProps {
  pcbFormData: QuoteFormData | null;
  calculationNotes: string[];
  deliveryNotes: string[];
  shippingNotes: {
    basicInfo: string;
    weightInfo: string;
    costBreakdown: string[];
  };
}

export function CalculationResultPanels({
  pcbFormData,
  calculationNotes,
  deliveryNotes,
  shippingNotes
}: CalculationResultPanelsProps) {
  return (
    <div className="space-y-3">
      {/* 价格计算结果 */}
      <div className="bg-white border rounded">
        <div className="bg-green-50 px-3 py-2 border-b">
          <h3 className="text-sm font-semibold text-green-800 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            价格计算结果
            {pcbFormData && calculationNotes.length > 0 && (
              <Badge variant="outline" className="ml-auto bg-green-100 text-green-700 border-green-300 text-xs">
                ✓ 已自动计算
              </Badge>
            )}
          </h3>
        </div>
        <div className="p-3">
          {pcbFormData ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">PCB基础价:</span>
                    <span className="font-semibold">
                      {(() => {
                        try {
                          const result = calcPcbPriceV3(pcbFormData);
                          return `¥${Number(result.total).toFixed(2)}`;
                        } catch {
                          return '计算中...';
                        }
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">工程费:</span>
                    <span className="font-semibold">¥50.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">阻抗费:</span>
                    <span className={`font-semibold ${pcbFormData.impedance ? 'text-red-600' : 'text-gray-400'}`}>
                      {pcbFormData.impedance ? '¥50.00' : '¥0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">金手指费:</span>
                    <span className={`font-semibold ${pcbFormData.goldFingers ? 'text-red-600' : 'text-gray-400'}`}>
                      {pcbFormData.goldFingers ? '¥30.00' : '¥0.00'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">加急费:</span>
                    <span className={`font-semibold ${pcbFormData.delivery === 'urgent' ? 'text-red-600' : 'text-gray-400'}`}>
                      {pcbFormData.delivery === 'urgent' ? '¥100.00' : '¥0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">边缘电镀:</span>
                    <span className={`font-semibold ${pcbFormData.edgePlating ? 'text-red-600' : 'text-gray-400'}`}>
                      {pcbFormData.edgePlating ? '¥25.00' : '¥0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">运费:</span>
                    <span className="font-semibold">¥15.00</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-800 font-medium">预估总价:</span>
                    <span className="font-bold text-green-600">
                      {(() => {
                        try {
                          const result = calcPcbPriceV3(pcbFormData);
                          let total = Number(result.total) + 50 + 15;
                          if (pcbFormData.impedance) total += 50;
                          if (pcbFormData.goldFingers) total += 30;
                          if (pcbFormData.edgePlating) total += 25;
                          if (pcbFormData.delivery === 'urgent') total += 100;
                          return `¥${total.toFixed(2)}`;
                        } catch {
                          return '¥0.00';
                        }
                      })()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-green-200 bg-green-50 rounded p-2">
                <div className="text-xs font-medium text-green-800 mb-2">💰 价格计算明细</div>
                <div className="space-y-1 text-xs text-green-700">
                  {calculationNotes.length > 0 ? (
                    calculationNotes.map((note, i) => (
                      <div key={i} className="bg-green-100 p-1.5 rounded text-xs">
                        • {note}
                      </div>
                    ))
                  ) : (
                    <div className="text-green-600">点击&quot;计算价格&quot;查看详细计算过程</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 text-xs">
              <Calculator className="w-6 h-6 mx-auto mb-1" />
              <p>需要PCB规格才能计算价格</p>
            </div>
          )}
        </div>
      </div>

      {/* 交期计算结果 */}
      <div className="bg-white border rounded">
        <div className="bg-purple-50 px-3 py-2 border-b">
          <h3 className="text-sm font-semibold text-purple-800 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            交期计算结果
            {pcbFormData && deliveryNotes.length > 0 && (
              <Badge variant="outline" className="ml-auto bg-purple-100 text-purple-700 border-purple-300 text-xs">
                ✓ 已自动计算
              </Badge>
            )}
          </h3>
        </div>
        <div className="p-3">
          {pcbFormData ? (
            <>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">基础周期:</span>
                  <span className="font-semibold">
                    {pcbFormData.delivery === 'urgent' ? '2天' : '5天'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">层数影响:</span>
                  <span className="font-semibold">
                    {Number(pcbFormData.layers) > 4 ? '+1天' : '标准'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">特殊工艺:</span>
                  <span className="font-semibold">
                    {(pcbFormData.goldFingers || pcbFormData.edgePlating || pcbFormData.impedance) ? '+1-2天' : '无'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">交付类型:</span>
                  <span className={`font-semibold ${pcbFormData.delivery === 'urgent' ? 'text-red-600' : 'text-green-600'}`}>
                    {pcbFormData.delivery === 'urgent' ? '加急48h' : '标准5-7天'}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-800 font-medium">总生产周期:</span>
                  <span className="font-bold text-purple-600">
                    {(() => {
                      try {
                        const cycle = calcProductionCycle(pcbFormData, new Date(), pcbFormData?.delivery);
                        return `${cycle.cycleDays}天`;
                      } catch {
                        return '计算中...';
                      }
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">预计完成:</span>
                  <span className="font-semibold text-purple-800">
                    {(() => {
                      try {
                        const cycle = calcProductionCycle(pcbFormData, new Date(), pcbFormData?.delivery);
                        const targetDate = new Date();
                        targetDate.setDate(targetDate.getDate() + cycle.cycleDays);
                        return targetDate.toLocaleDateString('zh-CN');
                      } catch {
                        return '计算中...';
                      }
                    })()}
                  </span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-purple-200 bg-purple-50 rounded p-2">
                <div className="text-xs font-medium text-purple-800 mb-2">⏰ 交期计算明细</div>
                <div className="space-y-1 text-xs text-purple-700">
                  {deliveryNotes.length > 0 ? (
                    deliveryNotes.map((note, i) => (
                      <div key={i} className="bg-purple-100 p-1.5 rounded text-xs">
                        • {note}
                      </div>
                    ))
                  ) : (
                    <div className="text-purple-600">点击&quot;计算交期&quot;查看详细计算过程</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 text-xs">
              <Clock className="w-6 h-6 mx-auto mb-1" />
              <p>需要PCB规格才能计算交期</p>
            </div>
          )}
        </div>
      </div>

      {/* 重量和运费计算 */}
      <div className="bg-white border rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Truck className="w-4 h-4" />
            运费计算
            <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
              ✓ 已自动计算
            </span>
          </h3>
        </div>
        
        <div className="space-y-2 text-xs">
          {/* 基本信息 */}
          <div className="flex justify-between">
            <span className="text-gray-600">运费信息:</span>
            <span className="font-medium text-blue-600">
              {shippingNotes.basicInfo || '待计算'}
            </span>
          </div>
          
          {/* 重量信息 */}
          {shippingNotes.weightInfo && (
            <div className="flex justify-between">
              <span className="text-gray-600">重量信息:</span>
              <span className="text-gray-800 text-right">
                {shippingNotes.weightInfo}
              </span>
            </div>
          )}
          
          {/* 运费明细 */}
          {shippingNotes.costBreakdown.length > 0 && (
            <div className="mt-2 pt-2 border-t">
              <div className="text-xs text-gray-500 mb-1">🚢 运费明细:</div>
              <div className="space-y-1 bg-blue-50 rounded p-2">
                {shippingNotes.costBreakdown.map((item, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-blue-700">
                      {item.split(':')[0]}:
                    </span>
                    <span className="font-mono text-blue-900">
                      {item.split(':')[1]?.trim()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-1 text-xs text-orange-600">
                💡 运费计算基于人民币，存储时已按汇率转换
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 价格对比 */}
      <div className="bg-white border rounded">
        <div className="bg-orange-50 px-3 py-2 border-b">
          <h3 className="text-sm font-semibold text-orange-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            价格对比
          </h3>
        </div>
        <div className="p-3">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">客户询价:</span>
              <span className="font-semibold text-blue-600">-</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">系统计算:</span>
              <span className="font-semibold text-green-600">
                {pcbFormData ? (
                  (() => {
                    try {
                      const result = calcPcbPriceV3(pcbFormData);
                      let total = Number(result.total) + 50 + 15;
                      if (pcbFormData.impedance) total += 50;
                      if (pcbFormData.goldFingers) total += 30;
                      if (pcbFormData.edgePlating) total += 25;
                      if (pcbFormData.delivery === 'urgent') total += 100;
                      return `¥${total.toFixed(2)}`;
                    } catch {
                      return '¥0.00';
                    }
                  })()
                ) : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">管理员价格:</span>
              <span className="font-semibold text-purple-600">待设置</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-gray-800 font-medium">差异:</span>
              <span className="font-bold text-orange-600">-</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 