import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { checkUserAuth } from '@/lib/auth-utils';
import { notifyAdminRefundConfirmed, notifyAdminRefundCancelled } from '@/lib/email/admin-notifications';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check user authentication
  const { user, error } = await checkUserAuth();
  if (error) return error;

  const { id: orderId } = await params;
  const { action } = await request.json(); // action can be 'confirm' or 'cancel'

  const supabase = await createClient();

  // 首先验证用户是否有权限访问这个订单
  const { data: userOrder, error: userOrderError } = await supabase
    .from('pcb_quotes')
    .select('id, user_id, email')
    .eq('id', orderId)
    .eq('user_id', user!.id)
    .single();

  if (userOrderError || !userOrder) {
    console.error('User order not found or no permission:', { 
      orderId, 
      userId: user!.id, 
      error: userOrderError?.message || userOrderError,
      details: userOrderError?.details || 'No additional details'
    });
    return NextResponse.json({ 
      error: 'Order not found or you do not have permission to access it',
      debug: process.env.NODE_ENV === 'development' ? { orderId, userId: user!.id } : undefined
    }, { status: 404 });
  }

  // 获取对应的管理员订单信息，包括所有退款相关字段
  const { data: orderData, error: orderError } = await supabase
    .from('admin_orders')
    .select(`
      id, refund_status, approved_refund_amount, refund_reason, refund_request_at, requested_refund_amount
    `)
    .eq('user_order_id', orderId)
    .single();

  if (orderError || !orderData) {
    console.error('Admin order not found:', { 
      orderId, 
      error: orderError?.message || orderError,
      details: orderError?.details || 'No additional details'
    });
    return NextResponse.json({ 
      error: 'Admin order not found. This order may not have been processed by our team yet.',
      debug: process.env.NODE_ENV === 'development' ? { 
        orderId,
        hasUserOrder: !!userOrder,
        errorDetails: orderError
      } : undefined
    }, { status: 404 });
  }

  const adminOrder = orderData;
  const userEmail = userOrder.email;

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
    const cancellationTime = new Date().toISOString();
    updateData = {
      refund_status: null, // Reset the refund status
      approved_refund_amount: null,
      refund_reason: null,
      refund_request_at: null,
      refund_note: `User cancelled refund request on ${new Date().toLocaleDateString()}`,
      updated_at: cancellationTime,
    };
    successMessage = 'Refund request has been cancelled successfully. You can request a new refund if needed.';
    
    // 发送邮件通知管理员用户已取消退款
    if (userEmail && adminOrder.approved_refund_amount) {
      try {
        await notifyAdminRefundCancelled(
          orderId,
          userEmail,
          adminOrder.approved_refund_amount,
          cancellationTime
        );
      } catch (emailError) {
        console.error('Failed to send admin notification for refund cancellation:', emailError);
        // 不要因为邮件发送失败而让整个请求失败
      }
    }
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