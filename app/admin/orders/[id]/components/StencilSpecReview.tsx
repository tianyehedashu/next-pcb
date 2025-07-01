"use client";

import React from 'react';
import { Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  BorderType,
  StencilType,
  StencilSide,
  StencilThickness,
  ExistingFiducials,
  Electropolishing,
  EngineeringRequirements,
  BorderTypeLabels,
  StencilTypeLabels,
  StencilSideLabels,
  StencilThicknessLabels,
  ExistingFiducialsLabels,
  ElectropolishingLabels,
  EngineeringRequirementsLabels
} from '@/app/quote2/schema/stencilTypes';

interface StencilFormData {
  productType: 'stencil';
  borderType: BorderType;
  stencilType: StencilType;
  size: string;
  stencilSide: StencilSide;
  quantity: number;
  thickness: StencilThickness;
  existingFiducials: ExistingFiducials;
  electropolishing: Electropolishing;
  engineeringRequirements: EngineeringRequirements;
  addPoNo?: string;
  specialRequests?: string;
  shippingAddress?: {
    country: string;
    state: string;
    city: string;
    address: string;
    zipCode: string;
    contactName: string;
    phone: string;
    courier: string;
  };
}

interface AddressFormValue {
  country: string;
  state: string;
  city: string;
  address: string;
  zipCode: string;
  contactName: string;
  phone: string;
  courier: string;
}

interface StencilSpecReviewProps {
  stencilFormData: StencilFormData | null;
  shippingAddress?: AddressFormValue | null;
}

