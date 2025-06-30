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
      key: 'baseCost',
      label: 'Base Material Cost',
      description: 'Cost based on stencil material (304SS, 316L, or Nickel) and area',
      icon: '🔧',
      color: 'blue'
    },
    {
      key: 'processCost',
      label: 'Manufacturing Process',
      description: 'Additional cost for laser cutting, electroforming, or chemical etching',
      icon: '⚡',
      color: 'purple'
    },
    {
      key: 'frameCost',
      label: 'Frame Cost',
      description: 'Cost for SMT frame or custom frame if selected',
      icon: '🖼️',
      color: 'orange'
    },
    {
      key: 'surfaceTreatmentCost',
      label: 'Surface Treatment',
      description: 'Additional cost for electropolishing or passivation',
      icon: '✨',
      color: 'green'
    },
    {
      key: 'quantityDiscount',
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
            <span>💡 Stencil price includes material, process, and frame costs.</span>
            <Badge variant="outline" className="text-green-600 border-green-300">
              ${totalPrice.toFixed(2)} USD
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
            Total: ${totalPrice.toFixed(2)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {priceFactors.map((factor) => {
          const value = priceBreakdown[factor.key] || 0;
          const isDiscount = factor.key === 'quantityDiscount' && value < 0;
          
          if (value === 0 && factor.key !== 'quantityDiscount') return null;
          
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
                    {isDiscount ? `-$${Math.abs(value).toFixed(2)}` : `+$${value.toFixed(2)}`}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{factor.description}</p>
                
                {/* 特殊说明 */}
                {factor.key === 'processCost' && value > 0 && (
                  <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    ⚡ Process multiplier applied based on manufacturing method
                  </div>
                )}
                
                {factor.key === 'quantityDiscount' && value < 0 && (
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
            <div>Base Cost = Area (mm²) × Material Rate (CNY/mm²)</div>
            <div>Process Cost = Base Cost × Process Multiplier</div>
            <div>Total = (Base + Process + Frame + Surface) × (1 + Discount%)</div>
            <div className="text-xs text-blue-600 mt-2 font-sans">
              * All prices converted from CNY to USD at current exchange rate
            </div>
          </div>
        </div>

        {/* 提示信息 */}
        <Alert className="border-amber-200 bg-amber-50">
          <AlertDescription className="text-amber-700 text-xs">
            💡 <strong>Pro Tip:</strong> Electroforming offers the highest precision for fine-pitch components (≤0.2mm), 
            while laser cutting is cost-effective for standard applications (≥0.3mm pitch).
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}; 