import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/utils/supabase/server';
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
    const userId = searchParams.get('userId') || '';

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
      if (userId) query = query.eq('user_id', userId);
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
    // Note: The middleware should already have verified for admin privileges.
    
    // For this privileged operation, we use the admin client which has the service_role key.
    const supabaseAdmin = createSupabaseAdminClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Case 1: Single delete from query param
    if (id) {
        // WARNING: This is NOT an atomic transaction. 
        // If the second delete fails, data will be inconsistent.
        
        // First, delete the associated admin_order.
        const { error: adminError } = await supabaseAdmin.from('admin_orders').delete().eq('user_order_id', id);
        if (adminError) {
            console.error('Admin order deletion error:', adminError);
            return NextResponse.json({ error: `Failed to delete related admin order: ${adminError.message}` }, { status: 500 });
        }
        
        // Second, delete the main quote.
        const { error: quoteError } = await supabaseAdmin.from(USER_ORDER).delete().eq('id', id);
        if (quoteError) {
            // CRITICAL: At this point, the admin_order is deleted but the pcb_quote is not.
            // This leaves the database in an inconsistent state.
            console.error('Main quote deletion error (INCONSISTENT STATE):', quoteError);
            return NextResponse.json({ error: `Failed to delete main quote, leaving inconsistent data: ${quoteError.message}` }, { status: 500 });
        }
        
        return NextResponse.json({ message: 'Quote and related orders deleted successfully', id });
    }

    // Case 2: Batch delete from request body
    try {
        const body = await request.json();
        const idList = body.idList;
        if (!Array.isArray(idList) || idList.length === 0) {
            return NextResponse.json({ error: 'For batch delete, idList array is required in the body' }, { status: 400 });
        }

        // WARNING: This is NOT an atomic transaction.
        
        // First, delete associated admin_orders.
        const { error: adminError } = await supabaseAdmin.from('admin_orders').delete().in('user_order_id', idList);
        if (adminError) {
            console.error('Batch admin order deletion error:', adminError);
            return NextResponse.json({ error: `Batch delete of admin orders failed: ${adminError.message}` }, { status: 500 });
        }
        
        // Second, delete main quotes.
        const { error: quoteError } = await supabaseAdmin.from(USER_ORDER).delete().in('id', idList);
        if (quoteError) {
            // CRITICAL: Inconsistent data state.
            console.error('Batch main quote deletion error (INCONSISTENT STATE):', quoteError);
            return NextResponse.json({ error: `Batch delete of main quotes failed, leaving inconsistent data: ${quoteError.message}` }, { status: 500 });
        }

        return NextResponse.json({ message: 'Quotes and related orders deleted successfully', idList });
    } catch(e) {
        console.error("Error parsing request body for batch delete:", e);
        return NextResponse.json({ error: 'Invalid request. Provide an `id` query parameter or a request body with `idList`.' }, { status: 400 });
    }
} 