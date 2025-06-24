import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';

// Define refund percentages based on order status
const REFUND_POLICY: Record<string, number> = {
  paid: 0.95, // 95% refund for paid orders
  in_production: 0.5, // 50% refund for orders in production
  shipped: 0, // 0% refund for shipped orders
  completed: 0, // 0% refund for completed orders
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  const supabase = await createSupabaseServerClient(true);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: quote, error: quoteError } = await supabase
    .from('pcb_quotes')
    .select('*, admin_orders!inner(*)')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single();

  if (quoteError || !quote) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const adminOrder = Array.isArray(quote.admin_orders)
    ? quote.admin_orders[0]
    : quote.admin_orders;

  if (!adminOrder) {
    return NextResponse.json({ error: 'Admin order details not found' }, { status: 404 });
  }

  // Check if a refund can be requested
  if (adminOrder.payment_status !== 'paid' || (adminOrder.refund_status && adminOrder.refund_status !== 'rejected')) {
    return NextResponse.json({ error: 'Refund cannot be requested for this order' }, { status: 400 });
  }
  
  const orderStatus = adminOrder.order_status || 'paid';
  const refundPercentage = REFUND_POLICY[orderStatus] ?? 0; // Default to 0 if status not in policy
  const estimatedRefundAmount = (adminOrder.admin_price || 0) * refundPercentage;

  const { error: updateError } = await supabase
    .from('admin_orders')
    .update({
      refund_status: 'requested',
      refund_request_at: new Date().toISOString(),
      // We store the *estimated* amount for admin's reference
      // The admin will set the final `approved_refund_amount`
      requested_refund_amount: estimatedRefundAmount, 
    })
    .eq('id', adminOrder.id);

  if (updateError) {
    console.error('Failed to update order for refund request:', updateError);
    return NextResponse.json({ error: 'Failed to request refund' }, { status: 500 });
  }

  // TODO: Notify admin about the refund request
  
  return NextResponse.json({
    success: true,
    message: 'Refund requested successfully.',
    estimatedRefundAmount,
  });
} 