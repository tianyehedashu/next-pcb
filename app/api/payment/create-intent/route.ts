import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, currency = 'usd' } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Step 1: Authenticate the user to get their ID.
    const supabaseUserClient = await createSupabaseServerClient(true);
    const {
      data: { user },
      error: authError,
    } = await supabaseUserClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 2: Use the Supabase admin client to bypass RLS.
    // This is safe because we use the authenticated user's ID to scope all queries.
    const supabaseAdmin = await createSupabaseServerClient(false);

    // Step 3: Use the admin client for the query, but scoped to the user's ID.
    const { data: quote, error: quoteError } = await supabaseAdmin
      .from('pcb_quotes')
      .select(
        `
        *,
        admin_orders(*)
      `
      )
      .eq('id', orderId)
      .eq('user_id', user.id) // Security check: ensuring the order belongs to the user
      .single();

    if (quoteError || !quote) {
      console.error('Order query error:', quoteError);
      return NextResponse.json(
        { error: 'Order not found or you do not have permission to access it.' },
        { status: 404 }
      );
    }

    // Get admin order details (should be exactly one)
    // Handle both array and object cases from Supabase relations
    let adminOrder;
    if (Array.isArray(quote.admin_orders)) {
      adminOrder = quote.admin_orders[0];
    } else {
      adminOrder = quote.admin_orders;
    }

    console.log('adminOrder quote.admin_orders:', quote.admin_orders);
    console.log('adminOrder processed:', adminOrder);
    
    if (!adminOrder) {
      return NextResponse.json(
        { error: 'Order has not been reviewed by admin yet' },
        { status: 400 }
      );
    }

    // Check if order is ready for payment
    if (!adminOrder.admin_price || adminOrder.admin_price <= 0) {
      return NextResponse.json(
        { error: 'Order has not been priced by admin yet' },
        { status: 400 }
      );
    }

    // Check if admin has reviewed and approved the order
    if (adminOrder.status !== 'reviewed') {
      return NextResponse.json(
        { error: 'Order has not been reviewed and approved by admin yet' },
        { status: 400 }
      );
    }

    if (adminOrder.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Order has already been paid' },
        { status: 400 }
      );
    }

    // Use admin_price as the authoritative payment amount
    // If amount is provided from frontend, verify it matches admin_price for security
    const paymentAmount = adminOrder.admin_price;
    
    if (amount && Math.abs(amount - paymentAmount) > 0.01) {
      console.error(`Payment amount mismatch: frontend=${amount}, admin_price=${paymentAmount}`);
      return NextResponse.json(
        { error: 'Payment amount does not match the order price' },
        { status: 400 }
      );
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(paymentAmount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        orderId: orderId,
        adminOrderId: adminOrder.id.toString(),
        userId: user.id,
        userEmail: user.email || '',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update user order with payment intent ID using user client (safer)
    // Users have permission to update their own pcb_quotes records
    const { error: updateError } = await supabaseUserClient
      .from('pcb_quotes')
      .update({
        payment_intent_id: paymentIntent.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('user_id', user.id); // Double security check

    if (updateError) {
      console.error('Failed to update quote with payment intent:', updateError);
      return NextResponse.json(
        { error: 'Failed to initialize payment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 