import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import Stripe from 'stripe';
import { sendAdminNotification } from '@/lib/utils/sendEmail';

export const runtime = 'edge';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const errorMessage = `Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
      console.error(errorMessage);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const paymentIntentId = paymentIntent.id;

        console.log(`Processing successful payment for intent: ${paymentIntentId}`);

        // Use the new transactional function to update order statuses
        const { error: rpcError } = await supabase.rpc('handle_payment_success', {
          p_payment_intent_id: paymentIntentId,
        });

        if (rpcError) {
          console.error(`Error in handle_payment_success RPC for intent ${paymentIntentId}:`, rpcError);
          // Return a 500 to signal to Stripe that it should retry the webhook
          return NextResponse.json({ error: 'Failed to process order update' }, { status: 500 });
        }
        
        console.log(`Successfully processed payment and updated order status for intent: ${paymentIntentId}`);
        
        // Send notification email to admin
        try {
            const { data: quote, error: quoteError } = await supabase
              .from('pcb_quotes')
              .select('id, email, admin_orders(id)')
              .eq('payment_intent_id', paymentIntentId)
              .single();

            if (quoteError || !quote) {
              console.error(`Quote not found for payment intent ${paymentIntentId} after successful payment. Could not send email.`, quoteError);
            } else {
              const subject = `Payment Received for Quote #${quote.id}`;
              const amount = paymentIntent.amount / 100; // Amount is in cents
              const currency = paymentIntent.currency.toUpperCase();
        
              let adminOrderId: string | undefined;
              const adminOrders = quote.admin_orders;
              if (Array.isArray(adminOrders)) {
                if (adminOrders.length > 0 && adminOrders[0]) {
                  adminOrderId = adminOrders[0].id;
                }
              } else if (adminOrders) {
                adminOrderId = (adminOrders as { id: string }).id;
              }
        
              const html = `
                <h1>New Payment Received</h1>
                <p>A payment has been successfully processed for quote <strong>#${quote.id}</strong>.</p>
                <ul>
                  <li><strong>Quote ID:</strong> ${quote.id}</li>
                  <li><strong>Admin Order ID:</strong> ${adminOrderId || 'N/A'}</li>
                  <li><strong>Customer Email:</strong> ${quote.email}</li>
                  <li><strong>Amount:</strong> ${amount.toFixed(2)} ${currency}</li>
                  <li><strong>Payment Intent ID:</strong> ${paymentIntentId}</li>
                </ul>
                <p>Please review the order in the admin dashboard.</p>
              `;
              
              // Directly call the sendAdminNotification function
              await sendAdminNotification(supabase, subject, html);
            }
        } catch(e) {
            console.error(`An exception occurred while trying to send admin notification for intent ${paymentIntentId}:`, e)
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const paymentIntentId = paymentIntent.id;

        console.log(`Payment failed for intent: ${paymentIntent.id}. Reason: ${paymentIntent.last_payment_error?.message}`);

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

        // Handle both array and object cases from Supabase relations
        let adminOrderData = quote.admin_orders;
        if (Array.isArray(adminOrderData)) {
          adminOrderData = adminOrderData[0];
        }
        const adminOrderId = adminOrderData?.id;
        
        if (adminOrderId) {
          // Update admin order status to failed
          await supabase
            .from('admin_orders')
            .update({
              payment_status: 'failed',
              status: 'payment_failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', adminOrderId);

          console.log(`Updated order status to 'payment_failed' for payment intent ${paymentIntentId}, quote ${quote.id}, admin order ${adminOrderId}`);
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

        // Handle both array and object cases from Supabase relations
        let adminOrderData = quote.admin_orders;
        if (Array.isArray(adminOrderData)) {
          adminOrderData = adminOrderData[0];
        }
        const adminOrderId = adminOrderData?.id;
        
        if (adminOrderId) {
          // Update admin order status to cancelled
          await supabase
            .from('admin_orders')
            .update({
              payment_status: 'cancelled',
              status: 'payment_cancelled',
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