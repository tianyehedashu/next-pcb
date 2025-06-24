'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface RefundActionButtonsProps {
  orderId: string;
  refundStatus: string | null;
  paymentStatus: string;
  approvedAmount?: number;
  onRefundStatusChange?: () => void;
}

export function RefundActionButtons({
  orderId,
  refundStatus,
  paymentStatus,
  approvedAmount,
  onRefundStatusChange
}: RefundActionButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);

  // 处理退款请求
  const handleRequestRefund = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/orders/${orderId}/request-refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Refund request submitted successfully!');
        onRefundStatusChange?.();
      } else {
        toast.error(data.error || 'Failed to request refund');
      }
    } catch (error) {
      console.error('Error requesting refund:', error);
      toast.error('An error occurred while requesting refund');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理确认退款
  const handleConfirmRefund = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/orders/${orderId}/confirm-refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm' }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Refund confirmed! Processing will begin shortly.');
        onRefundStatusChange?.();
      } else {
        toast.error(data.error || 'Failed to confirm refund');
      }
    } catch (error) {
      console.error('Error confirming refund:', error);
      toast.error('An error occurred while confirming refund');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理取消退款
  const handleCancelRefund = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/orders/${orderId}/confirm-refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Refund request cancelled successfully');
        onRefundStatusChange?.();
      } else {
        toast.error(data.error || 'Failed to cancel refund');
      }
    } catch (error) {
      console.error('Error cancelling refund:', error);
      toast.error('An error occurred while cancelling refund');
    } finally {
      setIsLoading(false);
    }
  };

  // 根据当前状态决定显示哪些按钮
  const renderButtons = () => {
    // 如果已经退款完成，不显示任何按钮
    if (paymentStatus === 'refunded' || refundStatus === 'processed') {
      return null;
    }

    // 如果没有退款请求且支付状态为已支付，显示申请退款按钮
    if (!refundStatus && paymentStatus === 'paid') {
      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={isLoading}>
              Request Refund
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Request Refund</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to request a refund for this order? 
                The refund amount will be calculated based on your order status and our refund policy.
                Our team will review your request within 24-48 hours.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRequestRefund} disabled={isLoading}>
                {isLoading ? 'Requesting...' : 'Request Refund'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    // 如果退款被拒绝，显示重新申请按钮
    if (refundStatus === 'rejected') {
      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={isLoading}>
              Request Refund Again
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Request Refund Again</AlertDialogTitle>
              <AlertDialogDescription>
                Your previous refund request was rejected. 
                Are you sure you want to submit a new refund request?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRequestRefund} disabled={isLoading}>
                {isLoading ? 'Requesting...' : 'Request Refund'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    // 如果等待用户确认，显示确认和取消按钮
    if (refundStatus === 'pending_confirmation') {
      return (
        <div className="flex space-x-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={isLoading}>
                Confirm Refund
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Refund</AlertDialogTitle>
                <AlertDialogDescription>
                  Your refund request has been approved for ${approvedAmount?.toFixed(2) || '0.00'}. 
                  By confirming, you agree to this refund amount and the process will begin.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmRefund} disabled={isLoading}>
                  {isLoading ? 'Confirming...' : 'Confirm Refund'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={isLoading}>
                Cancel Refund
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Refund Request</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel your refund request? 
                  This will remove the refund request completely, and you can submit a new one later if needed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Refund Request</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancelRefund} disabled={isLoading} variant="destructive">
                  {isLoading ? 'Cancelling...' : 'Cancel Refund Request'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    }

    // 其他状态（requested, processing）不显示操作按钮
    return null;
  };

  return (
    <div className="flex items-center space-x-3">
      {renderButtons()}
    </div>
  );
} 