import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ADMIN_ORDER, USER_ORDER } from '@/app/constants/tableNames';
import { OrderStatus } from '@/types/form';


export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies();
  const { id: userOrderId } = await params;
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });


  try {
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


    const { error: createError } = await supabase
      .from(ADMIN_ORDER)
      .insert({
        user_order_id: userOrderId,
        status: OrderStatus.Created,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating admin order:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // 3. 更新用户订单，添加管理员订单关联
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
  const cookieStore = await cookies();
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