import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ADMIN_ORDER, USER_ORDER } from '@/app/constants/tableNames';

// 清理和验证管理员订单字段
function sanitizeAdminOrderFields(body: Record<string, unknown>) {
  return {
    status: body.status || 'created',
    admin_price: body.admin_price || null,
    admin_note: body.admin_note || [],
    currency: body.currency || 'CNY',
    due_date: body.due_date || null,
    pay_time: body.pay_time || null,
    exchange_rate: body.exchange_rate || 7.2,
    payment_status: body.payment_status || null,
    production_days: body.production_days || null,
    coupon: body.coupon || 0,
    ship_price: body.ship_price || null,
    custom_duty: body.custom_duty || null,
    cny_price: body.cny_price || null,
    surcharges: body.surcharges || [],
  };
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Note: cookies() 在某些 Next.js 版本中需要 await
  const cookieStore = (await cookies()) as any;
  const { id: userOrderId } = await params;
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    const body = await request.json();
    
    // 1. 获取用户订单信息
    const { data: userOrder, error: userOrderError } = await supabase
      .from(USER_ORDER)
      .select('*')
      .eq('id', userOrderId)
      .single();

    if (userOrderError || !userOrder) {
      console.error('Error fetching user order:', userOrderError);
      return NextResponse.json({ error: 'User order not found' }, { status: 404 });
    }

    // 2. 检查是否已存在管理员订单
    const { data: existingAdminOrder, error: checkError } = await supabase
      .from(ADMIN_ORDER)
      .select('id')
      .eq('user_order_id', userOrderId)
      .single();

    if (!checkError && existingAdminOrder) {
      return NextResponse.json({ error: 'Admin order already exists' }, { status: 409 });
    }

    // 3. 准备管理员订单数据
    const adminOrderFields = sanitizeAdminOrderFields(body);
    const insertData = {
      user_order_id: userOrderId,
      ...adminOrderFields,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 4. 创建管理员订单
    const { error: createError } = await supabase
      .from(ADMIN_ORDER)
      .insert(insertData)
      .select()
      .single();

    if (createError) {
      console.error('Error creating admin order:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // 5. 更新用户订单时间戳
    const { data: updatedUserOrder, error: updateError } = await supabase
      .from(USER_ORDER)
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', userOrderId)
      .select('*,admin_orders(*)')
      .single();

    if (updateError) {
      console.error('Error updating user order:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedUserOrder);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Note: cookies() 在某些 Next.js 版本中需要 await
  const cookieStore = (await cookies()) as any;
  const { id: userOrderId } = await params;
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    const body = await request.json();
    // 1. 查找管理员订单
    const { data: adminOrder, error: adminOrderError } = await supabase
      .from(ADMIN_ORDER)
      .select('*')
      .eq('user_order_id', userOrderId)
      .single();
    if (adminOrderError || !adminOrder) {
      return NextResponse.json({ error: 'Admin order not found' }, { status: 404 });
    }
    // 2. 更新管理员订单
    const updateFields = {
      status: body.status,
      admin_price: body.admin_price,
      admin_note: body.admin_note,
      currency: body.currency,
      due_date: body.due_date,
      pay_time: body.pay_time,
      exchange_rate: body.exchange_rate,
      payment_status: body.payment_status,
      production_days: body.production_days,
      coupon: body.coupon,
      ship_price: body.ship_price,
      custom_duty: body.custom_duty,
      cny_price: body.cny_price,
      surcharges: body.surcharges,
      updated_at: new Date().toISOString(),
    };
    const { error: updateError } = await supabase
      .from(ADMIN_ORDER)
      .update(updateFields)
      .eq('id', adminOrder.id)
      .select()
      .single();
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    // 3. 更新用户订单的admin_orders字段（同步最新）
    const { data: updatedUserOrder, error: userOrderUpdateError } = await supabase
      .from(USER_ORDER)
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', userOrderId)
      .select('*,admin_orders(*)')
      .single();
    if (userOrderUpdateError) {
      return NextResponse.json({ error: userOrderUpdateError.message }, { status: 500 });
    }
    return NextResponse.json(updatedUserOrder);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 