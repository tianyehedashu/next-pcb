import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { fetchExternalExchangeRates } from '@/lib/services/external-exchange-rate';
import { SUPPORTED_CURRENCIES } from '@/types/exchange-rate';

// GET /api/admin/exchange-rates/sync - 获取外部汇率用于预览或单点同步
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const targetCurrency = searchParams.get('target');

    // 总是获取所有汇率，因为外部API通常一次性返回所有
    const externalRates = await fetchExternalExchangeRates('CNY', 'api_exchangerate');

    // 如果请求的是特定货币，只返回那一项
    if (targetCurrency) {
        if (externalRates.rates && externalRates.rates[targetCurrency]) {
            return NextResponse.json({
                base: externalRates.base,
                date: externalRates.date,
                rates: { [targetCurrency]: externalRates.rates[targetCurrency] }
            });
        } else {
            return NextResponse.json({ error: `Rate for ${targetCurrency} not found in external data.` }, { status: 404 });
        }
    }

    // 如果没有指定特定货币，返回所有获取到的汇率
    return NextResponse.json(externalRates);

  } catch (error) {
    console.error('获取外部汇率失败:', error);
    return NextResponse.json({ 
      error: `获取外部汇率失败: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 502 });
  }
}

// POST /api/admin/exchange-rates/sync - 应用确认后的汇率变更
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { ratesToApply, source = 'api_exchangerate' } = body;

    if (!ratesToApply || !Array.isArray(ratesToApply) || ratesToApply.length === 0) {
      return NextResponse.json({ error: 'No rates provided to apply.' }, { status: 400 });
    }

    let successCount = 0;
    const errors = [];

    for (const rate of ratesToApply) {
      try {
        const { data: existingRate } = await supabase
          .from('exchange_rates')
          .select('id')
          .eq('base_currency', rate.base_currency)
          .eq('target_currency', rate.target_currency)
          .maybeSingle();

        if (existingRate) {
          // 更新
          const { error } = await supabase.from('exchange_rates').update({
            rate: rate.rate,
            source: source,
            last_updated: new Date().toISOString(),
          }).eq('id', existingRate.id);
          if (error) throw error;
        } else {
          // 创建
          const { error } = await supabase.from('exchange_rates').insert({
            base_currency: rate.base_currency,
            target_currency: rate.target_currency,
            rate: rate.rate,
            is_active: true,
            source: source,
          });
          if (error) throw error;
        }
        successCount++;
      } catch (dbError) {
        errors.push({
          pair: `${rate.base_currency}/${rate.target_currency}`,
          error: dbError instanceof Error ? dbError.message : 'Unknown DB error'
        });
      }
    }

    if (errors.length > 0) {
        return NextResponse.json({ 
            message: `Sync partially completed. Success: ${successCount}, Failed: ${errors.length}`,
            errors,
        }, { status: 207 });
    }

    return NextResponse.json({
        success: true,
        message: `Successfully applied ${successCount} rate changes.`,
    });

  } catch (error) {
    console.error('应用汇率同步API错误:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 