"use client";

import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { useQuoteStore } from "@/lib/quoteStore";
import { calcProductionCycle, getRealDeliveryDate } from "@/lib/pcb-calc";
import { calcPcbPriceV2 } from "@/lib/pcb-calc-v2";
import { calculateShippingCost, shippingZones } from "@/lib/shipping-calculator";
import { calculateCustomsFee } from "@/lib/customs-fee";
import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useUserStore } from "@/lib/userStore";
import FileUpload from "@/app/components/custom-ui/FileUpload";
import { useExchangeRate } from "@/lib/hooks/useExchangeRate";
import type { PcbQuoteForm } from "@/types/pcbQuoteForm";

// OptionType 类型定义
export type OptionType = { value: string; label: string };
const ReactSelect = dynamic(() => import("react-select"), { ssr: false });

// 去重，保留第一个 iso2 出现的项
const COUNTRY_LIST = [
  { iso2: 'US', name: 'United States', emoji: '🇺🇸', geonameId: 6252001 },
  { iso2: 'CN', name: 'China', emoji: '🇨🇳', geonameId: 1814991 },
  { iso2: 'JP', name: 'Japan', emoji: '🇯🇵', geonameId: 1861060 },
  { iso2: 'DE', name: 'Germany', emoji: '🇩🇪', geonameId: 2921044 },
  { iso2: 'GB', name: 'United Kingdom', emoji: '🇬🇧', geonameId: 2635167 },
  { iso2: 'FR', name: 'France', emoji: '🇫🇷', geonameId: 3017382 },
  { iso2: 'IT', name: 'Italy', emoji: '🇮🇹', geonameId: 3175395 },
  { iso2: 'ES', name: 'Spain', emoji: '🇪🇸', geonameId: 2510769 },
  { iso2: 'NL', name: 'Netherlands', emoji: '🇳🇱', geonameId: 2750405 },
  { iso2: 'BE', name: 'Belgium', emoji: '🇧🇪', geonameId: 2802361 },
  { iso2: 'CH', name: 'Switzerland', emoji: '🇨🇭', geonameId: 2658434 },
  { iso2: 'SE', name: 'Sweden', emoji: '🇸🇪', geonameId: 2661886 },
  { iso2: 'NO', name: 'Norway', emoji: '🇳🇴', geonameId: 3144096 },
  { iso2: 'DK', name: 'Denmark', emoji: '🇩🇰', geonameId: 2623032 },
  { iso2: 'FI', name: 'Finland', emoji: '🇫🇮', geonameId: 660013 },
  { iso2: 'CA', name: 'Canada', emoji: '🇨🇦', geonameId: 6251999 },
  { iso2: 'AU', name: 'Australia', emoji: '🇦🇺', geonameId: 2077456 },
  { iso2: 'KR', name: 'South Korea', emoji: '🇰🇷', geonameId: 1835841 },
  { iso2: 'SG', name: 'Singapore', emoji: '🇸🇬', geonameId: 1880251 },
  { iso2: 'IN', name: 'India', emoji: '🇮🇳', geonameId: 1269750 },
  { iso2: 'BR', name: 'Brazil', emoji: '🇧🇷', geonameId: 3469034 },
  { iso2: 'RU', name: 'Russia', emoji: '🇷🇺', geonameId: 2017370 },
  { iso2: 'MX', name: 'Mexico', emoji: '🇲🇽', geonameId: 3996063 },
  // 欧盟成员国（去除已在上方出现的重复项）
  { iso2: 'AT', name: 'Austria', emoji: '🇦🇹', geonameId: 2782113 },
  { iso2: 'BG', name: 'Bulgaria', emoji: '🇧🇬', geonameId: 732800 },
  { iso2: 'HR', name: 'Croatia', emoji: '🇭🇷', geonameId: 3202326 },
  { iso2: 'CY', name: 'Cyprus', emoji: '🇨🇾', geonameId: 146669 },
  { iso2: 'CZ', name: 'Czechia', emoji: '🇨🇿', geonameId: 3077311 },
  { iso2: 'EE', name: 'Estonia', emoji: '🇪🇪', geonameId: 453733 },
  { iso2: 'GR', name: 'Greece', emoji: '🇬🇷', geonameId: 390903 },
  { iso2: 'HU', name: 'Hungary', emoji: '🇭🇺', geonameId: 719819 },
  { iso2: 'IE', name: 'Ireland', emoji: '🇮🇪', geonameId: 2963597 },
  { iso2: 'LV', name: 'Latvia', emoji: '🇱🇻', geonameId: 458258 },
  { iso2: 'LT', name: 'Lithuania', emoji: '🇱🇹', geonameId: 597427 },
  { iso2: 'LU', name: 'Luxembourg', emoji: '🇱🇺', geonameId: 2960313 },
  { iso2: 'MT', name: 'Malta', emoji: '🇲🇹', geonameId: 2562770 },
  { iso2: 'PL', name: 'Poland', emoji: '🇵🇱', geonameId: 798544 },
  { iso2: 'PT', name: 'Portugal', emoji: '🇵🇹', geonameId: 2264397 },
  { iso2: 'RO', name: 'Romania', emoji: '🇷🇴', geonameId: 798549 },
  { iso2: 'SK', name: 'Slovakia', emoji: '🇸🇰', geonameId: 3057568 },
  { iso2: 'SI', name: 'Slovenia', emoji: '🇸🇮', geonameId: 3190538 },
];

