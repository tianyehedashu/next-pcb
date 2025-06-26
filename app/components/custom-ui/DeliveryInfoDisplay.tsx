"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock } from 'lucide-react';

interface DeliveryInfoDisplayProps {
  pcbSpec: Record<string, unknown> & {
    delivery?: string;
    deliveryOptions?: {
      delivery?: string;
      urgentReduceDays?: number;
    };
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function DeliveryInfoDisplay({ pcbSpec, className = '', size = 'md' }: DeliveryInfoDisplayProps) {
  // 获取delivery信息，优先使用新的deliveryOptions结构
  const delivery = pcbSpec?.deliveryOptions?.delivery || pcbSpec?.delivery || 'standard';
  const urgentReduceDays = pcbSpec?.deliveryOptions?.urgentReduceDays || 0;
  
  const isUrgent = delivery === 'urgent' && urgentReduceDays > 0;
  
  if (isUrgent) {
    return (
      <Badge 
        variant="outline" 
        className={`inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 border-orange-200 ${className}`}
      >
        <Zap className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} />
        <span>Urgent (-{urgentReduceDays} day{urgentReduceDays > 1 ? 's' : ''})</span>
      </Badge>
    );
  }
  
  return (
    <Badge 
      variant="outline" 
      className={`inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border-blue-200 ${className}`}
    >
      <Clock className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} />
      <span>Standard</span>
    </Badge>
  );
}

export default DeliveryInfoDisplay; 