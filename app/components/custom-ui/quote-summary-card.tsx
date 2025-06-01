'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '../ui/separator';
import { 
  useQuoteCalculated, 
  useQuoteCalculatedProperty,
  useQuoteSummary 
} from '@/lib/stores/quote-store';
import { Calculator, Clock, DollarSign, Layers, Package, Zap } from 'lucide-react';

interface QuoteSummaryCardProps {
  className?: string;
}

export function QuoteSummaryCard({ className }: QuoteSummaryCardProps) {
  const calculated = useQuoteCalculated();
  const { formData, isValid } = useQuoteSummary();
  
  // 使用单个计算属性的示例
  const complexityLevel = useQuoteCalculatedProperty('complexityLevel');
  const priceCategory = useQuoteCalculatedProperty('priceCategory');
  
  const getComplexityColor = (level: string) => {
    switch (level) {
      case 'Simple': return 'bg-green-100 text-green-800';
      case 'Standard': return 'bg-blue-100 text-blue-800';
      case 'Complex': return 'bg-orange-100 text-orange-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getPriceCategoryColor = (category: string) => {
    switch (category) {
      case 'Economy': return 'bg-green-100 text-green-800';
      case 'Standard': return 'bg-blue-100 text-blue-800';
      case 'Premium': return 'bg-purple-100 text-purple-800';
      case 'Ultra': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
              {calculated.isMultiLayer && (
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

        {/* 复杂度和特性 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Complexity Level</span>
            <Badge className={getComplexityColor(complexityLevel)}>
              {complexityLevel}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Price Category</span>
            <Badge className={getPriceCategoryColor(priceCategory)}>
              {priceCategory}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Production Difficulty</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-red-500 transition-all duration-300"
                  style={{ width: `${(calculated.productionDifficulty / 10) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {calculated.productionDifficulty}/10
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* 特殊特性 */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">Special Features</p>
          <div className="flex flex-wrap gap-2">
            {calculated.isHDI && (
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                HDI
              </Badge>
            )}
            {calculated.requiresImpedance && (
              <Badge variant="outline" className="text-xs">Impedance Control</Badge>
            )}
            {calculated.hasSpecialFinish && (
              <Badge variant="outline" className="text-xs">Special Finish</Badge>
            )}
            {calculated.hasAdvancedFeatures && (
              <Badge variant="outline" className="text-xs">Advanced Features</Badge>
            )}
            {!calculated.isHDI && !calculated.requiresImpedance && 
             !calculated.hasSpecialFinish && !calculated.hasAdvancedFeatures && (
              <span className="text-xs text-gray-500">Standard PCB</span>
            )}
          </div>
        </div>

        <Separator />

        {/* 估算信息 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <p className="text-sm font-medium text-gray-600">Lead Time</p>
            </div>
            <p className="text-lg font-semibold">
              {calculated.estimatedLeadTime} days
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Est. Weight</p>
            <p className="text-lg font-semibold">
              {calculated.estimatedWeight.toFixed(1)}g
            </p>
          </div>
        </div>

        {/* 成本估算 */}
        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-600" />
            <p className="text-sm font-medium text-gray-600">Cost Estimation</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Material Cost</p>
              <p className="font-medium">${calculated.materialCost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-600">Processing Cost</p>
              <p className="font-medium">${calculated.processingCost.toFixed(2)}</p>
            </div>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <p className="font-medium">Total Estimate</p>
            <p className="text-lg font-bold text-blue-600">
              ${(calculated.materialCost + calculated.processingCost).toFixed(2)}
            </p>
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