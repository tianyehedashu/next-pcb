"use client";

import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Lock, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getStripe } from '@/lib/stripe-client';

interface StripePaymentFormProps {
  orderId: string;
  amount: number;
  currency?: string;
  displayCurrency?: string; // For display purposes (e.g., "CNY" shows ¥ but payment in USD)
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const CheckoutForm = ({ orderId, amount, currency = 'usd', displayCurrency, onSuccess, onError }: StripePaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [cardComplete, setCardComplete] = useState(false);

  useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/payment/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            amount,
            currency,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create payment intent');
        }

        setClientSecret(data.clientSecret);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize payment';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    };

    createPaymentIntent();
  }, [orderId, amount, currency, onError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsLoading(true);
    setError('');

    const card = elements.getElement(CardElement);

    if (!card) {
      setError('Card element not found');
      setIsLoading(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: card,
        }
      }
    );

    if (confirmError) {
      setError(confirmError.message || 'Payment failed');
      onError?.(confirmError.message || 'Payment failed');
      toast({
        title: "Payment Failed",
        description: confirmError.message,
        variant: "destructive",
      });
    } else if (paymentIntent.status === 'succeeded') {
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully.",
      });
      onSuccess?.();
    }

    setIsLoading(false);
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#374151',
        fontFamily: '"Inter", system-ui, sans-serif',
        '::placeholder': {
          color: '#9CA3AF',
        },
        iconColor: '#6B7280',
      },
      invalid: {
        color: '#EF4444',
        iconColor: '#EF4444',
      },
      complete: {
        color: '#059669',
        iconColor: '#059669',
      },
    },
  };

  if (error && !clientSecret) {
    return (
      <div className="p-8">
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center border-b border-gray-100 pb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Information</h2>
          <p className="text-gray-600">Please enter your payment details to complete the order</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Display */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Total Amount</p>
                <p className="text-xs text-blue-600">All fees included</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-900">
                  {displayCurrency === 'CNY' ? '¥' : '$'}{amount.toFixed(2)}
                </div>
                <p className="text-xs text-blue-600">{currency.toUpperCase()}</p>
              </div>
            </div>
          </div>

          {/* Card Input Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-gray-600" />
              <label className="text-lg font-semibold text-gray-900">
                Card Information
              </label>
              {cardComplete && (
                <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
              )}
            </div>

            <div className="relative">
              <div className="p-4 border-2 border-gray-200 rounded-xl bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all duration-200">
                <CardElement 
                  options={cardElementOptions}
                  onChange={(event) => {
                    setCardComplete(event.complete);
                    if (event.error) {
                      setError(event.error.message);
                    } else {
                      setError('');
                    }
                  }}
                />
              </div>
              
              {/* Card Type Indicators */}
              <div className="flex justify-end mt-3 space-x-2">
                <div className="flex space-x-2 text-xs text-gray-400">
                  <span className="px-2 py-1 bg-gray-100 rounded">VISA</span>
                  <span className="px-2 py-1 bg-gray-100 rounded">MC</span>
                  <span className="px-2 py-1 bg-gray-100 rounded">AMEX</span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {/* Security Features */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Secure Payment</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• 256-bit SSL encryption</li>
                  <li>• PCI DSS compliant</li>
                  <li>• Your card details are never stored</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={!stripe || isLoading || !clientSecret || !cardComplete}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <Lock className="mr-3 h-5 w-5" />
                Complete Payment • {displayCurrency === 'CNY' ? '¥' : '$'}{amount.toFixed(2)}
              </>
            )}
          </Button>

          {/* Payment Security Footer */}
          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              By completing this payment, you agree to our terms of service.
              <br />
              Your payment is processed securely by Stripe.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function StripePaymentForm(props: StripePaymentFormProps) {
  return (
    <Elements stripe={getStripe()}>
      <CheckoutForm {...props} />
    </Elements>
  );
} 