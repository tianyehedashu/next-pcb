import { ExternalExchangeRateResponse } from '@/types/exchange-rate';

interface ExchangeRateAPIConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  freeTier: boolean;
  rateLimit: string;
}

// 外部汇率API配置
const EXCHANGE_RATE_APIS: Record<string, ExchangeRateAPIConfig> = {
  exchangerate_api: {
    name: 'ExchangeRate-API',
    baseUrl: 'https://api.exchangerate-api.com/v4/latest',
    freeTier: true,
    rateLimit: '1500 requests/month (free)',
  },
  fixer: {
    name: 'Fixer.io',
    baseUrl: 'https://api.fixer.io/latest',
    apiKey: process.env.FIXER_API_KEY,
    freeTier: true,
    rateLimit: '100 requests/month (free)',
  },
  currencylayer: {
    name: 'CurrencyLayer',
    baseUrl: 'https://api.currencylayer.com/live',
    apiKey: process.env.CURRENCYLAYER_API_KEY,
    freeTier: true,
    rateLimit: '1000 requests/month (free)',
  },
};

/**
 * 从 ExchangeRate-API 获取汇率 (免费，无需API Key)
 */
async function fetchFromExchangeRateAPI(baseCurrency: string): Promise<ExternalExchangeRateResponse> {
  const url = `${EXCHANGE_RATE_APIS.exchangerate_api.baseUrl}/${baseCurrency}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'NextPCB/1.0',
      },
      next: { revalidate: 3600 }, // 缓存1小时
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      base: data.base,
      date: data.date,
      rates: data.rates,
    };
  } catch (error) {
    console.error('ExchangeRate-API 请求失败:', error);
    throw new Error(`ExchangeRate-API 请求失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 从 Fixer.io 获取汇率 (需要API Key)
 */
async function fetchFromFixerIO(baseCurrency: string): Promise<ExternalExchangeRateResponse> {
  const config = EXCHANGE_RATE_APIS.fixer;
  
  if (!config.apiKey) {
    throw new Error('Fixer.io API Key 未配置');
  }

  const url = `${config.baseUrl}?access_key=${config.apiKey}&base=${baseCurrency}`;
  
  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // 缓存1小时
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Fixer.io API 错误: ${data.error?.info || 'Unknown error'}`);
    }
    
    return {
      success: true,
      base: data.base,
      date: data.date,
      rates: data.rates,
    };
  } catch (error) {
    console.error('Fixer.io 请求失败:', error);
    throw new Error(`Fixer.io 请求失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 从 CurrencyLayer 获取汇率 (需要API Key)
 */
async function fetchFromCurrencyLayer(baseCurrency: string): Promise<ExternalExchangeRateResponse> {
  const config = EXCHANGE_RATE_APIS.currencylayer;
  
  if (!config.apiKey) {
    throw new Error('CurrencyLayer API Key 未配置');
  }

  const url = `${config.baseUrl}?access_key=${config.apiKey}&source=${baseCurrency}`;
  
  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // 缓存1小时
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`CurrencyLayer API 错误: ${data.error?.info || 'Unknown error'}`);
    }
    
    // CurrencyLayer 返回格式需要转换
    const rates: Record<string, number> = {};
    Object.entries(data.quotes).forEach(([key, value]) => {
      const targetCurrency = key.substring(3); // 去掉前缀 (如 USDCNY -> CNY)
      rates[targetCurrency] = value as number;
    });
    
    return {
      success: true,
      base: data.source,
      date: new Date(data.timestamp * 1000).toISOString().split('T')[0],
      rates,
    };
  } catch (error) {
    console.error('CurrencyLayer 请求失败:', error);
    throw new Error(`CurrencyLayer 请求失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 获取外部汇率数据
 */
export async function fetchExternalExchangeRates(
  baseCurrency: string,
  source: 'api_exchangerate' | 'api_fixer' | 'api_currencylayer' = 'api_exchangerate'
): Promise<ExternalExchangeRateResponse> {
  console.log(`🌐 正在从 ${source} 获取 ${baseCurrency} 汇率...`);

  try {
    let result: ExternalExchangeRateResponse;

    switch (source) {
      case 'api_exchangerate':
        result = await fetchFromExchangeRateAPI(baseCurrency);
        break;
      case 'api_fixer':
        result = await fetchFromFixerIO(baseCurrency);
        break;
      case 'api_currencylayer':
        result = await fetchFromCurrencyLayer(baseCurrency);
        break;
      default:
        throw new Error(`不支持的汇率源: ${source}`);
    }

    console.log(`✅ 成功获取汇率数据:`, {
      source,
      base: result.base,
      date: result.date,
      rateCount: Object.keys(result.rates).length,
    });

    return result;
  } catch (error) {
    console.error(`❌ 获取外部汇率失败:`, error);
    throw error;
  }
}

/**
 * 获取可用的汇率API配置
 */
export function getAvailableExchangeRateAPIs(): Array<ExchangeRateAPIConfig & { id: string }> {
  return Object.entries(EXCHANGE_RATE_APIS).map(([id, config]) => ({
    id,
    ...config,
  }));
}

/**
 * 检查API配置状态
 */
export function checkAPIConfiguration(): Record<string, { available: boolean; reason?: string }> {
  return {
    api_exchangerate: {
      available: true,
      reason: '免费API，无需配置',
    },
    api_fixer: {
      available: !!EXCHANGE_RATE_APIS.fixer.apiKey,
      reason: EXCHANGE_RATE_APIS.fixer.apiKey ? undefined : '需要配置 FIXER_API_KEY 环境变量',
    },
    api_currencylayer: {
      available: !!EXCHANGE_RATE_APIS.currencylayer.apiKey,
      reason: EXCHANGE_RATE_APIS.currencylayer.apiKey ? undefined : '需要配置 CURRENCYLAYER_API_KEY 环境变量',
    },
  };
} 