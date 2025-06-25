import { NextResponse } from 'next/server';
// import { stripe } from '@/lib/stripe'; // No longer needed
import { createClient } from '@/utils/supabase/server';
import { checkUserAuth } from '@/lib/auth-utils';

export async function GET(request: Request) {
  // Check user authentication
  const { user, error } = await checkUserAuth();
  if (error) return error;

  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const statusFilter = url.searchParams.get('status') || 'all';
    const searchTerm = url.searchParams.get('search') || '';
    const sortField = url.searchParams.get('sortField') || 'created_at';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    const supabase = await createClient();

    // 构建查询
    let query = supabase
      .from('pcb_quotes')
      .select(`
        id,
        created_at,
        status,
        pcb_spec,
        cal_values,
        payment_intent_id,
        admin_orders (
          id,
          status,
          admin_price,
          currency,
          payment_status,
          refund_status,
          requested_refund_amount,
          approved_refund_amount
        )
      `, { count: 'exact' })
      .eq('user_id', user!.id);

    // 添加状态筛选
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    // 添加搜索筛选
    if (searchTerm) {
      query = query.ilike('id', `%${searchTerm}%`);
    }

    // 添加排序
    const ascending = sortOrder === 'asc';
    switch (sortField) {
      case 'created_at':
        query = query.order('created_at', { ascending });
        break;
      case 'status':
        query = query.order('status', { ascending });
        break;
      case 'admin_price':
        // 复杂排序先获取数据再排序
        query = query.order('created_at', { ascending: false });
        break;
      case 'lead_time':
        // 复杂排序先获取数据再排序
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // 对于复杂排序，先获取所有数据
    let allOrdersData;
    let totalCount;
    
    if (sortField === 'admin_price' || sortField === 'lead_time') {
      // 获取所有数据进行排序
      const { data: allOrders, error: allOrdersError, count } = await query;
      if (allOrdersError) {
        return NextResponse.json(
          { error: 'Error fetching orders' },
          { status: 500 }
        );
      }
      
      // 手动排序
      const sortedOrders = (allOrders || []).sort((aOrder, bOrder) => {
        const a = aOrder as Record<string, unknown>;
        const b = bOrder as Record<string, unknown>;
        let aValue: string | number;
        let bValue: string | number;

        switch (sortField) {
          case 'admin_price':
            const aAdminOrders = a.admin_orders as Record<string, unknown>[] | Record<string, unknown>;
            const bAdminOrders = b.admin_orders as Record<string, unknown>[] | Record<string, unknown>;
            const aAdminOrder = Array.isArray(aAdminOrders) ? aAdminOrders[0] : aAdminOrders;
            const bAdminOrder = Array.isArray(bAdminOrders) ? bAdminOrders[0] : bAdminOrders;
            aValue = (aAdminOrder?.admin_price as number) || 0;
            bValue = (bAdminOrder?.admin_price as number) || 0;
            break;
          case 'lead_time':
            const aCalValues = a.cal_values as Record<string, unknown>;
            const bCalValues = b.cal_values as Record<string, unknown>;
            aValue = (aCalValues?.leadTimeDays as number) || 0;
            bValue = (bCalValues?.leadTimeDays as number) || 0;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return ascending ? -1 : 1;
        if (aValue > bValue) return ascending ? 1 : -1;
        return 0;
      });
      
      // 应用分页
      totalCount = count;
      allOrdersData = sortedOrders.slice((page - 1) * pageSize, page * pageSize);
    } else {
      // 简单排序直接使用数据库分页
      const { data: orders, error: orderError, count } = await query
        .range((page - 1) * pageSize, page * pageSize - 1);
      
      if (orderError) {
        return NextResponse.json(
          { error: 'Error fetching orders' },
          { status: 500 }
        );
      }
      
      allOrdersData = orders;
      totalCount = count;
    }

    // 为当前页的订单获取支付状态，不再依赖 Stripe
    const processedOrders = allOrdersData.map((order: Record<string, any>) => {
      const adminOrder = Array.isArray(order.admin_orders) ? order.admin_orders[0] : order.admin_orders;
      const dbPaymentStatus = adminOrder?.payment_status || 'unpaid';

      // 基于数据库中的状态构建支付信息
      const paymentStatusInfo = {
        hasPaymentIntent: !!order.payment_intent_id,
        paymentIntentId: order.payment_intent_id,
        stripeStatus: 'not_checked', // 表示未实时检查
        dbStatus: dbPaymentStatus,
        isPaid: dbPaymentStatus === 'paid',
      };

      return {
        ...order,
        payment_status_info: paymentStatusInfo,
      };
    });

    return NextResponse.json({
      orders: processedOrders,
      pagination: {
        page,
        pageSize,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / pageSize),
      },
    });

  } catch (error) {
    console.error('Error in orders API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}   