import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { sendNotificationToUser } from '@/app/api/admin/orders/[id]/admin-order/route';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
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
    return NextResponse.json({ 
      error: `Order is not ready for refund processing. Current status: ${adminOrder.refund_status}. Expected: processing` 
    }, { status: 400 });
  }
  if (!quote.payment_intent_id) {
    return NextResponse.json({ error: 'Payment Intent ID not found for this order.' }, { status: 400 });
  }
  if (!adminOrder.approved_refund_amount || adminOrder.approved_refund_amount <= 0) {
    return NextResponse.json({ error: 'Invalid approved refund amount.' }, { status: 400 });
  }
  
  // 3. 记录退款处理开始时间
  const processingStartTime = new Date().toISOString();
  const { error: processingStartError } = await supabase
    .from('admin_orders')
    .update({
      refund_processed_at: processingStartTime,
      updated_at: processingStartTime,
    })
    .eq('id', adminOrder.id);

  if (processingStartError) {
    console.error('Failed to update refund processing start time:', processingStartError);
    // Continue anyway, this is not critical
  }
  
  try {
    // 4. Create the refund with Stripe
    const refund = await stripe.refunds.create({
      payment_intent: quote.payment_intent_id,
      amount: Math.round(adminOrder.approved_refund_amount * 100), // Convert to cents
      reason: 'requested_by_customer',
      metadata: {
        orderId: quote.id,
        adminOrderId: adminOrder.id,
        originalAmount: (adminOrder.requested_refund_amount || 0).toString(),
        approvedAmount: adminOrder.approved_refund_amount.toString(),
      },
    });

    // 5. Update the order status to 'refunded' in your database
    const refundCompletionTime = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('admin_orders')
      .update({
        payment_status: 'refunded',
        refund_status: 'processed',
        refunded_at: refundCompletionTime,
        actual_refund_amount: adminOrder.approved_refund_amount, // Stripe amount matches approved amount
        stripe_refund_id: refund.id,
        refund_note: `Stripe refund processed successfully. Refund ID: ${refund.id}`,
        updated_at: refundCompletionTime,
      })
      .eq('id', adminOrder.id);

    if (updateError) {
      console.error('CRITICAL: Stripe refund succeeded but DB update failed!', { 
        orderId, 
        refundId: refund.id, 
        error: updateError,
        stripeRefundAmount: refund.amount,
        approvedAmount: adminOrder.approved_refund_amount 
      });
      return NextResponse.json({ 
        error: 'Stripe refund processed, but failed to update order status. Please check manually.',
        refundId: refund.id 
      }, { status: 500 });
    }

    // 6. Notify the user of the successful refund
    if (quote.user_id) {
      try {
        const subject = `Your Refund for Order #${orderId} has been Processed`;
        const html = `
          <h1>Refund Complete</h1>
          <p>Great news! Your refund has been successfully processed.</p>
          <p><strong>Order ID:</strong> #${orderId}</p>
          <p><strong>Refund Amount:</strong> $${adminOrder.approved_refund_amount.toFixed(2)}</p>
          <p><strong>Processing Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Stripe Refund ID:</strong> ${refund.id}</p>
          <hr>
          <p><strong>What happens next?</strong></p>
          <p>The refund amount should appear in your original payment method within 5-10 business days.</p>
          <p>You will receive a separate confirmation from your bank or credit card provider once the refund is processed on their end.</p>
          <p>If you have any questions, please contact our support team with your order ID and refund ID.</p>
        `;
        await sendNotificationToUser(quote.user_id, subject, html, orderId, 'refund_processed');
      } catch (emailError) {
        console.error('Failed to send refund completion notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      refundId: refund.id,
      refundAmount: adminOrder.approved_refund_amount,
      stripeRefundAmount: refund.amount / 100, // Convert back to dollars
      processingTime: new Date(refundCompletionTime).getTime() - new Date(processingStartTime).getTime(),
      message: 'Refund processed successfully'
    });

  } catch (error: any) {
    console.error('Stripe refund failed:', error);
    
    // 7. Update status to indicate processing failure
    const failureTime = new Date().toISOString();
    const { error: failureUpdateError } = await supabase
      .from('admin_orders')
      .update({
        refund_status: 'processing', // Keep in processing state for retry
        refund_note: `Stripe refund failed: ${error.message}`,
        updated_at: failureTime,
      })
      .eq('id', adminOrder.id);

    if (failureUpdateError) {
      console.error('Failed to update refund failure status:', failureUpdateError);
    }

    return NextResponse.json({ 
      error: error.message || 'Failed to process refund with Stripe.',
      stripe_error_code: error.code,
      can_retry: true
    }, { status: 500 });
  }
} 