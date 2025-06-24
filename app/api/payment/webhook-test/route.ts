import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { sendAdminNotification } from '@/lib/utils/sendEmail';

// Test webhook endpoint WITHOUT signature verification
// This is ONLY for debugging - DO NOT use in production
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    console.log('🧪 TEST WEBHOOK (No signature verification)');
    console.log('- Body length:', body.length);
    console.log('- Body preview:', body.substring(0, 200) + '...');
    
    // Parse the event manually
    let event;
    try {
      event = JSON.parse(body);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    console.log('- Event type:', event.type);
    console.log('- Event ID:', event.id);

    const supabase = await createSupabaseServerClient();

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const paymentIntentId = paymentIntent.id;

        console.log(`🧪 TEST: Processing successful payment for intent: ${paymentIntentId}`);

        // Use the transactional function to update order statuses
        const { error: rpcError } = await supabase.rpc('handle_payment_success', {
          p_payment_intent_id: paymentIntentId,
        });

        if (rpcError) {
          console.error(`🧪 TEST: Error in handle_payment_success RPC for intent ${paymentIntentId}:`, rpcError);
          return NextResponse.json({ error: 'Failed to process order update', details: rpcError }, { status: 500 });
        }
        
        console.log(`🧪 TEST: Successfully processed payment and updated order status for intent: ${paymentIntentId}`);
        
        // Send notification email to admin
        try {
            const { data: quote, error: quoteError } = await supabase
              .from('pcb_quotes')
              .select('id, email, admin_orders(id)')
              .eq('payment_intent_id', paymentIntentId)
              .single();

            if (quoteError || !quote) {
              console.error(`🧪 TEST: Quote not found for payment intent ${paymentIntentId} after successful payment. Could not send email.`, quoteError);
            } else {
              const subject = `[TEST] Payment Received for Quote #${quote.id}`;
              const amount = paymentIntent.amount / 100;
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
                <h1>[TEST] New Payment Received</h1>
                <p>A payment has been successfully processed for quote <strong>#${quote.id}</strong>.</p>
                <ul>
                  <li><strong>Quote ID:</strong> ${quote.id}</li>
                  <li><strong>Admin Order ID:</strong> ${adminOrderId || 'N/A'}</li>
                  <li><strong>Customer Email:</strong> ${quote.email}</li>
                  <li><strong>Amount:</strong> ${amount.toFixed(2)} ${currency}</li>
                  <li><strong>Payment Intent ID:</strong> ${paymentIntentId}</li>
                </ul>
                <p>This is a TEST webhook (no signature verification).</p>
              `;
              
              await sendAdminNotification(supabase, subject, html);
              console.log(`🧪 TEST: Email notification sent for quote ${quote.id}`);
            }
        } catch(e) {
            console.error(`🧪 TEST: Exception occurred while trying to send admin notification for intent ${paymentIntentId}:`, e)
        }
        break;
      }

      default:
        console.log(`🧪 TEST: Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ 
      received: true, 
      test: true,
      eventType: event.type,
      eventId: event.id
    });

  } catch (error) {
    console.error('🧪 TEST: Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
} 