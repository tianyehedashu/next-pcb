import React from 'react';
import { Settings, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { QuoteFormData } from '@/app/quote2/schema/quoteSchema';

interface PCBSpecReviewProps {
  pcbFormData: QuoteFormData | null;
}

export function PCBSpecReview({ pcbFormData }: PCBSpecReviewProps) {
  if (!pcbFormData) {
    return (
      <div className="bg-white border-2 border-blue-200 rounded">
        <div className="bg-blue-50 px-3 py-2 border-b">
          <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            PCB技术规格审核
            <Badge variant="outline" className="ml-auto bg-red-100 text-red-700 border-red-300 text-xs">
              核心审核项
            </Badge>
          </h3>
        </div>
        <div className="text-center py-8 text-red-600">
          <AlertCircle className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm font-semibold">⚠️ 缺少PCB规格信息</p>
          <p className="text-xs">无法进行技术审核，请联系客户补充完整的PCB规格</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-blue-200 rounded">
      <div className="bg-blue-50 px-3 py-2 border-b">
        <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          PCB技术规格审核
          <Badge variant="outline" className="ml-auto bg-red-100 text-red-700 border-red-300 text-xs">
            核心审核项
          </Badge>
        </h3>
      </div>
      <div className="p-0">
        <div className="border-t">
          {/* 基本参数表格 */}
          <div className="bg-blue-50 px-4 py-2 border-b">
            <h4 className="text-sm font-semibold text-blue-800">基本参数</h4>
          </div>
          <div className="grid grid-cols-6 text-xs">
            <div className="border-r border-b p-2 bg-gray-50 font-medium">板材类型</div>
            <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.pcbType || 'FR-4'}</div>
            <div className="border-r border-b p-2 bg-gray-50 font-medium">板子层数</div>
            <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.layers || '-'}</div>
            <div className="border-r border-b p-2 bg-gray-50 font-medium">板厚</div>
            <div className="border-b p-2 text-center font-semibold">{pcbFormData.thickness || '1.6'} mm</div>
            
            <div className="border-r border-b p-2 bg-gray-50 font-medium">板子长度</div>
            <div className="border-r border-b p-2 text-center font-semibold">
              {pcbFormData.singleDimensions?.length || '-'} mm
            </div>
            <div className="border-r border-b p-2 bg-gray-50 font-medium">板子宽度</div>
            <div className="border-r border-b p-2 text-center font-semibold">
              {pcbFormData.singleDimensions?.width || '-'} mm
            </div>
            <div className="border-r border-b p-2 bg-gray-50 font-medium">面积</div>
            <div className="border-b p-2 text-center font-semibold">
              {pcbFormData.singleDimensions ? 
                ((pcbFormData.singleDimensions.length * pcbFormData.singleDimensions.width) / 100).toFixed(2) + ' cm²' : '-'}
            </div>
            
            <div className="border-r border-b p-2 bg-gray-50 font-medium">数量类型</div>
            <div className="border-r border-b p-2 text-center font-semibold">
              {pcbFormData.shipmentType === 'single' ? '单片' : 
               pcbFormData.shipmentType === 'panel_by_gerber' ? 'Gerber拼板' :
               pcbFormData.shipmentType === 'panel_by_speedx' ? 'SpeedX拼板' : '-'}
            </div>
            <div className="border-r border-b p-2 bg-gray-50 font-medium">订购数量</div>
            <div className="border-r border-b p-2 text-center font-semibold">
              {pcbFormData.shipmentType === 'single' ? 
                `${pcbFormData.singleCount || '-'} pcs` :
                `${pcbFormData.panelSet || '-'} set`}
            </div>
            <div className="border-r border-b p-2 bg-gray-50 font-medium">板子重量</div>
            <div className="border-b p-2 text-center font-semibold">
              {pcbFormData.singleDimensions ? 
                ((pcbFormData.singleDimensions.length * pcbFormData.singleDimensions.width * Number(pcbFormData.thickness || 1.6) * 1.8) / 1000000).toFixed(3) + ' kg' : '-'}
            </div>
            
            <div className="border-r border-b p-2 bg-gray-50 font-medium">HDI类型</div>
            <div className="border-r border-b p-2 text-center font-semibold text-red-600">
              {pcbFormData.hdi || '无'}
            </div>
            <div className="border-r border-b p-2 bg-gray-50 font-medium">TG等级</div>
            <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.tg || 'Standard'}</div>
            <div className="border-r border-b p-2 bg-gray-50 font-medium">不同设计数</div>
            <div className="border-b p-2 text-center font-semibold">{pcbFormData.differentDesignsCount || '1'}</div>
          </div>

          {/* 工艺参数 */}
          <div className="bg-orange-50 px-4 py-2 border-b">
            <h4 className="text-sm font-semibold text-orange-800">工艺参数</h4>
          </div>
          <div className="grid grid-cols-6 text-xs">
            <div className="border-r border-b p-2 bg-gray-50 font-medium">外层铜厚</div>
            <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.outerCopperWeight || '1'} oz</div>
            <div className="border-r border-b p-2 bg-gray-50 font-medium">内层铜厚</div>
            <div className="border-r border-b p-2 text-center font-semibold">
              {Number(pcbFormData.layers) >= 4 ? (pcbFormData.innerCopperWeight || '0.5') + ' oz' : 'N/A'}
            </div>
            <div className="border-r border-b p-2 bg-gray-50 font-medium">最小线宽/线距</div>
            <div className="border-b p-2 text-center font-semibold">{pcbFormData.minTrace || '6/6'} mil</div>
            
            <div className="border-r border-b p-2 bg-gray-50 font-medium">最小过孔</div>
            <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.minHole || '0.3'} mm</div>
            <div className="border-r border-b p-2 bg-gray-50 font-medium">阻焊颜色</div>
            <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.solderMask || 'Green'}</div>
            <div className="border-r border-b p-2 bg-gray-50 font-medium">丝印颜色</div>
            <div className="border-b p-2 text-center font-semibold">{pcbFormData.silkscreen || 'White'}</div>
            
            <div className="border-r border-b p-2 bg-gray-50 font-medium">表面处理</div>
            <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.surfaceFinish || 'HASL'}</div>
            <div className="border-r border-b p-2 bg-gray-50 font-medium">ENIG厚度</div>
            <div className="border-r border-b p-2 text-center font-semibold">
              {pcbFormData.surfaceFinish === 'ENIG' ? (pcbFormData.surfaceFinishEnigType || 'Standard') : 'N/A'}
            </div>
            <div className="border-r border-b p-2 bg-gray-50 font-medium">过孔工艺</div>
            <div className="border-b p-2 text-center font-semibold">{pcbFormData.maskCover || 'Tented'}</div>
          </div>

          {/* 特殊工艺 */}
          <div className="bg-purple-50 px-4 py-2 border-b">
            <h4 className="text-sm font-semibold text-purple-800">特殊工艺</h4>
          </div>
          <div className="grid grid-cols-6 text-xs">
            <div className="border-r border-b p-2 bg-gray-50 font-medium">阻抗控制</div>
            <div className="border-r border-b p-2 text-center font-semibold text-red-600">
              {pcbFormData.impedance ? '需要' : '不需要'}
            </div>
            <div className="border-r border-b p-2 bg-gray-50 font-medium">金手指</div>
            <div className="border-r border-b p-2 text-center font-semibold text-red-600">
              {pcbFormData.goldFingers ? '需要' : '不需要'}
            </div>
            <div className="border-r border-b p-2 bg-gray-50 font-medium">金手指斜边</div>
            <div className="border-b p-2 text-center font-semibold">
              {pcbFormData.goldFingers && pcbFormData.goldFingersBevel ? '需要' : '不需要'}
            </div>
            
            <div className="border-r border-b p-2 bg-gray-50 font-medium">边缘电镀</div>
            <div className="border-r border-b p-2 text-center font-semibold text-red-600">
              {pcbFormData.edgePlating ? '需要' : '不需要'}
            </div>
            <div className="border-r border-b p-2 bg-gray-50 font-medium">边缘覆盖</div>
            <div className="border-r border-b p-2 text-center font-semibold">
              {pcbFormData.edgePlating ? (pcbFormData.edgeCover || 'No') : 'N/A'}
            </div>
            <div className="border-r border-b p-2 bg-gray-50 font-medium">UL标记</div>
            <div className="border-b p-2 text-center font-semibold">
              {pcbFormData.ulMark ? '需要' : '不需要'}
            </div>
          </div>

          {/* 拼板信息 */}
          {(pcbFormData.shipmentType === 'panel_by_gerber' || pcbFormData.shipmentType === 'panel_by_speedx') && (
            <>
              <div className="bg-indigo-50 px-4 py-2 border-b">
                <h4 className="text-sm font-semibold text-indigo-800">拼板信息</h4>
              </div>
              <div className="grid grid-cols-6 text-xs">
                <div className="border-r border-b p-2 bg-gray-50 font-medium">拼板类型</div>
                <div className="border-r border-b p-2 text-center font-semibold">
                  {pcbFormData.shipmentType === 'panel_by_gerber' ? 'Gerber拼板' : 'SpeedX拼板'}
                </div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">拼板尺寸</div>
                <div className="border-r border-b p-2 text-center font-semibold">
                  {pcbFormData.panelDimensions ? 
                    `${pcbFormData.panelDimensions.row}×${pcbFormData.panelDimensions.column}` : '-'}
                </div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">拼板数量</div>
                <div className="border-b p-2 text-center font-semibold">{pcbFormData.panelSet || '-'} set</div>
                
                {pcbFormData.shipmentType === 'panel_by_speedx' && (
                  <>
                    <div className="border-r border-b p-2 bg-gray-50 font-medium">工艺边</div>
                    <div className="border-r border-b p-2 text-center font-semibold">
                      {pcbFormData.breakAwayRail || 'None'}
                    </div>
                    <div className="border-r border-b p-2 bg-gray-50 font-medium">工艺边宽度</div>
                    <div className="border-r border-b p-2 text-center font-semibold">
                      {pcbFormData.breakAwayRail !== 'None' ? (pcbFormData.border || '5') + 'mm' : 'N/A'}
                    </div>
                    <div className="border-r border-b p-2 bg-gray-50 font-medium">分离方式</div>
                    <div className="border-b p-2 text-center font-semibold">
                      {pcbFormData.breakAwayRail !== 'None' ? (pcbFormData.borderCutType || 'V-Cut') : 'N/A'}
                    </div>
                  </>
                )}
                
                {pcbFormData.pcbNote && (
                  <>
                    <div className="border-r border-b p-2 bg-gray-50 font-medium">拼板备注</div>
                    <div className="border-b p-2 text-center font-semibold col-span-5 text-left px-3">
                      {pcbFormData.pcbNote}
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* 测试与质量 */}
          <div className="bg-green-50 px-4 py-2 border-b">
            <h4 className="text-sm font-semibold text-green-800">测试与质量</h4>
          </div>
          <div className="grid grid-cols-6 text-xs">
            <div className="border-r border-b p-2 bg-gray-50 font-medium">电测方式</div>
            <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.testMethod || 'Flying Probe'}</div>
            <div className="border-r border-b p-2 bg-gray-50 font-medium">工作Gerber</div>
            <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.workingGerber || 'Yes'}</div>
            <div className="border-r border-b p-2 bg-gray-50 font-medium">质量要求</div>
            <div className="border-b p-2 text-center font-semibold">Standard</div>
            
            <div className="border-r border-b p-2 bg-gray-50 font-medium">IPC等级</div>
            <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.ipcClass || 'IPC Class 2'}</div>
            <div className="border-r border-b p-2 bg-gray-50 font-medium">不良品处理</div>
            <div className="border-r border-b p-2 text-center font-semibold">
              {pcbFormData.crossOuts === 'Not Accept' ? '不接受' : '接受'}
            </div>
            <div className="border-r border-b p-2 bg-gray-50 font-medium">数据冲突处理</div>
            <div className="border-b p-2 text-center font-semibold">
              {pcbFormData.ifDataConflicts || 'Contact Customer'}
            </div>
            
            <div className="border-r border-b p-2 bg-gray-50 font-medium">产品报告</div>
            <div className="border-b p-2 text-center font-semibold col-span-5 text-left px-3">
              {Array.isArray(pcbFormData.productReport) ? 
                pcbFormData.productReport.join(', ') : (pcbFormData.productReport || 'None')}
            </div>
          </div>

          {/* 交付信息 */}
          <div className="bg-yellow-50 px-4 py-2 border-b">
            <h4 className="text-sm font-semibold text-yellow-800">交付信息</h4>
          </div>
          <div className="grid grid-cols-4 text-xs">
            <div className="border-r border-b p-2 bg-gray-50 font-medium">交付类型</div>
            <div className="border-r border-b p-2 text-center font-semibold text-red-600">
              {pcbFormData.delivery === 'urgent' ? '加急' : '标准'}
            </div>
            <div className="border-r border-b p-2 bg-gray-50 font-medium">预计交期</div>
            <div className="border-b p-2 text-center font-semibold">
              {pcbFormData.delivery === 'urgent' ? '48小时' : '5-7天'}
            </div>
            
            <div className="border-r border-b p-2 bg-gray-50 font-medium">特殊要求</div>
            <div className="border-b p-2 text-center font-semibold col-span-3 text-left px-3">
              {pcbFormData.specialRequests || '无'}
            </div>
          </div>

          {/* 物流信息 */}
          {pcbFormData.shippingAddress && (
            <>
              <div className="bg-cyan-50 px-4 py-2 border-b">
                <h4 className="text-sm font-semibold text-cyan-800">物流信息</h4>
              </div>
              <div className="grid grid-cols-4 text-xs">
                <div className="border-r border-b p-2 bg-gray-50 font-medium">收货人</div>
                <div className="border-r border-b p-2 text-center font-semibold">
                  {(pcbFormData.shippingAddress as any).contactName || '-'}
                </div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">联系电话</div>
                <div className="border-b p-2 text-center font-semibold">
                  {(pcbFormData.shippingAddress as any).phone || '-'}
                </div>
                
                <div className="border-r border-b p-2 bg-gray-50 font-medium">收货地址</div>
                <div className="border-b p-2 text-center font-semibold col-span-3">
                  {(pcbFormData.shippingAddress as any).address || '-'}, {(pcbFormData.shippingAddress as any).city || '-'}, {(pcbFormData.shippingAddress as any).country || '-'}
                </div>
                
                <div className="border-r border-b p-2 bg-gray-50 font-medium">快递公司</div>
                <div className="border-r border-b p-2 text-center font-semibold">
                  {(pcbFormData.shippingAddress as any).courier || '联邦通'}
                </div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">快递费</div>
                <div className="border-b p-2 text-center font-semibold">0.00</div>
              </div>
            </>
          )}

          {/* 备注信息 */}
          {(pcbFormData.userNote || pcbFormData.specialRequests) && (
            <>
              <div className="bg-gray-50 px-4 py-2 border-b">
                <h4 className="text-sm font-semibold text-gray-800">备注信息</h4>
              </div>
              <div className="p-3 text-xs">
                {pcbFormData.userNote && (
                  <div className="mb-2">
                    <span className="font-medium text-gray-600">用户备注：</span>
                    <span>{pcbFormData.userNote}</span>
                  </div>
                )}
                {pcbFormData.specialRequests && (
                  <div>
                    <span className="font-medium text-gray-600">特殊要求：</span>
                    <span>{pcbFormData.specialRequests}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 