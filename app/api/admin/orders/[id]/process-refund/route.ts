import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { sendNotificationToUser } from '@/app/api/admin/orders/[id]/admin-order/route';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const orderId = params.id;
  const supabase = await createSupabaseServerClient(false);

  // 1. Fetch the order details, including payment_intent_id from the user order (pcb_quotes)
  const { data: quote, error: quoteError } = await supabase
    .from('pcb_quotes')
    .select('id, payment_intent_id, user_id, admin_orders!inner(*)')
    .eq('id', orderId)
    .single();

  if (quoteError || !quote) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }
  
  const adminOrder = Array.isArray(quote.admin_orders) ? quote.admin_orders[0] : quote.admin_orders;

  // 2. Verify the order is ready for refund processing
  if (adminOrder.refund_status !== 'processing') {
    return NextResponse.json({ error: 'Order is not awaiting refund processing.' }, { status: 400 });
  }
  if (!quote.payment_intent_id) {
    return NextResponse.json({ error: 'Payment Intent ID not found for this order.' }, { status: 400 });
  }
  if (!adminOrder.approved_refund_amount || adminOrder.approved_refund_amount <= 0) {
    return NextResponse.json({ error: 'Invalid approved refund amount.' }, { status: 400 });
  }
  
  try {
    // 3. Create the refund with Stripe
    const refund = await stripe.refunds.create({
      payment_intent: quote.payment_intent_id,
      amount: Math.round(adminOrder.approved_refund_amount * 100), // Convert to cents
      reason: 'requested_by_customer',
      metadata: {
        orderId: quote.id,
        adminOrderId: adminOrder.id,
      },
    });

    // 4. Update the order status to 'refunded' in your database
    const { error: updateError } = await supabase
      .from('admin_orders')
      .update({
        payment_status: 'refunded',
        status: 'refunded',
        refund_status: 'refunded',
        refunded_at: new Date().toISOString(),
        actual_refund_amount: adminOrder.approved_refund_amount,
        stripe_refund_id: refund.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', adminOrder.id);

    if (updateError) {
      console.error('CRITICAL: Stripe refund succeeded but DB update failed!', { orderId, refundId: refund.id, error: updateError });
      return NextResponse.json({ error: 'Stripe refund processed, but failed to update order status.' }, { status: 500 });
    }

    // 5. Notify the user of the successful refund
    if (quote.user_id) {
        const subject = `Your Refund for Order #${orderId} has been Processed`;
        const html = `
          <h1>Refund Complete</h1>
          <p>A refund of <strong>$${adminOrder.approved_refund_amount.toFixed(2)}</strong> for your order <strong>#${orderId}</strong> has been successfully processed.</p>
          <p>The amount should appear in your account within 5-10 business days.</p>
          <p><strong>Stripe Refund ID:</strong> ${refund.id}</p>
        `;
        await sendNotificationToUser(quote.user_id, subject, html, orderId, 'refund_processed');
    }

    return NextResponse.json({ success: true, refundId: refund.id });

  } catch (error: any) {
    console.error('Stripe refund failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to process refund with Stripe.' }, { status: 500 });
  }
} 