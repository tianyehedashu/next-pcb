import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Authenticate user
    const supabase = await createSupabaseServerClient(true);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get order with payment intent ID
    const { data: order, error: orderError } = await supabase
      .from('pcb_quotes')
      .select(`
        id,
        payment_intent_id,
        admin_orders(id, payment_status)
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (!order.payment_intent_id) {
      return NextResponse.json(
        { error: 'No payment intent found for this order' },
        { status: 400 }
      );
    }

    // Check current admin order status
    const adminOrder = Array.isArray(order.admin_orders) 
      ? order.admin_orders[0] 
      : order.admin_orders;

    if (adminOrder?.payment_status === 'paid') {
      return NextResponse.json({
        success: true,
        message: 'Order is already marked as paid',
        alreadyPaid: true
      });
    }

    // Check Stripe payment intent status
    const paymentIntent = await stripe.paymentIntents.retrieve(order.payment_intent_id);

    if (paymentIntent.status === 'succeeded') {
      // Payment succeeded in Stripe but not updated in DB - sync it
      const { error: rpcError } = await supabase.rpc('handle_payment_success', {
        p_payment_intent_id: order.payment_intent_id,
      });

      if (rpcError) {
        console.error('Error syncing payment status:', rpcError);
        return NextResponse.json(
          { error: 'Failed to sync payment status' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Payment status synchronized successfully',
        synced: true,
        stripeStatus: paymentIntent.status
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'Payment not completed in Stripe',
        synced: false,
        stripeStatus: paymentIntent.status
      });
    }

  } catch (error) {
    console.error('Error syncing payment status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 