import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ADMIN_ORDER, USER_ORDER } from '@/app/constants/tableNames';

// 定义 pcb_quotes 查询返回类型
interface AdminQuoteRow {
  id: string;
  user_id: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  admin_notes?: string | null;
  pcb_spec?: unknown; // 用 unknown 替代 any
  cal_values?: unknown; // 新增，支持返回cal_values
  admin_orders?: {
    id: string;
    status: string | null;
    admin_price: number | null;
    production_days: number | null;
  }[];
}

interface UpdateQuotePayload {
  status?: string;
  admin_notes?: string;
}

interface BatchUpdateQuotesPayload extends UpdateQuotePayload {
  orderIds: string[];
}

// GET /api/admin/orders
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
  const keyword = searchParams.get('keyword') || '';
  const status = searchParams.get('status') || '';

  if (id) {
    // 详情
    const { data, error } = await supabase
      .from(USER_ORDER)
      .select('*,admin_orders(id,status,admin_price,production_days)')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching single quote:', error);
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    return NextResponse.json(formatQuote(data as AdminQuoteRow));
  } else {
    // 列表+分页+筛选
    let query = supabase
      .from(USER_ORDER)
      .select('*,admin_orders(id,status,admin_price,production_days)', { count: 'exact' })
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
      console.error('Error fetching quotes list:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      items: (data || []).map(item => formatQuote(item as AdminQuoteRow)),
      total: count || 0,
    });
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

  const body: UpdateQuotePayload = await request.json();
  const updateData: Partial<AdminQuoteRow> = {};

  if (body.status !== undefined) updateData.status = body.status;
  if (body.admin_notes !== undefined) updateData.admin_notes = body.admin_notes;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ message: 'No fields to update' }, { status: 200 });
  }

  updateData.updated_at = new Date().toISOString();

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
  const body: BatchUpdateQuotesPayload = await request.json();
  const { orderIds, status } = body;

  if (!Array.isArray(orderIds) || orderIds.length === 0) {
     return NextResponse.json({ error: 'orderIds array is required and must not be empty' }, { status: 400 });
  }

  const updateData: Partial<AdminQuoteRow> = {};
  if (status !== undefined) updateData.status = status;

   if (Object.keys(updateData).length === 0) {
     return NextResponse.json({ message: 'No fields to update in batch' }, { status: 200 });
   }

  updateData.updated_at = new Date().toISOString();

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
    .from('orders')
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

// 工具：格式化返回给前端的报价结构
function formatQuote(row: AdminQuoteRow) {
  // pcb_spec 可能为 json
  let pcbLeadTime = null, pcbStatus = null, pcbSpecData = null;
  if (row.pcb_spec) {
    try {
      const spec = typeof row.pcb_spec === 'string' ? JSON.parse(row.pcb_spec) : row.pcb_spec;
      pcbLeadTime = spec.leadTimeDays ?? null;
      pcbStatus = spec.status ?? null;
      pcbSpecData = spec; // 返回完整规格
    } catch {}
  }
  const order = row.admin_orders?.[0];
  // 新增：从cal_values中提取price
  let calPrice = null;
  if (row.cal_values) {
    try {
      const cal = typeof row.cal_values === 'string' ? JSON.parse(row.cal_values) : row.cal_values;
      calPrice = cal?.price ?? null;
    } catch {}
  }
  return {
    id: row.id,
    user_id: row.user_id,
    email: row.email,
    phone: row.phone,
    created_at: row.created_at,
    updated_at: row.updated_at,
    status: row.status,
    price: calPrice, // 兼容性保留
    admin_notes: row.admin_notes,
    pcb_price: calPrice, // 现在直接用cal_values.price
    pcb_lead_time: pcbLeadTime,
    pcb_status: pcbStatus,
    pcb_spec_data: pcbSpecData, // 新增
    admin_order_status: order?.status ?? null,
    admin_order_price: order?.admin_price ?? null,
    admin_order_lead_time: order?.production_days ?? null,
    cal_values: row.cal_values ?? null, // 新增，返回所有计算字段
  };
} 