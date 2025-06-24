import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { sendNotificationToUser } from '@/app/api/admin/orders/[id]/admin-order/route';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  const { amount, reason, action } = await request.json(); // action can be 'approve' or 'reject'

  const supabase = await createSupabaseServerClient(); // Use service role

  // Step 1: Fetch the order to verify its state
  const { data: adminOrder, error: orderError } = await supabase
    .from('admin_orders')
    .select('id, user_order_id, refund_status, user_id, requested_refund_amount, refund_request_at')
    .eq('user_order_id', orderId)
    .single();
    
  if (orderError || !adminOrder) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (adminOrder.refund_status !== 'requested') {
    return NextResponse.json(
      { error: `Cannot ${action} a refund for an order that is not in 'requested' state. Current status: ${adminOrder.refund_status}` },
      { status: 400 }
    );
  }

  // Step 2: Update the order based on the admin's action
  let updateData: any = {};
  let subject = '';
  let htmlContent = '';

  if (action === 'approve') {
    if (typeof amount !== 'number' || amount < 0) {
      return NextResponse.json({ error: 'Invalid refund amount' }, { status: 400 });
    }
    
    // 更新为等待用户确认状态，并记录审批信息
    updateData = {
      refund_status: 'pending_confirmation',
      approved_refund_amount: amount,
      refund_reason: reason,
      refund_note: `Admin approved refund. Original request: $${adminOrder.requested_refund_amount || 0}, Approved: $${amount}`,
      updated_at: new Date().toISOString(),
    };
    
    subject = `Action Required: Confirm Your Refund for Order #${orderId}`;
    htmlContent = `
      <h1>Your Refund Has Been Approved</h1>
      <p>Your refund request for order <strong>#${orderId}</strong> has been reviewed and approved by our team.</p>
      <p><strong>Requested Amount:</strong> $${(adminOrder.requested_refund_amount || 0).toFixed(2)}</p>
      <p><strong>Approved Refund Amount:</strong> $${amount.toFixed(2)}</p>
      <p><strong>Reason:</strong> ${reason || 'Standard refund approval'}</p>
      <p><strong>Next Step:</strong> Please log in to your account to confirm and finalize the refund process.</p>
      <p>You have 7 days to confirm this refund, otherwise it will be automatically cancelled.</p>
    `;
  } else if (action === 'reject') {
    // 拒绝退款，重置状态并记录原因
    updateData = {
      refund_status: 'rejected',
      refund_reason: reason,
      refund_note: `Admin rejected refund. Reason: ${reason || 'No reason provided'}`,
      updated_at: new Date().toISOString(),
    };
    
    subject = `Update on Your Refund Request for Order #${orderId}`;
    htmlContent = `
      <h1>Your Refund Request Has Been Reviewed</h1>
      <p>Your refund request for order <strong>#${orderId}</strong> has been reviewed.</p>
      <p>Unfortunately, we are unable to process a refund at this time.</p>
      <p><strong>Reason:</strong> ${reason || 'Please contact support for more details'}</p>
      <p>If you have any questions or believe this decision was made in error, please contact our support team.</p>
    `;
  } else {
    return NextResponse.json({ error: 'Invalid action. Must be "approve" or "reject"' }, { status: 400 });
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
    try {
      await sendNotificationToUser(
        adminOrder.user_id,
        subject,
        htmlContent,
        orderId,
        action === 'approve' ? 'refund_approved' : 'refund_rejected'
      );
    } catch (emailError) {
      console.error('Failed to send notification:', emailError);
      // Don't fail the request if email fails, but log it
    }
  }

  return NextResponse.json({ 
    success: true, 
    message: `Refund successfully ${action}d.`,
    refund_status: updateData.refund_status,
    approved_amount: action === 'approve' ? amount : null
  });
} 