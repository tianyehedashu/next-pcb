import React from 'react';
import { Settings, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { QuoteFormData } from '@/app/quote2/schema/quoteSchema';
import { AddressFormValue } from '@/app/quote2/components/AddressFormComponent';
import { ProductReport } from '@/types/form';

interface PCBSpecReviewProps {
  pcbFormData: QuoteFormData | null;
  shippingAddress?: AddressFormValue | null;
}

export function PCBSpecReview({ pcbFormData, shippingAddress: externalShippingAddress }: PCBSpecReviewProps) {
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

  // 优先使用外部传入的地址，如果没有则从pcbFormData中获取
  const shippingAddress = externalShippingAddress || (pcbFormData.shippingAddress as AddressFormValue | undefined);

  // 定义规格数据结构
  const basicSpecs = [
    { label: '板材类型', value: String(pcbFormData.pcbType || 'FR-4') },
    { label: '板子层数', value: String(pcbFormData.layers || '-') },
    { label: '板厚', value: `${pcbFormData.thickness || '1.6'} mm` },
    { label: '板子长度', value: `${pcbFormData.singleDimensions?.length || '-'} mm` },
    { label: '板子宽度', value: `${pcbFormData.singleDimensions?.width || '-'} mm` },

    { 
      label: '数量类型', 
      value: pcbFormData.shipmentType === 'single' ? '单片' : 
             pcbFormData.shipmentType === 'panel_by_gerber' ? 'Gerber拼板' :
             pcbFormData.shipmentType === 'panel_by_speedx' ? 'SpeedX拼板' : '-'
    },
    { 
      label: '订购数量', 
      value: pcbFormData.shipmentType === 'single' ? 
             `${pcbFormData.singleCount || '-'} pcs` :
             `${pcbFormData.panelSet || '-'} set`
    },
    { label: 'HDI类型', value: String(pcbFormData.hdi || '无'), highlight: !!pcbFormData.hdi },
    { label: 'TG等级', value: String(pcbFormData.tg || 'Standard') },
    { label: '不同设计数', value: String(pcbFormData.differentDesignsCount || '1') }
  ];

  const processSpecs = [
    { label: '外层铜厚', value: `${pcbFormData.outerCopperWeight || '1'} oz` },
    { 
      label: '内层铜厚', 
      value: Number(pcbFormData.layers) >= 4 ? `${pcbFormData.innerCopperWeight || '0.5'} oz` : 'N/A'
    },
    { label: '最小线宽/线距', value: `${pcbFormData.minTrace || '6/6'} mil` },
    { label: '最小过孔', value: `${pcbFormData.minHole || '0.3'} mm` },
    { label: '阻焊颜色', value: pcbFormData.solderMask || 'Green' },
    { label: '丝印颜色', value: pcbFormData.silkscreen || 'White' },
    { label: '表面处理', value: pcbFormData.surfaceFinish || 'HASL' },
    { 
      label: 'ENIG厚度', 
      value: pcbFormData.surfaceFinish === 'ENIG' ? (pcbFormData.surfaceFinishEnigType || 'Standard') : 'N/A'
    },
    { label: '过孔工艺', value: pcbFormData.maskCover || 'Tented' }
  ];

  const specialSpecs = [
    { label: '阻抗控制', value: pcbFormData.impedance ? '需要' : '不需要', highlight: pcbFormData.impedance },
    { label: '金手指', value: pcbFormData.goldFingers ? '需要' : '不需要', highlight: pcbFormData.goldFingers },
    { label: '金手指斜边', value: pcbFormData.goldFingers && pcbFormData.goldFingersBevel ? '需要' : '不需要' },
    { label: '边缘电镀', value: pcbFormData.edgePlating ? '需要' : '不需要', highlight: pcbFormData.edgePlating },
    { label: '边缘覆盖', value: pcbFormData.edgePlating ? (pcbFormData.edgeCover || 'No') : 'N/A' },
    { label: 'UL标记', value: pcbFormData.ulMark ? '需要' : '不需要' }
  ];

  // 获取delivery信息，优先使用新的deliveryOptions结构
  const delivery = pcbFormData.deliveryOptions?.delivery || 'standard';
  const urgentReduceDays = pcbFormData.deliveryOptions?.urgentReduceDays || 0;
  
  // 格式化delivery显示
  let deliveryDisplay = '标准';
  let deliveryHighlight = false;
  if (delivery === 'urgent' && urgentReduceDays > 0) {
    deliveryDisplay = `加急 ⚡ (减${urgentReduceDays}天)`;
    deliveryHighlight = true;
  } else if (delivery === 'urgent') {
    deliveryDisplay = '加急 ⚡';
    deliveryHighlight = true;
  }

  const serviceSpecs = [
    { label: '使用盛意料', value: pcbFormData.useShengyiMaterial ? '是' : '否', highlight: !!pcbFormData.useShengyiMaterial },
    { label: '测试方式', value: pcbFormData.testMethod || '默认' },
    { label: 'IPC 等级', value: pcbFormData.ipcClass || 'IPC Class 2' },
    { label: '交货类型', value: deliveryDisplay, highlight: deliveryHighlight },
    { label: '工作Gerber来源', value: pcbFormData.workingGerber || '客户提供' },
    { label: '数据冲突时', value: pcbFormData.ifDataConflicts || '以Gerber为准' },
    { label: '接受瑕疵板', value: pcbFormData.crossOuts === 'Accept' ? '是' : '否' },
    {
      label: '品质报告',
      value: (pcbFormData.productReport && pcbFormData.productReport.length > 0 && !pcbFormData.productReport.includes(ProductReport.None))
        ? pcbFormData.productReport.join(', ')
        : '无'
    },
  ];

  const renderSpecsTable = (specs: { label: string; value: string; highlight?: boolean }[], title: string, bgColor: string) => (
    <>
      {/* 桌面端表格 */}
      <div className="hidden lg:block">
        <div className={`${bgColor} px-4 py-2 border-b`}>
          <h4 className="text-sm font-semibold">{title}</h4>
        </div>
        <div className="grid grid-cols-6 text-xs">
          {specs.map((spec, index) => (
            <React.Fragment key={index}>
              <div className="border-r border-b p-2 bg-gray-50 font-medium">{spec.label}</div>
              <div className={`border-r border-b p-2 text-center font-semibold ${spec.highlight ? 'text-red-600' : ''}`}>
                {spec.value}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 移动端卡片 */}
      <div className="lg:hidden">
        <div className={`${bgColor} px-3 py-2 border-b`}>
          <h4 className="text-sm font-semibold">{title}</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
          {specs.map((spec, index) => (
            <div key={index} className="bg-gray-50 rounded p-2">
              <div className="text-xs text-gray-600 mb-1">{spec.label}</div>
              <div className={`text-sm font-medium ${spec.highlight ? 'text-red-600' : ''}`}>
                {spec.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

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
          {/* 基本参数 */}
          {renderSpecsTable(basicSpecs, '基本参数', 'bg-blue-50 text-blue-800')}

          {/* 工艺参数 */}
          {renderSpecsTable(processSpecs, '工艺参数', 'bg-orange-50 text-orange-800')}

          {/* 特殊工艺 */}
          {renderSpecsTable(specialSpecs, '特殊工艺', 'bg-purple-50 text-purple-800')}

          {/* 服务与其他要求 */}
          {renderSpecsTable(serviceSpecs, '服务与其他要求', 'bg-teal-50 text-teal-800')}

          {/* 备注信息 */}
          {(pcbFormData.pcbNote || pcbFormData.specialRequests) && (
            <>
              <div className="bg-yellow-50 px-3 md:px-4 py-2 border-b">
                <h4 className="text-sm font-semibold text-yellow-800">备注与特殊要求</h4>
              </div>
              <div className="p-3 text-xs space-y-2">
                {pcbFormData.pcbNote && (
                  <div>
                    <strong className="font-medium text-gray-700">拼板备注:</strong>
                    <p className="p-2 bg-gray-50 rounded mt-1 whitespace-pre-wrap text-gray-800">{pcbFormData.pcbNote}</p>
                  </div>
                )}
                {pcbFormData.specialRequests && (
                  <div>
                    <strong className="font-medium text-gray-700">特殊要求:</strong>
                    <p className="p-2 bg-gray-50 rounded mt-1 whitespace-pre-wrap text-gray-800">{pcbFormData.specialRequests}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* 拼板信息 */}
          {(pcbFormData.shipmentType === 'panel_by_gerber' || pcbFormData.shipmentType === 'panel_by_speedx') && (
            <>
              <div className="bg-indigo-50 px-3 md:px-4 py-2 border-b">
                <h4 className="text-sm font-semibold text-indigo-800">拼板信息</h4>
              </div>
              
              {/* 桌面端表格 */}
              <div className="hidden lg:block">
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
                </div>
              </div>

              {/* 移动端卡片 */}
              <div className="lg:hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-600 mb-1">拼板类型</div>
                    <div className="text-sm font-medium">
                      {pcbFormData.shipmentType === 'panel_by_gerber' ? 'Gerber拼板' : 'SpeedX拼板'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-600 mb-1">拼板尺寸</div>
                    <div className="text-sm font-medium">
                      {pcbFormData.panelDimensions ? 
                        `${pcbFormData.panelDimensions.row}×${pcbFormData.panelDimensions.column}` : '-'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-600 mb-1">拼板数量</div>
                    <div className="text-sm font-medium">{pcbFormData.panelSet || '-'} set</div>
                  </div>
                  
                  {pcbFormData.shipmentType === 'panel_by_speedx' && (
                    <>
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-xs text-gray-600 mb-1">工艺边</div>
                        <div className="text-sm font-medium">{pcbFormData.breakAwayRail || 'None'}</div>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-xs text-gray-600 mb-1">工艺边宽度</div>
                        <div className="text-sm font-medium">
                          {pcbFormData.breakAwayRail !== 'None' ? (pcbFormData.border || '5') + 'mm' : 'N/A'}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-xs text-gray-600 mb-1">分离方式</div>
                        <div className="text-sm font-medium">
                          {pcbFormData.breakAwayRail !== 'None' ? (pcbFormData.borderCutType || 'V-Cut') : 'N/A'}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* 收货地址信息 */}
          {shippingAddress && (
            <>
              <div className="bg-green-50 px-3 md:px-4 py-2 border-b">
                <h4 className="text-sm font-semibold text-green-800">收货地址信息</h4>
              </div>
              
              {/* 桌面端表格 */}
              <div className="hidden lg:block">
                <div className="grid grid-cols-6 text-xs">
                  <div className="border-r border-b p-2 bg-gray-50 font-medium">收货人</div>
                  <div className="border-r border-b p-2 text-center font-semibold">
                    {shippingAddress.contactName || '-'}
                  </div>
                  <div className="border-r border-b p-2 bg-gray-50 font-medium">联系电话</div>
                  <div className="border-r border-b p-2 text-center font-semibold">{shippingAddress.phone || '-'}</div>
                  <div className="border-r border-b p-2 bg-gray-50 font-medium">快递公司</div>
                  <div className="border-b p-2 text-center font-semibold text-blue-600">
                    {shippingAddress.courier?.toUpperCase() || '-'}
                  </div>
                  
                  <div className="border-r p-2 bg-gray-50 font-medium">收货地址</div>
                  <div className="col-span-5 p-2 text-center font-semibold">
                    {[
                      shippingAddress.address,
                      shippingAddress.city,
                      shippingAddress.state,
                      shippingAddress.zipCode,
                      shippingAddress.countryName || shippingAddress.country
                    ].filter(Boolean).join(', ') || '-'}
                  </div>
                </div>
              </div>

              {/* 移动端卡片 */}
              <div className="lg:hidden">
                <div className="grid grid-cols-1 gap-2 p-3">
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-600 mb-1">收货人</div>
                    <div className="text-sm font-medium">
                      {shippingAddress.contactName || '-'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-600 mb-1">联系电话</div>
                    <div className="text-sm font-medium">{shippingAddress.phone || '-'}</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-600 mb-1">快递公司</div>
                    <div className="text-sm font-medium text-blue-600">
                      {shippingAddress.courier?.toUpperCase() || '-'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-600 mb-1">收货地址</div>
                    <div className="text-sm font-medium">
                      {[
                        shippingAddress.address,
                        shippingAddress.city,
                        shippingAddress.state,
                        shippingAddress.zipCode,
                        shippingAddress.countryName || shippingAddress.country
                      ].filter(Boolean).join(', ') || '-'}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 