import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const paymentIntentId = searchParams.get('paymentIntentId');

    if (!orderId && !paymentIntentId) {
      return NextResponse.json(
        { error: 'Either orderId or paymentIntentId is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Get order details
    let orderQuery = supabase
      .from('pcb_quotes')
      .select(`
        *,
        admin_orders(*)
      `);

    if (orderId) {
      orderQuery = orderQuery.eq('id', orderId);
    } else if (paymentIntentId) {
      orderQuery = orderQuery.eq('payment_intent_id', paymentIntentId);
    }

    const { data: order, error: orderError } = await orderQuery.single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found', details: orderError },
        { status: 404 }
      );
    }

    // Check admin order status
    let adminOrder;
    if (Array.isArray(order.admin_orders)) {
      adminOrder = order.admin_orders[0];
    } else {
      adminOrder = order.admin_orders;
    }

    const debugInfo = {
      order: {
        id: order.id,
        status: order.status,
        payment_intent_id: order.payment_intent_id,
        created_at: order.created_at,
        updated_at: order.updated_at,
      },
      adminOrder: adminOrder ? {
        id: adminOrder.id,
        status: adminOrder.status,
        payment_status: adminOrder.payment_status,
        order_status: adminOrder.status,
        admin_price: adminOrder.admin_price,
        currency: adminOrder.currency,
        payment_method: adminOrder.payment_method,
        paid_at: adminOrder.paid_at,
        updated_at: adminOrder.updated_at,
      } : null,
      canBePaid: adminOrder && adminOrder.admin_price && adminOrder.status === 'reviewed' && adminOrder.payment_status !== 'paid',
      webhook_received: order.payment_intent_id ? 'Payment Intent ID exists' : 'No Payment Intent ID',
      diagnosis: []
    };

    // Add diagnosis
    const diagnosis = [];
    
    if (!order.payment_intent_id) {
      diagnosis.push('❌ No payment intent ID - payment may not have been initiated');
    } else {
      diagnosis.push('✅ Payment intent ID exists: ' + order.payment_intent_id);
    }

    if (!adminOrder) {
      diagnosis.push('❌ No admin order found');
    } else {
      if (adminOrder.payment_status === 'paid') {
        diagnosis.push('✅ Payment status is paid');
      } else {
        diagnosis.push('❌ Payment status is not paid: ' + (adminOrder.payment_status || 'null'));
      }

      if (adminOrder.status === 'reviewed') {
        diagnosis.push('✅ Admin has reviewed the order');
      } else {
        diagnosis.push('❌ Order not reviewed by admin: ' + (adminOrder.status || 'null'));
      }

      if (adminOrder.admin_price && adminOrder.admin_price > 0) {
        diagnosis.push('✅ Admin price is set: ' + adminOrder.admin_price + ' ' + (adminOrder.currency || 'USD'));
      } else {
        diagnosis.push('❌ No admin price set');
      }
    }

    if (order.payment_intent_id && adminOrder?.payment_status !== 'paid') {
      diagnosis.push('⚠️ Payment intent exists but status not updated - webhook may have failed or be delayed');
    }

    debugInfo.diagnosis = diagnosis;

    return NextResponse.json({
      success: true,
      debugInfo,
      recommendations: [
        'If payment intent exists but status is not updated, check Stripe webhook logs',
        'If webhook was delivered, check server logs for handle_payment_success function errors',
        'If payment status is still not updated after 5 minutes, contact support'
      ]
    });

  } catch (error) {
    console.error('Error in payment status debug:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
 