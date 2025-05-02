// 表单校验和动态必填规则提取

export const countryRequiresTaxId = (country: string) => [
  "BR", "RU", "KR", "TR", "IN", "ID", "UA", "BY", "KZ", "UZ", "EG", "SA", "AE", "IR", "IQ", "VN", "TH", "PH", "MY", "SG", "TW", "HK", "MO", "CN", "JP", "DE", "FR", "IT", "ES", "GB", "PL", "NL", "BE", "SE", "FI", "NO", "DK", "CZ", "SK", "HU", "AT", "CH", "PT", "IE", "GR", "RO", "BG", "HR", "SI", "LT", "LV", "EE"
].includes(country);

export const countryRequiresPersonalId = (country: string) => ["BR", "RU", "KR"].includes(country);

export interface QuoteConfirmForm {
  country: string;
  state: string;
  city: string;
  zip: string;
  phone: string;
  email: string;
  address: string;
  courier: string;
  pcbFile: File | null;
  gerberUrl?: string;
  declarationMethod: string;
  taxId: string;
  personalId: string;
  purpose: string;
  declaredValue: string;
  companyName?: string;
  customsNote?: string;
  pcbNote?: string;
  userNote?: string;
}

// 国际电话号码合法性校验（E.164标准，允许+，空格，7-15位数字）
export function isValidInternationalPhone(phone: string): boolean {
  // 允许+开头，后面7-15位数字，可有空格
  // ^\+(?:[0-9] ?){6,14}[0-9]$
  return /^\+(?:[0-9] ?){6,14}[0-9]$/.test(phone.trim());
}

export function checkQuoteConfirmRequired(form: QuoteConfirmForm, setError: (msg: string) => void, quote?: any) {
  if (!form.country) { setError("Please select your country."); return false; }
  if (!form.state) { setError("Please select your state/province."); return false; }
  if (!form.city) { setError("Please select your city."); return false; }
  if (!form.zip) { setError("Please enter your zip/postal code."); return false; }
  if (!form.phone) { setError("Please enter your phone number."); return false; }
  if (!isValidInternationalPhone(form.phone)) { setError("Please enter a valid international phone number, e.g. +12345678901"); return false; }
  if (!form.email) { setError("Please enter your email address."); return false; }
  if (!form.address) { setError("Please enter your detailed address."); return false; }
  if (!form.courier) { setError("Please select your courier."); return false; }
  if (!form.pcbFile && !(form.gerberUrl || quote?.gerber?.url)) { setError("Please upload your PCB file."); return false; }
  if (!form.declarationMethod) { setError("Please select declaration method."); return false; }
  if (form.declarationMethod !== "dutyfree" && countryRequiresTaxId(form.country) && !form.taxId) { setError("Please enter your Tax ID."); return false; }
  if (countryRequiresPersonalId(form.country) && !form.personalId) { setError("Please enter your Personal ID."); return false; }
  if (form.declarationMethod !== "dutyfree" && !form.purpose) { setError("Please select purpose."); return false; }
  if (form.declarationMethod !== "dutyfree" && !form.declaredValue) { setError("Please enter declared value."); return false; }
  return true;
} 