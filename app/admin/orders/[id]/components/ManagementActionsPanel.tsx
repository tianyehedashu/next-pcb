import React from 'react';
import { Calculator, Clock, CheckCircle, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuoteFormData } from '@/app/quote2/schema/quoteSchema';

interface ManagementActionsPanelProps {
  pcbFormData: QuoteFormData | null;
  isUpdating: boolean;
  isAdminOrderCreated: boolean;
  onCalcPCB: () => void;
  onCalcDelivery: () => void;
  onRecalc: () => void;
  onSave: () => void;
  onSaveAndNotify: () => void;
}

export function ManagementActionsPanel({
  pcbFormData,
  isUpdating,
  isAdminOrderCreated,
  onCalcPCB,
  onCalcDelivery,
  onRecalc,
  onSave,
  onSaveAndNotify
}: ManagementActionsPanelProps) {
  return (
    <div className="bg-white border rounded">
      <div className="bg-orange-50 px-3 py-2 border-b">
        <h3 className="text-sm font-semibold text-orange-800 flex items-center gap-2">
          <Calculator className="w-4 h-4" />
          管理操作
        </h3>
      </div>
      <div className="p-3 space-y-2">
        <div className="grid grid-cols-3 gap-1">
          <Button 
            onClick={onCalcPCB}
            size="sm"
            variant="outline"
            className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
            disabled={!pcbFormData}
          >
            <Calculator className="w-3 h-3 mr-1" />
            重算价格
          </Button>
          <Button 
            onClick={onCalcDelivery}
            size="sm"
            variant="outline"
            className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
            disabled={!pcbFormData}
          >
            <Clock className="w-3 h-3 mr-1" />
            重算交期
          </Button>
          <Button 
            onClick={onRecalc}
            size="sm"
            variant="outline"
            className="text-xs border-orange-200 text-orange-700 hover:bg-orange-50"
            disabled={!pcbFormData}
          >
            🔄 全部
          </Button>
        </div>
        <Button 
          onClick={onSave}
          size="sm"
          className="w-full bg-green-600 hover:bg-green-700 text-white text-xs"
          disabled={isUpdating}
        >
          {isUpdating ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              保存中
            </>
          ) : (
            <>
              <CheckCircle className="w-3 h-3 mr-1" />
              {isAdminOrderCreated ? '保存订单' : '创建订单'}
            </>
          )}
        </Button>
        <Button 
          variant="outline"
          size="sm"
          className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 text-xs"
          onClick={onSaveAndNotify}
          disabled={isUpdating}
        >
          <Send className="w-3 h-3 mr-1" />
          保存并通知客户
        </Button>
      </div>
    </div>
  );
} 