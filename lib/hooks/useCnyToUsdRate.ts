import { useEffect, useState } from "react";
import { fetchCnyToUsdRate } from "@/lib/data/fetchExchangeRate";

/**
 * 获取最新CNY->USD汇率，内部有状态，只有调用时才请求
 */
export function useCnyToUsdRate() {
  const [rate, setRate] = useState<number>(0.14); // 默认值
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchCnyToUsdRate()
      .then((r) => {
        console.log('fetchCnyToUsdRate result:', r);
        setRate(r && r > 0 ? r : 0.14); // 兜底
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || "Failed to fetch rate");
        setLoading(false);
      });
  }, []);

  return { rate, loading, error };
} 