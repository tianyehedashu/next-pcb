import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient(false);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const paymentIntentId = paymentIntent.id;
        
        // Find the user order by payment_intent_id
        const { data: quote, error: quoteError } = await supabase
          .from('pcb_quotes')
          .select(`
            *,
            admin_orders!inner(id)
          `)
          .eq('payment_intent_id', paymentIntentId)
          .single();

        if (quoteError || !quote) {
          console.error(`Quote not found for payment intent ${paymentIntentId}:`, quoteError);
          break;
        }

        const adminOrderId = quote.admin_orders?.[0]?.id;
        
        if (adminOrderId) {
          // Update admin order status to paid
          await supabase
            .from('admin_orders')
            .update({
              payment_status: 'paid',
              payment_method: 'stripe',
              order_status: 'paid',
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', adminOrderId);

          console.log(`Payment succeeded for payment intent ${paymentIntentId}, quote ${quote.id}, admin order ${adminOrderId}`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const paymentIntentId = paymentIntent.id;
        
        // Find the user order by payment_intent_id
        const { data: quote, error: quoteError } = await supabase
          .from('pcb_quotes')
          .select(`
            *,
            admin_orders!inner(id)
          `)
          .eq('payment_intent_id', paymentIntentId)
          .single();

        if (quoteError || !quote) {
          console.error(`Quote not found for payment intent ${paymentIntentId}:`, quoteError);
          break;
        }

        const adminOrderId = quote.admin_orders?.[0]?.id;
        
        if (adminOrderId) {
          // Update admin order status to failed
          await supabase
            .from('admin_orders')
            .update({
              payment_status: 'failed',
              order_status: 'payment_failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', adminOrderId);

          console.log(`Payment failed for payment intent ${paymentIntentId}, quote ${quote.id}, admin order ${adminOrderId}`);
        }
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const paymentIntentId = paymentIntent.id;
        
        // Find the user order by payment_intent_id
        const { data: quote, error: quoteError } = await supabase
          .from('pcb_quotes')
          .select(`
            *,
            admin_orders!inner(id)
          `)
          .eq('payment_intent_id', paymentIntentId)
          .single();

        if (quoteError || !quote) {
          console.error(`Quote not found for payment intent ${paymentIntentId}:`, quoteError);
          break;
        }

        const adminOrderId = quote.admin_orders?.[0]?.id;
        
        if (adminOrderId) {
          // Update admin order status to cancelled
          await supabase
            .from('admin_orders')
            .update({
              payment_status: 'cancelled',
              order_status: 'payment_cancelled',
              updated_at: new Date().toISOString(),
            })
            .eq('id', adminOrderId);

          console.log(`Payment cancelled for payment intent ${paymentIntentId}, quote ${quote.id}, admin order ${adminOrderId}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 