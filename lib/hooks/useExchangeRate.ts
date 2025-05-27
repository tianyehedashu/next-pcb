import { useExchangeRateStore } from '@/lib/exchangeRateStore';

export function useExchangeRate() {
  const cnyToUsdRate = useExchangeRateStore(state => state.cnyToUsd);
  const loading = useExchangeRateStore(state => state.loading);
  const error = useExchangeRateStore(state => state.error);
  // fetchCnyToUsd action is now accessed directly from the store if needed

  return {
    cnyToUsdRate,
    loading,
    error,
  };
} 