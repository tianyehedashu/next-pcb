"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface StencilPriceExplainerProps {
  priceBreakdown: Record<string, number>;
  totalPrice: number;
  showDetails?: boolean;
}

export const StencilPriceExplainer: React.FC<StencilPriceExplainerProps> = ({
  priceBreakdown,
  totalPrice,
  showDetails = false
}) => {
  const priceFactors = [
    {
      key: 'Base Price',
      label: 'Base Stencil Price',
      description: 'Fixed price based on selected stencil size and frame type',
      icon: '🔧',
      color: 'blue'
    },
    {
      key: 'Thickness Adjustment',
      label: 'Thickness Adjustment',
      description: '0.12mm (+10%), 0.15mm (+20%) compared to 0.10mm base thickness',
      icon: '📏',
      color: 'purple'
    },
    {
      key: 'Electropolishing',
      label: 'Electropolishing',
      description: 'Enhanced surface finish for better print quality (+¥50)',
      icon: '✨',
      color: 'green'
    },
    {
      key: 'Shipping Extra',
      label: 'Large Size Shipping Extra',
      description: 'Additional shipping fee for large framework stencils (¥10/pc for certain sizes)',
      icon: '📦',
      color: 'orange'
    },
    {
      key: 'Quantity Discount',
      label: 'Quantity Discount',
      description: 'Volume discounts: 20+pcs (5% off), 50+pcs (10% off), 100+pcs (15% off)',
      icon: '📊',
      color: 'emerald'
    }
  ];

  if (!showDetails) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <AlertDescription className="text-green-700">
          <div className="flex items-center justify-between">
            <span>💡 Stencil price includes size, thickness, and surface treatment.</span>
            <Badge variant="outline" className="text-green-600 border-green-300">
              ¥{totalPrice.toFixed(2)} CNY
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-green-800 flex items-center gap-2">
          💰 Stencil Price Breakdown
          <Badge variant="outline" className="text-green-600 border-green-300">
            Total: ¥{totalPrice.toFixed(2)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {priceFactors.map((factor) => {
          const value = priceBreakdown[factor.key] || 0;
          const isDiscount = factor.key === 'Quantity Discount' && value < 0;
          
          if (value === 0 && factor.key !== 'Quantity Discount') return null;
          
          return (
            <div key={factor.key} className="flex items-start gap-3 p-3 bg-white/70 rounded-md border border-green-100">
              <span className="text-lg">{factor.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-800 text-sm">{factor.label}</h4>
                  <Badge 
                    variant="outline" 
                    className={`${isDiscount ? 'text-green-600 border-green-300 bg-green-50' : 'text-gray-600 border-gray-300'}`}
                  >
                    {isDiscount ? `-¥${Math.abs(value).toFixed(2)}` : `+¥${value.toFixed(2)}`}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{factor.description}</p>
                
                {/* 特殊说明 */}
                {factor.key === 'Thickness Adjustment' && value > 0 && (
                  <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    📏 Thicker stencils provide more solder volume for larger components
                  </div>
                )}
                
                {factor.key === 'Quantity Discount' && value < 0 && (
                  <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    🎉 Volume discount applied! Order more to save even more.
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* 计算公式说明 */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">📐 Calculation Formula:</h4>
          <div className="text-xs text-blue-700 space-y-1 font-mono">
            <div>Base Price = Fixed by size/frame type (¥130~¥430 per piece)</div>
            <div>Thickness Adj = Base × Multiplier (0.10mm=1.0, 0.12mm=1.1, 0.15mm=1.2)</div>
            <div>Electropolishing = +¥50 per piece (if selected)</div>
            <div>Shipping Extra = +¥10 per piece (large framework sizes only)</div>
            <div>Final Price = (Base + Thickness + Electropolishing + Shipping) × (1 - Discount%)</div>
            <div className="text-xs text-blue-600 mt-2 font-sans">
              * All prices strictly follow stencil specification data table in CNY
            </div>
          </div>
        </div>

        {/* 提示信息 */}
        <Alert className="border-amber-200 bg-amber-50">
          <AlertDescription className="text-amber-700 text-xs">
            💡 <strong>Pro Tip:</strong> Framework stencils are recommended for production use, 
            while non-framework stencils are cost-effective for prototyping and small batches.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}; 