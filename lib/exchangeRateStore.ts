import { create } from "zustand";
import { getExchangeRate } from "@/lib/services/exchange-rate-service";

interface ExchangeRateState {
  cnyToUsd: number;
  loading: boolean;
  error: string | null;
  setCnyToUsd: (rate: number) => void;
  fetchCnyToUsd: () => Promise<void>;
}

export const useExchangeRateStore = create<ExchangeRateState>((set, get) => ({
  cnyToUsd: 0.14, // 默认值
  loading: false,
  error: null,
  setCnyToUsd: (rate) => set({ cnyToUsd: rate }),
  fetchCnyToUsd: async () => {
    if (get().loading) return;

    set({ loading: true, error: null });

    try {
      // Use the new standardized service
      const result = await getExchangeRate('CNY', 'USD');
      
      if (result && typeof result.rate === 'number') {
        set({ cnyToUsd: result.rate });
      } else {
        const errorMessage = "Failed to fetch valid CNY to USD rate from internal service.";
        console.error(errorMessage, result);
        set({ error: errorMessage, cnyToUsd: 0.14 }); // fallback
      }
    } catch (e: unknown) {
      console.error('Failed to fetch rate via getExchangeRate:', e);
      set({ error: e instanceof Error ? e.message : "Failed to fetch rate", cnyToUsd: 0.14 }); // fallback
    } finally {
      set({ loading: false });
    }
  },
})); 