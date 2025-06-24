"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Package, Download, Calendar } from 'lucide-react';
import { getAdminOrder, formatOrderPrice, type OrderWithAdminOrder } from '@/lib/utils/orderHelpers';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<OrderWithAdminOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session) {
          router.push('/auth');
          return;
        }

        const response = await fetch(`/api/user/orders/${orderId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch order details');
        }

        const data: OrderWithAdminOrder = await response.json();
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order:', err);
        // Redirect to order page if there's an error
        router.push(`/profile/orders/${orderId}`);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const adminOrder = getAdminOrder(order);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600">Thank you for your order. We'll start processing it right away.</p>
          </div>

          {/* Order Details Card */}
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm mb-6">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                Order Confirmation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Order ID</p>
                  <p className="text-lg font-mono">#{order.id.slice(0, 8)}...</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Amount Paid</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatOrderPrice(order)}
                  </p>
                </div>
              </div>
              
              {adminOrder?.delivery_date && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Expected Delivery</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <p className="text-gray-900">
                      {new Date(adminOrder.delivery_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">What happens next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-green-600">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Production begins</p>
                  <p className="text-sm text-gray-600">Our team will start manufacturing your PCB according to your specifications.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Quality control</p>
                  <p className="text-sm text-gray-600">We'll perform thorough quality checks before shipping.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-600">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Shipping & delivery</p>
                  <p className="text-sm text-gray-600">Your order will be shipped and you'll receive tracking information.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button 
              onClick={() => router.push(`/profile/orders/${orderId}`)}
              className="flex-1"
              size="lg"
            >
              View Order Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              onClick={() => router.push('/profile/orders')}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              All Orders
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 