'use client';

import React from 'react';

interface RefundStatusBadgeProps {
  refundStatus: string | null;
  paymentStatus?: string;
  approvedAmount?: number;
  requestedAmount?: number;
  showDetails?: boolean;
}

export function RefundStatusBadge({ 
  refundStatus, 
  paymentStatus,
  approvedAmount,
  requestedAmount,
  showDetails = false 
}: RefundStatusBadgeProps) {
  // 如果没有退款状态，检查支付状态
  if (!refundStatus) {
    if (paymentStatus === 'refunded') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✅ Refunded
        </span>
      );
    }
    return null;
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'requested':
        return {
          label: 'Refund Requested',
          emoji: '📝',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          description: 'Waiting for admin review'
        };
      case 'pending_confirmation':
        return {
          label: 'Pending Confirmation',
          emoji: '⏳',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          description: 'Waiting for user confirmation'
        };
      case 'approved':
        return {
          label: 'Approved',
          emoji: '✅',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          description: 'Refund approved by admin'
        };
      case 'rejected':
        return {
          label: 'Rejected',
          emoji: '❌',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          description: 'Refund request rejected'
        };
      case 'processing':
        return {
          label: 'Processing',
          emoji: '⚡',
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          description: 'Processing refund via Stripe'
        };
      case 'processed':
        return {
          label: 'Refunded',
          emoji: '💰',
          bgColor: 'bg-emerald-100',
          textColor: 'text-emerald-800',
          description: 'Refund completed successfully'
        };
      default:
        return {
          label: status,
          emoji: '❓',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          description: 'Unknown status'
        };
    }
  };

  const config = getStatusConfig(refundStatus);

  if (!showDetails) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
        {config.emoji} {config.label}
      </span>
    );
  }

  return (
    <div className={`inline-flex flex-col items-start px-3 py-2 rounded-lg ${config.bgColor} ${config.textColor}`}>
      <div className="flex items-center space-x-1">
        <span className="text-sm font-medium">
          {config.emoji} {config.label}
        </span>
      </div>
      <p className="text-xs opacity-75 mt-1">{config.description}</p>
      {(requestedAmount || approvedAmount) && (
        <div className="text-xs mt-1 space-y-0.5">
          {requestedAmount && (
            <div>Requested: ${requestedAmount.toFixed(2)}</div>
          )}
          {approvedAmount && refundStatus !== 'rejected' && (
            <div className="font-medium">Approved: ${approvedAmount.toFixed(2)}</div>
          )}
        </div>
      )}
    </div>
  );
}

// 退款详细信息组件，用于订单详情页
interface RefundDetailsProps {
  refundStatus: string | null;
  paymentStatus?: string;
  requestedAmount?: number;
  approvedAmount?: number;
  actualRefundAmount?: number;
  refundReason?: string;
  refundNote?: string;
  refundRequestAt?: string;
  userRefundConfirmationAt?: string;
  refundProcessedAt?: string;
  refundedAt?: string;
  stripeRefundId?: string;
}

export function RefundDetails({
  refundStatus,
  paymentStatus,
  requestedAmount,
  approvedAmount,
  actualRefundAmount,
  refundReason,
  refundNote,
  refundRequestAt,
  userRefundConfirmationAt,
  refundProcessedAt,
  refundedAt,
  stripeRefundId
}: RefundDetailsProps) {
  // 如果没有退款信息，不显示
  if (!refundStatus && paymentStatus !== 'refunded') {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Refund Information</h3>
        <RefundStatusBadge 
          refundStatus={refundStatus} 
          paymentStatus={paymentStatus}
          showDetails={false}
        />
      </div>

      {/* 金额信息 */}
      {(requestedAmount || approvedAmount || actualRefundAmount) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {requestedAmount && (
            <div className="bg-white p-3 rounded border">
              <p className="text-sm text-gray-600">Requested Amount</p>
              <p className="text-lg font-semibold text-gray-900">${requestedAmount.toFixed(2)}</p>
            </div>
          )}
          {approvedAmount && (
            <div className="bg-white p-3 rounded border">
              <p className="text-sm text-gray-600">Approved Amount</p>
              <p className="text-lg font-semibold text-blue-600">${approvedAmount.toFixed(2)}</p>
            </div>
          )}
          {actualRefundAmount && (
            <div className="bg-white p-3 rounded border">
              <p className="text-sm text-gray-600">Actual Refund</p>
              <p className="text-lg font-semibold text-green-600">${actualRefundAmount.toFixed(2)}</p>
            </div>
          )}
        </div>
      )}

      {/* 时间线 */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900">Timeline</h4>
        <div className="space-y-2 text-sm">
          {refundRequestAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Request submitted:</span>
              <span className="text-gray-900">{new Date(refundRequestAt).toLocaleString()}</span>
            </div>
          )}
          {userRefundConfirmationAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">User confirmed:</span>
              <span className="text-gray-900">{new Date(userRefundConfirmationAt).toLocaleString()}</span>
            </div>
          )}
          {refundProcessedAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Processing started:</span>
              <span className="text-gray-900">{new Date(refundProcessedAt).toLocaleString()}</span>
            </div>
          )}
          {refundedAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Refund completed:</span>
              <span className="text-green-600 font-medium">{new Date(refundedAt).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* 原因和备注 */}
      {(refundReason || refundNote) && (
        <div className="space-y-2">
          {refundReason && (
            <div>
              <h4 className="font-medium text-gray-900">Reason</h4>
              <p className="text-sm text-gray-700 bg-white p-2 rounded border">{refundReason}</p>
            </div>
          )}
          {refundNote && (
            <div>
              <h4 className="font-medium text-gray-900">Notes</h4>
              <p className="text-sm text-gray-700 bg-white p-2 rounded border">{refundNote}</p>
            </div>
          )}
        </div>
      )}

      {/* Stripe信息 */}
      {stripeRefundId && (
        <div className="bg-blue-50 p-3 rounded border border-blue-200">
          <h4 className="font-medium text-blue-900">Stripe Information</h4>
          <p className="text-sm text-blue-700">Refund ID: {stripeRefundId}</p>
        </div>
      )}
    </div>
  );
} 