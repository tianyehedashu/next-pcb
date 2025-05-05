import { create } from "zustand";

interface ExchangeRateState {
  cnyToUsd: number;
  setCnyToUsd: (rate: number) => void;
}

export const useExchangeRateStore = create<ExchangeRateState>((set) => ({
  cnyToUsd: 0.14, // 默认值
  setCnyToUsd: (rate) => set({ cnyToUsd: rate }),
})); 