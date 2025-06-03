'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calculator, Layers, Package
} from 'lucide-react';
import { 
  useQuoteSummary, 
  useQuoteCalculated
} from '@/lib/stores/quote-store';

interface QuoteSummaryCardProps {
  className?: string;
}

export function QuoteSummaryCard({ className }: QuoteSummaryCardProps) {
  const calculated = useQuoteCalculated();
  const { formData, isValid } = useQuoteSummary();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Quote Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 基础信息 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">PCB Type</p>
            <p className="text-lg font-semibold">{formData.pcbType}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Layers</p>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <p className="text-lg font-semibold">{formData.layers}</p>
              {formData.layers > 2 && (
                <Badge variant="secondary" className="text-xs">Multi-layer</Badge>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* 尺寸和数量 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Dimensions</p>
            <p className="text-sm">
              {formData.singleDimensions.length} × {formData.singleDimensions.width} mm
            </p>
            <p className="text-xs text-gray-500">
              Area: {calculated.singlePcbArea.toFixed(1)} mm²
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Quantity</p>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <p className="text-lg font-semibold">{calculated.totalQuantity}</p>
            </div>
            <p className="text-xs text-gray-500">
              Total Area: {calculated.totalArea.toFixed(1)} mm²
            </p>
          </div>
        </div>

        <Separator />

        {/* 基础计算信息 */}
        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-gray-600" />
            <p className="text-sm font-medium text-gray-600">Calculated Properties</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Single PCB Area</p>
              <p className="font-medium">{calculated.singlePcbArea.toFixed(2)} mm²</p>
            </div>
            <div>
              <p className="text-gray-600">Total Area</p>
              <p className="font-medium">{calculated.totalArea.toFixed(2)} mm²</p>
            </div>
            <div>
              <p className="text-gray-600">Total Quantity</p>
              <p className="font-medium">{calculated.totalQuantity} pcs</p>
            </div>
          </div>
        </div>

        {/* 验证状态 */}
        {!isValid && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
            <p className="text-sm text-red-600">
              ⚠️ Please complete all required fields to get accurate calculations
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default QuoteSummaryCard; 