export function StencilSpecReview({ stencilFormData, shippingAddress: externalShippingAddress }: StencilSpecReviewProps) {
  if (!stencilFormData) {
    return (
      <div className="bg-white border-2 border-red-200 rounded">
        <div className="bg-red-50 px-3 py-2 border-b">
          <h3 className="text-sm font-semibold text-red-800 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            钢网技术规格审核
            <Badge variant="outline" className="ml-auto bg-red-100 text-red-700 border-red-300 text-xs">
              缺少规格数据
            </Badge>
          </h3>
        </div>
        <div className="p-4 text-center text-gray-500">
          钢网规格数据未找到或格式不正确
        </div>
      </div>
    );
  }

  // 解析尺寸信息
  const parseSizeInfo = (size: string) => {
    const [length, width] = size.split('x').map(d => parseInt(d) || 0);
    const area = length * width;
    return { length, width, area };
  };

  const sizeInfo = parseSizeInfo(stencilFormData.size || '0x0');

  // 配置规格
  const stencilSpecs = [
    { label: '边框类型', value: BorderTypeLabels[stencilFormData.borderType] },
    { label: '钢网类型', value: StencilTypeLabels[stencilFormData.stencilType] },
    { label: '尺寸', value: `${stencilFormData.size}mm` },
    { label: '有效面积', value: `${sizeInfo.area.toLocaleString()} mm²` },
    { label: '钢网面', value: StencilSideLabels[stencilFormData.stencilSide] },
    { label: '数量', value: `${stencilFormData.quantity} pcs` }
  ];

  // 制造工艺
  const manufacturingSpecs = [
    { label: '厚度', value: StencilThicknessLabels[stencilFormData.thickness] },
    { label: '基准孔', value: ExistingFiducialsLabels[stencilFormData.existingFiducials] },
    { label: '电抛光', value: ElectropolishingLabels[stencilFormData.electropolishing], highlight: stencilFormData.electropolishing === Electropolishing.ELECTROPOLISHING },
    { label: '工程要求', value: EngineeringRequirementsLabels[stencilFormData.engineeringRequirements] }
  ];

  // 订单信息
  const orderSpecs = [
    { label: 'PO编号', value: stencilFormData.addPoNo || '无' },
    { label: '特殊要求', value: stencilFormData.specialRequests || '无' }
  ];

  // 收货地址信息
  const shippingAddress = externalShippingAddress || stencilFormData.shippingAddress;

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
          钢网技术规格审核
          <Badge variant="outline" className="ml-auto bg-red-100 text-red-700 border-red-300 text-xs">
            核心审核项
          </Badge>
        </h3>
      </div>
      <div className="p-0">
        <div className="border-t">
          {/* 钢网配置 */}
          {renderSpecsTable(stencilSpecs, '钢网配置', 'bg-blue-50 text-blue-800')}

          {/* 制造工艺 */}
          {renderSpecsTable(manufacturingSpecs, '制造工艺', 'bg-orange-50 text-orange-800')}

          {/* 订单信息 */}
          {renderSpecsTable(orderSpecs, '订单信息', 'bg-purple-50 text-purple-800')}

          {/* 备注信息 */}
          {stencilFormData.specialRequests && (
            <div className="bg-amber-50 px-3 md:px-4 py-2 border-b">
              <h4 className="text-sm font-semibold text-amber-800">特殊要求</h4>
              <div className="mt-2 text-sm text-amber-700 bg-white rounded p-2 border border-amber-200">
                {stencilFormData.specialRequests}
              </div>
            </div>
          )}

          {/* 收货地址信息 */}
          {shippingAddress && (
            <div className="bg-green-50 px-3 md:px-4 py-2">
              <h4 className="text-sm font-semibold text-green-800 mb-2">收货地址</h4>
              
              {/* 桌面端表格 */}
              <div className="hidden lg:block">
                <div className="grid grid-cols-6 text-xs">
                  <div className="border-r border-b p-2 bg-gray-50 font-medium">联系人</div>
                  <div className="border-r border-b p-2 text-center font-semibold">{shippingAddress.contactName || '-'}</div>
                  <div className="border-r border-b p-2 bg-gray-50 font-medium">电话</div>
                  <div className="border-r border-b p-2 text-center font-semibold">{shippingAddress.phone || '-'}</div>
                  <div className="border-r border-b p-2 bg-gray-50 font-medium">快递公司</div>
                  <div className="border-b p-2 text-center font-semibold">{shippingAddress.courier || '-'}</div>
                  
                  <div className="border-r border-b p-2 bg-gray-50 font-medium">国家</div>
                  <div className="border-r border-b p-2 text-center font-semibold">{shippingAddress.country || '-'}</div>
                  <div className="border-r border-b p-2 bg-gray-50 font-medium">省/州</div>
                  <div className="border-r border-b p-2 text-center font-semibold">{shippingAddress.state || '-'}</div>
                  <div className="border-r border-b p-2 bg-gray-50 font-medium">城市</div>
                  <div className="border-b p-2 text-center font-semibold">{shippingAddress.city || '-'}</div>
                  
                  <div className="border-r p-2 bg-gray-50 font-medium">详细地址</div>
                  <div className="col-span-3 p-2 font-semibold">{shippingAddress.address || '-'}</div>
                  <div className="border-r p-2 bg-gray-50 font-medium">邮编</div>
                  <div className="p-2 text-center font-semibold">{shippingAddress.zipCode || '-'}</div>
                </div>
              </div>

              {/* 移动端卡片 */}
              <div className="lg:hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-600 mb-1">联系人</div>
                    <div className="text-sm font-medium">{shippingAddress.contactName || '-'}</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-600 mb-1">电话</div>
                    <div className="text-sm font-medium">{shippingAddress.phone || '-'}</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-600 mb-1">快递公司</div>
                    <div className="text-sm font-medium">{shippingAddress.courier || '-'}</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-600 mb-1">国家</div>
                    <div className="text-sm font-medium">{shippingAddress.country || '-'}</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-600 mb-1">省/州</div>
                    <div className="text-sm font-medium">{shippingAddress.state || '-'}</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-600 mb-1">城市</div>
                    <div className="text-sm font-medium">{shippingAddress.city || '-'}</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2 sm:col-span-2">
                    <div className="text-xs text-gray-600 mb-1">详细地址</div>
                    <div className="text-sm font-medium">{shippingAddress.address || '-'}</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-600 mb-1">邮编</div>
                    <div className="text-sm font-medium">{shippingAddress.zipCode || '-'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 