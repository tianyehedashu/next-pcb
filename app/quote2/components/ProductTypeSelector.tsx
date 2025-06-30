"use client";

import React from 'react';
import { ProductType } from '../schema/stencilTypes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProductTypeSelectorProps {
  value: ProductType;
  onChange: (type: ProductType) => void;
}

export const ProductTypeSelector: React.FC<ProductTypeSelectorProps> = ({ 
  value, 
  onChange 
}) => {
  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Product Type:</span>
          <div className="flex gap-2">
            <Button
              variant={value === ProductType.PCB ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(ProductType.PCB)}
              className="h-8 px-3"
            >
              🔧 PCB
            </Button>
            <Button
              variant={value === ProductType.STENCIL ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(ProductType.STENCIL)}
              className="h-8 px-3"
            >
              📐 Stencil
            </Button>
          </div>
        </div>
        
        <Badge variant="secondary" className="text-xs">
          {value === ProductType.PCB ? 'Circuit Board Manufacturing' : 'Solder Paste Stencil'}
        </Badge>
      </div>
    </div>
  );
}; 