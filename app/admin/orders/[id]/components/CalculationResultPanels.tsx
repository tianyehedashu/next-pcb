import React from 'react';
import { QuoteFormData } from '@/app/quote2/schema/quoteSchema';
import { calcPcbPriceV3 } from '@/lib/pcb-calc-v3';
import { calcProductionCycle } from '@/lib/productCycleCalc-v3';
import { calculateUrgentFee, isUrgentSupported } from '@/lib/urgentDeliverySystem-v4';
import { calculateTotalPcbArea } from '@/lib/utils/precision';
import { StencilCalculator } from '@/lib/calculators/stencilCalculator';

interface CalculationResultPanelsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: any; // 完整的订单数据
  pcbFormData?: QuoteFormData | null; // 向后兼容
  calculationNotes: string[];
  deliveryNotes: string[];
  shippingNotes: {
    basicInfo: string;
    weightInfo: string;
    costBreakdown: string[];
  };
}

// 简化的产品类型检测
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getProductType(order: any): 'pcb' | 'stencil' {
  return order?.product_type === 'stencil' ? 'stencil' : 'pcb';
}

function getProductDisplayName(productType: 'pcb' | 'stencil'): string {
  return productType === 'stencil' ? '钢网' : 'PCB';
}

// PCB价格计算组件
function PCBPriceCalculation({ pcbFormData, calculationNotes }: { pcbFormData: QuoteFormData; calculationNotes: string[] }) {
  return (
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
  );
}