// useGeoOptions hook
// GeoNames 省/州类型
type GeoNamesState = {
  geonameId: number;
  name: string;
  adminCodes1?: { ISO3166_2?: string };
  adminCode1?: string;
};
// GeoNames 城市类型
type GeoNamesCity = {
  geonameId: number;
  name: string;
};

function useGeoOptions(country: string, province: string) {
  const [states, setStates] = useState<OptionType[]>([]);
  const [cities, setCities] = useState<OptionType[]>([]);
  const geonamesUser = "leodennis"; // TODO: 替换为你的 GeoNames 用户名

  // 通过 iso2 获取 geonameId
  function getCountryGeonameId(iso2: string): number | undefined {
    return COUNTRY_LIST.find(c => c.iso2 === iso2)?.geonameId;
  }

  useEffect(() => {
    if (!country) { setStates([]); return; }
    const geonameId = getCountryGeonameId(country);
    if (!geonameId) { setStates([]); return; }
    fetch(`https://secure.geonames.org/childrenJSON?geonameId=${geonameId}&username=${geonamesUser}`)
      .then(res => res.json())
      .then(data => setStates(
        Array.isArray(data.geonames)
          ? data.geonames.map((s: GeoNamesState) => ({
              value: s.adminCode1 || String(s.geonameId),
              label: s.name
            }))
          : []
      ));
  }, [country]);

  useEffect(() => {
    if (!country || !province) { setCities([]); return; }
    fetch(`https://secure.geonames.org/searchJSON?country=${country}&adminCode1=${province}&featureClass=P&maxRows=1000&username=${geonamesUser}`)
      .then(res => res.json())
      .then(data => setCities(
        Array.isArray(data.geonames)
          ? data.geonames.map((c: GeoNamesCity) => ({
              value: String(c.geonameId),
              label: c.name
            }))
          : []
      ));
  }, [country, province]);
  return { states, cities };
}

// useAutoSaveForm hook
function useAutoSaveForm<T>(form: T, save: (f: T) => void) {
  useEffect(() => { save(form); }, [form, save]);
}

// validateQuoteForm 工具
function validateQuoteForm(form: PcbQuoteForm): string | null {
  if (!form.shippingAddress.country) return "Country required";
  if (!form.shippingAddress.courier) return "Courier required";
  // ...其它校验
  return null;
}

// 前缀匹配函数
const prefixFilterOption = (option: { label: string; value: string }, input: string) => {
  return option.label.toLowerCase().startsWith(input.toLowerCase());
};

