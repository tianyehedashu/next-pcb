import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// 用户可以修改的字段白名单
const ALLOWED_USER_FIELDS = [
  'shipping_address',
  'phone',
  'customs'
];

// 允许用户取消订单的状态
const CANCELLABLE_STATUSES = [
  'created',
  'pending',
  'reviewed',
  'quoted'
];

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies();
  const { id: orderId } = await params;
  //@ts-expect-error nextjs 15 的cookies 是异步的
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    // 1. 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 从pcb_quotes表获取订单信息，包含关联的管理员订单信息
    const { data: order, error: orderError } = await supabase
      .from('pcb_quotes')
      .select(`
        *,
        admin_orders(*)
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies();
  const { id: orderId } = await params;
  //@ts-expect-error nextjs 15 的cookies 是异步的
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    // 1. 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...updateData } = body;

    // 2. 获取订单信息，确保是用户自己的订单
    const { data: order, error: orderError } = await supabase
      .from('pcb_quotes')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 3. 处理特殊操作
    if (action === 'cancel') {
      // 检查订单是否可以取消
      if (!CANCELLABLE_STATUSES.includes(order.status)) {
        return NextResponse.json(
          { error: 'Order cannot be cancelled in current status' },
          { status: 400 }
        );
      }

      // 更新订单状态为已取消
      const { data: updatedOrder, error: updateError } = await supabase
        .from('pcb_quotes')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json(updatedOrder);
    }

    // 4. 检查订单状态，只有特定状态下才能修改
    const editableStatuses = ['created', 'pending', 'reviewed'];
    if (!editableStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: 'Order cannot be modified in current status' },
        { status: 400 }
      );
    }

    // 5. 过滤只允许用户修改的字段
    const filteredData: Record<string, unknown> = {};
    for (const key of ALLOWED_USER_FIELDS) {
      if (key in updateData) {
        filteredData[key] = updateData[key];
      }
    }

    if (Object.keys(filteredData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // 6. 添加更新时间
    filteredData.updated_at = new Date().toISOString();

    // 7. 更新订单
    const { data: updatedOrder, error: updateError } = await supabase
      .from('pcb_quotes')
      .update(filteredData)
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// 删除订单（取消订单）
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies();
  const { id: orderId } = await params;
  //@ts-expect-error nextjs 15 的cookies 是异步的
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    // 1. 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 获取订单信息
    const { data: order, error: orderError } = await supabase
      .from('pcb_quotes')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 3. 检查是否可以取消
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      return NextResponse.json(
        { error: 'Order cannot be cancelled in current status' },
        { status: 400 }
      );
    }

    // 4. 更新为取消状态而不是删除
    const { data: updatedOrder, error: updateError } = await supabase
      .from('pcb_quotes')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Order cancelled successfully', order: updatedOrder });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 