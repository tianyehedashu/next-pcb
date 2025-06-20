import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { sendAdminNotification } from '@/lib/utils/sendEmail';

// 定义状态枚举
enum QuoteStatus {
  DRAFT = 'draft',
  CREATED = 'created', 
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  QUOTED = 'quoted',
  UNPAID = 'unpaid',
  PAYMENT_PENDING = 'payment_pending',
  PAID = 'paid',
  IN_PRODUCTION = 'in_production',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
  REFUNDED = 'refunded'
}

// 定义状态转换规则
const STATUS_TRANSITIONS: Record<string, string[]> = {
  [QuoteStatus.DRAFT]: [QuoteStatus.CREATED, QuoteStatus.PENDING],
  [QuoteStatus.CREATED]: [QuoteStatus.PENDING, QuoteStatus.REVIEWED, QuoteStatus.REJECTED],
  [QuoteStatus.PENDING]: [QuoteStatus.REVIEWED, QuoteStatus.REJECTED],
  [QuoteStatus.REVIEWED]: [QuoteStatus.QUOTED, QuoteStatus.UNPAID, QuoteStatus.REJECTED],
  [QuoteStatus.QUOTED]: [QuoteStatus.UNPAID, QuoteStatus.PENDING], // 用户修改后回到pending
  [QuoteStatus.UNPAID]: [QuoteStatus.PAYMENT_PENDING, QuoteStatus.PAID, QuoteStatus.CANCELLED],
  [QuoteStatus.PAYMENT_PENDING]: [QuoteStatus.PAID, QuoteStatus.CANCELLED],
  [QuoteStatus.PAID]: [QuoteStatus.IN_PRODUCTION, QuoteStatus.REFUNDED],
  [QuoteStatus.IN_PRODUCTION]: [QuoteStatus.SHIPPED, QuoteStatus.CANCELLED],
  [QuoteStatus.SHIPPED]: [QuoteStatus.DELIVERED],
  [QuoteStatus.DELIVERED]: [QuoteStatus.COMPLETED],
  [QuoteStatus.COMPLETED]: [QuoteStatus.REFUNDED],
  [QuoteStatus.CANCELLED]: [],
  [QuoteStatus.REJECTED]: [QuoteStatus.PENDING], // 可以重新提交
  [QuoteStatus.REFUNDED]: []
};

// 用户可编辑的状态
const USER_EDITABLE_STATUSES = [
  QuoteStatus.DRAFT,
  QuoteStatus.CREATED,
  QuoteStatus.PENDING
];

// 管理员可编辑的状态（几乎所有状态，除了已完成的流程）
const ADMIN_EDITABLE_STATUSES = [
  QuoteStatus.DRAFT,
  QuoteStatus.CREATED,
  QuoteStatus.PENDING,
  QuoteStatus.REVIEWED,
  QuoteStatus.QUOTED,
  QuoteStatus.UNPAID,
  QuoteStatus.PAYMENT_PENDING,
  QuoteStatus.PAID,
  QuoteStatus.IN_PRODUCTION,
  QuoteStatus.SHIPPED,
  QuoteStatus.DELIVERED,
  QuoteStatus.CANCELLED,
  QuoteStatus.REJECTED
];

