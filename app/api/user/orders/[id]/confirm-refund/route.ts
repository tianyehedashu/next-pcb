import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const orderId = params.id;
  const { action } = await request.json(); // action can be 'confirm' or 'cancel'

  const supabase = await createSupabaseServerClient(true);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: adminOrder, error: orderError } = await supabase
    .from('admin_orders')
    .select('id, refund_status, approved_refund_amount')
    .eq('user_order_id', orderId)
    .single();

  if (orderError || !adminOrder) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (adminOrder.refund_status !== 'pending_confirmation') {
    return NextResponse.json(
      { error: `Cannot ${action} a refund for an order that is not in 'pending_confirmation' state.` },
      { status: 400 }
    );
  }

  let updateData = {};
  let successMessage = '';

  if (action === 'confirm') {
    updateData = {
      refund_status: 'processing', // Ready for admin to process via Stripe
      user_refund_confirmation_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    successMessage = 'Refund confirmed. The refund will be processed by our team shortly.';
    
    // TODO: Notify admin that user has confirmed the refund.
    // This could be an email or a notification in the admin dashboard.

  } else if (action === 'cancel') {
    updateData = {
      refund_status: null, // Reset the refund status
      approved_refund_amount: null,
      refund_reason: null,
      refund_request_at: null,
      updated_at: new Date().toISOString(),
    };
    successMessage = 'Refund request has been cancelled.';
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from('admin_orders')
    .update(updateData)
    .eq('id', adminOrder.id);

  if (updateError) {
    console.error(`Failed to ${action} refund:`, updateError);
    return NextResponse.json({ error: `Failed to ${action} refund.` }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: successMessage });
} 