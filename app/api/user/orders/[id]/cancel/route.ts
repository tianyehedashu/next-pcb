import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { checkUserAuth } from '@/lib/auth-utils';

// 可取消的订单状态
const CANCELLABLE_STATUSES = [
  'created',
  'pending', 
  'quoted',
  'reviewed'
];

interface CancelOrderRequest {
  reason: string;
  customReason?: string;
  notifyAdmin?: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check user authentication
  const { user, error } = await checkUserAuth();
  if (error) return error;

  try {
    const orderId = params.id;
    const body: CancelOrderRequest = await request.json();
    
    if (!body.reason) {
      return NextResponse.json(
        { error: 'Cancellation reason is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 获取订单信息
    const { data: order, error: fetchError } = await supabase
      .from('pcb_quotes')
      .select(`
        id,
        user_id,
        status,
        payment_status,
        cancelled_at,
        admin_orders (
          id,
          status,
          payment_status
        )
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // 检查订单是否已取消
    if (order.status === 'cancelled' || order.cancelled_at) {
      return NextResponse.json(
        { error: 'Order is already cancelled' },
        { status: 400 }
      );
    }

    // 检查订单状态是否允许取消
    const currentStatus = order.status;
    if (!CANCELLABLE_STATUSES.includes(currentStatus)) {
      // 特殊处理已付款订单
      if (currentStatus === 'paid' || order.payment_status === 'paid') {
        return NextResponse.json({
          error: 'Paid orders cannot be cancelled directly. Please request a refund instead.',
          redirectTo: `/profile/orders/${orderId}#refund`
        }, { status: 400 });
      }

      return NextResponse.json({
        error: `Orders with status "${currentStatus}" cannot be cancelled.`,
        allowedStatuses: CANCELLABLE_STATUSES
      }, { status: 400 });
    }

    // 检查管理员订单状态
    const adminOrder = Array.isArray(order.admin_orders) 
      ? order.admin_orders[0] 
      : order.admin_orders;

    if (adminOrder?.status === 'in_production') {
      return NextResponse.json({
        error: 'This order is in production and requires admin approval to cancel.',
        requiresApproval: true
      }, { status: 400 });
    }

    if (adminOrder?.payment_status === 'paid') {
      return NextResponse.json({
        error: 'Paid orders cannot be cancelled directly. Please request a refund instead.',
        redirectTo: `/profile/orders/${orderId}#refund`
      }, { status: 400 });
    }

    const cancellationTime = new Date().toISOString();
    const cancellationReason = body.customReason || body.reason;

    // 更新订单状态
    const { error: updateError } = await supabase
      .from('pcb_quotes')
      .update({
        status: 'cancelled',
        cancelled_at: cancellationTime,
        cancellation_reason: cancellationReason,
        cancelled_by: 'user',
        can_be_uncancelled: true, // 24小时内可撤销
        updated_at: cancellationTime
      })
      .eq('id', orderId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating order status:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel order' },
        { status: 500 }
      );
    }

    // 如果有管理员订单，也更新其状态
    if (adminOrder?.id) {
      const { error: adminUpdateError } = await supabase
        .from('admin_orders')
        .update({
          status: 'cancelled',
          updated_at: cancellationTime,
          admin_note: `Order cancelled by user. Reason: ${cancellationReason}`
        })
        .eq('id', adminOrder.id);

      if (adminUpdateError) {
        console.error('Error updating admin order status:', adminUpdateError);
        // 不返回错误，因为主订单已经取消成功
      }
    }

    // TODO: 取消支付意向（如果存在）
    // TODO: 发送管理员通知（如果请求）
    
    // 计算撤销过期时间（24小时后）
    const undoExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      cancellationId: `cancel_${orderId}_${Date.now()}`,
      canUndo: true,
      undoExpiresAt,
      cancellationTime,
      reason: cancellationReason
    });

  } catch (error) {
    console.error('Error in cancel order API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 