"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import StripePaymentForm from '@/components/custom-ui/StripePaymentForm';
import { getAdminOrder, canOrderBePaid, getOrderPaymentAmount, formatOrderPrice, type OrderWithAdminOrder, type AdminOrder } from '@/lib/utils/orderHelpers';
import { stripePromise } from '@/lib/stripe-client'; 
import { Elements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Package, MapPin } from 'lucide-react';

// Use the standardized interface from orderHelpers
type Order = OrderWithAdminOrder;

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [adminOrder, setAdminOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError("Order ID is not specified.");
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session) {
          router.push('/auth');
          return;
        }

        const response = await fetch(`/api/user/orders/${orderId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch order details');
        }

        const data: Order = await response.json();
        
        if (data.admin_orders?.payment_status === 'paid') {
          router.push(`/profile/orders/${orderId}`);
          return;
        }
        
        const currentAdminOrder = getAdminOrder(data);

        if (!canOrderBePaid(data, currentAdminOrder)) {
          setError('This order is not ready for payment. Please wait for admin review.');
          setLoading(false);
          return;
        }
        
        setOrder(data);
        setAdminOrder(currentAdminOrder);

        const intentResponse = await fetch('/api/payment/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: data.id, adminOrderId: currentAdminOrder?.id }),
        });

        if (!intentResponse.ok) {
          const intentError = await intentResponse.json();
          throw new Error(intentError.error || 'Failed to create payment intent.');
        }

        const { clientSecret: newClientSecret } = await intentResponse.json();
        setClientSecret(newClientSecret);

      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

  const handlePaymentSuccess = () => {
    router.push(`/profile/orders/${orderId}/success`);
  }

  const handlePaymentError = (errorMessage: string) => {
    setError(`Payment failed: ${errorMessage}`);
  }

  if (loading) {
    return (
       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
         <div className="text-center">
           <p className="text-lg font-semibold text-gray-700">Loading Payment Details...</p>
           <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mx-auto mt-4"></div>
         </div>
       </div>
    );
   }

  if (error || !order || !adminOrder || !clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Payment Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error || 'Could not load order details.'}</AlertDescription>
            </Alert>
            <Button onClick={() => router.back()} className="mt-4 w-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const amount = getOrderPaymentAmount(adminOrder);
  const shippingAddress = order.shipping_address as { [key: string]: string } | null;

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-4">
           <Button variant="ghost" onClick={() => router.back()} className="mb-4">
             <ArrowLeft className="mr-2 h-4 w-4" /> Back to Order
           </Button>
           <h1 className="text-2xl font-extrabold text-gray-900">Checkout</h1>
           <div></div>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6">
             <div className="flex justify-between items-center text-lg font-semibold border-b pb-4 mb-4">
               <span>Total Amount</span>
               <span className="text-blue-600">
                 {formatOrderPrice(order, adminOrder)}
               </span>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center"><Package className="mr-2 h-5 w-5"/>Order Summary</h3>
                  <p className="text-sm text-gray-600">Order ID: {order.id}</p>
                </div>
                {shippingAddress && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center"><MapPin className="mr-2 h-5 w-5"/>Shipping Address</h3>
                    <p className="text-sm text-gray-600">{shippingAddress.name}</p>
                    <p className="text-sm text-gray-600">{shippingAddress.line1}{shippingAddress.line2 ? `, ${shippingAddress.line2}` : ''}</p>
                    <p className="text-sm text-gray-600">{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}</p>
                    <p className="text-sm text-gray-600">{shippingAddress.country}</p>
                  </div>
                )}
             </div>

             <div className="mt-6">
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripePaymentForm
                  orderId={orderId}
                  amount={amount}
                  currency={adminOrder.currency.toLowerCase()}
                  displayCurrency={order.display_currency?.toLowerCase() || 'usd'}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </Elements>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
} 