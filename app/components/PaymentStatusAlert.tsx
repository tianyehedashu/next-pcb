'use client'

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CreditCard, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import type { PaymentIntentStatus } from "@/lib/utils/orderHelpers"

interface PaymentStatusAlertProps {
  orderId: string
  paymentStatus?: PaymentIntentStatus
  onRetry?: () => void
}

export function PaymentStatusAlert({ orderId, paymentStatus, onRetry }: PaymentStatusAlertProps) {
  const router = useRouter()

  if (!paymentStatus?.hasPaymentIntent) {
    return null
  }

  const isRetryable = ['requires_payment_method', 'failed', 'canceled'].includes(paymentStatus.stripeStatus || '')
  const needsAction = ['requires_action', 'requires_confirmation'].includes(paymentStatus.stripeStatus || '')
  const isProcessing = paymentStatus.stripeStatus === 'processing'

  if (isRetryable) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-800">Payment Failed</AlertTitle>
        <AlertDescription className="text-orange-700">
          <div className="space-y-2">
            <p>Your payment could not be processed. This can happen if:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Your payment method was declined</li>
              <li>Insufficient funds</li>
              <li>Network connection issues</li>
              <li>Payment was canceled</li>
            </ul>
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                onClick={() => router.push(`/payment/${orderId}`)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <CreditCard className="h-3 w-3 mr-1" />
                Retry Payment
              </Button>
              {onRetry && (
                <Button size="sm" variant="outline" onClick={onRetry}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh Status
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (needsAction) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <AlertTriangle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Payment Action Required</AlertTitle>
        <AlertDescription className="text-blue-700">
          <div className="space-y-2">
            <p>Your payment requires additional authentication or confirmation.</p>
            <Button 
              size="sm" 
              onClick={() => router.push(`/payment/${orderId}`)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CreditCard className="h-3 w-3 mr-1" />
              Complete Payment
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (isProcessing) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />
        <AlertTitle className="text-yellow-800">Payment Processing</AlertTitle>
        <AlertDescription className="text-yellow-700">
          Your payment is being processed. This usually takes a few moments. Please do not close this page.
        </AlertDescription>
      </Alert>
    )
  }

  return null
} 