"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
} from '../../quote2/schema/stencilTypes';

interface StencilSpec {
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

interface StencilOrderCardProps {
  order: {
    id: string;
    email: string;
    phone?: string;
    pcb_spec: StencilSpec;
    cal_values?: {
      totalPrice: number;
      leadTimeDays: number;
      shippingCost: number;
    };
    status: string;
    created_at: string;
    updated_at: string;
  };
  onStatusChange?: (orderId: string, newStatus: string) => void;
  onViewDetails?: (orderId: string) => void;
}

export const StencilOrderCard: React.FC<StencilOrderCardProps> = ({
  order,
  onStatusChange,
  onViewDetails
}) => {
  const { pcb_spec: spec, cal_values } = order;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'quoted': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-300';
      case 'production': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeColor = (stencilType: StencilType) => {
    switch (stencilType) {
      case StencilType.SOLDER_PASTE: return 'bg-blue-100 text-blue-700';
      case StencilType.ADHESIVES: return 'bg-purple-100 text-purple-700';
      case StencilType.STEP_DOWN: return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // 解析尺寸信息
  const parseSizeInfo = (size: string) => {
    const [length, width] = size.split('x').map(d => parseInt(d) || 0);
    const area = length * width;
    return { length, width, area };
  };

  const sizeInfo = parseSizeInfo(spec.size || '0x0');

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            🔧 Stencil Order #{order.id.slice(-8)}
          </CardTitle>
          <Badge className={`${getStatusColor(order.status)} border`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>
        <div className="text-sm text-gray-600">
          Created: {new Date(order.created_at).toLocaleDateString()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 客户信息 */}
        <div className="bg-gray-50 rounded-md p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Customer Information</h4>
          <div className="space-y-1 text-sm">
            <div>📧 {order.email}</div>
            {order.phone && <div>📞 {order.phone}</div>}
          </div>
        </div>

        {/* 钢网规格 */}
        <div className="bg-blue-50 rounded-md p-3">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Stencil Specifications</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Border Type:</span>
                <span className="font-medium">{BorderTypeLabels[spec.borderType]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stencil Type:</span>
                <Badge className={`${getTypeColor(spec.stencilType)} text-xs`}>
                  {StencilTypeLabels[spec.stencilType]}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Thickness:</span>
                <span className="font-medium">{StencilThicknessLabels[spec.thickness]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stencil Side:</span>
                <span className="font-medium">{StencilSideLabels[spec.stencilSide]}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Size:</span>
                <span className="font-medium">{spec.size}mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Area:</span>
                <span className="font-medium">{sizeInfo.area.toLocaleString()} mm²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-medium">{spec.quantity} pcs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fiducials:</span>
                <span className="font-medium">{ExistingFiducialsLabels[spec.existingFiducials]}</span>
              </div>
            </div>
          </div>

          {/* 制造工艺信息 */}
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">
                {ElectropolishingLabels[spec.electropolishing]}
              </Badge>
              <Badge variant="outline">
                {EngineeringRequirementsLabels[spec.engineeringRequirements]}
              </Badge>
            </div>
          </div>
        </div>

        {/* 价格和交期信息 */}
        {cal_values && (
          <div className="bg-green-50 rounded-md p-3">
            <h4 className="text-sm font-medium text-green-800 mb-2">Quote Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="text-center">
                <div className="text-gray-600">Total Price</div>
                <div className="font-bold text-green-700">¥{cal_values.totalPrice.toFixed(2)}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">Lead Time</div>
                <div className="font-medium">{cal_values.leadTimeDays} days</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">Shipping</div>
                <div className="font-medium">¥{cal_values.shippingCost.toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}

        {/* PO号码和特殊要求 */}
        {(spec.addPoNo || spec.specialRequests) && (
          <div className="bg-amber-50 rounded-md p-3">
            <h4 className="text-sm font-medium text-amber-800 mb-2">Order Information</h4>
            <div className="space-y-1 text-sm text-amber-700">
              {spec.addPoNo && (
                <div><span className="font-medium">PO Number:</span> {spec.addPoNo}</div>
              )}
              {spec.specialRequests && (
                <div>
                  <span className="font-medium">Special Requests:</span>
                  <p className="mt-1">{spec.specialRequests}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails?.(order.id)}
            className="text-xs"
          >
            View Details
          </Button>
          
          {order.status === 'pending' && onStatusChange && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(order.id, 'quoted')}
                className="text-xs text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                Send Quote
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(order.id, 'cancelled')}
                className="text-xs text-red-600 border-red-300 hover:bg-red-50"
              >
                Cancel
              </Button>
            </>
          )}
          
          {order.status === 'quoted' && onStatusChange && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(order.id, 'confirmed')}
              className="text-xs text-green-600 border-green-300 hover:bg-green-50"
            >
              Confirm Order
            </Button>
          )}
          
          {order.status === 'confirmed' && onStatusChange && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(order.id, 'production')}
              className="text-xs text-purple-600 border-purple-300 hover:bg-purple-50"
            >
              Start Production
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 