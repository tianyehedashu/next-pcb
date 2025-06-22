export interface ExchangeRate {
  id: number;
  base_currency: string;
  target_currency: string;
  rate: number;
  source: string | null;
  last_updated: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ExchangeRateHistory {
  id: number;
  base_currency: string;
  target_currency: string;
  old_rate: number | null;
  new_rate: number;
  source: string | null;
  changed_at: string;
  changed_by: string | null;
  reason: string | null;
}

export interface ExchangeRateCreateInput {
  base_currency: string;
  target_currency: string;
  rate: number;
  source?: string;
  is_active?: boolean;
}

export interface ExchangeRateUpdateInput {
  rate?: number;
  source?: string;
  is_active?: boolean;
}

export interface ExternalExchangeRateResponse {
  success: boolean;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
];

export const EXCHANGE_RATE_SOURCES = [
  { value: 'manual', label: 'Manual Input' },
  { value: 'api_fixer', label: 'Fixer.io API' },
  { value: 'api_exchangerate', label: 'ExchangeRate-API' },
  { value: 'api_currencylayer', label: 'CurrencyLayer API' },
] as const;

export type ExchangeRateSource = typeof EXCHANGE_RATE_SOURCES[number]['value']; 