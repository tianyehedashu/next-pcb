"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  StencilMaterial,
  StencilThickness,
  StencilProcess,
  FrameType,
  SurfaceTreatment,
  StencilMaterialLabels,
  StencilThicknessLabels,
  StencilProcessLabels,
  FrameTypeLabels,
  SurfaceTreatmentLabels
} from '../quote2/schema/stencilTypes';

export default function TestStencilQuotePage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: 'test@example.com',
    phone: '+1234567890',
    productType: 'stencil',
    stencilMaterial: StencilMaterial.STAINLESS_304,
    stencilThickness: StencilThickness.T_0_12,
    stencilProcess: StencilProcess.LASER_CUT,
    frameType: FrameType.NONE,
    surfaceTreatment: SurfaceTreatment.ELECTROPOLISH,
    singleDimensions: {
      length: 100,
      width: 80
    },
    singleCount: 5,
    deliveryOptions: {
      delivery: 'standard'
    },
    notes: 'Test stencil order'
  });

  const [result, setResult] = useState<unknown>(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      console.log('Submitting stencil quote:', formData);
      
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit quote');
      }

      setResult(data);
      toast.success('Stencil quote submitted successfully!');
      
    } catch (error) {
      console.error('Error submitting quote:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit quote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">🔧 Stencil Quote API Test</CardTitle>
          <p className="text-gray-600">Test the stencil quote submission system</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="test@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+1234567890"
              />
            </div>
          </div>

          {/* 钢网规格 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-blue-800">Stencil Specifications</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Material</label>
                <Select
                  value={formData.stencilMaterial}
                  onValueChange={(value) => setFormData({...formData, stencilMaterial: value as StencilMaterial})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(StencilMaterial).map((material) => (
                      <SelectItem key={material} value={material}>
                        {StencilMaterialLabels[material]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Thickness</label>
                <Select
                  value={formData.stencilThickness}
                  onValueChange={(value) => setFormData({...formData, stencilThickness: value as StencilThickness})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(StencilThickness).map((thickness) => (
                      <SelectItem key={thickness} value={thickness}>
                        {StencilThicknessLabels[thickness]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Process</label>
                <Select
                  value={formData.stencilProcess}
                  onValueChange={(value) => setFormData({...formData, stencilProcess: value as StencilProcess})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(StencilProcess).map((process) => (
                      <SelectItem key={process} value={process}>
                        {StencilProcessLabels[process]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Frame Type</label>
                <Select
                  value={formData.frameType}
                  onValueChange={(value) => setFormData({...formData, frameType: value as FrameType})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(FrameType).map((frame) => (
                      <SelectItem key={frame} value={frame}>
                        {FrameTypeLabels[frame]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Surface Treatment</label>
                <Select
                  value={formData.surfaceTreatment}
                  onValueChange={(value) => setFormData({...formData, surfaceTreatment: value as SurfaceTreatment})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(SurfaceTreatment).map((treatment) => (
                      <SelectItem key={treatment} value={treatment}>
                        {SurfaceTreatmentLabels[treatment]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <Input
                  type="number"
                  value={formData.singleCount}
                  onChange={(e) => setFormData({...formData, singleCount: parseInt(e.target.value) || 1})}
                  min="1"
                  placeholder="5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2">Length (mm)</label>
                <Input
                  type="number"
                  value={formData.singleDimensions.length}
                  onChange={(e) => setFormData({
                    ...formData, 
                    singleDimensions: {...formData.singleDimensions, length: parseFloat(e.target.value) || 0}
                  })}
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Width (mm)</label>
                <Input
                  type="number"
                  value={formData.singleDimensions.width}
                  onChange={(e) => setFormData({
                    ...formData, 
                    singleDimensions: {...formData.singleDimensions, width: parseFloat(e.target.value) || 0}
                  })}
                  placeholder="80"
                />
              </div>
            </div>
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Additional requirements..."
            />
          </div>

          {/* 提交按钮 */}
          <Button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Submitting...' : 'Submit Stencil Quote'}
          </Button>

          {/* 结果显示 */}
          {result && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-green-800">API Response</h3>
              <pre className="text-sm text-green-700 overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 