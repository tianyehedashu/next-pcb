import { requireAuth } from '@/lib/auth-utils';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getAdminOrder, canOrderBePaid, type OrderWithAdminOrder } from '@/lib/utils/orderHelpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PaymentPageClient from './PaymentPageClient';

type Order = OrderWithAdminOrder;

export default async function PaymentPage({ params }: { params: { orderId: string } }) {
  const user = await requireAuth({ redirectTo: `/auth?redirect=/payment/${params.orderId}` });

  const supabase = await createClient();

  const { data: orderData, error: orderError } = await supabase
    .from('pcb_quotes')
    .select('*, admin_orders(*), shipping_address:user_addresses(*)')
    .eq('id', params.orderId)
    .eq('user_id', user.id)
    .single();

  if (orderError || !orderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card className="shadow-lg border-0">
              <CardHeader className="text-center">
                <CardTitle className="text-red-600">Payment Error</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{orderError?.message || 'Could not load order details or permission denied.'}</AlertDescription>
                </Alert>
                <Link href="/profile/orders">
                  <Button className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const typedOrder = orderData as unknown as Order;
  const adminOrder = getAdminOrder(typedOrder);

  if (adminOrder?.payment_status === 'paid') {
    return redirect(`/profile/orders/${params.orderId}?payment_completed=true`);
  }

  if (!canOrderBePaid(typedOrder)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card className="shadow-lg border-0">
              <CardHeader className="text-center">
                <CardTitle className="text-orange-600">Order Not Ready</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert variant="default" className="mb-4 bg-orange-50 border-orange-200 text-orange-800">
                  <AlertDescription>This order is not ready for payment. Please wait for admin review.</AlertDescription>
                </Alert>
                <Link href={`/profile/orders/${params.orderId}`}>
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" /> View Order Status
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  const clientProps = {
    order: JSON.parse(JSON.stringify(typedOrder)),
    adminOrder: JSON.parse(JSON.stringify(adminOrder)),
    orderId: params.orderId,
  };
  
  return <PaymentPageClient {...clientProps} />;
} 