import React from 'react';
import { QuoteFormData } from '@/app/quote2/schema/quoteSchema';
import { calcPcbPriceV3 } from '@/lib/pcb-calc-v3';
import { calcProductionCycle } from '@/lib/productCycleCalc-v3';
import { calculateUrgentFee, isUrgentSupported } from '@/lib/urgentDeliverySystem-v4';
import { calculateTotalPcbArea } from '@/lib/utils/precision';

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
        <div className="bg-gray-50 px-3 py-2 border-b">
          <h3 className="text-sm font-medium text-gray-700">价格计算结果</h3>
        </div>
        <div className="p-3">
          {pcbFormData ? (
            <>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>PCB基础价</span>
                  <span className="font-mono">
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
                
                {pcbFormData.impedance && (
                  <div className="flex justify-between text-red-600">
                    <span>阻抗控制</span>
                    <span className="font-mono">¥50.00</span>
                  </div>
                )}
                
                {pcbFormData.goldFingers && (
                  <div className="flex justify-between text-red-600">
                    <span>金手指</span>
                    <span className="font-mono">¥30.00</span>
                  </div>
                )}
                
                {pcbFormData.edgePlating && (
                  <div className="flex justify-between text-red-600">
                    <span>边缘电镀</span>
                    <span className="font-mono">¥25.00</span>
                  </div>
                )}
                
                {(pcbFormData.deliveryOptions?.delivery === 'urgent') && (() => {
                  try {
                    const { totalArea } = calculateTotalPcbArea(pcbFormData);
                    const urgentReduceDays = pcbFormData.deliveryOptions?.urgentReduceDays || 0;
                    if (isUrgentSupported(pcbFormData, totalArea) && urgentReduceDays > 0) {
                      const feeInfo = calculateUrgentFee(pcbFormData, totalArea, urgentReduceDays);
                      if (feeInfo.supported) {
                        return (
                          <div className="flex justify-between text-red-600">
                            <span>加急费</span>
                            <span className="font-mono">¥{feeInfo.fee.toFixed(2)}</span>
                          </div>
                        );
                      }
                    }
                    // 回退到固定费用
                    return (
                      <div className="flex justify-between text-red-600">
                        <span>加急费</span>
                        <span className="font-mono">¥100.00</span>
                      </div>
                    );
                  } catch {
                    return (
                      <div className="flex justify-between text-red-600">
                        <span>加急费</span>
                        <span className="font-mono">¥100.00</span>
                      </div>
                    );
                  }
                })()}
                
                <div className="flex justify-between border-t pt-1 mt-2">
                  <span className="font-medium">预估总价</span>
                  <span className="font-mono font-bold">
                    {(() => {
                      try {
                        const result = calcPcbPriceV3(pcbFormData);
                        let total = Number(result.total);
                        if (pcbFormData.impedance) total += 50;
                        if (pcbFormData.goldFingers) total += 30;
                        if (pcbFormData.edgePlating) total += 25;
                        if (pcbFormData.deliveryOptions?.delivery === 'urgent') {
                          try {
                            const { totalArea } = calculateTotalPcbArea(pcbFormData);
                            const urgentReduceDays = pcbFormData.deliveryOptions?.urgentReduceDays || 0;
                            if (isUrgentSupported(pcbFormData, totalArea) && urgentReduceDays > 0) {
                              const feeInfo = calculateUrgentFee(pcbFormData, totalArea, urgentReduceDays);
                              if (feeInfo.supported) {
                                total += feeInfo.fee;
                              } else {
                                total += 100; // 回退费用
                              }
                            } else {
                              total += 100; // 回退费用
                            }
                          } catch {
                            total += 100; // 错误时回退费用
                          }
                        }
                        return `¥${total.toFixed(2)}`;
                      } catch {
                        return '¥0.00';
                      }
                    })()}
                  </span>
                </div>
              </div>
              
              {calculationNotes.length > 0 && (
                <div className="mt-3 pt-3 border-t bg-gray-50 rounded p-2">
                  <div className="text-xs font-medium text-gray-600 mb-1">计算明细</div>
                  <div className="space-y-1 text-xs text-gray-600">
                    {calculationNotes.map((note, i) => (
                      <div key={i}>• {note}</div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 text-sm py-4">
              需要PCB规格才能计算价格
            </div>
          )}
        </div>
      </div>

      {/* 交期计算结果 */}
      <div className="bg-white border rounded">
        <div className="bg-gray-50 px-3 py-2 border-b">
          <h3 className="text-sm font-medium text-gray-700">交期计算结果</h3>
        </div>
        <div className="p-3">
          {pcbFormData ? (
            <>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>基础周期</span>
                  <span>{pcbFormData.deliveryOptions?.delivery === 'urgent' ? '2天' : '5天'}</span>
                </div>
                
                {Number(pcbFormData.layers) > 4 && (
                  <div className="flex justify-between text-orange-600">
                    <span>多层板延期</span>
                    <span>+1天</span>
                  </div>
                )}
                
                {(pcbFormData.goldFingers || pcbFormData.edgePlating || pcbFormData.impedance) && (
                  <div className="flex justify-between text-orange-600">
                    <span>特殊工艺延期</span>
                    <span>+1-2天</span>
                  </div>
                )}
                
                <div className="flex justify-between border-t pt-1 mt-2">
                  <span className="font-medium">总生产周期</span>
                  <span className="font-mono font-bold">
                    {(() => {
                      try {
                        const cycle = calcProductionCycle(pcbFormData, new Date(), pcbFormData?.deliveryOptions?.delivery);
                        return `${cycle.cycleDays}天`;
                      } catch {
                        return '计算中...';
                      }
                    })()}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>预计完成</span>
                  <span className="font-mono">
                    {(() => {
                      try {
                        const cycle = calcProductionCycle(pcbFormData, new Date(), pcbFormData?.deliveryOptions?.delivery);
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
              
              {deliveryNotes.length > 0 && (
                <div className="mt-3 pt-3 border-t bg-gray-50 rounded p-2">
                  <div className="text-xs font-medium text-gray-600 mb-1">交期明细</div>
                  <div className="space-y-1 text-xs text-gray-600">
                    {deliveryNotes.map((note, i) => (
                      <div key={i}>• {note}</div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 text-sm py-4">
              需要PCB规格才能计算交期
            </div>
          )}
        </div>
      </div>

      {/* 运费计算 */}
      {(shippingNotes.basicInfo || shippingNotes.weightInfo || shippingNotes.costBreakdown.length > 0) && (
        <div className="bg-white border rounded">
          <div className="bg-gray-50 px-3 py-2 border-b">
            <h3 className="text-sm font-medium text-gray-700">运费计算</h3>
          </div>
          <div className="p-3">
            <div className="space-y-1 text-sm">
              {shippingNotes.basicInfo && (
                <div className="flex justify-between">
                  <span>运费</span>
                  <span className="font-mono">{shippingNotes.basicInfo}</span>
                </div>
              )}
              
              {shippingNotes.weightInfo && (
                <div className="flex justify-between">
                  <span>重量</span>
                  <span className="font-mono">{shippingNotes.weightInfo}</span>
                </div>
              )}
              
              {shippingNotes.costBreakdown.length > 0 && (
                <div className="mt-2 pt-2 border-t">
                  <div className="text-xs font-medium text-gray-600 mb-1">运费明细</div>
                  <div className="space-y-1 text-xs text-gray-600">
                    {shippingNotes.costBreakdown.map((item, index) => (
                      <div key={index}>• {item}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 