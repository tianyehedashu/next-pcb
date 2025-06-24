import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { notifyAdminRefundConfirmed } from '@/lib/email/admin-notifications';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  const { action } = await request.json(); // action can be 'confirm' or 'cancel'

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 获取订单详细信息，包括所有退款相关字段和用户邮箱
  const { data: orderData, error: orderError } = await supabase
    .from('admin_orders')
    .select(`
      id, refund_status, approved_refund_amount, refund_reason, refund_request_at, requested_refund_amount,
      pcb_quotes!admin_orders_user_order_id_fkey(email)
    `)
    .eq('user_order_id', orderId)
    .single();

  if (orderError || !orderData) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const adminOrder = orderData;
  const userEmail = Array.isArray(orderData.pcb_quotes) 
    ? orderData.pcb_quotes[0]?.email 
    : orderData.pcb_quotes?.email;

  if (adminOrder.refund_status !== 'pending_confirmation') {
    return NextResponse.json(
      { error: `Cannot ${action} a refund for an order that is not pending confirmation. Current status: ${adminOrder.refund_status}` },
      { status: 400 }
    );
  }

  let updateData: any = {};
  let successMessage = '';

  if (action === 'confirm') {
    // 用户确认退款，状态变为等待管理员处理
    const confirmationTime = new Date().toISOString();
    updateData = {
      refund_status: 'processing', // Ready for admin to process via Stripe
      user_refund_confirmation_at: confirmationTime,
      refund_note: `User confirmed refund of $${adminOrder.approved_refund_amount} on ${new Date().toLocaleDateString()}`,
      updated_at: confirmationTime,
    };
    successMessage = `Refund of $${adminOrder.approved_refund_amount.toFixed(2)} confirmed. Our team will process the refund within 24 hours.`;
    
    // 发送邮件通知管理员用户已确认退款
    if (userEmail) {
      try {
        await notifyAdminRefundConfirmed(
          orderId,
          userEmail,
          adminOrder.approved_refund_amount,
          confirmationTime
        );
      } catch (emailError) {
        console.error('Failed to send admin notification for refund confirmation:', emailError);
        // 不要因为邮件发送失败而让整个请求失败
      }
    }

  } else if (action === 'cancel') {
    // 用户取消退款请求，完全重置退款状态
    updateData = {
      refund_status: null, // Reset the refund status
      approved_refund_amount: null,
      refund_reason: null,
      refund_request_at: null,
      refund_note: `User cancelled refund request on ${new Date().toLocaleDateString()}`,
      updated_at: new Date().toISOString(),
    };
    successMessage = 'Refund request has been cancelled successfully. You can request a new refund if needed.';
  } else {
    return NextResponse.json({ error: 'Invalid action. Must be "confirm" or "cancel"' }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from('admin_orders')
    .update(updateData)
    .eq('id', adminOrder.id);

  if (updateError) {
    console.error(`Failed to ${action} refund:`, updateError);
    return NextResponse.json({ error: `Failed to ${action} refund.` }, { status: 500 });
  }

  // 返回详细的响应信息
  return NextResponse.json({ 
    success: true, 
    message: successMessage,
    action: action,
    refund_status: updateData.refund_status,
    refund_amount: action === 'confirm' ? adminOrder.approved_refund_amount : null,
    confirmation_time: action === 'confirm' ? updateData.user_refund_confirmation_at : null
  });
} 