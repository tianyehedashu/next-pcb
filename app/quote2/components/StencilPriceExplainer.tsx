"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  // 钢网价格因子 - 严格按照规格数据表
  const priceFactors = [
    {
      key: 'Base Price',
      label: 'Base Stencil Price',
      description: 'Fixed price based on selected stencil size and frame type (as per specification table)',
      icon: '🔧',
      color: 'blue'
    },
    {
      key: 'Shipping Extra',
      label: 'Large Size Shipping Extra',
      description: 'Additional shipping fee for large framework stencils (¥10/pc for certain sizes, as per specification table)',
      icon: '📦',
      color: 'orange'
    },
    {
      key: 'Electropolishing',
      label: 'Electropolishing',
      description: 'Enhanced surface finish for better print quality (+¥50 per piece)',
      icon: '✨',
      color: 'green'
    }
  ];

  if (!showDetails) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <AlertDescription className="text-green-700">
          <div className="flex items-center justify-between">
            <span>💡 Stencil price based on specification data table.</span>
            <Badge variant="outline" className="text-green-600 border-green-300">
              ¥{totalPrice.toFixed(2)} CNY
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="pt-4">
        <div className="space-y-4">
          {/* 价格分解项目 */}
          {priceFactors.map((factor) => {
            const value = priceBreakdown[factor.key];
            if (value === undefined || value === 0) return null;

            return (
              <div key={factor.key} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200">
                <div className="text-lg">{factor.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-800 text-sm">{factor.label}</h4>
                    <Badge 
                      variant="outline" 
                      className="text-gray-600 border-gray-300"
                    >
                      ¥{value.toFixed(2)}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{factor.description}</p>
                  
                  {/* 特殊说明 */}
                  {factor.key === 'Base Price' && (
                    <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      📊 Price directly from stencil specification data table
                    </div>
                  )}
                  
                  {factor.key === 'Electropolishing' && value > 0 && (
                    <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      ✨ Enhanced surface finish improves print quality and durability
                    </div>
                  )}

                  {factor.key === 'Shipping Extra' && value > 0 && (
                    <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                      📦 Large framework stencils require special handling
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* 计算说明 */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-sm font-medium text-blue-800 mb-2">📐 Price Calculation:</h4>
            <div className="text-xs text-blue-700 space-y-1 font-mono">
              <div>Base Price = Fixed by size/frame type (¥130~¥430 per piece)</div>
              <div>Shipping Extra = ¥10 per piece (large framework sizes only)</div>
              <div>Electropolishing = +¥50 per piece (if selected)</div>
              <div>Final Price = Base Price + Shipping Extra + Electropolishing</div>
              <div className="text-xs text-blue-600 mt-2 font-sans">
                * All prices strictly follow stencil specification data table
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
        </div>
      </CardContent>
    </Card>
  );
}; 