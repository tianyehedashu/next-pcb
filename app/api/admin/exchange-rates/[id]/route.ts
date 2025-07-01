import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/utils/supabase/server';
import { ExchangeRateUpdateInput } from '@/types/exchange-rate';
import { checkAdminAuth } from '@/lib/auth-utils';

// GET /api/admin/exchange-rates/[id] - 获取单个汇率（所有人可访问）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // 使用管理员客户端绕过RLS限制，因为汇率信息是公开的
    const supabase = createSupabaseAdminClient();

    const { data: exchangeRate, error } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Exchange rate not found' }, { status: 404 });
      }
      console.error('获取汇率失败:', error);
      return NextResponse.json({ error: 'Failed to fetch exchange rate' }, { status: 500 });
    }

    return NextResponse.json({ exchangeRate });

  } catch (error) {
    console.error('汇率获取API错误:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/exchange-rates/[id] - 更新汇率
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin authentication
  const { error } = await checkAdminAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();

    const body: ExchangeRateUpdateInput = await request.json();

    // 验证汇率值
    if (body.rate !== undefined && body.rate <= 0) {
      return NextResponse.json({ 
        error: 'Exchange rate must be greater than 0' 
      }, { status: 400 });
    }

    // 构建更新数据
    const updateData: Record<string, unknown> = {};
    if (body.rate !== undefined) updateData.rate = body.rate;
    if (body.source !== undefined) updateData.source = body.source;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        error: 'No valid fields to update' 
      }, { status: 400 });
    }

    const { data: exchangeRate, error } = await supabase
      .from('exchange_rates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Exchange rate not found' }, { status: 404 });
      }
      console.error('更新汇率失败:', error);
      return NextResponse.json({ error: 'Failed to update exchange rate' }, { status: 500 });
    }

    return NextResponse.json({ exchangeRate });

  } catch (error) {
    console.error('汇率更新API错误:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/exchange-rates/[id] - 删除汇率
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin authentication
  const { error } = await checkAdminAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from('exchange_rates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除汇率失败:', error);
      return NextResponse.json({ error: 'Failed to delete exchange rate' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Exchange rate deleted successfully' });

  } catch (error) {
    console.error('汇率删除API错误:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 