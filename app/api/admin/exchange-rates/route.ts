import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/utils/supabase/server';
import { ExchangeRateCreateInput } from '@/types/exchange-rate';

// GET /api/admin/exchange-rates - 获取所有汇率（所有人可访问）
export async function GET(request: NextRequest) {
  try {
    // 使用管理员客户端绕过RLS限制，因为汇率信息是公开的
    const supabase = createSupabaseAdminClient();

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const baseCurrency = searchParams.get('base_currency');
    const targetCurrency = searchParams.get('target_currency');
    const isActive = searchParams.get('is_active');

    // 构建查询
    let query = supabase
      .from('exchange_rates')
      .select('*')
      .order('base_currency', { ascending: true })
      .order('target_currency', { ascending: true });

    if (baseCurrency) {
      query = query.eq('base_currency', baseCurrency);
    }
    if (targetCurrency) {
      query = query.eq('target_currency', targetCurrency);
    }
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: exchangeRates, error } = await query;

    if (error) {
      console.error('获取汇率失败:', error);
      return NextResponse.json({ error: 'Failed to fetch exchange rates' }, { status: 500 });
    }

    return NextResponse.json({ 
      exchangeRates,
      total: exchangeRates?.length || 0 
    });

  } catch (error) {
    console.error('汇率API错误:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/exchange-rates - 创建新汇率
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // 验证用户权限
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查管理员权限
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body: ExchangeRateCreateInput = await request.json();

    // 验证必填字段
    if (!body.base_currency || !body.target_currency || !body.rate) {
      return NextResponse.json({ 
        error: 'Missing required fields: base_currency, target_currency, rate' 
      }, { status: 400 });
    }

    // 验证汇率值
    if (body.rate <= 0) {
      return NextResponse.json({ 
        error: 'Exchange rate must be greater than 0' 
      }, { status: 400 });
    }

    // 防止相同货币转换
    if (body.base_currency === body.target_currency) {
      return NextResponse.json({ 
        error: 'Base currency and target currency cannot be the same' 
      }, { status: 400 });
    }

    const { data: exchangeRate, error } = await supabase
      .from('exchange_rates')
      .insert({
        base_currency: body.base_currency.toUpperCase(),
        target_currency: body.target_currency.toUpperCase(),
        rate: body.rate,
        source: body.source || 'manual',
        is_active: body.is_active ?? true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // 唯一约束违反
        return NextResponse.json({ 
          error: 'Exchange rate for this currency pair already exists' 
        }, { status: 409 });
      }
      console.error('创建汇率失败:', error);
      return NextResponse.json({ error: 'Failed to create exchange rate' }, { status: 500 });
    }

    return NextResponse.json({ exchangeRate }, { status: 201 });

  } catch (error) {
    console.error('汇率创建API错误:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 