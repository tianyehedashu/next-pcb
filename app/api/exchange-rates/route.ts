import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

// 固定汇率作为降级方案
const FALLBACK_RATES: Record<string, Record<string, { rate: number; source: string; last_updated: string }>> = {
  'USD': {
    'CNY': { rate: 7.2, source: 'fallback', last_updated: new Date().toISOString() },
    'EUR': { rate: 0.85, source: 'fallback', last_updated: new Date().toISOString() },
    'GBP': { rate: 0.75, source: 'fallback', last_updated: new Date().toISOString() },
    'JPY': { rate: 110, source: 'fallback', last_updated: new Date().toISOString() },
    'HKD': { rate: 7.8, source: 'fallback', last_updated: new Date().toISOString() },
  },
  'CNY': {
    'USD': { rate: 0.139, source: 'fallback', last_updated: new Date().toISOString() },
    'EUR': { rate: 0.118, source: 'fallback', last_updated: new Date().toISOString() },
    'GBP': { rate: 0.104, source: 'fallback', last_updated: new Date().toISOString() },
    'JPY': { rate: 15.28, source: 'fallback', last_updated: new Date().toISOString() },
    'HKD': { rate: 1.08, source: 'fallback', last_updated: new Date().toISOString() },
  },
  'EUR': {
    'USD': { rate: 1.18, source: 'fallback', last_updated: new Date().toISOString() },
    'CNY': { rate: 8.47, source: 'fallback', last_updated: new Date().toISOString() },
    'GBP': { rate: 0.88, source: 'fallback', last_updated: new Date().toISOString() },
    'JPY': { rate: 129, source: 'fallback', last_updated: new Date().toISOString() },
    'HKD': { rate: 9.18, source: 'fallback', last_updated: new Date().toISOString() },
  }
};

/**
 * 获取固定汇率的辅助函数
 */
function getFallbackRate(baseCurrency: string, targetCurrency: string) {
  const base = baseCurrency.toUpperCase();
  const target = targetCurrency.toUpperCase();
  
  // 相同货币
  if (base === target) {
    return {
      base_currency: base,
      target_currency: target,
      rate: 1,
      source: 'same_currency',
      last_updated: new Date().toISOString(),
    };
  }

  // 查找固定汇率
  const fallbackRate = FALLBACK_RATES[base]?.[target];
  if (fallbackRate) {
    return {
      base_currency: base,
      target_currency: target,
      ...fallbackRate,
    };
  }

  return null;
}

