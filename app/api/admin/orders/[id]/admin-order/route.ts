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
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const userOrderId = params.id;

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


    const { data: adminOrder, error: createError } = await supabase
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
        admin_orders: [adminOrder],
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