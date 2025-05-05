import type { NextApiRequest, NextApiResponse } from "next";

/**
 * 获取人民币(CNY)到美元(USD)的最新汇率
 * @returns Promise<number> 最新汇率
 */
export async function fetchCnyToUsdRate(): Promise<number> {
  const res = await fetch("https://api.exchangerate.host/latest?base=CNY&symbols=USD");
  if (!res.ok) return 0.14;
  const data = await res.json();
  const rate = data && data.rates && data.rates.USD;
  if (rate && rate > 0) return rate;
  return 0.14;
} 