// GET /api/exchange-rates - 获取激活的汇率（公共接口）
export async function GET(request: NextRequest) {
  console.log('🌐 汇率API被调用');
  
  try {
    const { searchParams } = new URL(request.url);
    const baseCurrency = searchParams.get('base_currency');
    const targetCurrency = searchParams.get('target_currency');
    
    console.log(`📝 请求参数: ${baseCurrency} -> ${targetCurrency}`);

    // 尝试从数据库获取汇率
    try {
      console.log('🔍 尝试连接数据库...');
      
      // 先尝试用管理员客户端绕过RLS
      const supabase = createAdminClient();
      console.log('✅ 数据库连接成功 (使用管理员客户端)');
      
      // 构建查询 - 只返回激活的汇率
      let query = supabase
        .from('exchange_rates')
        .select('base_currency, target_currency, rate, last_updated, source')
        .eq('is_active', true)
        .order('base_currency', { ascending: true })
        .order('target_currency', { ascending: true });

      if (baseCurrency) {
        query = query.eq('base_currency', baseCurrency.toUpperCase());
      }
      if (targetCurrency) {
        query = query.eq('target_currency', targetCurrency.toUpperCase());
      }

      console.log('🔍 执行数据库查询...');
      const { data: exchangeRates, error } = await query;

      if (error) {
        console.error('❌ 数据库查询错误:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
      } else {
        console.log('🌐 数据库查询成功:', exchangeRates?.length || 0, '条记录');
      }

      if (!error && exchangeRates) {
        console.log('🌐 成功从数据库获取汇率:', exchangeRates.length, '条记录');
        
        // 如果查询特定汇率对，返回单个汇率对象
        if (baseCurrency && targetCurrency) {
          const rate = exchangeRates?.[0];
          if (rate) {
            console.log(`✅ 找到数据库汇率: ${baseCurrency} -> ${targetCurrency} = ${rate.rate}`);
            return NextResponse.json(rate);
          }
          
          // 尝试查询反向汇率
          console.log('🔄 尝试查询反向汇率...');
          const { data: reverseQuery, error: reverseError } = await supabase
            .from('exchange_rates')
            .select('base_currency, target_currency, rate, source, last_updated')
            .eq('is_active', true)
            .eq('base_currency', targetCurrency.toUpperCase())
            .eq('target_currency', baseCurrency.toUpperCase())
            .maybeSingle();
          
          if (reverseError) {
            console.error('❌ 反向汇率查询错误:', reverseError);
          }
          
          if (!reverseError && reverseQuery && reverseQuery.rate > 0) {
            const reversedRate = 1 / reverseQuery.rate;
            console.log(`🔄 使用反向汇率: ${targetCurrency} -> ${baseCurrency} = ${reverseQuery.rate}, 计算得 ${baseCurrency} -> ${targetCurrency} = ${reversedRate}`);
            return NextResponse.json({
              base_currency: baseCurrency.toUpperCase(),
              target_currency: targetCurrency.toUpperCase(),
              rate: reversedRate,
              source: `${reverseQuery.source || 'database'} (reversed)`,
              last_updated: reverseQuery.last_updated || new Date().toISOString(),
            });
          }
        } else {
          // 返回所有匹配的汇率
          console.log('📋 返回所有汇率列表');
          return NextResponse.json({ 
            exchangeRates,
            total: exchangeRates?.length || 0 
          });
        }
      } else {
        console.warn('❌ 数据库汇率查询失败:', error?.message || '未知错误');
      }
      
    } catch (dbError) {
      console.error('❌ 数据库连接异常:', {
        error: dbError,
        message: dbError instanceof Error ? dbError.message : '未知错误',
        stack: dbError instanceof Error ? dbError.stack : undefined
      });
    }

    // 数据库查询失败，使用固定汇率降级
    console.log('🔄 使用固定汇率降级方案');

    if (baseCurrency && targetCurrency) {
      const fallbackRate = getFallbackRate(baseCurrency, targetCurrency);
      if (fallbackRate) {
        console.log(`✅ 返回固定汇率: ${baseCurrency} -> ${targetCurrency} = ${fallbackRate.rate}`);
        return NextResponse.json(fallbackRate);
      }

      console.warn(`⚠️ 汇率对不支持: ${baseCurrency} -> ${targetCurrency}`);
      return NextResponse.json({ 
        error: `Exchange rate not found for ${baseCurrency} to ${targetCurrency}` 
      }, { status: 404 });
    }

    // 返回所有固定汇率
    const allRates: Array<{
      base_currency: string;
      target_currency: string;
      rate: number;
      source: string;
      last_updated: string;
    }> = [];

    Object.entries(FALLBACK_RATES).forEach(([base, targets]) => {
      Object.entries(targets).forEach(([target, rateData]) => {
        if (!baseCurrency || base === baseCurrency.toUpperCase()) {
          allRates.push({
            base_currency: base,
            target_currency: target,
            rate: rateData.rate,
            source: rateData.source,
            last_updated: rateData.last_updated,
          });
        }
      });
    });

    console.log(`✅ 返回固定汇率列表: ${allRates.length} 条记录`);
    return NextResponse.json({ 
      exchangeRates: allRates,
      total: allRates.length 
    });

  } catch (outerError) {
    console.error('❌ API最外层错误:', {
      error: outerError,
      message: outerError instanceof Error ? outerError.message : '未知错误',
      stack: outerError instanceof Error ? outerError.stack : undefined
    });

    // 即使最外层出错，也要尝试返回固定汇率
    try {
      const { searchParams } = new URL(request.url);
      const baseCurrency = searchParams.get('base_currency');
      const targetCurrency = searchParams.get('target_currency');

      if (baseCurrency && targetCurrency) {
        const fallbackRate = getFallbackRate(baseCurrency, targetCurrency);
        if (fallbackRate) {
          console.log(`🆘 紧急降级: 返回固定汇率 ${baseCurrency} -> ${targetCurrency} = ${fallbackRate.rate}`);
          return NextResponse.json(fallbackRate);
        }
      }
    } catch (emergencyError) {
      console.error('❌ 紧急降级也失败了:', emergencyError);
    }

    // 最后的最后，返回500但包含错误信息
    return NextResponse.json({ 
      error: 'Internal server error',
      details: outerError instanceof Error ? outerError.message : '未知错误'
    }, { status: 500 });
  }
} 