import React from 'react';
import { FileText, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuoteFormData } from '@/app/quote2/schema/quoteSchema';
import { DeliveryType } from '@/app/quote2/schema/shared-types';
import { ProductReport } from '@/types/form';

interface PCBSpecificationDisplayProps {
  pcbFormData: QuoteFormData | null;
}

export function PCBSpecificationDisplay({ pcbFormData }: PCBSpecificationDisplayProps) {
  if (!pcbFormData) {
    return (
      <Card className="border-2 border-orange-200">
        <CardHeader className="bg-orange-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            PCB Specifications
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-center py-8 text-red-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm font-semibold">⚠️ PCB specifications not available</p>
            <p className="text-xs">Unable to display technical specifications</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-orange-200">
      <CardHeader className="bg-orange-50 border-b">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            PCB Specifications
          </div>
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium text-xs sm:text-sm border border-blue-200">
              {pcbFormData.layers}L
            </span>
            <span className="px-2 py-1 bg-green-50 text-green-700 rounded font-medium text-xs sm:text-sm border border-green-200">
              {pcbFormData.singleCount || pcbFormData.panelSet}
              {pcbFormData.shipmentType === 'single' ? 'pcs' : 'set'}
            </span>
            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded font-medium text-xs sm:text-sm border border-purple-200">
              {pcbFormData.thickness}mm
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
          {/* Basic Parameters */}
          <div className="border-b">
            <div className="bg-blue-50 px-4 py-2 border-b">
              <h4 className="text-sm font-semibold text-blue-800">Basic Parameters</h4>
            </div>
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-6 text-xs">
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Material</div>
                <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.pcbType || 'FR-4'}</div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Layers</div>
                <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.layers}</div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Thickness</div>
                <div className="border-b p-2 text-center font-semibold">{pcbFormData.thickness}mm</div>
                
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Size</div>
                <div className="border-r border-b p-2 text-center font-semibold">
                  {pcbFormData.singleDimensions?.length}×{pcbFormData.singleDimensions?.width}mm
                </div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Quantity Type</div>
                <div className="border-r border-b p-2 text-center font-semibold">
                  {pcbFormData.shipmentType === 'single' ? 'Single' : 
                   pcbFormData.shipmentType === 'panel_by_gerber' ? 'Gerber Panel' :
                   pcbFormData.shipmentType === 'panel_by_speedx' ? 'SpeedX Panel' : '-'}
                </div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Quantity</div>
                <div className="border-b p-2 text-center font-semibold">
                  {pcbFormData.shipmentType === 'single' ? 
                   `${pcbFormData.singleCount} pcs` :
                   `${pcbFormData.panelSet} set`}
                </div>
                
                <div className="border-r border-b p-2 bg-gray-50 font-medium">HDI</div>
                <div className="border-r border-b p-2 text-center font-semibold text-red-600">
                  {pcbFormData.hdi || 'None'}
                </div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">TG</div>
                <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.tg || 'Standard'}</div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Designs</div>
                <div className="border-b p-2 text-center font-semibold">{pcbFormData.differentDesignsCount || '1'}</div>
              </div>
            </div>
            
            {/* Mobile Cards */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Material</div>
                <div className="text-sm font-medium">{pcbFormData.pcbType || 'FR-4'}</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Layers</div>
                <div className="text-sm font-medium">{pcbFormData.layers}</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Thickness</div>
                <div className="text-sm font-medium">{pcbFormData.thickness}mm</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Size</div>
                <div className="text-sm font-medium">
                  {pcbFormData.singleDimensions?.length}×{pcbFormData.singleDimensions?.width}mm
                </div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Quantity Type</div>
                <div className="text-sm font-medium">
                  {pcbFormData.shipmentType === 'single' ? 'Single' : 
                   pcbFormData.shipmentType === 'panel_by_gerber' ? 'Gerber Panel' :
                   pcbFormData.shipmentType === 'panel_by_speedx' ? 'SpeedX Panel' : '-'}
                </div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Quantity</div>
                <div className="text-sm font-medium">
                  {pcbFormData.shipmentType === 'single' ? 
                   `${pcbFormData.singleCount} pcs` :
                   `${pcbFormData.panelSet} set`}
                </div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">HDI</div>
                <div className="text-sm font-medium text-red-600">{pcbFormData.hdi || 'None'}</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">TG</div>
                <div className="text-sm font-medium">{pcbFormData.tg || 'Standard'}</div>
              </div>
            </div>
          </div>

          {/* Process Parameters */}
          <div className="border-b">
            <div className="bg-orange-50 px-4 py-2 border-b">
              <h4 className="text-sm font-semibold text-orange-800">Process Parameters</h4>
            </div>
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-6 text-xs">
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Outer Copper</div>
                <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.outerCopperWeight || '1'}oz</div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Inner Copper</div>
                <div className="border-r border-b p-2 text-center font-semibold">
                  {Number(pcbFormData.layers) >= 4 ? `${pcbFormData.innerCopperWeight || '0.5'}oz` : 'N/A'}
                </div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Min Trace/Space</div>
                <div className="border-b p-2 text-center font-semibold">{pcbFormData.minTrace || '6/6'}mil</div>
                
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Min Hole</div>
                <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.minHole || '0.3'}mm</div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Solder Mask</div>
                <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.solderMask || 'Green'}</div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Silkscreen</div>
                <div className="border-b p-2 text-center font-semibold">{pcbFormData.silkscreen || 'White'}</div>
                
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Surface Finish</div>
                <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.surfaceFinish || 'HASL'}</div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">ENIG Type</div>
                <div className="border-r border-b p-2 text-center font-semibold">
                  {pcbFormData.surfaceFinish === 'ENIG' ? (pcbFormData.surfaceFinishEnigType || 'Standard') : 'N/A'}
                </div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Via Process</div>
                <div className="border-b p-2 text-center font-semibold">{pcbFormData.maskCover || 'Tented'}</div>
              </div>
            </div>
            
            {/* Mobile Cards */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Outer Copper</div>
                <div className="text-sm font-medium">{pcbFormData.outerCopperWeight || '1'}oz</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Inner Copper</div>
                <div className="text-sm font-medium">
                  {Number(pcbFormData.layers) >= 4 ? `${pcbFormData.innerCopperWeight || '0.5'}oz` : 'N/A'}
                </div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Min Trace/Space</div>
                <div className="text-sm font-medium">{pcbFormData.minTrace || '6/6'}mil</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Min Hole</div>
                <div className="text-sm font-medium">{pcbFormData.minHole || '0.3'}mm</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Solder Mask</div>
                <div className="text-sm font-medium">{pcbFormData.solderMask || 'Green'}</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Silkscreen</div>
                <div className="text-sm font-medium">{pcbFormData.silkscreen || 'White'}</div>
              </div>
            </div>
          </div>

          {/* Special Features */}
          <div className="border-b">
            <div className="bg-purple-50 px-4 py-2 border-b">
              <h4 className="text-sm font-semibold text-purple-800">Special Features</h4>
            </div>
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-6 text-xs">
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Impedance Control</div>
                <div className="border-r border-b p-2 text-center font-semibold text-red-600">
                  {pcbFormData.impedance ? 'Required' : 'Not Required'}
                </div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Gold Fingers</div>
                <div className="border-r border-b p-2 text-center font-semibold text-red-600">
                  {pcbFormData.goldFingers ? 'Required' : 'Not Required'}
                </div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Gold Fingers Bevel</div>
                <div className="border-b p-2 text-center font-semibold">
                  {pcbFormData.goldFingers && pcbFormData.goldFingersBevel ? 'Required' : 'Not Required'}
                </div>
                
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Edge Plating</div>
                <div className="border-r border-b p-2 text-center font-semibold text-red-600">
                  {pcbFormData.edgePlating ? 'Required' : 'Not Required'}
                </div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Edge Cover</div>
                <div className="border-r border-b p-2 text-center font-semibold">
                  {pcbFormData.edgePlating ? (pcbFormData.edgeCover || 'No') : 'N/A'}
                </div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">UL Mark</div>
                <div className="border-b p-2 text-center font-semibold">
                  {pcbFormData.ulMark ? 'Required' : 'Not Required'}
                </div>
              </div>
            </div>
            
            {/* Mobile Cards */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Impedance Control</div>
                <div className="text-sm font-medium text-red-600">
                  {pcbFormData.impedance ? 'Required' : 'Not Required'}
                </div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Gold Fingers</div>
                <div className="text-sm font-medium text-red-600">
                  {pcbFormData.goldFingers ? 'Required' : 'Not Required'}
                </div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Edge Plating</div>
                <div className="text-sm font-medium text-red-600">
                  {pcbFormData.edgePlating ? 'Required' : 'Not Required'}
                </div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">UL Mark</div>
                <div className="text-sm font-medium">
                  {pcbFormData.ulMark ? 'Required' : 'Not Required'}
                </div>
              </div>
            </div>
          </div>

          {/* Service & Other Requirements */}
          <div className="border-b">
            <div className="bg-teal-50 px-4 py-2 border-b">
              <h4 className="text-sm font-semibold text-teal-800">Service & Other Requirements</h4>
            </div>
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-6 text-xs">
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Shengyi Material</div>
                <div className="border-r border-b p-2 text-center font-semibold text-red-600">
                  {pcbFormData.useShengyiMaterial ? 'Yes' : 'No'}
                </div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Test Method</div>
                <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.testMethod || 'Default'}</div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">IPC Class</div>
                <div className="border-b p-2 text-center font-semibold">{pcbFormData.ipcClass || 'IPC Class 2'}</div>
                
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Delivery Type</div>
                <div className="border-r border-b p-2 text-center font-semibold">
                  {pcbFormData.delivery === DeliveryType.Urgent ? 'Urgent ⚡' : 'Standard'}
                </div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Working Gerber</div>
                <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.workingGerber || 'Customer Provided'}</div>
                <div className="border-r border-b p-2 bg-gray-50 font-medium">Data Conflicts</div>
                <div className="border-b p-2 text-center font-semibold">{pcbFormData.ifDataConflicts || 'Follow Gerber'}</div>
                
                <div className="border-r p-2 bg-gray-50 font-medium">Accept Cross Outs</div>
                <div className="border-r p-2 text-center font-semibold">
                  {pcbFormData.crossOuts === 'Accept' ? 'Yes' : 'No'}
                </div>
                <div className="border-r p-2 bg-gray-50 font-medium">Product Report</div>
                <div className="col-span-3 p-2 text-center font-semibold">
                  {(pcbFormData.productReport && pcbFormData.productReport.length > 0 && !pcbFormData.productReport.includes(ProductReport.None))
                    ? pcbFormData.productReport.join(', ')
                    : 'None'}
                </div>
              </div>
            </div>
            
            {/* Mobile Cards */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Shengyi Material</div>
                <div className="text-sm font-medium text-red-600">
                  {pcbFormData.useShengyiMaterial ? 'Yes' : 'No'}
                </div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Test Method</div>
                <div className="text-sm font-medium">{pcbFormData.testMethod || 'Default'}</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">IPC Class</div>
                <div className="text-sm font-medium">{pcbFormData.ipcClass || 'IPC Class 2'}</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600 mb-1">Delivery Type</div>
                <div className="text-sm font-medium">
                  {pcbFormData.delivery === DeliveryType.Urgent ? 'Urgent ⚡' : 'Standard'}
                </div>
              </div>
            </div>
          </div>

          {/* Panel Information - if applicable */}
          {(pcbFormData.shipmentType === 'panel_by_gerber' || pcbFormData.shipmentType === 'panel_by_speedx') && (
            <div className="border-b">
              <div className="bg-indigo-50 px-4 py-2 border-b">
                <h4 className="text-sm font-semibold text-indigo-800">Panel Information</h4>
              </div>
              {/* Desktop Table */}
              <div className="hidden lg:block">
                <div className="grid grid-cols-6 text-xs">
                  <div className="border-r border-b p-2 bg-gray-50 font-medium">Panel Type</div>
                  <div className="border-r border-b p-2 text-center font-semibold">
                    {pcbFormData.shipmentType === 'panel_by_gerber' ? 'Gerber Panel' : 'SpeedX Panel'}
                  </div>
                  <div className="border-r border-b p-2 bg-gray-50 font-medium">Panel Size</div>
                  <div className="border-r border-b p-2 text-center font-semibold">
                    {pcbFormData.panelDimensions ? 
                      `${pcbFormData.panelDimensions.row}×${pcbFormData.panelDimensions.column}` : '-'}
                  </div>
                  <div className="border-r border-b p-2 bg-gray-50 font-medium">Panel Quantity</div>
                  <div className="border-b p-2 text-center font-semibold">{pcbFormData.panelSet || '-'} set</div>
                  
                  {pcbFormData.shipmentType === 'panel_by_speedx' && (
                    <>
                      <div className="border-r border-b p-2 bg-gray-50 font-medium">Break-away Rail</div>
                      <div className="border-r border-b p-2 text-center font-semibold">
                        {pcbFormData.breakAwayRail || 'None'}
                      </div>
                      <div className="border-r border-b p-2 bg-gray-50 font-medium">Rail Width</div>
                      <div className="border-r border-b p-2 text-center font-semibold">
                        {pcbFormData.breakAwayRail !== 'None' ? (pcbFormData.border || '5') + 'mm' : 'N/A'}
                      </div>
                      <div className="border-r border-b p-2 bg-gray-50 font-medium">Separation</div>
                      <div className="border-b p-2 text-center font-semibold">
                        {pcbFormData.breakAwayRail !== 'None' ? (pcbFormData.borderCutType || 'V-Cut') : 'N/A'}
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Mobile Cards */}
              <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-xs text-gray-600 mb-1">Panel Type</div>
                  <div className="text-sm font-medium">
                    {pcbFormData.shipmentType === 'panel_by_gerber' ? 'Gerber Panel' : 'SpeedX Panel'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-xs text-gray-600 mb-1">Panel Size</div>
                  <div className="text-sm font-medium">
                    {pcbFormData.panelDimensions ? 
                      `${pcbFormData.panelDimensions.row}×${pcbFormData.panelDimensions.column}` : '-'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-xs text-gray-600 mb-1">Panel Quantity</div>
                  <div className="text-sm font-medium">{pcbFormData.panelSet || '-'} set</div>
                </div>
              </div>
            </div>
          )}

          {/* Notes and Special Requests */}
          {(pcbFormData.pcbNote || pcbFormData.specialRequests) && (
            <div>
              <div className="bg-yellow-50 px-4 py-2 border-b">
                <h4 className="text-sm font-semibold text-yellow-800">Notes & Special Requests</h4>
              </div>
              <div className="p-3 text-xs space-y-2">
                {pcbFormData.pcbNote && (
                  <div>
                    <strong className="font-medium text-gray-700">PCB Note:</strong>
                    <p className="p-2 bg-gray-50 rounded mt-1 whitespace-pre-wrap text-gray-800">{pcbFormData.pcbNote}</p>
                  </div>
                )}
                {pcbFormData.specialRequests && (
                  <div>
                    <strong className="font-medium text-gray-700">Special Requests:</strong>
                    <p className="p-2 bg-gray-50 rounded mt-1 whitespace-pre-wrap text-gray-800">{pcbFormData.specialRequests}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 