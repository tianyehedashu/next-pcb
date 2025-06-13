/**
 * Fetches the latest exchange rate from Chinese Yuan (CNY) to US Dollar (USD).
 * @returns {Promise<number>} The latest exchange rate.
 */
export async function fetchCnyToUsdRate(): Promise<number> {
  const res = await fetch("https://api.exchangerate-api.com/v4/latest/CNY");
  if (!res.ok) return 0.14;
  const data = await res.json();
  const rate = data?.rates?.USD;
  if (rate && rate > 0) return rate;
  return 0.14;
} 