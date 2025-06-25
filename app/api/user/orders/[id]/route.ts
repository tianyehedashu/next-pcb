import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';

async function getOrder(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const { id: orderId } = await params;

  const { data: order, error } = await supabase
    .from('pcb_quotes')
    .select(
      `
      *,
      admin_orders(*)
    `
    )
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json(order);
}

async function postOrder(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { shippingAddress, billingAddress } = await req.json();

  if (!shippingAddress || !billingAddress) {
    return NextResponse.json(
      { error: 'Shipping and billing addresses are required' },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { id: orderId } = await params;

  const { data: updatedOrder, error } = await supabase
    .from('pcb_quotes')
    .update({
      shipping_address: shippingAddress,
      billing_address: billingAddress,
      status: 'confirmed',
    })
    .eq('id', orderId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }

  return NextResponse.json(updatedOrder);
}

async function putOrder(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const { id: orderId } = await params;

  const { data, error } = await supabase
    .from('pcb_quotes')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
  return NextResponse.json(data);
}

export { getOrder as GET, postOrder as POST, putOrder as PUT }; 