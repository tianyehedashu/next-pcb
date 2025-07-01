import React from 'react';
import { FileText, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
}

interface StencilSpecificationDisplayProps {
  stencilFormData: StencilFormData | null;
}

export function StencilSpecificationDisplay({ stencilFormData }: StencilSpecificationDisplayProps) {
  if (!stencilFormData) {
    return (
      <Card className="border-2 border-orange-200">
        <CardHeader className="bg-orange-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            Stencil Specifications
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-center py-8 text-red-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm font-semibold">⚠️ Stencil specifications not available</p>
            <p className="text-xs">Unable to display technical specifications</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 解析尺寸信息
  const parseSizeInfo = (size: string) => {
    const [length, width] = size.split('x').map(d => parseInt(d) || 0);
    const area = length * width;
    return { length, width, area };
  };

  const sizeInfo = parseSizeInfo(stencilFormData.size || '0x0');

  return (
    <Card className="border-2 border-orange-200">
      <CardHeader className="bg-orange-50 border-b">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            Stencil Specifications
          </div>
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium text-xs sm:text-sm border border-blue-200">
              {BorderTypeLabels[stencilFormData.borderType]}
            </span>
            <span className="px-2 py-1 bg-green-50 text-green-700 rounded font-medium text-xs sm:text-sm border border-green-200">
              {stencilFormData.quantity} pcs
            </span>
            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded font-medium text-xs sm:text-sm border border-purple-200">
              {StencilThicknessLabels[stencilFormData.thickness]}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="space-y-0">
          {/* Stencil Configuration */}
          <div className="border-b">
            <div className="bg-blue-50 px-4 py-2 border-b">
              <h4 className="text-sm font-semibold text-blue-800">Stencil Configuration</h4>
            </div>
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-6 text-xs">
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Border Type</div>
                <div className="border-r border-b p-2 text-center font-semibold">{BorderTypeLabels[stencilFormData.borderType]}</div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Stencil Type</div>
                <div className="border-r border-b p-2 text-center font-semibold">{StencilTypeLabels[stencilFormData.stencilType]}</div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Size</div>
                <div className="border-b p-2 text-center font-semibold">{stencilFormData.size}mm</div>
                
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Effective Area</div>
                <div className="border-r border-b p-2 text-center font-semibold">{sizeInfo.area.toLocaleString()} mm²</div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Stencil Side</div>
                <div className="border-r border-b p-2 text-center font-semibold">{StencilSideLabels[stencilFormData.stencilSide]}</div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Quantity</div>
                <div className="border-b p-2 text-center font-semibold">{stencilFormData.quantity} pcs</div>
              </div>
            </div>
            
            {/* Mobile Cards */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Border Type</div>
                <div className="text-sm font-medium">{BorderTypeLabels[stencilFormData.borderType]}</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Stencil Type</div>
                <div className="text-sm font-medium">{StencilTypeLabels[stencilFormData.stencilType]}</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Size</div>
                <div className="text-sm font-medium">{stencilFormData.size}mm</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Effective Area</div>
                <div className="text-sm font-medium">{sizeInfo.area.toLocaleString()} mm²</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Stencil Side</div>
                <div className="text-sm font-medium">{StencilSideLabels[stencilFormData.stencilSide]}</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Quantity</div>
                <div className="text-sm font-medium">{stencilFormData.quantity} pcs</div>
              </div>
            </div>
          </div>

          {/* Manufacturing Process */}
          <div className="border-b">
            <div className="bg-orange-50 px-4 py-2 border-b">
              <h4 className="text-sm font-semibold text-orange-800">Manufacturing Process</h4>
            </div>
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-6 text-xs">
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Thickness</div>
                <div className="border-r border-b p-2 text-center font-semibold">{StencilThicknessLabels[stencilFormData.thickness]}</div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Existing Fiducials</div>
                <div className="border-r border-b p-2 text-center font-semibold">{ExistingFiducialsLabels[stencilFormData.existingFiducials]}</div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Electropolishing</div>
                <div className="border-b p-2 text-center font-semibold">
                  <span className={stencilFormData.electropolishing === Electropolishing.ELECTROPOLISHING ? 'text-red-600 font-bold' : ''}>
                    {ElectropolishingLabels[stencilFormData.electropolishing]}
                  </span>
                </div>
                
                <div className="border-r p-2 bg-gray-50 font-medium">Engineering Requirements</div>
                <div className="col-span-5 p-2 text-center font-semibold">{EngineeringRequirementsLabels[stencilFormData.engineeringRequirements]}</div>
              </div>
            </div>
            
            {/* Mobile Cards */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Thickness</div>
                <div className="text-sm font-medium">{StencilThicknessLabels[stencilFormData.thickness]}</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Existing Fiducials</div>
                <div className="text-sm font-medium">{ExistingFiducialsLabels[stencilFormData.existingFiducials]}</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Electropolishing</div>
                <div className={`text-sm font-medium ${stencilFormData.electropolishing === Electropolishing.ELECTROPOLISHING ? 'text-red-600 font-bold' : ''}`}>
                  {ElectropolishingLabels[stencilFormData.electropolishing]}
                </div>
              </div>
              <div className="bg-gray-50 rounded p-2 sm:col-span-2">
                <div className="text-xs text-gray-600 mb-1">Engineering Requirements</div>
                <div className="text-sm font-medium">{EngineeringRequirementsLabels[stencilFormData.engineeringRequirements]}</div>
              </div>
            </div>
          </div>

          {/* Order Information */}
          <div className="border-b">
            <div className="bg-purple-50 px-4 py-2 border-b">
              <h4 className="text-sm font-semibold text-purple-800">Order Information</h4>
            </div>
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-6 text-xs">
                <div className="border-r border-b p-2 bg-gray-50 font-medium">PO Number</div>
                <div className="border-r border-b p-2 text-center font-semibold">{stencilFormData.addPoNo || '-'}</div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Special Requests</div>
                <div className="col-span-3 border-b p-2 text-center font-semibold">{stencilFormData.specialRequests || '-'}</div>
              </div>
            </div>
            
            {/* Mobile Cards */}
            <div className="lg:hidden grid grid-cols-1 gap-2 p-3">
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">PO Number</div>
                <div className="text-sm font-medium">{stencilFormData.addPoNo || '-'}</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Special Requests</div>
                <div className="text-sm font-medium">{stencilFormData.specialRequests || '-'}</div>
              </div>
            </div>
          </div>

          {/* Notes and Special Requests */}
          {stencilFormData.specialRequests && (
            <div className="border-b">
              <div className="bg-amber-50 px-4 py-2 border-b">
                <h4 className="text-sm font-semibold text-amber-800">Special Requirements</h4>
              </div>
              <div className="p-4">
                <div className="bg-white rounded-lg border border-amber-200 p-3">
                  <p className="text-sm text-gray-700">{stencilFormData.specialRequests}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 