'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';

interface OrderCancellationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: CancellationData) => Promise<void>;
  orderId: string;
  orderStatus: string;
  loading?: boolean;
}

interface CancellationData {
  reason: string;
  customReason?: string;
  notifyAdmin?: boolean;
}

const CANCELLATION_REASONS = [
  { 
    value: 'changed_mind', 
    label: 'Changed my mind',
    description: 'No longer need this PCB'
  },
  { 
    value: 'design_changes', 
    label: 'Need to modify design',
    description: 'Found issues or want to update the PCB design'
  },
  { 
    value: 'price_concern', 
    label: 'Price is too high',
    description: 'The quoted price exceeds my budget'
  },
  { 
    value: 'timeline_delay', 
    label: 'Taking too long',
    description: 'The lead time is longer than expected'
  },
  { 
    value: 'found_alternative', 
    label: 'Found alternative supplier',
    description: 'Using a different PCB manufacturer'
  },
  { 
    value: 'project_cancelled', 
    label: 'Project cancelled',
    description: 'The entire project is no longer happening'
  },
  { 
    value: 'other', 
    label: 'Other reason',
    description: 'Please specify below'
  }
];

export function OrderCancellationDialog({
  isOpen,
  onClose,
  onConfirm,
  orderId,
  orderStatus,
  loading = false
}: OrderCancellationDialogProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [notifyAdmin, setNotifyAdmin] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    if (!selectedReason) {
      toast.error('Please select a cancellation reason');
      return;
    }

    if (selectedReason === 'other' && !customReason.trim()) {
      toast.error('Please provide a custom reason');
      return;
    }

    setConfirming(true);
    try {
      await onConfirm({
        reason: selectedReason,
        customReason: selectedReason === 'other' ? customReason : undefined,
        notifyAdmin
      });
      
      // 重置表单
      setSelectedReason('');
      setCustomReason('');
      setNotifyAdmin(true);
      onClose();
    } catch (error) {
      console.error('Error confirming cancellation:', error);
    } finally {
      setConfirming(false);
    }
  };

  const handleClose = () => {
    if (confirming) return; // 防止在处理过程中关闭
    setSelectedReason('');
    setCustomReason('');
    setNotifyAdmin(true);
    onClose();
  };

  const selectedReasonData = CANCELLATION_REASONS.find(r => r.value === selectedReason);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>Cancel Order</DialogTitle>
              <DialogDescription>
                Order #{orderId.slice(-8)} • Status: {orderStatus}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* 警告信息 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Important Notice
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>This action cannot be undone. Once cancelled:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Your order will be permanently cancelled</li>
                    <li>Any payment intents will be cancelled</li>
                    <li>You'll need to create a new order if needed</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 取消原因选择 */}
          <div className="space-y-4">
            <Label className="text-base font-medium">
              Why are you cancelling this order? <span className="text-red-500">*</span>
            </Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {CANCELLATION_REASONS.map((reason) => (
                <div key={reason.value} className="flex items-start space-x-2">
                  <RadioGroupItem value={reason.value} id={reason.value} className="mt-0.5" />
                  <div className="grid gap-1.5 leading-none">
                    <Label 
                      htmlFor={reason.value}
                      className="font-medium text-gray-900 cursor-pointer"
                    >
                      {reason.label}
                    </Label>
                    <p className="text-xs text-gray-500">{reason.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* 自定义原因输入 */}
          {selectedReason === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="customReason">
                Please specify your reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="customReason"
                placeholder="Enter your reason for cancelling this order..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          )}

          {/* 通知选项 */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="notifyAdmin"
              checked={notifyAdmin}
              onCheckedChange={setNotifyAdmin}
            />
            <Label 
              htmlFor="notifyAdmin" 
              className="text-sm text-gray-600 cursor-pointer"
            >
              Notify administrator about this cancellation
            </Label>
          </div>

          {/* 选中原因的确认显示 */}
          {selectedReasonData && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Selected reason:</span> {selectedReasonData.label}
              </p>
              {selectedReason === 'other' && customReason && (
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Details:</span> {customReason}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={confirming || loading}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Keep Order
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedReason || confirming || loading}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
          >
            {confirming ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Cancelling...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Cancel Order
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 