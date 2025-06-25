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
    const { orderId, amount, currency = 'usd' } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Query the order with user authentication
    const { data: quote, error: quoteError } = await supabase
      .from('pcb_quotes')
      .select(
        `
        *,
        admin_orders(*)
      `
      )
      .eq('id', orderId)
      .eq('user_id', user!.id) // Security check: ensuring the order belongs to the user
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

    // Check if payment intent already exists and verify its status
    if (quote.payment_intent_id) {
      try {
        const existingPaymentIntent = await stripe.paymentIntents.retrieve(quote.payment_intent_id);
        
        if (existingPaymentIntent.status === 'succeeded') {
          return NextResponse.json(
            { error: 'Payment has already been completed successfully' },
            { status: 400 }
          );
        }
        
        if (existingPaymentIntent.status === 'processing') {
          return NextResponse.json(
            { error: 'Payment is currently being processed. Please wait.' },
            { status: 400 }
          );
        }
        
        // If payment intent exists but failed/canceled/requires_action, we can create a new one
        const retriableStatuses = ['requires_payment_method', 'canceled', 'failed', 'requires_action', 'requires_confirmation'];
        if (!retriableStatuses.includes(existingPaymentIntent.status)) {
          return NextResponse.json(
            { error: `Payment intent exists with status: ${existingPaymentIntent.status}. Cannot create new payment.` },
            { status: 400 }
          );
        }
        
        // Log that we're creating a new payment intent to replace the old one
        console.log(`Creating new payment intent to replace existing one with status: ${existingPaymentIntent.status}`);
      } catch (stripeError) {
        console.error('Error checking existing payment intent:', stripeError);
        // If we can't verify the existing payment intent, proceed with caution
        // but log this for monitoring
      }
    }

    // Currency validation - normalize and check supported currencies
    const normalizedAdminCurrency = adminOrder.currency?.toUpperCase() || 'USD';
    const supportedCurrencies = ['USD', 'CNY'];
    
    console.log('Currency check:', {
      adminOrderCurrency: adminOrder.currency,
      normalizedAdminCurrency,
      requestCurrency: currency,
      supportedCurrencies
    });

    if (!supportedCurrencies.includes(normalizedAdminCurrency)) {
      return NextResponse.json(
        { error: `Payment not supported for currency: ${normalizedAdminCurrency}. Supported currencies: ${supportedCurrencies.join(', ')}` },
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

    // Determine the correct currency for Stripe (convert CNY to USD for Stripe processing)
    let stripeCurrency = currency.toLowerCase();
    const stripeAmount = paymentAmount;

    // If admin order is in CNY but we need to process in USD for Stripe
    if (normalizedAdminCurrency === 'CNY') {
      // For now, keep CNY as CNY since Stripe supports it
      // In the future, you might want to convert to USD using exchange rates
      stripeCurrency = 'cny';
    } else {
      stripeCurrency = 'usd';
    }

    console.log('Stripe payment details:', {
      stripeCurrency,
      stripeAmount,
      amountInCents: Math.round(stripeAmount * 100)
    });

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(stripeAmount * 100), // Convert to cents
      currency: stripeCurrency,
      metadata: {
        orderId: orderId,
        adminOrderId: adminOrder.id.toString(),
        userId: user!.id,
        userEmail: user!.email || '',
        originalCurrency: normalizedAdminCurrency,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('Payment intent created successfully:', paymentIntent.id);

    // Update user order with payment intent ID
    const { error: updateError } = await supabase
      .from('pcb_quotes')
      .update({
        payment_intent_id: paymentIntent.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('user_id', user!.id); // Double security check

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