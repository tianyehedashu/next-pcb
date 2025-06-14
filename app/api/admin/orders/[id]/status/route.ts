import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';

// 管理员订单状态枚举
enum AdminOrderStatus {
  DRAFT = 'draft',
  CREATED = 'created',
  REVIEWED = 'reviewed',
  UNPAID = 'unpaid',
  PAYMENT_PENDING = 'payment_pending',
  PAID = 'paid',
  IN_PRODUCTION = 'in_production',
  QUALITY_CHECK = 'quality_check',
  READY_FOR_SHIPMENT = 'ready_for_shipment',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
  REJECTED = 'rejected',
  REFUNDED = 'refunded'
}

// 管理员订单状态转换规则
const ADMIN_STATUS_TRANSITIONS: Record<string, string[]> = {
  [AdminOrderStatus.DRAFT]: [AdminOrderStatus.CREATED],
  [AdminOrderStatus.CREATED]: [AdminOrderStatus.REVIEWED, AdminOrderStatus.REJECTED],
  [AdminOrderStatus.REVIEWED]: [AdminOrderStatus.UNPAID, AdminOrderStatus.REJECTED],
  [AdminOrderStatus.UNPAID]: [AdminOrderStatus.PAYMENT_PENDING, AdminOrderStatus.CANCELLED],
  [AdminOrderStatus.PAYMENT_PENDING]: [AdminOrderStatus.PAID, AdminOrderStatus.CANCELLED],
  [AdminOrderStatus.PAID]: [AdminOrderStatus.IN_PRODUCTION, AdminOrderStatus.REFUNDED],
  [AdminOrderStatus.IN_PRODUCTION]: [AdminOrderStatus.QUALITY_CHECK, AdminOrderStatus.ON_HOLD],
  [AdminOrderStatus.QUALITY_CHECK]: [AdminOrderStatus.READY_FOR_SHIPMENT, AdminOrderStatus.ON_HOLD],
  [AdminOrderStatus.READY_FOR_SHIPMENT]: [AdminOrderStatus.SHIPPED],
  [AdminOrderStatus.SHIPPED]: [AdminOrderStatus.DELIVERED],
  [AdminOrderStatus.DELIVERED]: [AdminOrderStatus.COMPLETED],
  [AdminOrderStatus.COMPLETED]: [AdminOrderStatus.REFUNDED],
  [AdminOrderStatus.CANCELLED]: [],
  [AdminOrderStatus.ON_HOLD]: [AdminOrderStatus.IN_PRODUCTION, AdminOrderStatus.CANCELLED],
  [AdminOrderStatus.REJECTED]: [AdminOrderStatus.CREATED], // 可以重新审核
  [AdminOrderStatus.REFUNDED]: []
};

