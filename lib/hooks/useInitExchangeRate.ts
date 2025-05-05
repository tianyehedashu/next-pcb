import { useEffect } from "react";
import { fetchCnyToUsdRate } from "@/lib/data/fetchExchangeRate";
import { useExchangeRateStore } from "@/lib/exchangeRateStore";

/**
 * 页面/应用启动时自动拉取一次汇率并存入store
 * 只需在_app/layout等顶层组件调用一次即可
 */
export function useInitExchangeRate() {
  useEffect(() => {
    fetchCnyToUsdRate().then((rate) => {
      useExchangeRateStore.getState().setCnyToUsd(rate);
    });
  }, []);
} 