import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { USER_ORDER } from '@/app/constants/tableNames';

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
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
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
        .select('*,admin_orders(*)')
        .eq('id', id)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json(data);
    } else {
      // 列表
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
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        items: data || [],
        total: count || 0,
      });
    }
  } catch (error) {
    console.error('Unexpected error in GET:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// PATCH /api/admin/orders?id=xxx
export async function PATCH(request: NextRequest) {
    const supabase = await createSupabaseServerClient();
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

    if (Object.keys(updateData).length === 1) {
        return NextResponse.json({ message: 'No fields to update' }, { status: 200 });
    }

    const { error } = await supabase
        .from(USER_ORDER)
        .update(updateData)
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Quote updated successfully', id });
}

// POST /api/admin/orders/batch
export async function POST(request: NextRequest) {
    const supabase = await createSupabaseServerClient();
    const body = await request.json();
    const { orderIds, status } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return NextResponse.json({ error: 'orderIds array is required' }, { status: 400 });
    }

    const updateData: BatchUpdateData = {
        updated_at: new Date().toISOString()
    };
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 1) {
        return NextResponse.json({ message: 'No fields to update in batch' }, { status: 200 });
    }

    const { error } = await supabase
        .from(USER_ORDER)
        .update(updateData)
        .in('id', orderIds);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Batch operation successful' });
}

// DELETE /api/admin/orders?id=xxx 或 批量
export async function DELETE(request: NextRequest) {
    const supabase = await createSupabaseServerClient();
    let idList: string[] = [];
    try {
        const body = await request.json();
        if (Array.isArray(body.idList)) {
            idList = body.idList;
        }
    } catch {
        // Not a batch delete, proceed with single ID
    }

    if (idList.length > 0) {
        // Batch delete
        const { error } = await supabase.rpc('delete_user_orders_by_ids', { p_ids: idList });
        if (error) {
            return NextResponse.json({ error: `Batch delete failed: ${error.message}` }, { status: 500 });
        }
        return NextResponse.json({ message: 'Quotes and related orders deleted successfully', idList });
    } else {
        // Single delete
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 });
        }
        const { error } = await supabase.rpc('delete_user_orders_by_ids', { p_ids: [id] });
        if (error) {
            return NextResponse.json({ error: `Failed to delete order: ${error.message}` }, { status: 500 });
        }
        return NextResponse.json({ message: 'Quote and related orders deleted successfully', id });
    }
} 