// PUT - 更新管理员订单状态
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { id } = await params;
    const body = await request.json();

    // 获取当前用户并验证管理员权限
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const isAdmin = await checkAdminRole(user.id, supabase);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { status: newStatus, reason } = body;

    if (!newStatus) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // 查询现有管理员订单
    const { data: existingAdminOrder, error: fetchError } = await supabase
      .from('admin_orders')
      .select(`
        *,
        pcb_quotes!user_order_id (
          id,
          status,
          email,
          user_id
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !existingAdminOrder) {
      return NextResponse.json(
        { error: 'Admin order not found' },
        { status: 404 }
      );
    }

    // 验证状态转换是否合法
    const isValidTransition = validateAdminStatusTransition(
      existingAdminOrder.status,
      newStatus
    );

    if (!isValidTransition) {
      return NextResponse.json(
        { 
          error: 'Invalid status transition',
          details: `Cannot change admin order status from ${existingAdminOrder.status} to ${newStatus}`,
          allowedTransitions: ADMIN_STATUS_TRANSITIONS[existingAdminOrder.status] || []
        },
        { status: 400 }
      );
    }

    // 更新管理员订单状态
    const { data: updatedAdminOrder, error: updateError } = await supabase
      .from('admin_orders')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating admin order:', updateError);
      return NextResponse.json(
        { error: 'Failed to update admin order status' },
        { status: 500 }
      );
    }

    // 同步更新用户订单状态（如果需要）
    const userQuoteStatus = mapAdminStatusToQuoteStatus(newStatus);
    const currentQuoteStatus = existingAdminOrder.pcb_quotes?.status;

    if (userQuoteStatus !== currentQuoteStatus) {
      const { error: quoteUpdateError } = await supabase
        .from('pcb_quotes')
        .update({
          status: userQuoteStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAdminOrder.user_order_id);

      if (quoteUpdateError) {
        console.error('Error updating quote status:', quoteUpdateError);
        // 不阻断主流程，但记录错误
      }
    }

    // 记录状态变更历史
    await recordAdminStatusChange(
      existingAdminOrder.user_order_id,
      existingAdminOrder.status,
      newStatus,
      user.id,
      reason,
      supabase
    );

    return NextResponse.json({
      success: true,
      adminOrder: updatedAdminOrder,
      message: `Admin order status updated from ${existingAdminOrder.status} to ${newStatus}`
    });

  } catch (error) {
    console.error('Error updating admin order status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - 获取管理员订单状态转换选项
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { id } = await params;

    // 验证管理员权限
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !await checkAdminRole(user.id, supabase)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // 查询管理员订单当前状态
    const { data: adminOrder, error } = await supabase
      .from('admin_orders')
      .select('status')
      .eq('id', id)
      .single();

    if (error || !adminOrder) {
      return NextResponse.json(
        { error: 'Admin order not found' },
        { status: 404 }
      );
    }

    const allowedTransitions = ADMIN_STATUS_TRANSITIONS[adminOrder.status] || [];
    
    return NextResponse.json({
      currentStatus: adminOrder.status,
      allowedTransitions,
      statusOptions: Object.values(AdminOrderStatus).map(status => ({
        value: status,
        label: formatStatusLabel(status),
        allowed: allowedTransitions.includes(status)
      }))
    });

  } catch (error) {
    console.error('Error fetching admin order status options:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 检查管理员角色
async function checkAdminRole(userId: string, supabase: any): Promise<boolean> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    return profile?.role === 'admin';
  } catch {
    return false;
  }
}

// 验证管理员状态转换
function validateAdminStatusTransition(fromStatus: string, toStatus: string): boolean {
  const allowedTransitions = ADMIN_STATUS_TRANSITIONS[fromStatus] || [];
  return allowedTransitions.includes(toStatus);
}

// 将管理员订单状态映射到用户订单状态
function mapAdminStatusToQuoteStatus(adminStatus: string): string {
  const statusMap: Record<string, string> = {
    [AdminOrderStatus.DRAFT]: 'draft',
    [AdminOrderStatus.CREATED]: 'pending',
    [AdminOrderStatus.REVIEWED]: 'reviewed',
    [AdminOrderStatus.UNPAID]: 'quoted',
    [AdminOrderStatus.PAYMENT_PENDING]: 'payment_pending',
    [AdminOrderStatus.PAID]: 'paid',
    [AdminOrderStatus.IN_PRODUCTION]: 'in_production',
    [AdminOrderStatus.QUALITY_CHECK]: 'in_production',
    [AdminOrderStatus.READY_FOR_SHIPMENT]: 'in_production',
    [AdminOrderStatus.SHIPPED]: 'shipped',
    [AdminOrderStatus.DELIVERED]: 'delivered',
    [AdminOrderStatus.COMPLETED]: 'completed',
    [AdminOrderStatus.CANCELLED]: 'cancelled',
    [AdminOrderStatus.ON_HOLD]: 'on_hold',
    [AdminOrderStatus.REJECTED]: 'rejected',
    [AdminOrderStatus.REFUNDED]: 'refunded'
  };

  return statusMap[adminStatus] || 'pending';
}

// 格式化状态标签
function formatStatusLabel(status: string): string {
  const labelMap: Record<string, string> = {
    [AdminOrderStatus.DRAFT]: '📝 Draft',
    [AdminOrderStatus.CREATED]: '🆕 Created',
    [AdminOrderStatus.REVIEWED]: '✅ Reviewed',
    [AdminOrderStatus.UNPAID]: '💰 Unpaid',
    [AdminOrderStatus.PAYMENT_PENDING]: '🔄 Payment Pending',
    [AdminOrderStatus.PAID]: '✨ Paid',
    [AdminOrderStatus.IN_PRODUCTION]: '🏭 In Production',
    [AdminOrderStatus.QUALITY_CHECK]: '🔍 Quality Check',
    [AdminOrderStatus.READY_FOR_SHIPMENT]: '📦 Ready for Shipment',
    [AdminOrderStatus.SHIPPED]: '🚚 Shipped',
    [AdminOrderStatus.DELIVERED]: '📫 Delivered',
    [AdminOrderStatus.COMPLETED]: '🎉 Completed',
    [AdminOrderStatus.CANCELLED]: '❌ Cancelled',
    [AdminOrderStatus.ON_HOLD]: '⏸️ On Hold',
    [AdminOrderStatus.REJECTED]: '🚫 Rejected',
    [AdminOrderStatus.REFUNDED]: '💵 Refunded'
  };

  return labelMap[status] || status;
}

// 记录管理员状态变更历史
async function recordAdminStatusChange(
  orderId: string,
  fromStatus: string,
  toStatus: string,
  adminId: string,
  reason: string | undefined,
  supabase: any
): Promise<void> {
  try {
    await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        from_status: fromStatus,
        to_status: toStatus,
        changed_by: adminId,
        changed_by_role: 'admin',
        reason: reason || `Admin status changed from ${fromStatus} to ${toStatus}`,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error recording admin status change:', error);
    // 不阻断主流程
  }
} 