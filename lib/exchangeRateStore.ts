import { create } from "zustand";
import { fetchCnyToUsdRate } from "@/lib/data/fetchExchangeRate";

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
    const { loading, setCnyToUsd, } = get();
    if (loading) return; // Avoid multiple fetches

    set({ loading: true, error: null });

    try {
      const rate = await fetchCnyToUsdRate();
      console.log('fetchCnyToUsdRate result:', rate);
      if (rate && rate > 0) {
        setCnyToUsd(rate);
      } else {
        set({ error: "Invalid rate fetched or rate is 0.", cnyToUsd: 0.14 }); // fallback
      }
    } catch (e: unknown) {
      console.error('Failed to fetch rate:', e);
      set({ error: e instanceof Error ? e.message : "Failed to fetch rate", cnyToUsd: 0.14 }); // fallback
    } finally {
      set({ loading: false });
    }
  },
})); 