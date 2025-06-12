"use client";

import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Lock } from 'lucide-react';
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
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  if (error && !clientSecret) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Display */}
                      <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-blue-700 font-medium">Total Amount</span>
                <span className="text-blue-900 font-bold text-lg">
                  {displayCurrency === 'CNY' ? '¥' : '$'}{amount.toFixed(2)}
                </span>
              </div>
            </div>

          {/* Card Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Card Information
            </label>
            <div className="p-3 border border-gray-300 rounded-md bg-white">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Security Note */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Lock className="h-4 w-4" />
            <span>Your payment information is secure and encrypted</span>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={!stripe || isLoading || !clientSecret}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              `Pay $${amount.toFixed(2)}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default function StripePaymentForm(props: StripePaymentFormProps) {
  return (
    <Elements stripe={getStripe()}>
      <CheckoutForm {...props} />
    </Elements>
  );
} 