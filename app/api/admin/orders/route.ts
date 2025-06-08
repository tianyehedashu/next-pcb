import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ADMIN_ORDER, USER_ORDER } from '@/app/constants/tableNames';

interface UpdateData {
  status?: string;
  admin_notes?: string;
  updated_at: string;
}

interface BatchUpdateData {
  status?: string;
  updated_at: string;
}

// GET /api/admin/orders
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const keyword = searchParams.get('keyword') || '';
    const status = searchParams.get('status') || '';

    if (id) {
      // 详情，返回所有字段，包括 shipping_address 和 admin_orders 的所有字段
      const { data, error } = await supabase
        .from(USER_ORDER)
        .select('*,admin_orders(*)')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Error fetching single order:', error);
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      return NextResponse.json(data);
    } else {
      // 列表+分页+筛选，返回所有字段
      let query = supabase
        .from(USER_ORDER)
        .select('*,admin_orders(*)', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (status && status !== 'all') query = query.eq('status', status);
      if (keyword) {
        query = query.or(`email.ilike.%${keyword}%,phone.ilike.%${keyword}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching orders list:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        items: data || [],
        total: count || 0,
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/orders?id=xxx
export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 });
  }

  const body = await request.json();
  const updateData: UpdateData = {
    updated_at: new Date().toISOString()
  };

  if (body.status !== undefined) updateData.status = body.status;
  if (body.admin_notes !== undefined) updateData.admin_notes = body.admin_notes;

  if (Object.keys(updateData).length === 1) { // 只有 updated_at
    return NextResponse.json({ message: 'No fields to update' }, { status: 200 });
  }

  const { error } = await supabase
    .from(USER_ORDER)
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating quote:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Quote updated successfully', id });
}

// POST /api/admin/orders/batch
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const body = await request.json();
  const { orderIds, status } = body;

  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return NextResponse.json({ error: 'orderIds array is required and must not be empty' }, { status: 400 });
  }

  const updateData: BatchUpdateData = {
    updated_at: new Date().toISOString()
  };
  
  if (status !== undefined) updateData.status = status;

  if (Object.keys(updateData).length === 1) { // 只有 updated_at
    return NextResponse.json({ message: 'No fields to update in batch' }, { status: 200 });
  }

  const { error } = await supabase
    .from(USER_ORDER)
    .update(updateData)
    .in('id', orderIds);

  if (error) {
    console.error('Error performing batch operation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Batch operation successful' });
}

// DELETE /api/admin/orders?id=xxx 或 批量
export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  let idList: string[] = [];
  try {
    const body = await request.json();
    if (Array.isArray(body.idList)) {
      idList = body.idList;
    }
  } catch {
    // body 不是 JSON 或没有 idList，继续走 query 参数逻辑
  }

  if (idList.length > 0) {
    // 先删除 orders
    const { error: orderError } = await supabase
      .from(ADMIN_ORDER)
      .delete()
      .in('user_order_id', idList);

    if (orderError) {
      console.error('Error deleting related orders:', orderError);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // 再删除 quotes
    const { error } = await supabase
      .from(USER_ORDER)
      .delete()
      .in('id', idList);

    if (error) {
      console.error('Error deleting quotes:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Quotes and related orders deleted successfully', idList });
  }

  // 单个删除
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 });
  }

  // 先删除 orders
  const { error: orderError } = await supabase
    .from('USER_ORDER')
    .delete()
    .eq('quote_id', id);

  if (orderError) {
    console.error('Error deleting related orders:', orderError);
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  // 再删除 quotes
  const { error: deleteError } = await supabase
    .from(USER_ORDER)
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('Error deleting quote:', deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Quote and related orders deleted successfully', id });
}

// 工具：格式化返回给前端的订单结构，保留所有字段，补充特殊处理字段
// 定义一个宽泛类型用于 row，避免使用 any
interface AdminOrderRow {
  [key: string]: unknown;
}
function formatQuote(row: AdminOrderRow) {
  // pcb_spec 可能为 json
  let pcbLeadTime = null, pcbStatus = null, pcbSpecData = null;
  if (row.pcb_spec) {
    try {
      const spec = typeof row.pcb_spec === 'string' ? JSON.parse(row.pcb_spec as string) : row.pcb_spec;
      const specObj = spec as Record<string, unknown>;
      pcbLeadTime = specObj.leadTimeDays ?? null;
      pcbStatus = specObj.status ?? null;
      pcbSpecData = specObj; // 返回完整规格
    } catch {}
  }
  // 新增：从cal_values中提取price
  let calPrice = null;
  if (row.cal_values) {
    try {
      const cal = typeof row.cal_values === 'string' ? JSON.parse(row.cal_values as string) : row.cal_values;
      const calObj = cal as Record<string, unknown>;
      calPrice = calObj.price ?? null;
    } catch {}
  }
  // 直接返回所有字段，并补充特殊处理字段
  const restRow = { ...row };
  delete restRow.pcb_spec;
  return {
    ...restRow, // 保留所有原始字段，除了 pcb_spec
    pcb_price: calPrice,
    pcb_lead_time: pcbLeadTime,
    pcb_status: pcbStatus,
    pcb_spec_data: pcbSpecData,
    cal_values: row.cal_values ?? null,
  };
} 