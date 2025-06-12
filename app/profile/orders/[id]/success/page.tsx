"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight, Home, Package } from 'lucide-react';
import { OrderWithAdminOrder, getAdminOrder, formatOrderPrice } from '@/lib/utils/orderHelpers';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderWithAdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError("Order ID not found.");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('pcb_quotes')
          .select('*, admin_orders(*)')
          .eq('id', orderId)
          .single();

        if (error) throw error;
        setOrder(data);
      } catch (err) {
        setError("Failed to fetch order details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const adminOrder = order ? getAdminOrder(order) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        <Card className="shadow-2xl border-0 rounded-2xl bg-white/80 backdrop-blur-xl">
          <CardHeader className="text-center items-center pt-10">
            <div className="bg-green-100 p-4 rounded-full mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">Payment Successful!</CardTitle>
            <p className="text-gray-600 mt-2">Thank you for your order. Your payment has been confirmed.</p>
          </CardHeader>
          <CardContent className="p-8">
            {loading ? (
              <div className="text-center text-gray-500">Loading order summary...</div>
            ) : error || !order || !adminOrder ? (
              <div className="text-center text-red-500">{error || "Could not display order summary."}</div>
            ) : (
              <div className="bg-gray-50/80 rounded-xl p-6 border border-gray-100 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-600">Order ID:</span>
                  <span className="font-mono text-gray-800">{order.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-600">Amount Paid:</span>
                  <span className="font-bold text-lg text-green-700">{formatOrderPrice(order)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-600">Payment Date:</span>
                  <span className="text-gray-800">{new Date().toLocaleDateString()}</span>
                </div>
                {adminOrder.delivery_date && (
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <span className="font-medium text-gray-600">Estimated Delivery:</span>
                    <span className="text-blue-600 font-semibold">
                      {new Date(adminOrder.delivery_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href={`/profile/orders/${orderId}`} passHref>
                <Button variant="outline" className="w-full h-12 text-base">
                  <Package className="mr-2 h-5 w-5" /> View Order Details
                </Button>
              </Link>
              <Link href="/profile/orders" passHref>
                <Button className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700">
                  <Home className="mr-2 h-5 w-5" /> All My Orders <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 