export default function QuoteConfirmPage() {
  const router = useRouter();
  const { form: quote, clearForm, setForm: setQuoteForm } = useQuoteStore();
  const [form, setForm] = useState<PcbQuoteForm>(quote);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const user = useUserStore(state => state.user);

  // 自动保存到全局 quote store
  useAutoSaveForm<PcbQuoteForm>(form, setQuoteForm);

  // 地理选项
  const { states, cities } = useGeoOptions(form.shippingAddress.country, form.shippingAddress.province);

  // 汇率
  const { cnyToUsdRate, loading: rateLoading } = useExchangeRate();
  const toUSD = (cny: number) => cnyToUsdRate && cnyToUsdRate > 0 ? cny * cnyToUsdRate : 0;

  // PCB价格等
  const pcbPrice = quote ? calcPcbPriceV2(quote).total : 0;
  const productionCycle = quote ? calcProductionCycle(quote).cycleDays : null;
  const estimatedFinishDate = productionCycle ? getRealDeliveryDate(new Date(), productionCycle) : null;
  const shipping = quote && form.shippingAddress.country && form.shippingAddress.courier && form.shippingAddress.zipCode
    ? calculateShippingCost(form).finalCost
    : 0;
  const declaredValueNumber = form.customs?.declaredValue !== undefined && form.customs?.declaredValue !== "" ? Number(form.customs?.declaredValue) : 0;
  const customs = calculateCustomsFee({
    country: form.shippingAddress.country,
    declarationMethod: typeof form.customs?.declarationMethod === 'string' ? form.customs.declarationMethod : "",
    courier: form.shippingAddress.courier ?? "",
    declaredValue: declaredValueNumber,
    pcbType: quote?.pcbType || undefined,
  })?.total ?? 0;
  const total = pcbPrice + shipping + customs;

  // 提交
  const handleFinalSubmit = async () => {
    setError("");
    const err = validateQuoteForm(form);
    if (err) { setError(err); return; }
    setLoading(true);
    // 1. 上传 PCB 文件
    let pcbFileUrl = "";
    if (form.gerber) {
      const { data, error: uploadError } = await supabase.storage
        .from("next-pcb")
        .upload(`pcb_${Date.now()}_${form.gerber.name}`, form.gerber);
        
      if (uploadError) {
        setError("Failed to upload PCB file.");
        setLoading(false);
        return;
      }
      pcbFileUrl = data?.path || "";
      // 上传成功后，更新 quote 里的 gerberUrl
      setQuoteForm({ ...quote, gerberUrl: pcbFileUrl });
    } 
    // 2. 上传地址信息
    let addressId = null;
    const { data: addressData, error: addressError } = await supabase
      .from("addresses")
      .insert([
        {
          ...form.shippingAddress,
          zip: form.shippingAddress.zipCode,
          email: user?.email,
          note: form.userNote,
          user_id: user?.id || null,
        },
      ])
      .select()
      .single();
    if (addressError) {
      setError("Failed to save address.");
      setLoading(false);
      return;
    }
    addressId = addressData.id;
    // 3. 上传报关信息
    let customsId = null;
    const { data: customsData, error: customsError } = await supabase
      .from("customs_declarations")
      .insert([
        {
          declaration_method: form.customs?.declarationMethod,
          company_name: form.customs?.companyName,
          tax_id: form.customs?.taxId,
          personal_id: form.customs?.personalId,
          incoterm: '',
          purpose: form.customs?.purpose,
          declared_value: form.customs?.declaredValue ? Number(form.customs?.declaredValue) : null,
          customs_note: form.customs?.customsNote,
          user_id: user?.id || null,
        },
      ])
      .select()
      .single();
    if (customsError) {
      setError("Failed to save customs info.");
      setLoading(false);
      return;
    }
    customsId = customsData.id;
    // 4. 上传订单主信息
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          user_id: user?.id,
          address_id: addressId,
          customs_id: customsId,
          pcb_spec: quote,
          gerber_file_url: pcbFileUrl,
          courier: form.shippingAddress.courier ?? "",
          price: pcbPrice,
          shipping_cost: shipping,
          customs_fee: customs,
          total,
          pcb_price: pcbPrice,
          production_cycle: productionCycle,
          estimated_finish_date: estimatedFinishDate ? estimatedFinishDate.toISOString().slice(0, 10) : null,
          pcb_note: form.pcbNote,
          user_note: form.userNote,
          status: "inquiry",
          admin_price: null,
          admin_note: null,
        },
      ])
      .select()
      .single();
    setLoading(false);
    if (orderError) {
      setError("Failed to submit order.");
      return;
    }
    clearForm();
    router.push(`/quote/orders/${orderData.id}`);
  };

  // 国家选项
  const SUPPORTED_COUNTRIES: string[] = Array.from(
    new Set(
      shippingZones.flatMap((z: typeof shippingZones[number]) => z.countries.map((c: string) => c.toUpperCase()))
    )
  );
  const countryOptions: OptionType[] = useMemo(() => {
    const exists = COUNTRY_LIST.some(c => c.iso2 === form.shippingAddress.country);
    let opts = COUNTRY_LIST
      .filter(c => SUPPORTED_COUNTRIES.includes(c.iso2))
      .map(c => ({ value: c.iso2, label: `${c.emoji ? c.emoji + " " : ""}${c.name}` }));
    if (form.shippingAddress.country && !exists && SUPPORTED_COUNTRIES.includes(form.shippingAddress.country)) {
      opts = [
        ...opts,
        { value: form.shippingAddress.country, label: form.shippingAddress.country }
      ];
    }
    return opts;
  }, [form.shippingAddress.country, SUPPORTED_COUNTRIES]);

  // select样式类型
  const selectStyles: Record<string, unknown> = {
    control: (base: Record<string, unknown>) => ({
      ...base,
      minHeight: 40,
      borderColor: "#cbd5e1",
      boxShadow: "none",
      '&:hover': { borderColor: "#3b82f6" },
    }),
    menu: (base: Record<string, unknown>) => ({
      ...base,
      zIndex: 9999,
    }),
  };


  if (!quote) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100 font-sans pt-16">
      <div className="container max-w-7xl mx-auto py-10 px-2 md:px-4">
        <div className="flex items-center gap-4 mt-2 mb-8">
          <Button
            variant="outline"
            onClick={() => router.push("/quote")}
            className="h-10"
          >
            ← Back
          </Button>
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-800 tracking-tight drop-shadow-sm">
            Order Confirmation
          </h1>
        </div>
        {/* 订单进度步骤条 */}
        <div className="mb-10">
          {/* OrderStepBar component would be rendered here */}
        </div>
        <div className="grid grid-cols-12 gap-8">
          {/* 左侧主要内容区域 */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            {/* PCB 规格信息 */}
            <Card className="shadow-lg border-blue-100 bg-white/90">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-xl font-bold text-blue-700">PCB Specifications</CardTitle>
              </CardHeader>
              <CardContent className="pt-2 pb-6 px-6">
                {/* PCB 文件上传区域 */}
                <div className="mb-2">
                  <FileUpload
                    value={form.gerber}
                    onChange={pcbFile => setForm(f => ({ ...f, pcbFile }))}
                    required
                  />
                  {!form.gerber && quote?.gerber && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-2 w-full mt-2">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                      <p className="text-sm text-blue-700 truncate font-medium">ℹ {quote.gerber.name}</p>
                    </div>
                  )}
                </div>
                {/* PCB参数信息 */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(quote).map(([k, v], index) => (
                    <div key={`quote-${k}-${index}`} className="space-y-1">
                      <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{k}</span>
                      <p className="text-base font-semibold text-gray-800">{String(v)}</p>
                    </div>
                  ))}
                </div>
                {/* 订单备注 */}
                <div className="mt-6">
                  <label className="text-sm font-semibold text-blue-700">User Note</label>
                  <Input className="mt-1" value={form.pcbNote} onChange={e => setForm(f => ({ ...f, pcbNote: e.target.value }))} placeholder="Enter any note for your PCB (optional)" />
                </div>
              </CardContent>
            </Card>
            {/* 收货地址 */}
            <Card className="shadow-lg border-blue-100 bg-white/90">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-xl font-bold text-blue-700">Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold text-blue-700">Country <span className="text-red-500">*</span></label>
                    <ReactSelect
                      className="mt-1"
                      isLoading={false}
                      isDisabled={false}
                      options={countryOptions}
                      value={countryOptions.find(opt => opt.value === form.shippingAddress.country) || null}
                      onChange={(option) => { setForm(f => ({ ...f, shippingAddress: { ...f.shippingAddress, country: (option as OptionType | null)?.value || "" } })); return void 0; }}
                      placeholder="Select Country"
                      isClearable
                      styles={selectStyles}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-blue-700">State/Province <span className="text-red-500">*</span></label>
                    <ReactSelect
                      className="mt-1"
                      isLoading={false}
                      isDisabled={!form.shippingAddress.country}
                      options={states}
                      value={states.find(opt => opt.value === form.shippingAddress.province) || null}
                      onChange={(option) => { setForm(f => ({ ...f, shippingAddress: { ...f.shippingAddress, province: (option as OptionType | null)?.value || "", city: "" } })); return void 0; }}
                      placeholder="Select State/Province"
                      isClearable
                      styles={selectStyles}
                      filterOption={prefixFilterOption}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-blue-700">City <span className="text-red-500">*</span></label>
                    <ReactSelect
                      className="mt-1"
                      isLoading={false}
                      isDisabled={!form.shippingAddress.province}
                      options={cities}
                      value={cities.find(opt => opt.value === form.shippingAddress.city) || null}
                      onChange={(option) => { setForm(f => ({ ...f, shippingAddress: { ...f.shippingAddress, city: (option as OptionType | null)?.value || "" } })); return void 0; }}
                      placeholder="Select City"
                      isClearable
                      styles={selectStyles}
                      filterOption={prefixFilterOption}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-blue-700">Zip/Postal Code <span className="text-red-500">*</span></label>
                    <Input className="mt-1" value={form.shippingAddress.zipCode || ""} onChange={e => setForm(f => ({ ...f, shippingAddress: { ...f.shippingAddress, zipCode: e.target.value } }))} placeholder="Enter zip/postal code" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-blue-700">Phone <span className="text-red-500">*</span></label>
                    <Input className="mt-1" value={form.shippingAddress.phone} onChange={e => setForm(f => ({ ...f, shippingAddress: { ...f.shippingAddress, phone: e.target.value } }))} placeholder="Enter phone number" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-blue-700">Name <span className="text-red-500">*</span></label>
                    <Input className="mt-1" value={form.shippingAddress.name} onChange={e => setForm(f => ({ ...f, shippingAddress: { ...f.shippingAddress, name: e.target.value } }))} placeholder="Enter recipient name" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-semibold text-blue-700">Detailed Address <span className="text-red-500">*</span></label>
                    <Input className="mt-1" value={form.shippingAddress.address} onChange={e => setForm(f => ({ ...f, shippingAddress: { ...f.shippingAddress, address: e.target.value } }))} placeholder="Enter your detailed address" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-semibold text-blue-700">Courier <span className="text-red-500">*</span></label>
                    <select className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-400" value={form.shippingAddress.courier ?? ""} onChange={e => setForm(f => ({ ...f, shippingAddress: { ...f.shippingAddress, courier: e.target.value as "dhl" | "fedex" | "ups" | "" } }))}>
                      <option key="default" value="">Select Courier</option>
                      <option key="dhl" value="dhl">DHL Express</option>
                      <option key="fedex" value="fedex">FedEx International</option>
                      <option key="ups" value="ups">UPS Worldwide</option>
                    </select>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-semibold text-blue-700">User Note</label>
                  <Input className="mt-1" value={form.userNote} onChange={e => setForm(f => ({ ...f, userNote: e.target.value }))} placeholder="Enter any note for your order (optional)" />
                </div>
              </CardContent>
            </Card>
            {/* 海关申报信息 */}
            <Card className="shadow-lg border-blue-100 bg-white/90 mt-8">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-xl font-bold text-blue-700">Customs Declaration Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold text-blue-700">Declaration Method <span className="text-red-500">*</span></label>
                    <Select value={form.customs?.declarationMethod} onValueChange={v => setForm(f => ({ ...f, customs: { ...f.customs, declarationMethod: v, purpose: "", declaredValue: "", taxId: "", personalId: "" } }))}>
                      <SelectTrigger className="mt-1" size="default">
                        <SelectValue placeholder="Select declaration method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self">Self-declare</SelectItem>
                        <SelectItem value="agent">Agent declare (by courier)</SelectItem>
                        <SelectItem value="dutyfree">Duty Free</SelectItem>
                        <SelectItem value="ddp">DDP (Delivered Duty Paid)</SelectItem>
                        <SelectItem value="dap">DAP (Delivered At Place)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.customs?.declarationMethod !== "dutyfree" && (
                    <>
                      <div>
                        <label className="text-sm font-semibold text-blue-700">Company Name (optional)</label>
                        <Input className="mt-1" value={form.customs?.companyName || ""} onChange={e => setForm(f => ({ ...f, customs: { ...f.customs, companyName: e.target.value } }))} placeholder="Enter company name" />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-blue-700">Tax ID / VAT ID / EORI</label>
                        <Input className="mt-1" value={form.customs?.taxId || ""} onChange={e => setForm(f => ({ ...f, customs: { ...f.customs, taxId: e.target.value } }))} placeholder="Enter tax or VAT ID" />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-blue-700">Personal ID / Passport No.</label>
                        <Input className="mt-1" value={form.customs?.personalId || ""} onChange={e => setForm(f => ({ ...f, customs: { ...f.customs, personalId: e.target.value } }))} placeholder="Enter personal ID or passport number" />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-blue-700">Purpose</label>
                        <Select value={form.customs?.purpose} onValueChange={v => setForm(f => ({ ...f, customs: { ...f.customs, purpose: v } }))}>
                          <SelectTrigger className="mt-1" size="default">
                            <SelectValue placeholder="Select purpose" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="personal">Personal</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                            <SelectItem value="sample">Sample</SelectItem>
                            <SelectItem value="gift">Gift</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-blue-700">Declared Value (USD)</label>
                        <Input className="mt-1" value={form.customs?.declaredValue || ""} onChange={e => setForm(f => ({ ...f, customs: { ...f.customs, declaredValue: e.target.value } }))} placeholder="Enter declared value" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-semibold text-blue-700">Customs Note</label>
                        <Input className="mt-1" value={form.customs?.customsNote || ""} onChange={e => setForm(f => ({ ...f, customs: { ...f.customs, customsNote: e.target.value } }))} placeholder="Any note for customs (optional)" />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          {/* 右侧订单摘要 */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <Card className="sticky top-24 shadow-xl border-blue-200 bg-gradient-to-br from-blue-100/80 via-white to-blue-50/80 max-w-xl w-full">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-xl font-bold text-blue-800">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">PCB Price</span>
                    <span className="text-lg font-bold text-blue-700">
                      {rateLoading || !cnyToUsdRate ? '-' : `$ ${toUSD(pcbPrice).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Production Time</span>
                    <span className="text-base font-semibold text-gray-700">{productionCycle != null ? `${productionCycle} days` : '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Estimated Finish</span>
                    <span className="text-base font-semibold text-gray-700">{estimatedFinishDate ? estimatedFinishDate.toLocaleDateString() : '-'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3">
                    <span className="text-sm text-muted-foreground">Shipping Cost</span>
                    <span className="text-lg font-bold text-blue-700">
                      {rateLoading || !cnyToUsdRate ? '-' : `$ ${(shipping ?? 0).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex flex-col mb-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Customs Fee</span>
                      <span className="text-base font-semibold text-blue-700">
                        {rateLoading || !cnyToUsdRate ? '-' : `$ ${(customs).toFixed(2)}`}
                      </span>
                    </div>
                    <div className="ml-2 text-xs text-gray-500">
                      Duty: ${(customs).toFixed(2)} | VAT: ${(customs).toFixed(2)}
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-blue-900">Total</span>
                      <span className="text-2xl font-extrabold text-blue-700">
                        {rateLoading || !cnyToUsdRate ? '-' : `$ ${toUSD(total).toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </div>
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                <Button className="w-full h-12 text-lg font-bold mt-2" size="lg" onClick={handleFinalSubmit} disabled={loading}>
                  {loading ? "Processing..." : "Place Order"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}