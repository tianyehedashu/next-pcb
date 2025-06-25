import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';
import { checkUserAuth } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  // Check user authentication
  const { user, error } = await checkUserAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get order
    const { data: order, error: orderError } = await supabase
      .from('pcb_quotes')
      .select('payment_intent_id, admin_orders(payment_status)')
      .eq('id', orderId)
      .eq('user_id', user!.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order is already paid
    const adminOrder = Array.isArray(order.admin_orders) 
      ? order.admin_orders[0] 
      : order.admin_orders;

    if (adminOrder?.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Order has already been paid' },
        { status: 400 }
      );
    }

    if (!order.payment_intent_id) {
      return NextResponse.json(
        { error: 'No payment intent to clear' },
        { status: 400 }
      );
    }

    // Check the payment intent status in Stripe
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(order.payment_intent_id);
      
      // Only allow clearing if the payment intent is in a failed or retriable state
      const clearableStatuses = ['failed', 'canceled', 'requires_payment_method', 'requires_action', 'requires_confirmation'];
      
      if (!clearableStatuses.includes(paymentIntent.status)) {
        return NextResponse.json(
          { error: `Cannot clear payment intent with status: ${paymentIntent.status}` },
          { status: 400 }
        );
      }

      // Cancel the payment intent in Stripe if it's not already canceled/failed
      if (paymentIntent.status !== 'failed' && paymentIntent.status !== 'canceled') {
        await stripe.paymentIntents.cancel(order.payment_intent_id);
      }

    } catch (stripeError) {
      console.error('Error checking/canceling payment intent:', stripeError);
      // Continue with clearing from database even if Stripe operation fails
    }

    // Clear the payment intent ID from the order
    const { error: updateError } = await supabase
      .from('pcb_quotes')
      .update({
        payment_intent_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('user_id', user!.id);

    if (updateError) {
      console.error('Error clearing payment intent ID:', updateError);
      return NextResponse.json(
        { error: 'Failed to clear payment intent' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Payment intent cleared successfully',
      orderId
    });

  } catch (error) {
    console.error('Error clearing failed payment intent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 