// 钢网价格计算组件
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StencilPriceCalculation({ stencilFormData, calculationNotes }: { stencilFormData: any; calculationNotes: string[] }) {
  return (
    <>
      <div className="space-y-1 text-sm">
        {(() => {
          try {
            const calculator = new StencilCalculator();
            const result = calculator.calculatePrice(stencilFormData);
            const breakdown = result.breakdown || {};
            
            return (
              <>
                <div className="flex justify-between">
                  <span>钢网基础价</span>
                  <span className="font-mono">${breakdown.basePrice?.toFixed(2) || '0.00'}</span>
                </div>
                
                {breakdown.processAddons && breakdown.processAddons > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>工艺加价</span>
                    <span className="font-mono">+${breakdown.processAddons.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between border-t pt-1 mt-2">
                  <span className="font-medium">预估总价</span>
                  <span className="font-mono font-bold">${result.totalPrice.toFixed(2)}</span>
                </div>
              </>
            );
          } catch (error) {
            console.error('钢网价格计算错误:', error);
            return (
              <div className="flex justify-between">
                <span>钢网价格</span>
                <span className="font-mono text-red-500">计算错误</span>
              </div>
            );
          }
        })()}
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
  );
}

// PCB交期计算组件
function PCBDeliveryCalculation({ pcbFormData }: { pcbFormData: QuoteFormData }) {
  return (
    <div className="space-y-1 text-sm">
      <div className="flex justify-between">
        <span>PCB基础周期</span>
        <span>
          {(() => {
            try {
              const cycle = calcProductionCycle(pcbFormData, new Date(), pcbFormData?.deliveryOptions?.delivery);
              return `${cycle.cycleDays}天`;
            } catch {
              return '2-3天';
            }
          })()}
        </span>
      </div>
      
      {pcbFormData.deliveryOptions?.delivery === 'urgent' && (
        <div className="flex justify-between text-red-600">
          <span>加急处理</span>
          <span>-{pcbFormData.deliveryOptions?.urgentReduceDays || 1}天</span>
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
    </div>
  );
}

// 钢网交期计算组件
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StencilDeliveryCalculation({ stencilFormData }: { stencilFormData: any }) {
  return (
    <div className="space-y-1 text-sm">


      <div className="flex justify-between border-t pt-1 mt-2">
        <span className="font-medium">总制造周期</span>
        <span className="font-mono font-bold">
          {(() => {
            try {
              const calculator = new StencilCalculator();
              const leadTime = calculator.calculateLeadTime(stencilFormData);
              return `${leadTime}天`;
            } catch {
              return '3-5天';
            }
          })()}
        </span>
      </div>
    </div>
  );
}

// 未支持产品类型的占位组件
function UnsupportedProductCalculation({ productType }: { productType: 'pcb' | 'stencil' }) {
  const productDisplayName = getProductDisplayName(productType);
  
  return (
    <div className="text-center text-gray-500 py-4">
      <div className="text-sm mb-2">
        {productDisplayName} 计算功能开发中
      </div>
      <div className="text-xs text-gray-400">
        敬请期待后续版本支持
      </div>
    </div>
  );
}

export function CalculationResultPanels({
  order,
  pcbFormData, // 向后兼容
  calculationNotes,
  deliveryNotes,
  shippingNotes
}: CalculationResultPanelsProps) {
  // 判断产品类型
  const productType = getProductType(order);
  const productDisplayName = getProductDisplayName(productType);
  
  // 获取对应的规格数据
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let specData: any = null;
  if (productType === 'stencil') {
    specData = order?.stencil_spec;
  } else if (productType === 'pcb') {
    specData = order?.pcb_spec || pcbFormData; // 向后兼容
  }
  
  // 简化的计算支持判断
  const calculationSupported = productType === 'pcb' || productType === 'stencil';
  
  return (
    <div className="space-y-3">
      {/* 价格计算结果 */}
      <div className="bg-white border rounded">
        <div className="bg-gray-50 px-3 py-2 border-b">
          <h3 className="text-sm font-medium text-gray-700">
            {productDisplayName}价格计算结果
          </h3>
        </div>
        <div className="p-3">
          {!calculationSupported ? (
            <UnsupportedProductCalculation productType={productType} />
          ) : !specData ? (
            <div className="text-center text-gray-500 text-sm py-4">
              需要{productDisplayName}规格才能计算价格
            </div>
          ) : productType === 'stencil' ? (
            <StencilPriceCalculation 
              stencilFormData={specData} 
              calculationNotes={calculationNotes} 
            />
          ) : productType === 'pcb' ? (
            <PCBPriceCalculation 
              pcbFormData={specData as QuoteFormData} 
              calculationNotes={calculationNotes} 
            />
          ) : (
            <UnsupportedProductCalculation productType={productType} />
          )}
        </div>
      </div>

      {/* 交期计算结果 */}
      <div className="bg-white border rounded">
        <div className="bg-gray-50 px-3 py-2 border-b">
          <h3 className="text-sm font-medium text-gray-700">
            {productDisplayName}交期计算结果
          </h3>
        </div>
        <div className="p-3">
          {!calculationSupported ? (
            <UnsupportedProductCalculation productType={productType} />
          ) : !specData ? (
            <div className="text-center text-gray-500 text-sm py-4">
              需要{productDisplayName}规格才能计算交期
            </div>
          ) : productType === 'stencil' ? (
            <StencilDeliveryCalculation stencilFormData={specData} />
          ) : productType === 'pcb' ? (
            <PCBDeliveryCalculation pcbFormData={specData as QuoteFormData} />
          ) : (
            <UnsupportedProductCalculation productType={productType} />
          )}
          
          {deliveryNotes.length > 0 && (
            <div className="mt-3 pt-3 border-t bg-gray-50 rounded p-2">
              <div className="text-xs font-medium text-gray-600 mb-1">交期说明</div>
              <div className="space-y-1 text-xs text-gray-600">
                {deliveryNotes.map((note, i) => (
                  <div key={i}>• {note}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 运费信息 */}
      {(shippingNotes.basicInfo || shippingNotes.weightInfo || shippingNotes.costBreakdown.length > 0) && (
        <div className="bg-white border rounded">
          <div className="bg-gray-50 px-3 py-2 border-b">
            <h3 className="text-sm font-medium text-gray-700">运费计算信息</h3>
          </div>
          <div className="p-3 space-y-2">
            {shippingNotes.basicInfo && (
              <div className="text-xs text-gray-600">
                <div className="font-medium mb-1">基本信息</div>
                <div>{shippingNotes.basicInfo}</div>
              </div>
            )}
            
            {shippingNotes.weightInfo && (
              <div className="text-xs text-gray-600">
                <div className="font-medium mb-1">重量信息</div>
                <div>{shippingNotes.weightInfo}</div>
              </div>
            )}
            
            {shippingNotes.costBreakdown.length > 0 && (
              <div className="text-xs text-gray-600">
                <div className="font-medium mb-1">费用明细</div>
                <div className="space-y-1">
                  {shippingNotes.costBreakdown.map((note, i) => (
                    <div key={i}>• {note}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 