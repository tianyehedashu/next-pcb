/**
 * 统一汇率服务
 * 优先从数据库获取汇率，失败时使用固定汇率作为降级方案
 */

// 固定汇率作为降级方案
const FALLBACK_EXCHANGE_RATES: Record<string, Record<string, number>> = {
  'USD': {
    'CNY': 7.2,
    'EUR': 0.85,
    'GBP': 0.75,
    'JPY': 110,
    'HKD': 7.8,
  },
  'CNY': {
    'USD': 0.139,  // 1/7.2
    'EUR': 0.118,  // 0.85/7.2
    'GBP': 0.104,  // 0.75/7.2
    'JPY': 15.28,  // 110/7.2
    'HKD': 1.08,   // 7.8/7.2
  },
  'EUR': {
    'USD': 1.18,   // 1/0.85
    'CNY': 8.47,   // 7.2/0.85
    'GBP': 0.88,
    'JPY': 129,
    'HKD': 9.18,
  }
};

interface ExchangeRateCache {
  [key: string]: {
    rate: number;
    lastUpdated: number;
    source: string;
  };
}

// 汇率缓存，避免频繁API调用
let exchangeRateCache: ExchangeRateCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

/**
 * 从固定汇率表获取汇率（降级方案）
 */
function getFallbackExchangeRate(baseCurrency: string, targetCurrency: string): { rate: number; source: string; lastUpdated: string } | null {
  const base = baseCurrency.toUpperCase();
  const target = targetCurrency.toUpperCase();
  
  // 相同货币直接返回1
  if (base === target) {
    return {
      rate: 1,
      source: 'same_currency',
      lastUpdated: new Date().toISOString(),
    };
  }

  const rate = FALLBACK_EXCHANGE_RATES[base]?.[target];
  
  if (rate) {
    return {
      rate,
      source: 'fallback_fixed',
      lastUpdated: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * 获取汇率（带缓存和降级方案）
 */
export async function getExchangeRate(
  baseCurrency: string, 
  targetCurrency: string
): Promise<{ rate: number; source: string; lastUpdated: string } | null> {
  const cacheKey = `${baseCurrency.toUpperCase()}_${targetCurrency.toUpperCase()}`;
  const now = Date.now();

  // 检查缓存
  if (exchangeRateCache[cacheKey]) {
    const cached = exchangeRateCache[cacheKey];
    if (now - cached.lastUpdated < CACHE_DURATION) {
      console.log(`📋 使用缓存汇率: ${baseCurrency} -> ${targetCurrency} = ${cached.rate}`);
      return {
        rate: cached.rate,
        source: cached.source,
        lastUpdated: new Date(cached.lastUpdated).toISOString(),
      };
    }
  }

  // 尝试从数据库获取汇率
  try {
    const response = await fetch(
      `/api/exchange-rates?base_currency=${baseCurrency.toUpperCase()}&target_currency=${targetCurrency.toUpperCase()}`,
      { 
        next: { revalidate: 300 }, // 5分钟缓存
        cache: 'force-cache' 
      }
    );

    if (response.ok) {
      const data = await response.json();

      if (data && typeof data.rate === 'number') {
        // 更新缓存
        exchangeRateCache[cacheKey] = {
          rate: data.rate,
          lastUpdated: now,
          source: data.source || 'database',
        };

        console.log(`🌐 从数据库获取汇率: ${baseCurrency} -> ${targetCurrency} = ${data.rate} (${data.source})`);

        return {
          rate: data.rate,
          source: data.source || 'database',
          lastUpdated: data.last_updated || new Date().toISOString(),
        };
      }
    }

    // 数据库查询失败，使用降级方案
    console.warn(`⚠️ 数据库汇率查询失败 (${response.status}), 使用固定汇率降级`);
    
  } catch (error) {
    console.warn(`❌ 数据库汇率查询异常，使用固定汇率降级:`, error);
  }

  // 使用固定汇率降级方案
  const fallbackRate = getFallbackExchangeRate(baseCurrency, targetCurrency);
  if (fallbackRate) {
    // 更新缓存
    exchangeRateCache[cacheKey] = {
      rate: fallbackRate.rate,
      lastUpdated: now,
      source: fallbackRate.source,
    };

    console.log(`🔄 使用固定汇率: ${baseCurrency} -> ${targetCurrency} = ${fallbackRate.rate}`);
    return fallbackRate;
  }

  console.error(`❌ 汇率未找到: ${baseCurrency} -> ${targetCurrency}`);
  return null;
}

/**
 * 批量获取汇率
 */
export async function getBatchExchangeRates(
  baseCurrency: string,
  targetCurrencies: string[]
): Promise<Record<string, { rate: number; source: string; lastUpdated: string }>> {
  const results: Record<string, { rate: number; source: string; lastUpdated: string }> = {};

  // 并发获取所有汇率
  const promises = targetCurrencies.map(async (targetCurrency) => {
    const result = await getExchangeRate(baseCurrency, targetCurrency);
    if (result) {
      results[targetCurrency.toUpperCase()] = result;
    }
  });

  await Promise.all(promises);
  return results;
}

/**
 * 货币转换
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<{ convertedAmount: number; rate: number; source: string } | null> {
  // 相同货币直接返回
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
    return {
      convertedAmount: amount,
      rate: 1,
      source: 'same_currency',
    };
  }

  const exchangeRate = await getExchangeRate(fromCurrency, toCurrency);
  if (!exchangeRate) {
    return null;
  }

  const convertedAmount = amount * exchangeRate.rate;

  console.log(`💱 货币转换: ${amount} ${fromCurrency} = ${convertedAmount.toFixed(6)} ${toCurrency} (汇率: ${exchangeRate.rate})`);

  return {
    convertedAmount,
    rate: exchangeRate.rate,
    source: exchangeRate.source,
  };
}

/**
 * 获取所有可用汇率（优先数据库，降级到固定汇率）
 */
export async function getAllExchangeRates(baseCurrency?: string): Promise<Array<{
  base_currency: string;
  target_currency: string;
  rate: number;
  source: string;
  last_updated: string;
}>> {
  try {
    const url = baseCurrency 
      ? `/api/exchange-rates?base_currency=${baseCurrency.toUpperCase()}`
      : '/api/exchange-rates';

    const response = await fetch(url, { 
      next: { revalidate: 300 }, // 5分钟缓存
      cache: 'force-cache' 
    });

    if (response.ok) {
      const data = await response.json();
      return data.exchangeRates || [];
    }

  } catch (error) {
    console.error('获取数据库汇率失败，使用固定汇率:', error);
  }

  // 降级到固定汇率
  const rates: Array<{
    base_currency: string;
    target_currency: string;
    rate: number;
    source: string;
    last_updated: string;
  }> = [];

  const now = new Date().toISOString();

  Object.entries(FALLBACK_EXCHANGE_RATES).forEach(([base, targets]) => {
    if (!baseCurrency || base === baseCurrency.toUpperCase()) {
      Object.entries(targets).forEach(([target, rate]) => {
        rates.push({
          base_currency: base,
          target_currency: target,
          rate,
          source: 'fallback_fixed',
          last_updated: now,
        });
      });
    }
  });

  return rates;
}

/**
 * 清除汇率缓存
 */
export function clearExchangeRateCache(): void {
  exchangeRateCache = {};
  console.log('🧹 汇率缓存已清除');
}

/**
 * 获取缓存状态
 */
export function getExchangeRateCacheStatus(): {
  cacheSize: number;
  cacheKeys: string[];
  oldestEntry?: { key: string; age: number };
} {
  const keys = Object.keys(exchangeRateCache);
  const now = Date.now();
  
  let oldestEntry: { key: string; age: number } | undefined;
  
  keys.forEach(key => {
    const age = now - exchangeRateCache[key].lastUpdated;
    if (!oldestEntry || age > oldestEntry.age) {
      oldestEntry = { key, age };
    }
  });

  return {
    cacheSize: keys.length,
    cacheKeys: keys,
    oldestEntry,
  };
}

// 导出常用汇率常量
export const COMMON_RATES = {
  USD_TO_CNY: 7.2,
  EUR_TO_CNY: 8.47,
  GBP_TO_CNY: 9.6,
  CNY_TO_USD: 0.139,
  CNY_TO_EUR: 0.118,
} as const; 