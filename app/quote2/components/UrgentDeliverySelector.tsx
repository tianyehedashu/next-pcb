"use client";

import React from "react";
import { useForm } from "@formily/react";
import { useQuoteCalculated, useQuoteStore } from "@/lib/stores/quote-store";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Zap, AlertTriangle } from "lucide-react";
import { getAvailableUrgentOptions, isUrgentSupported } from "@/lib/urgentDeliverySystem-v4";
import { cn } from "@/lib/utils";
import { DeliveryType } from "../schema/shared-types";

interface FormilyFieldProps {
  value?: { delivery?: string; urgentReduceDays?: number } | null;
  onChange?: (value: { delivery: string; urgentReduceDays: number }) => void;
  [key: string]: unknown;
}

export const UrgentDeliverySelector = (props: FormilyFieldProps) => {
  const form = useForm();
  const calculated = useQuoteCalculated();
  
  const deliveryData = props.value || { delivery: 'standard', urgentReduceDays: 0 };
  const { totalArea } = calculated;
  const formValues = form.values;

  // 检查是否支持加急
  const urgentSupported = isUrgentSupported(formValues, totalArea);
  
  // 处理delivery类型变化
  const handleDeliveryChange = (newDelivery: string) => {
    let newUrgentReduceDays = deliveryData.urgentReduceDays || 0;
    
    if (newDelivery === 'standard') {
      newUrgentReduceDays = 0;
    } else if (newDelivery === 'urgent' && newUrgentReduceDays === 0) {
      // 如果切换到加急但没有选择天数，默认选择第一个可用选项
      const availableOptions = getAvailableUrgentOptions(formValues, totalArea);
      if (availableOptions.length > 0) {
        newUrgentReduceDays = availableOptions[0].reduceDays;
      }
    }
    
    const newValue = {
      delivery: newDelivery as DeliveryType,
      urgentReduceDays: newUrgentReduceDays
    };
    
    // 更新 Formily 表单
    props.onChange?.(newValue);
    

  };

  // 处理加急天数变化
  const handleUrgentDaysChange = (days: number) => {
    const newValue = {
      delivery: (deliveryData.delivery || 'urgent') as DeliveryType,
      urgentReduceDays: days
    };
    
    // 更新 Formily 表单
    props.onChange?.(newValue);

  };

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardContent className="p-4 space-y-4">
        <h3 className="font-medium text-blue-900 flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          Delivery Type
        </h3>
        
        {/* Delivery Type Selection */}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleDeliveryChange('standard')}
            className={cn(
              "px-4 py-2 min-w-[80px] h-9 rounded-md border transition-colors duration-150 text-sm font-medium",
              deliveryData.delivery === 'standard'
                ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            )}
          >
            Standard
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => urgentSupported && handleDeliveryChange('urgent')}
            disabled={!urgentSupported}
            className={cn(
              "px-4 py-2 min-w-[80px] h-9 rounded-md border transition-colors duration-150 text-sm font-medium",
              deliveryData.delivery === 'urgent'
                ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50",
              !urgentSupported ? "opacity-50 cursor-not-allowed" : ""
            )}
          >
            Urgent
          </Button>
        </div>
        
        {/* Urgent Options */}
        {deliveryData.delivery === 'urgent' && urgentSupported && (
          <div className="space-y-2 pt-2">
            <div className="text-sm font-medium text-orange-800">Select Urgent Option:</div>
            <div className="flex flex-wrap gap-2">
              {getAvailableUrgentOptions(formValues, totalArea).map(option => (
                <Button
                  key={option.reduceDays}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleUrgentDaysChange(option.reduceDays)}
                  className={cn(
                    "px-4 py-2 min-w-[120px] h-9 rounded-md border transition-colors duration-150 text-sm font-medium",
                    deliveryData.urgentReduceDays === option.reduceDays
                      ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  )}
                >
                  Save {option.reduceDays} Day(s)
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {/* Warning Message */}
        {!urgentSupported && deliveryData.delivery === 'urgent' && (
          <Alert className="border-amber-200 bg-amber-50 mt-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-sm">
              Urgent delivery is not available for the current PCB configuration. It has been switched to Standard.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};