"use client";

import { useMemo } from "react";
import { FormConsumer } from "@formily/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Info, Truck, Clock, Zap } from "lucide-react";
import type { QuoteFormData } from "../schema/quoteSchema";

interface PriceBreakdown {
  basePrice: number;
  layerCost: number;
  sizeCost: number;
  quantityDiscount: number;
  surfaceFinishCost: number;
  drillCost: number;
  expediteCost: number;
  totalPrice: number;
  unitPrice: number;
}

// 内部组件来处理价格计算
function PriceSummaryContent({ formValues }: { formValues: Partial<QuoteFormData> }) {
  // 增强的价格计算逻辑
  const priceBreakdown = useMemo((): PriceBreakdown => {
    const values = formValues as QuoteFormData;
    
    // 如果表单值为空，使用默认值
    if (!values || Object.keys(values).length === 0) {
      return {
        basePrice: 8.0,
        layerCost: 0,
        sizeCost: 0,
        quantityDiscount: 0,
        surfaceFinishCost: 0,
        drillCost: 0.5,
        expediteCost: 0,
        totalPrice: 320, // 8.0 * 40
        unitPrice: 8.0
      };
    }
    
    // 基础价格
    const basePrice = 8.0;
    
    // 层数系数
    const layers = values.layers || 2;
    let layerMultiplier = 1;
    if (layers === 4) layerMultiplier = 1.8;
    else if (layers === 6) layerMultiplier = 2.5;
    else if (layers === 8) layerMultiplier = 3.2;
    else if (layers >= 10) layerMultiplier = 4.0;
    
    const layerCost = basePrice * (layerMultiplier - 1);
    
    // 尺寸成本
    const length = values.singleDimensions?.length || 10;
    const width = values.singleDimensions?.width || 10;
    const area = length * width; // cm²
    const sizeCost = area > 100 ? (area - 100) * 0.02 : 0;
    
    // 数量折扣
    const quantity = values.singleCount || 40;
    let quantityDiscount = 0;
    if (quantity >= 500) quantityDiscount = 0.15;
    else if (quantity >= 200) quantityDiscount = 0.10;
    else if (quantity >= 100) quantityDiscount = 0.05;
    
    // 表面处理成本
    let surfaceFinishCost = 0;
    if (values.surfaceFinish === "ENIG") surfaceFinishCost = 2.0;
    else if (values.surfaceFinish === "OSP") surfaceFinishCost = 0.5;
    else if (values.surfaceFinish === "Immersion Silver") surfaceFinishCost = 1.5;
    else if (values.surfaceFinish === "Immersion Tin") surfaceFinishCost = 1.2;
    
    // 钻孔成本（基于孔径）
    let drillCost = 0;
    const minHole = parseFloat(values.minHole || "0.2");
    if (minHole <= 0.15) drillCost = 1.5;
    else if (minHole <= 0.2) drillCost = 1.0;
    else drillCost = 0.5;
    
    // 加急费用（根据测试方法判断是否加急）
    let expediteCost = 0;
    // 如果选择了更复杂的测试方法，可能需要更多成本
    if (values.testMethod === "Test Fixture") {
      expediteCost = basePrice * 0.3;
    }
    
    // 计算总价
    const subtotal = (basePrice + layerCost + sizeCost + surfaceFinishCost + drillCost + expediteCost);
    const discountAmount = subtotal * quantityDiscount;
    const totalPrice = (subtotal - discountAmount) * quantity;
    const unitPrice = totalPrice / quantity;
    
    return {
      basePrice,
      layerCost,
      sizeCost,
      quantityDiscount: discountAmount,
      surfaceFinishCost,
      drillCost,
      expediteCost,
      totalPrice,
      unitPrice
    };
  }, [formValues]);

  // 获取交货时间
  const getLeadTime = () => {
    const values = formValues as QuoteFormData;
    // 根据测试方法和层数判断交货时间
    if (values.testMethod === "Test Fixture") {
      return "5-7 work days";
    }
    if (values.layers <= 4) return "7-10 work days";
    return "10-15 work days";
  };

  // 获取技术规格摘要
  const getTechSpecs = () => {
    const values = formValues as QuoteFormData;
    return {
      material: values.pcbType || "FR-4",
      layers: values.layers || 2,
      thickness: values.thickness || 1.6,
      size: `${values.singleDimensions?.length || 10} × ${values.singleDimensions?.width || 10}`,
      quantity: values.singleCount || 40,
      surfaceFinish: values.surfaceFinish || "HASL",
      minTrace: values.minTrace || "6/6",
      minHole: values.minHole || "0.2",
      color: values.solderMask || "Green"
    };
  };

  const specs = getTechSpecs();

  return (
    <div className="space-y-4">
      {/* 价格概览卡片 */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Calculator className="h-5 w-5" />
            Quote Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-blue-600">
              ${priceBreakdown.totalPrice.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">
              ${priceBreakdown.unitPrice.toFixed(3)} per piece
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Quantity:</span>
              <span className="font-medium">{specs.quantity} pcs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Layers:</span>
              <span className="font-medium">{specs.layers}L</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Size:</span>
              <span className="font-medium">{specs.size} cm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Material:</span>
              <span className="font-medium">{specs.material}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 交货信息 */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-green-500" />
              <span className="text-gray-600">Lead Time:</span>
              <span className="font-medium text-green-700">{getLeadTime()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-blue-500" />
              <span className="text-gray-600">Shipping:</span>
              <span className="font-medium">Free for orders over $100</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-orange-500" />
              <span className="text-gray-600">Express:</span>
              <span className="font-medium">Available (+50% cost)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 价格明细 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-700">Price Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Base Price:</span>
              <span>${priceBreakdown.basePrice.toFixed(2)}</span>
            </div>
            {priceBreakdown.layerCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Layer Cost:</span>
                <span>+${priceBreakdown.layerCost.toFixed(2)}</span>
              </div>
            )}
            {priceBreakdown.sizeCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Size Cost:</span>
                <span>+${priceBreakdown.sizeCost.toFixed(2)}</span>
              </div>
            )}
            {priceBreakdown.surfaceFinishCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Surface Finish:</span>
                <span>+${priceBreakdown.surfaceFinishCost.toFixed(2)}</span>
              </div>
            )}
            {priceBreakdown.drillCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Drilling:</span>
                <span>+${priceBreakdown.drillCost.toFixed(2)}</span>
              </div>
            )}
            {priceBreakdown.expediteCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Express Fee:</span>
                <span>+${priceBreakdown.expediteCost.toFixed(2)}</span>
              </div>
            )}
            {priceBreakdown.quantityDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Quantity Discount:</span>
                <span>-${priceBreakdown.quantityDiscount.toFixed(2)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 技术规格 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-700">Technical Specifications</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Thickness:</span>
              <span>{specs.thickness}mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Color:</span>
              <span>{specs.color}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Surface:</span>
              <span>{specs.surfaceFinish}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Min Trace:</span>
              <span>{specs.minTrace}mil</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Min Hole:</span>
              <span>{specs.minHole}mm</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 注意事项 */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-800">
              <p className="font-medium mb-1">Important Notes:</p>
              <ul className="space-y-1 text-amber-700">
                <li>• This is an estimated price based on standard specifications</li>
                <li>• Final pricing may vary after engineering review</li>
                <li>• Free design verification included</li>
                <li>• 100% quality testing guaranteed</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PriceSummary() {
  return (
    <FormConsumer>
      {(form) => {
        const formValues = form?.values || {};
        return <PriceSummaryContent formValues={formValues} />;
      }}
    </FormConsumer>
  );
} 