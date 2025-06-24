import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { notifyAdminRefundRequest } from '@/lib/email/admin-notifications';

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
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 获取订单信息，包括管理员订单的所有相关字段和用户邮箱
  const { data: quote, error: quoteError } = await supabase
    .from('pcb_quotes')
    .select('email, admin_orders!inner(id, payment_status, refund_status, status, admin_price, user_id)')
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

  // 检查退款条件
  if (adminOrder.payment_status !== 'paid') {
    return NextResponse.json({ 
      error: 'Refund can only be requested for paid orders',
      current_payment_status: adminOrder.payment_status 
    }, { status: 400 });
  }

  // 检查是否已有退款请求（除非之前被拒绝）
  if (adminOrder.refund_status && adminOrder.refund_status !== 'rejected') {
    return NextResponse.json({ 
      error: `A refund request already exists for this order`,
      current_refund_status: adminOrder.refund_status 
    }, { status: 400 });
  }
  
  // 根据订单状态确定退款百分比
  const orderStatus = adminOrder.status || 'paid'; // 默认为paid状态
  const refundPercentage = REFUND_POLICY[orderStatus] ?? 0; // 如果状态不在政策中，默认为0
  
  if (refundPercentage === 0) {
    return NextResponse.json({ 
      error: `Refunds are not available for orders in '${orderStatus}' status`,
      order_status: orderStatus,
      refund_percentage: refundPercentage 
    }, { status: 400 });
  }

  const estimatedRefundAmount = (adminOrder.admin_price || 0) * refundPercentage;

  // 创建退款请求
  const requestTime = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('admin_orders')
    .update({
      refund_status: 'requested',
      refund_request_at: requestTime,
      requested_refund_amount: estimatedRefundAmount,
      refund_note: `User requested refund. Order status: ${orderStatus}, Refund policy: ${(refundPercentage * 100)}%`,
      updated_at: requestTime,
    })
    .eq('id', adminOrder.id);

  if (updateError) {
    console.error('Failed to update order for refund request:', updateError);
    return NextResponse.json({ error: 'Failed to request refund' }, { status: 500 });
  }

  // 发送邮件通知管理员
  try {
    await notifyAdminRefundRequest(
      orderId,
      quote.email,
      estimatedRefundAmount,
      orderStatus,
      refundPercentage
    );
  } catch (emailError) {
    console.error('Failed to send admin notification for refund request:', emailError);
    // 不要因为邮件发送失败而让整个请求失败
  }
  
  return NextResponse.json({
    success: true,
    message: 'Refund requested successfully. Our team will review your request within 24-48 hours.',
    refund_details: {
      order_status: orderStatus,
      refund_percentage: refundPercentage,
      estimated_refund_amount: estimatedRefundAmount,
      original_amount: adminOrder.admin_price,
      request_time: requestTime,
      next_steps: 'You will receive an email notification once your refund request has been reviewed.'
    }
  });
} 