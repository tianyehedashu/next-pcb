import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createSupabaseAdminClient } from '@/utils/supabase/server';
import Stripe from 'stripe';
import { sendAdminNotification } from '@/lib/utils/sendEmail';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    // Get the raw request body for signature verification
    const payload = await request.text();
    const sig = request.headers.get('stripe-signature');



    if (!sig) {
      console.error('No stripe-signature header found');
      return NextResponse.json({ error: 'No signature header' }, { status: 400 });
    }

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET environment variable not set');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event: Stripe.Event;

    try {
      // Official Stripe webhook verification for Next.js App Router
      event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
      console.log('✅ Webhook signature verified successfully');
      console.log('- Event type:', event.type);
      console.log('- Event ID:', event.id);
    } catch (err) {
      const errorMessage = `Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
      console.error(errorMessage);
      console.error('Debug details:');
      console.error('- Signature:', sig);
      console.error('- Payload preview:', payload.substring(0, 100) + '...');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

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
            // Debug: Check all recent quotes with payment_intent_id
            const { data: recentQuotes } = await supabase
              .from('pcb_quotes')
              .select('id, payment_intent_id')
              .not('payment_intent_id', 'is', null)
              .order('created_at', { ascending: false })
              .limit(5);
            
            console.log(`Debug: Recent quotes with payment_intent_id:`, recentQuotes);
            console.log(`Debug: Looking for payment_intent_id: "${paymentIntentId}"`);
            
            // First, let's check if the quote exists at all
            const { data: allQuotes } = await supabase
              .from('pcb_quotes')
              .select('id, payment_intent_id')
              .eq('payment_intent_id', paymentIntentId);

            console.log(`Debug: Found ${allQuotes?.length || 0} quotes with exact payment_intent_id match:`, allQuotes);
            
            // Try with LIKE to handle potential whitespace issues
            const { data: likeQuotes } = await supabase
              .from('pcb_quotes')
              .select('id, payment_intent_id')
              .like('payment_intent_id', `%${paymentIntentId}%`);
            
            console.log(`Debug: Found ${likeQuotes?.length || 0} quotes with LIKE match:`, likeQuotes);
            
            // Then try the full query
            const { data: quote, error: quoteError } = await supabase
              .from('pcb_quotes')
              .select(`
                id, 
                email, 
                admin_orders(id)
              `)
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
          console.error(` payment_intent.canceled Quote not found for payment intent ${paymentIntentId}:`, quoteError);
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