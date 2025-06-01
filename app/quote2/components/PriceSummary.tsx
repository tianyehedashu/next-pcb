"use client";

import { useMemo } from "react";
import { FormConsumer } from "@formily/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Info, Truck, Clock, Zap, TrendingUp, CheckCircle, Download, Share } from "lucide-react";
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
    <div className="p-6 lg:p-8 space-y-6">
      {/* 主要价格展示卡片 */}
      <Card className="border-blue-200/60 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calculator className="h-5 w-5 text-blue-600" />
            </div>
            Quote Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="relative">
              <div className="text-4xl lg:text-5xl font-bold text-blue-600 mb-2 animate-pulse">
                ${priceBreakdown.totalPrice.toFixed(2)}
              </div>
              <div className="absolute -top-2 -right-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-4">
              ${priceBreakdown.unitPrice.toFixed(3)} per piece
            </div>
            
            {/* 价格趋势指示器 */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              Competitive Price
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg">
              <span className="text-gray-600">Quantity:</span>
              <span className="font-semibold text-gray-900">{specs.quantity} pcs</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg">
              <span className="text-gray-600">Layers:</span>
              <span className="font-semibold text-gray-900">{specs.layers}L</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg">
              <span className="text-gray-600">Size:</span>
              <span className="font-semibold text-gray-900">{specs.size} cm</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg">
              <span className="text-gray-600">Material:</span>
              <span className="font-semibold text-gray-900">{specs.material}</span>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 group">
              <Download className="h-4 w-4 mr-2 group-hover:translate-y-0.5 transition-transform" />
              Download
            </Button>
            <Button variant="outline" size="sm" className="flex-1 group">
              <Share className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 交货和服务信息 */}
      <Card className="shadow-md hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-500" />
            Delivery & Service
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <div>
              <div className="font-medium text-green-800">Lead Time: {getLeadTime()}</div>
              <div className="text-sm text-green-600">Standard manufacturing time</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Truck className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <div>
              <div className="font-medium text-blue-800">Free Shipping</div>
              <div className="text-sm text-blue-600">For orders over $100</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <Zap className="h-5 w-5 text-orange-500 flex-shrink-0" />
            <div>
              <div className="font-medium text-orange-800">Express Available</div>
              <div className="text-sm text-orange-600">+50% cost for rush orders</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 价格明细 */}
      <Card className="shadow-md hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-800">Price Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Base Price:</span>
              <span className="font-medium">${priceBreakdown.basePrice.toFixed(2)}</span>
            </div>
            {priceBreakdown.layerCost > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Layer Cost:</span>
                <span className="font-medium text-blue-600">+${priceBreakdown.layerCost.toFixed(2)}</span>
              </div>
            )}
            {priceBreakdown.sizeCost > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Size Cost:</span>
                <span className="font-medium text-blue-600">+${priceBreakdown.sizeCost.toFixed(2)}</span>
              </div>
            )}
            {priceBreakdown.surfaceFinishCost > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Surface Finish:</span>
                <span className="font-medium text-blue-600">+${priceBreakdown.surfaceFinishCost.toFixed(2)}</span>
              </div>
            )}
            {priceBreakdown.drillCost > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Drilling:</span>
                <span className="font-medium text-blue-600">+${priceBreakdown.drillCost.toFixed(2)}</span>
              </div>
            )}
            {priceBreakdown.expediteCost > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Express Fee:</span>
                <span className="font-medium text-orange-600">+${priceBreakdown.expediteCost.toFixed(2)}</span>
              </div>
            )}
            {priceBreakdown.quantityDiscount > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-green-600 font-medium">Quantity Discount:</span>
                <span className="font-medium text-green-600">-${priceBreakdown.quantityDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-3 font-semibold">
              <span className="text-gray-800">Total per Unit:</span>
              <span className="text-blue-600 text-lg">${priceBreakdown.unitPrice.toFixed(3)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 技术规格 */}
      <Card className="shadow-md hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-800">Technical Specifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-gray-600">Thickness:</span>
              <span className="font-medium">{specs.thickness}mm</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-gray-600">Color:</span>
              <span className="font-medium">{specs.color}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-gray-600">Surface:</span>
              <span className="font-medium">{specs.surfaceFinish}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-gray-600">Min Trace:</span>
              <span className="font-medium">{specs.minTrace}mil</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded col-span-2">
              <span className="text-gray-600">Min Hole:</span>
              <span className="font-medium">{specs.minHole}mm</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 重要提示 */}
      <Card className="border-amber-200/60 bg-gradient-to-br from-amber-50/80 to-yellow-50/80 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
              <Info className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-sm">
              <p className="font-semibold text-amber-800 mb-2">Important Notes:</p>
              <ul className="space-y-1.5 text-amber-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                  Estimated price based on standard specifications
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                  Final pricing confirmed after engineering review
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                  Free design verification included
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                  100% quality testing guaranteed
                </li>
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