// GET - 获取单个报价
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { id } = await params;

    // 获取当前用户
    const { data: { user } } = await supabase.auth.getUser();
    
    // 查询报价数据，包含关联的管理员订单
    const { data: quote, error } = await supabase
      .from('pcb_quotes')
      .select(`
        *,
        admin_orders!left (
          id,
          status,
          payment_status,
          pcb_price,
          admin_price,
          cny_price,
          currency,
          exchange_rate,
          due_date,
          delivery_date,
          admin_note,
          production_days,
          ship_price,
          custom_duty,
          coupon,
          surcharges,
          refund_status,
          approved_refund_amount,
          created_at,
          updated_at
        )
      `)
      .eq('id', id)
      .single();

    if (error || !quote) {
      console.error('Quote not found:', { id, error: error?.message });
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    // 权限检查
    const canAccess = await checkAccessPermission(quote, user, supabase);
    if (!canAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - 更新报价
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { id } = await params;
    const body = await request.json();

    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 查询现有报价数据和关联的管理员订单
    const { data: existingQuote, error: fetchError } = await supabase
      .from('pcb_quotes')
      .select(`
        *,
        admin_orders!left (
          id,
          status,
          payment_status
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !existingQuote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    // 权限检查
    const isAdmin = await checkAdminRole(user.id, supabase);
    const canEdit = await checkEditPermission(existingQuote, user, supabase);
    
    if (!canEdit) {
      return NextResponse.json(
        { 
          error: 'Permission denied',
          details: isAdmin 
            ? 'Admin cannot edit this quote in current status'
            : `You can only edit quotes in status: ${USER_EDITABLE_STATUSES.join(', ')}`
        },
        { status: 403 }
      );
    }

    // 准备更新数据
    const {
      email,
      phone,
      shippingAddress,
      gerberFileUrl,
      cal_values,
      status: requestedStatus,
      ...pcbSpecData
    } = body;

    // 计算新状态
    const newStatus = calculateNewStatus(
      existingQuote.status,
      requestedStatus,
      isAdmin
    );

    // 验证状态转换是否合法
    if (newStatus !== existingQuote.status) {
      const isValidTransition = validateStatusTransition(
        existingQuote.status,
        newStatus,
        isAdmin
      );
      
      if (!isValidTransition) {
        return NextResponse.json(
          { 
            error: 'Invalid status transition',
            details: `Cannot change status from ${existingQuote.status} to ${newStatus}`
          },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, any> = {
      email: email || existingQuote.email,
      phone: phone || existingQuote.phone,
      shipping_address: shippingAddress || existingQuote.shipping_address,
      gerber_file_url: gerberFileUrl || existingQuote.gerber_file_url,
      pcb_spec: pcbSpecData,
      cal_values: cal_values || existingQuote.cal_values,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // 开始事务处理
    const { data: updatedQuote, error: updateError } = await supabase
      .from('pcb_quotes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating quote:', updateError);
      return NextResponse.json(
        { error: 'Failed to update quote' },
        { status: 500 }
      );
    }

    // 同步更新管理员订单表（如果存在）
    if (existingQuote.admin_orders && Array.isArray(existingQuote.admin_orders) && existingQuote.admin_orders.length > 0) {
      const adminOrder = existingQuote.admin_orders[0];
      
      // 根据用户订单状态更新管理员订单状态
      const adminOrderStatus = mapQuoteStatusToAdminStatus(newStatus);
      
      if (adminOrderStatus !== adminOrder.status) {
        const { error: adminUpdateError } = await supabase
          .from('admin_orders')
          .update({
            status: adminOrderStatus,
            updated_at: new Date().toISOString()
          })
          .eq('user_order_id', id);

        if (adminUpdateError) {
          console.error('Error updating admin order:', adminUpdateError);
          // 不阻断主流程，但记录错误
        }
      }
    } else {
      console.log('No admin order found for quote:', id);
    }

    // 记录状态变更历史（如果状态发生变化）
    if (newStatus !== existingQuote.status) {
      await recordStatusChange(
        id,
        existingQuote.status,
        newStatus,
        user.id,
        isAdmin ? 'admin' : 'user',
        supabase
      );
    }

    // 如果是用户修改订单且状态发生变化，发送通知给管理员
    if (!isAdmin && newStatus !== existingQuote.status) {
      await notifyAdminsOfOrderChange(
        updatedQuote,
        existingQuote.status,
        newStatus,
        user,
        supabase
      );
    }

    return NextResponse.json(updatedQuote);
  } catch (error) {
    console.error('Error updating quote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 检查访问权限
async function checkAccessPermission(
  quote: Record<string, any>, 
  user: Record<string, any> | null,
  supabase: any
): Promise<boolean> {
  // 管理员可以访问所有报价
  if (user && await checkAdminRole(user.id, supabase)) {
    return true;
  }

  // 用户可以访问自己的报价
  if (user && quote.user_id === user.id) {
    return true;
  }

  // 游客可以访问自己的报价（通过邮箱匹配，但需要额外验证）
  if (!user && !quote.user_id) {
    // 这里可以添加额外的验证逻辑，比如通过邮箱验证码
    return true;
  }

  return false;
}

// 检查编辑权限
async function checkEditPermission(
  quote: Record<string, any>, 
  user: Record<string, any> | null,
  supabase: any
): Promise<boolean> {
  const isAdmin = user && await checkAdminRole(user.id, supabase);
  
  // 管理员权限检查
  if (isAdmin) {
    return ADMIN_EDITABLE_STATUSES.includes(quote.status);
  }

  // 用户权限检查
  if (user && quote.user_id === user.id) {
    return USER_EDITABLE_STATUSES.includes(quote.status);
  }

  // 游客权限检查
  if (!user && !quote.user_id) {
    return USER_EDITABLE_STATUSES.includes(quote.status);
  }

  return false;
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

// 计算新状态
function calculateNewStatus(
  currentStatus: string,
  requestedStatus: string | undefined,
  isAdmin: boolean
): string {
  // 如果明确指定了状态且是管理员，使用指定状态
  if (requestedStatus && isAdmin) {
    return requestedStatus;
  }

  // 用户编辑订单的状态转换逻辑
  if (!isAdmin) {
    // 用户编辑已报价的订单，状态改为待审核
    if (currentStatus === QuoteStatus.QUOTED) {
      return QuoteStatus.PENDING;
    }
    // 用户编辑已审核的订单，状态也改为待审核（需要重新审核）
    if (currentStatus === QuoteStatus.REVIEWED) {
      return QuoteStatus.PENDING;
    }
  }

  // 其他情况保持原状态
  return currentStatus;
}

// 验证状态转换是否合法
function validateStatusTransition(
  fromStatus: string,
  toStatus: string,
  isAdmin: boolean
): boolean {
  // 管理员有更多的状态转换权限
  if (isAdmin) {
    // 管理员可以进行大部分状态转换，除了一些不合理的转换
    const forbiddenTransitions = [
      `${QuoteStatus.COMPLETED}->${QuoteStatus.DRAFT}`,
      `${QuoteStatus.REFUNDED}->${QuoteStatus.PAID}`,
      `${QuoteStatus.DELIVERED}->${QuoteStatus.SHIPPED}`
    ];
    
    return !forbiddenTransitions.includes(`${fromStatus}->${toStatus}`);
  }

  // 普通用户只能按照预定义的转换规则
  const allowedTransitions = STATUS_TRANSITIONS[fromStatus] || [];
  return allowedTransitions.includes(toStatus);
}

// 将用户订单状态映射到管理员订单状态
function mapQuoteStatusToAdminStatus(quoteStatus: string): string {
  const statusMap: Record<string, string> = {
    [QuoteStatus.DRAFT]: 'draft',
    [QuoteStatus.CREATED]: 'created',
    [QuoteStatus.PENDING]: 'created', // 待审核
    [QuoteStatus.REVIEWED]: 'reviewed',
    [QuoteStatus.QUOTED]: 'reviewed',
    [QuoteStatus.UNPAID]: 'unpaid',
    [QuoteStatus.PAYMENT_PENDING]: 'payment_pending',
    [QuoteStatus.PAID]: 'paid',
    [QuoteStatus.IN_PRODUCTION]: 'in_production',
    [QuoteStatus.SHIPPED]: 'shipped',
    [QuoteStatus.DELIVERED]: 'delivered',
    [QuoteStatus.COMPLETED]: 'completed',
    [QuoteStatus.CANCELLED]: 'cancelled',
    [QuoteStatus.REJECTED]: 'rejected',
    [QuoteStatus.REFUNDED]: 'refunded'
  };

  return statusMap[quoteStatus] || 'created';
}

// 记录状态变更历史
async function recordStatusChange(
  orderId: string,
  fromStatus: string,
  toStatus: string,
  userId: string,
  userRole: string,
  supabase: any
): Promise<void> {
  try {
    await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        from_status: fromStatus,
        to_status: toStatus,
        changed_by: userId,
        changed_by_role: userRole,
        reason: `Status changed via quote edit API`,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error recording status change:', error);
    // 不阻断主流程
  }
}

// 通知管理员订单变更
async function notifyAdminsOfOrderChange(
  updatedQuote: any,
  fromStatus: string,
  toStatus: string,
  user: any,
  supabase: any
): Promise<void> {
  try {
    const statusDisplayMap: Record<string, string> = {
      'draft': '草稿',
      'created': '已创建',
      'pending': '待审核',
      'reviewed': '已审核',
      'quoted': '已报价',
      'unpaid': '待付款',
      'payment_pending': '付款处理中',
      'paid': '已付款',
      'in_production': '生产中',
      'shipped': '已发货',
      'delivered': '已交付',
      'completed': '已完成',
      'cancelled': '已取消',
      'rejected': '已拒绝',
      'refunded': '已退款'
    };

    const fromStatusDisplay = statusDisplayMap[fromStatus] || fromStatus;
    const toStatusDisplay = statusDisplayMap[toStatus] || toStatus;
    
    const subject = `🔄 订单修改通知 - ${updatedQuote.id.slice(0, 8)}...`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
          📋 用户订单修改通知
        </h2>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">订单信息</h3>
          <p><strong>订单ID:</strong> ${updatedQuote.id}</p>
          <p><strong>用户邮箱:</strong> ${updatedQuote.email}</p>
          <p><strong>修改时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
        </div>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="color: #92400e; margin-top: 0;">⚠️ 状态变更</h3>
          <p style="font-size: 16px;">
            <span style="background-color: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px;">${fromStatusDisplay}</span>
            <span style="margin: 0 10px;">→</span>
            <span style="background-color: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px;">${toStatusDisplay}</span>
          </p>
          ${toStatus === 'pending' ? '<p style="color: #92400e; font-weight: bold;">⚡ 此订单需要重新审核</p>' : ''}
        </div>
        
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">📝 操作建议</h3>
          <ul style="color: #374151;">
            <li>请及时查看订单详情，了解用户的修改内容</li>
            <li>如果订单状态变为"待审核"，请重新审核订单规格和价格</li>
            <li>必要时可联系用户确认修改原因</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders/${updatedQuote.id}" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            查看订单详情
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          这是一封自动发送的邮件，请勿直接回复。<br>
          如有问题，请登录管理后台查看详情。
        </p>
      </div>
    `;

    // 直接调用通知函数
    await sendAdminNotification(supabase, subject, html);
    console.log('Admin notification sent successfully for order:', updatedQuote.id);

  } catch (error) {
    console.error('Error sending admin notification:', error);
    // 不阻断主流程
  }
} 