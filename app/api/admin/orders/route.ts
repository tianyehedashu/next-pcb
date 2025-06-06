import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ADMIN_ORDER_TABLE } from '@/app/constants/tableNames';

// 定义 pcb_quotes 查询返回类型
interface AdminQuoteRow {
  id: string;
  user_id: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  price?: number | null;
  admin_notes?: string | null;
  pcb_spec?: unknown; // 用 unknown 替代 any
  orders?: {
    id: string;
    status: string | null;
    quoted_price: number | null;
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
  const cookieStore = cookies();
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
      .from('pcb_quotes')
      .select('*,orders(id,status,quoted_price,production_days)')
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
      .from('pcb_quotes')
      .select('*,orders(id,status,quoted_price,production_days)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status && status !== 'all') query = query.eq('status', status);
    if (keyword) {
      query = query.or(`email.ilike.%${keyword}%,phone.ilike.%${keyword}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    console.log('ltd data', data);

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
  const cookieStore = cookies();
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
    .from(ADMIN_ORDER_TABLE)
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
  const cookieStore = cookies();
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
    .from(ADMIN_ORDER_TABLE)
    .update(updateData)
    .in('id', orderIds);

  if (error) {
    console.error('Error performing batch operation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Batch operation successful' });
}

// DELETE /api/admin/orders?id=xxx
export async function DELETE(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .from(ADMIN_ORDER_TABLE)
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('Error deleting quote:', deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Quote deleted successfully', id });
}

// 工具：格式化返回给前端的报价结构
function formatQuote(row: AdminQuoteRow) {
  // pcb_spec 可能为 json
  let pcbPrice = null, pcbLeadTime = null, pcbStatus = null;
  if (row.pcb_spec) {
    try {
      const spec = typeof row.pcb_spec === 'string' ? JSON.parse(row.pcb_spec) : row.pcb_spec;
      pcbPrice = spec.price ?? null;
      pcbLeadTime = spec.leadTimeDays ?? null;
      pcbStatus = spec.status ?? null;
    } catch {}
  }
  const order = row.orders?.[0];
  return {
    id: row.id,
    user_id: row.user_id,
    email: row.email,
    phone: row.phone,
    created_at: row.created_at,
    updated_at: row.updated_at,
    status: row.status,
    price: row.price,
    admin_notes: row.admin_notes,
    pcb_price: pcbPrice,
    pcb_lead_time: pcbLeadTime,
    pcb_status: pcbStatus,
    admin_order_status: order?.status ?? null,
    admin_order_price: order?.quoted_price ?? null,
    admin_order_lead_time: order?.production_days ?? null,
  };
} 