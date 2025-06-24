import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

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
      .select('payment_intent_id, admin_orders(payment_status)')
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
      return NextResponse.json({
        hasPaymentIntent: false,
        paymentStatus: 'no_intent',
        dbStatus: order.admin_orders?.[0]?.payment_status || 'unpaid'
      });
    }

    // Check Stripe payment intent status
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(order.payment_intent_id);
      
      return NextResponse.json({
        hasPaymentIntent: true,
        paymentIntentId: order.payment_intent_id,
        stripeStatus: paymentIntent.status,
        dbStatus: order.admin_orders?.[0]?.payment_status || 'unpaid',
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        isPaid: paymentIntent.status === 'succeeded',
        needsSync: paymentIntent.status === 'succeeded' && order.admin_orders?.[0]?.payment_status !== 'paid'
      });

    } catch (stripeError) {
      console.error('Error retrieving payment intent from Stripe:', stripeError);
      return NextResponse.json({
        hasPaymentIntent: true,
        paymentIntentId: order.payment_intent_id,
        stripeStatus: 'unknown',
        dbStatus: order.admin_orders?.[0]?.payment_status || 'unpaid',
        error: 'Could not verify payment status with Stripe'
      });
    }

  } catch (error) {
    console.error('Error checking payment intent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 