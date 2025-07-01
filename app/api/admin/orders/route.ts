import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/utils/supabase/server';
import { checkAdminAuth } from '@/lib/auth-utils';
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
  // Check admin authentication
  const { error } = await checkAdminAuth();
  if (error) return error;

  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const detailId = searchParams.get('detailId'); // 用于详情查询
    const keyword = searchParams.get('keyword') || '';
    const id = searchParams.get('id') || ''; // 用于ID搜索
    const status = searchParams.get('status') || '';
    const userId = searchParams.get('userId') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    if (detailId) {
      // 详情查询 - 使用新的数据结构和文件字段
      const { data, error } = await supabase
        .from(USER_ORDER)
        .select(`
          id,
          user_id,
          email,
          phone,
          product_type,
          product_types,
          pcb_spec,
          stencil_spec,
          smt_spec,
          assembly_spec,
          cal_values,
          shipping_address,
          gerber_file_url,
          status,
          created_at,
          updated_at,
          user_name,
          payment_intent_id,
          admin_orders(*)
        `)
        .eq('id', detailId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // === 新增：根据数据结构确定产品类型 ===
      let productType = data.product_type;
      let productTypes = data.product_types;
      
      if (!productType || !productTypes) {
        // 兼容旧数据：如果没有新字段，根据数据内容判断
        if (data.stencil_spec) {
          productType = 'stencil';
          productTypes = ['stencil'];
        } else if (data.pcb_spec?.borderType || data.pcb_spec?.stencilType) {
          productType = 'stencil';
          productTypes = ['stencil'];
        } else {
          productType = 'pcb';
          productTypes = ['pcb'];
        }
      }

      return NextResponse.json({
        ...data,
        product_type: productType,
        product_types: productTypes
      });
    } else {
      // 列表查询 - 使用新的数据结构，包含部分文件字段
      let query = supabase
        .from(USER_ORDER)
        .select(`
          id,
          user_id,
          email,
          phone,
          product_type,
          product_types,
          pcb_spec,
          stencil_spec,
          smt_spec,
          assembly_spec,
          status,
          created_at,
          updated_at,
          user_name,
          payment_intent_id,
          gerber_file_url,
          admin_orders(*)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (status && status !== 'all') query = query.eq('status', status);
      if (userId) query = query.eq('user_id', userId);
      if (keyword) {
        query = query.or(`email.ilike.%${keyword}%,phone.ilike.%${keyword}%`);
      }
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        // Add 1 day to include the end date fully
        const endOfDay = new Date(endDate);
        endOfDay.setDate(endOfDay.getDate() + 1);
        query = query.lt('created_at', endOfDay.toISOString());
      }

      if (id) {
        // 使用数据库函数解决UUID查询问题
        // 不能直接对UUID使用ilike，需要通过数据库函数
        const { data: matchingIds } = await supabase
          .rpc('search_orders_by_uuid', { search_text: id });
        
        if (matchingIds && matchingIds.length > 0) {
          const uuidList = matchingIds.map((item: { id: string }) => item.id);
          query = query.in('id', uuidList);
        } else {
          // 如果没有匹配的ID，返回空结果
          query = query.eq('id', '00000000-0000-0000-0000-000000000000'); // 不存在的UUID
        }
      }

      const offset = (page - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // === 新增：为列表数据添加产品类型信息 ===
      const processedData = (data || []).map(order => {
        let productType = order.product_type;
        let productTypes = order.product_types;
        
        if (!productType || !productTypes) {
          // 兼容旧数据：如果没有新字段，根据数据内容判断
          if (order.stencil_spec) {
            productType = 'stencil';
            productTypes = ['stencil'];
          } else if (order.pcb_spec?.borderType || order.pcb_spec?.stencilType) {
            productType = 'stencil';
            productTypes = ['stencil'];
          } else {
            productType = 'pcb';
            productTypes = ['pcb'];
          }
        }

        return {
          ...order,
          product_type: productType,
          product_types: productTypes
        };
      });

      return NextResponse.json({
        data: processedData,
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize)
        }
      });
    }
  } catch (error) {
    console.error('Admin orders API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PATCH /api/admin/orders?id=xxx
export async function PATCH(request: NextRequest) {
  // Check admin authentication
  const { error } = await checkAdminAuth();
  if (error) return error;

  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
      return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 });
  }

  const body = await request.json();
  
  // === 新增：状态验证 ===
  if (body.status) {
    const validStatuses = ['pending', 'quoted', 'confirmed', 'production', 'shipped', 'completed', 'cancelled'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
  }

  const updateData: UpdateData = {
      updated_at: new Date().toISOString()
  };

  if (body.status !== undefined) updateData.status = body.status;
  if (body.admin_notes !== undefined) updateData.admin_notes = body.admin_notes;

  if (Object.keys(updateData).length === 1) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 200 });
  }

  // === 修改：获取更新后的数据以检测产品类型 ===
  const { data, error: updateError } = await supabase
      .from(USER_ORDER)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

  if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // === 新增：产品类型检测和日志 ===
  const productType = data?.pcb_spec?.productType || 
    (data?.pcb_spec?.stencilMaterial ? 'stencil' : 'pcb');
  
  if (body.status) {
    console.log(`Updated ${productType} order ${id} status to ${body.status}`);
  }

  return NextResponse.json({ 
    message: 'Quote updated successfully', 
    id,
    productType,
    updatedFields: Object.keys(updateData).filter(key => key !== 'updated_at')
  });
}

// POST /api/admin/orders/batch
export async function POST(request: NextRequest) {
  // Check admin authentication
  const { error } = await checkAdminAuth();
  if (error) return error;

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

  const { error: batchError } = await supabase
      .from(USER_ORDER)
      .update(updateData)
      .in('id', orderIds);

  if (batchError) {
      return NextResponse.json({ error: batchError.message }, { status: 500 });
  }
  return NextResponse.json({ message: 'Batch operation successful' });
}

// DELETE /api/admin/orders?id=xxx 或 批量
export async function DELETE(request: NextRequest) {
  // Check admin authentication
  const { error } = await checkAdminAuth();
  if (error) return error;
  
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