import { AddressFormValue } from "@/app/quote2/components/AddressFormComponent";

/**
 * 格式化地址显示文本
 */
export function formatAddressDisplay(address: AddressFormValue): {
  fullAddress: string;
  shortAddress: string;
  countryDisplay: string;
  stateDisplay: string;
  cityDisplay: string;
  courierDisplay: string;
} {
  const countryDisplay = address.countryName || address.country;
  const stateDisplay = address.stateName || address.state;
  const cityDisplay = address.cityName || address.city;
  const courierDisplay = address.courierName || address.courier || '';

  const shortAddress = `${cityDisplay}, ${stateDisplay} ${address.zipCode}`;
  const fullAddress = `${address.address}, ${shortAddress}, ${countryDisplay}`;

  return {
    fullAddress,
    shortAddress,
    countryDisplay,
    stateDisplay,
    cityDisplay,
    courierDisplay
  };
}

/**
 * 获取国家名称（去除表情符号）
 */
export function getCountryName(countryCode: string, countryName?: string): string {
  if (countryName) return countryName;
  
  // 国家代码到名称的映射
  const countryMap: Record<string, string> = {
    'US': 'United States',
    'CN': 'China',
    'JP': 'Japan',
    'DE': 'Germany',
    'GB': 'United Kingdom',
    'FR': 'France',
    'IT': 'Italy',
    'ES': 'Spain',
    'NL': 'Netherlands',
    'BE': 'Belgium',
    'CH': 'Switzerland',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland',
    'CA': 'Canada',
    'AU': 'Australia',
    'KR': 'South Korea',
    'SG': 'Singapore',
    'IN': 'India',
    'BR': 'Brazil',
    'RU': 'Russia',
    'MX': 'Mexico',
    'AT': 'Austria',
    'BG': 'Bulgaria',
    'HR': 'Croatia',
    'CY': 'Cyprus',
    'CZ': 'Czechia',
    'EE': 'Estonia',
    'GR': 'Greece',
    'HU': 'Hungary',
    'IE': 'Ireland',
    'LV': 'Latvia',
    'LT': 'Lithuania',
    'LU': 'Luxembourg',
    'MT': 'Malta',
    'PL': 'Poland',
    'PT': 'Portugal',
    'RO': 'Romania',
    'SK': 'Slovakia',
    'SI': 'Slovenia',
  };
  
  return countryMap[countryCode] || countryCode;
}

/**
 * 获取快递公司显示名称
 */
export function getCourierName(courierCode: string, courierName?: string): string {
  if (courierName) return courierName;
  
  const courierMap: Record<string, string> = {
    'dhl': 'DHL',
    'fedex': 'FedEx',
    'ups': 'UPS',
  };
  
  return courierMap[courierCode] || courierCode;
} 