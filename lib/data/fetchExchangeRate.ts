import type { NextApiRequest, NextApiResponse } from "next";

/**
 * 获取人民币(CNY)到美元(USD)的最新汇率
 * @returns Promise<number> 最新汇率
 */
export async function fetchCnyToUsdRate(): Promise<number> {
  const res = await fetch("https://api.exchangerate.host/latest?base=CNY&symbols=USD");
  if (!res.ok) throw new Error("Failed to fetch exchange rate");
  const data = await res.json();
  return data.rates?.USD ?? 0;
} 