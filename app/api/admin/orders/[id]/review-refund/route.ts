import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { sendNotificationToUser } from '@/app/api/admin/orders/[id]/admin-order/route';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  const { amount, reason, action } = await request.json(); // action can be 'approve' or 'reject'

  const supabase = await createSupabaseServerClient(false); // Use service role

  // Step 1: Fetch the order to verify its state
  const { data: adminOrder, error: orderError } = await supabase
    .from('admin_orders')
    .select('id, user_order_id, refund_status, user_id')
    .eq('user_order_id', orderId)
    .single();
    
  if (orderError || !adminOrder) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (adminOrder.refund_status !== 'requested') {
    return NextResponse.json(
      { error: `Cannot ${action} a refund for an order that is not in 'requested' state.` },
      { status: 400 }
    );
  }

  // Step 2: Update the order based on the admin's action
  let updateData = {};
  let subject = '';
  let htmlContent = '';

  if (action === 'approve') {
    if (typeof amount !== 'number' || amount < 0) {
      return NextResponse.json({ error: 'Invalid refund amount' }, { status: 400 });
    }
    updateData = {
      refund_status: 'pending_confirmation',
      approved_refund_amount: amount,
      refund_reason: reason,
      updated_at: new Date().toISOString(),
    };
    subject = `Action Required: Confirm Your Refund for Order #${orderId}`;
    htmlContent = `
      <h1>Your Refund Has Been Approved</h1>
      <p>Your refund request for order <strong>#${orderId}</strong> has been reviewed by our team.</p>
      <p><strong>Approved Refund Amount:</strong> $${amount.toFixed(2)}</p>
      <p><strong>Reason:</strong> ${reason || 'N/A'}</p>
      <p>Please log in to your account to confirm and finalize the refund process.</p>
    `;
  } else if (action === 'reject') {
    updateData = {
      refund_status: 'rejected',
      refund_reason: reason,
      updated_at: new Date().toISOString(),
    };
    subject = `Update on Your Refund Request for Order #${orderId}`;
    htmlContent = `
      <h1>Your Refund Request Has Been Reviewed</h1>
      <p>Your refund request for order <strong>#${orderId}</strong> has been reviewed.</p>
      <p>Unfortunately, we are unable to process a refund at this time.</p>
      <p><strong>Reason:</strong> ${reason || 'N/A'}</p>
      <p>If you have any questions, please contact our support team.</p>
    `;
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from('admin_orders')
    .update(updateData)
    .eq('id', adminOrder.id);

  if (updateError) {
    console.error('Failed to update order for refund approval:', updateError);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }

  // Step 3: Notify the user
  if (adminOrder.user_id) {
    await sendNotificationToUser(
      adminOrder.user_id,
      subject,
      htmlContent,
      orderId,
      'refund_approved' // notificationType
    );
  }

  return NextResponse.json({ success: true, message: `Refund successfully ${action}d.` });
} 