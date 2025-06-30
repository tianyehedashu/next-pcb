"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  StencilProcess, 
  StencilMaterial, 
  StencilThickness, 
  FrameType,
  StencilProcessLabels,
  StencilMaterialLabels,
  StencilThicknessLabels,
  FrameTypeLabels 
} from '../schema/stencilTypes';

interface StencilProcessGuideProps {
  selectedProcess?: StencilProcess;
  selectedMaterial?: StencilMaterial;
  selectedThickness?: StencilThickness;
  selectedFrameType?: FrameType;
}

export const StencilProcessGuide: React.FC<StencilProcessGuideProps> = ({
  selectedProcess,
  selectedMaterial,
  selectedThickness,
  selectedFrameType
}) => {
  const processInfo = {
    [StencilProcess.LASER_CUT]: {
      title: 'Laser Cutting',
      description: 'Most common and cost-effective method',
      advantages: [
        'Fast production (1-2 days)',
        'Good for most component types', 
        'Cost-effective',
        'Smooth aperture walls'
      ],
      disadvantages: [
        'Heat affected zone',
        'Limited for ultra-fine pitch (<0.2mm)',
        'Slight taper in apertures'
      ],
      applications: 'Ideal for standard SMT components, QFP, BGA ≥0.3mm pitch',
      priceMultiplier: '1.0x (Base price)',
      leadTime: '+0 days',
      color: 'blue'
    },
    [StencilProcess.ELECTROFORM]: {
      title: 'Electroforming',
      description: 'Highest precision method for fine pitch components',
      advantages: [
        'Excellent aperture quality',
        'Perfect for fine pitch (≤0.2mm)',
        'No heat affected zone',
        'Straight aperture walls'
      ],
      disadvantages: [
        'Higher cost',
        'Longer production time',
        'Limited thickness options'
      ],
      applications: 'Best for ultra-fine pitch BGA, CSP, 01005 components',
      priceMultiplier: '2.5x (Base price)',
      leadTime: '+4 days',
      color: 'purple'
    },
    [StencilProcess.CHEMICAL_ETCH]: {
      title: 'Chemical Etching',
      description: 'Traditional method with good precision',
      advantages: [
        'Good for fine pitch',
        'No thermal stress',
        'Smooth finish',
        'Cost-effective for volume'
      ],
      disadvantages: [
        'Longer lead time',
        'Undercut possible',
        'Chemical handling required'
      ],
      applications: 'Suitable for fine pitch QFN, dense layouts',
      priceMultiplier: '1.8x (Base price)',
      leadTime: '+2 days', 
      color: 'green'
    }
  };

  const materialInfo = {
    [StencilMaterial.STAINLESS_STEEL_304]: {
      description: 'Standard grade, excellent durability',
      characteristics: ['Corrosion resistant', 'Good flexibility', 'Easy to clean'],
      applications: 'Most common choice for general applications'
    },
    [StencilMaterial.STAINLESS_STEEL_316L]: {
      description: 'Premium grade with enhanced corrosion resistance',
      characteristics: ['Superior corrosion resistance', 'Medical grade', 'Low carbon content'],
      applications: 'Medical devices, marine applications, harsh environments'
    },
    [StencilMaterial.NICKEL]: {
      description: 'Highest precision for ultra-fine pitch',
      characteristics: ['Excellent fine feature definition', 'Superior aperture quality', 'Premium option'],
      applications: 'Ultra-fine pitch, high-density designs, premium applications'
    }
  };

  const thicknessGuide = {
    [StencilThickness.T0_08]: {
      applications: 'Ultra-fine pitch (01005, <0.2mm)',
      notes: 'Requires careful handling, electroforming recommended'
    },
    [StencilThickness.T0_10]: {
      applications: 'Fine pitch components (0.2-0.3mm)',
      notes: 'Good balance for fine pitch applications'
    },
    [StencilThickness.T0_12]: {
      applications: 'Standard SMT components (0.3-0.5mm)',
      notes: 'Most common thickness, good for general use'
    },
    [StencilThickness.T0_15]: {
      applications: 'Large components, connectors (>0.5mm)',
      notes: 'Provides more solder volume'
    },
    [StencilThickness.T0_20]: {
      applications: 'Very large components, specialized applications',
      notes: 'Maximum solder volume, requires strong frame'
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Selection Summary */}
      {(selectedProcess || selectedMaterial || selectedThickness) && (
        <Alert>
          <AlertDescription className="space-y-2">
            <div className="font-medium text-gray-800">Current Selection Summary:</div>
            <div className="flex flex-wrap gap-2">
              {selectedProcess && (
                <Badge variant="outline" className="border-blue-300 text-blue-700">
                  {StencilProcessLabels[selectedProcess]} - {processInfo[selectedProcess].priceMultiplier}
                </Badge>
              )}
              {selectedMaterial && (
                <Badge variant="outline">
                  {StencilMaterialLabels[selectedMaterial]}
                </Badge>
              )}
              {selectedThickness && (
                <Badge variant="outline">
                  {StencilThicknessLabels[selectedThickness]}
                </Badge>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="process" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="process">Process</TabsTrigger>
          <TabsTrigger value="material">Material</TabsTrigger>
          <TabsTrigger value="recommendations">Tips</TabsTrigger>
        </TabsList>

        {/* Manufacturing Process Guide */}
        <TabsContent value="process" className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Manufacturing Process Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(processInfo).map(([process, info]) => (
              <Card key={process} className={`border-2 ${selectedProcess === process ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    {info.title}
                    <Badge variant={selectedProcess === process ? 'default' : 'outline'}>
                      {info.priceMultiplier}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-gray-600">{info.description}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-green-700 mb-1">✓ Advantages</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {info.advantages.map((advantage, index) => (
                        <li key={index}>• {advantage}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-orange-700 mb-1">⚠ Considerations</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {info.disadvantages.map((disadvantage, index) => (
                        <li key={index}>• {disadvantage}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-700">
                      <strong>Best for:</strong> {info.applications}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      <strong>Lead time:</strong> {info.leadTime}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Material Guide */}
        <TabsContent value="material" className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Material Selection Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(materialInfo).map(([material, info]) => (
              <Card key={material} className={`${selectedMaterial === material ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {StencilMaterialLabels[material as StencilMaterial]}
                  </CardTitle>
                  <p className="text-sm text-gray-600">{info.description}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Characteristics</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {info.characteristics.map((char, index) => (
                        <li key={index}>• {char}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-700">
                      <strong>Best for:</strong> {info.applications}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Recommendations */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-base text-green-800">💡 Quick Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-green-700">
              <p><strong>For standard SMT components:</strong> Laser cutting + SS304 + 0.12mm + SMT frame</p>
              <p><strong>For fine pitch BGA (≤0.3mm):</strong> Electroforming + Nickel + 0.10mm + SMT frame</p>
              <p><strong>For prototyping/low volume:</strong> Laser cutting + SS304 + 0.12mm + No frame</p>
              <p><strong>For harsh environments:</strong> Any process + SS316L + Suitable thickness + SMT frame</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-base text-blue-800">📏 Thickness Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-blue-700">
              <p><strong>0.08mm:</strong> Ultra-fine pitch (01005, &lt;0.2mm spacing)</p>
              <p><strong>0.10mm:</strong> Fine pitch components (0.2-0.3mm spacing)</p>
              <p><strong>0.12mm:</strong> Standard SMT components (0.3-0.5mm spacing) - Most common</p>
              <p><strong>0.15mm:</strong> Large components, connectors (&gt;0.5mm spacing)</p>
              <p><strong>0.20mm:</strong> Very large components, specialized applications</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 