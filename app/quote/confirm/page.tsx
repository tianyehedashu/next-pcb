"use client";

import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { useQuoteStore } from "@/lib/quoteStore";
import { calcPcbPrice, calcProductionCycle, getRealDeliveryDate } from "@/lib/pcb-calc";
import { calculateShippingCost } from "@/lib/shipping-calculator";
import OrderStepBar from "@/components/ui/OrderStepBar";
import { calculateCustomsFee } from "@/lib/customs-fee";
import { checkQuoteConfirmRequired, countryRequiresTaxId, countryRequiresPersonalId, QuoteConfirmForm } from "./validate";
import { createLocalStoragePersistor } from "./persistLocal";
import { createZustandPersistor } from "./persistZustand";
import { FormPersistor } from "./persist";
import {
  Command,
  CommandInput,
  CommandGroup,
  CommandItem,
  CommandEmpty
} from "@/components/ui/command";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useEffect, useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
const ReactSelect = dynamic(() => import("react-select"), { ssr: false });

// 添加类型定义
interface GeoState {
  code: string;
  name: string;
}

interface GeoCity {
  code: string;
  name: string;
}

// 添加常用国家常量数组
const COMMON_COUNTRIES = [
  { iso2: 'US', name: 'United States', emoji: '🇺🇸' },
  { iso2: 'CN', name: 'China', emoji: '🇨🇳' },
  { iso2: 'JP', name: 'Japan', emoji: '🇯🇵' },
  { iso2: 'DE', name: 'Germany', emoji: '🇩🇪' },
  { iso2: 'GB', name: 'United Kingdom', emoji: '🇬🇧' },
  { iso2: 'FR', name: 'France', emoji: '🇫🇷' },
  { iso2: 'CA', name: 'Canada', emoji: '🇨🇦' },
  { iso2: 'AU', name: 'Australia', emoji: '🇦🇺' },
  { iso2: 'KR', name: 'South Korea', emoji: '🇰🇷' },
  { iso2: 'SG', name: 'Singapore', emoji: '🇸🇬' },
  { iso2: 'IN', name: 'India', emoji: '🇮🇳' },
  { iso2: 'IT', name: 'Italy', emoji: '🇮🇹' },
  { iso2: 'ES', name: 'Spain', emoji: '🇪🇸' },
  { iso2: 'NL', name: 'Netherlands', emoji: '🇳🇱' },
  { iso2: 'CH', name: 'Switzerland', emoji: '🇨🇭' },
  { iso2: 'SE', name: 'Sweden', emoji: '🇸🇪' },
  { iso2: 'BR', name: 'Brazil', emoji: '🇧🇷' },
  { iso2: 'RU', name: 'Russia', emoji: '🇷🇺' },
  { iso2: 'MX', name: 'Mexico', emoji: '🇲🇽' },
];

// 步骤条组件（主流PCB厂商风格，支持动态高亮）
const steps = [
  { label: "Inquiry", key: "inquiry" },
  { label: "Review", key: "review" },
  { label: "Confirm & Pay", key: "confirm_pay" },
  { label: "Scheduling", key: "scheduling" },
  { label: "Production", key: "production" },
  { label: "Shipping", key: "shipping" },
  { label: "Receiving", key: "receiving" },
  { label: "Complete", key: "complete" },
];

// 选择持久化方式
const useLocal = true; // 可根据需要切换
const persistor: FormPersistor<QuoteConfirmForm> = useLocal
  ? createLocalStoragePersistor<QuoteConfirmForm>("quote_confirm_form")
  : createZustandPersistor<QuoteConfirmForm>();

export default function QuoteConfirmPage() {
  const router = useRouter();
  const { form: quote, clearForm } = useQuoteStore();
  const [address, setAddress] = useState("");
  const [pcbFile, setPcbFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [courier, setCourier] = useState<"dhl" | "fedex" | "ups" | "">("");
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [countries, setCountries] = useState(COMMON_COUNTRIES);
  const [states, setStates] = useState<GeoState[]>([]);
  const [cities, setCities] = useState<GeoCity[]>([]);
  const [loadingCountry, setLoadingCountry] = useState(false);
  const [loadingState, setLoadingState] = useState(false);
  const [loadingCity, setLoadingCity] = useState(false);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [customsDeclareType, setCustomsDeclareType] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [personalId, setPersonalId] = useState("");
  const [declarationMethod, setDeclarationMethod] = useState("");
  const [incoterm, setIncoterm] = useState("");
  const [purpose, setPurpose] = useState("");
  const [declaredValue, setDeclaredValue] = useState("");
  const [customsNote, setCustomsNote] = useState("");
  const [pcbNote, setPcbNote] = useState("");
  const [userNote, setUserNote] = useState("");
  const [cityPopoverOpen, setCityPopoverOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const filteredCities = useMemo(() => {
    if (!citySearch) return cities;
    return cities.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase()));
  }, [cities, citySearch]);

  // 动态必填逻辑
  const countryRequiresTaxIdMemo = useMemo(() => countryRequiresTaxId(country), [country]);
  const countryRequiresPersonalIdMemo = useMemo(() => countryRequiresPersonalId(country), [country]);

  // 步骤条动态高亮逻辑
  const orderStatus = (quote && quote.status) || "inquiry";
  const currentStep = steps.findIndex(s => s.key === orderStatus);

  // 恢复表单（优先级：quote > persistor > 默认值）
  useEffect(() => {
    const saved = persistor.load();
    if (saved) {
      if (saved.country) setCountry(saved.country);
      if (saved.state) setState(saved.state);
      if (saved.city) setCity(saved.city);
      if (saved.zip) setZip(saved.zip);
      if (saved.phone) setPhone(saved.phone);
      if (saved.email) setEmail(saved.email);
      if (saved.address) setAddress(saved.address);
      if (saved.courier) setCourier(saved.courier as "dhl" | "fedex" | "ups" | "");
      if (saved.pcbFile) setPcbFile(saved.pcbFile);
      if (saved.companyName) setCompanyName(saved.companyName);
      if (saved.taxId) setTaxId(saved.taxId);
      if (saved.personalId) setPersonalId(saved.personalId);
      if (saved.declarationMethod) setDeclarationMethod(saved.declarationMethod);
      if (saved.purpose) setPurpose(saved.purpose);
      if (saved.declaredValue) setDeclaredValue(saved.declaredValue);
      if (saved.customsNote) setCustomsNote(saved.customsNote);
      if (saved.pcbNote) setPcbNote(saved.pcbNote);
      if (saved.userNote) setUserNote(saved.userNote);
    }
  }, []);

  // 自动保存表单
  useEffect(() => {
    const data: QuoteConfirmForm = {
      country,
      state,
      city,
      zip,
      phone,
      email,
      address,
      courier,
      pcbFile,
      gerberUrl: quote?.gerber?.url,
      declarationMethod,
      taxId,
      personalId,
      purpose,
      declaredValue,
    };
    persistor.save(data);
    // eslint-disable-next-line
  }, [country, state, city, zip, phone, email, address, courier, pcbFile, declarationMethod, taxId, personalId, purpose, declaredValue]);

  useEffect(() => {
    // 登录校验
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push(`/login?redirect=/quote/confirm`);
      // 自动填充邮箱和电话
      if (session?.user) {
        setEmail(session.user.email || "");
        // 假设用户profile表有phone字段
        supabase
          .from('profiles')
          .select('phone')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile?.phone) setPhone(profile.phone);
          });
      }
    });
    // 取回表单数据
    if (!quote) router.push("/quote"); // 没有数据返回表单页
  }, [router, quote]);

  // 国家变化时，重置省/州和城市，并拉取省/州
  useEffect(() => {
    if (!country) {
      setStates([]);
      setCities([]);
      setState("");
      setCity("");
      return;
    }
    setLoadingState(true);
    console.log('Fetching states for country:', country);
    fetch(`/api/geo/states?country=${country}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(response => {
        // 正确处理API响应格式和字段名
        const arr = Array.isArray(response.data) ? response.data : [];
        const validStates = arr
          .filter((s: any) => typeof s.state_code === 'string' && s.state_code && typeof s.name === 'string')
          .map((s: any) => ({ code: s.state_code, name: s.name }));
        setStates(validStates);
        setLoadingState(false);
        setState("");
        setCity("");
      })
      .catch(err => {
        console.error('Failed to fetch states:', err);
        setStates([]);
        setLoadingState(false);
      });
  }, [country]);

  // 省/州变化时，重置城市，并拉取城市
  useEffect(() => {
    if (!country || !state) {
      setCities([]);
      setCity("");
      setCityPopoverOpen(false); // 省份变了，先关闭城市下拉
      return;
    }
    setLoadingCity(true);
    fetch(`/api/geo/cities?country=${country}&state=${state}`)
      .then(res => res.json())
      .then(response => {
        // 正确处理API响应格式
        const arr = Array.isArray(response.data) ? response.data : [];
        const validCities = arr.map((cityData: any) => {
          return {
            code: cityData.code || cityData.name || '',
            name: cityData.name || cityData.code || ''
          };
        }).filter((city: any) => city.code && city.name);
        setCities(validCities);
        setLoadingCity(false);
        setCity("");
        setCityPopoverOpen(true); // 数据加载完再弹出城市下拉
      })
      .catch(err => {
        setCities([]);
        setLoadingCity(false);
        setCityPopoverOpen(false);
      });
  }, [state, country]);

  // 自动计算快递费用
  useEffect(() => {
    if (quote && country && courier) {
      try {
        const cost = calculateShippingCost(
          quote,
          country,
          courier as "dhl" | "fedex" | "ups",
          "standard",
          zip
        );
        setShippingCost(cost.finalCost);
      } catch (e) {
        setShippingCost(null);
      }
    } else {
      setShippingCost(null);
    }
  }, [quote, country, courier, zip]);

  // 计算报关费用
  const declaredValueNum = Number(declaredValue) || calcPcbPrice(quote);
  const customsFee = useMemo(() => {
    if (!country || !declarationMethod || !courier || !declaredValueNum) return null;
    return calculateCustomsFee({
      country,
      declarationMethod,
      courier,
      declaredValue: declaredValueNum,
      pcbType: quote?.pcbType || undefined,
    });
  }, [country, declarationMethod, courier, declaredValueNum, quote]);

  const checkRequired = () => {
    return checkQuoteConfirmRequired({
      country,
      state,
      city,
      zip,
      phone,
      email,
      address,
      courier,
      pcbFile,
      gerberUrl: quote?.gerber?.url,
      declarationMethod,
      taxId,
      personalId,
      purpose,
      declaredValue,
    }, setError, quote);
  };

  const handleFinalSubmit = async () => {
    setError("");
    if (!checkRequired()) return;
    setLoading(true);

    // 1. 上传 PCB 文件
    let pcbFileUrl = "";
    if (pcbFile) {
      const { data, error: uploadError } = await supabase.storage
        .from("pcb-files")
        .upload(`pcb_${Date.now()}_${pcbFile.name}`, pcbFile);
      if (uploadError) {
        setError("Failed to upload PCB file.");
        setLoading(false);
        return;
      }
      pcbFileUrl = data?.path || "";
    } else if (quote?.gerber?.url) {
      pcbFileUrl = quote.gerber.url;
    }

    // 2. 上传地址信息
    let addressId = null;
    const { data: addressData, error: addressError } = await supabase
      .from("addresses")
      .insert([
        {
          country,
          state,
          city,
          zip,
          address,
          phone,
          email,
          user_id: quote?.user_id || null,
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
          declaration_method: declarationMethod,
          company_name: companyName,
          tax_id: taxId,
          personal_id: personalId,
          incoterm,
          purpose,
          declared_value: declaredValue,
          customs_note: customsNote,
          user_id: quote?.user_id || null,
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
    const pcbPrice = quote ? calcPcbPrice(quote) : 0;
    const shipping = shippingCost ?? 0;
    const customs = customsFee?.total ?? 0;
    const total = pcbPrice + shipping + customs;
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          user_id: quote?.user_id || null,
          address_id: addressId,
          customs_id: customsId,
          pcb_spec: quote,
          gerber_file_url: pcbFileUrl,
          courier,
          price: pcbPrice,
          shipping_cost: shipping,
          customs_fee: customs,
          total,
          pcb_note: pcbNote,
          user_note: userNote,
          status: "pending",
          admin_price: null, // 管理员审核后可填写
          admin_note: null, // 管理员审核备注
        },
      ])
      .select()
      .single();
    setLoading(false);
    if (orderError) {
      setError("Failed to submit order.");
      return;
    }
    persistor.clear(); // 清除缓存
    clearForm();
    router.push("/quote/success");
  };

  // 生成 react-select 需要的 options（动态补充当前值）
  const countryOptions = useMemo(() => {
    const exists = countries.some(c => c.iso2 === country);
    let opts = countries.map(c => ({
      value: c.iso2,
      label: `${c.emoji ? c.emoji + " " : ""}${c.name}`,
    }));
    if (country && !exists) {
      opts = [
        ...opts,
        { value: country, label: country }
      ];
    }
    return opts;
  }, [countries, country]);

  const stateOptions = useMemo(() => {
    const exists = states.some(s => s.code === state);
    let opts = states.map(s => ({
      value: s.code,
      label: s.name,
    }));
    if (state && !exists) {
      opts = [
        ...opts,
        { value: state, label: state }
      ];
    }
    return opts;
  }, [states, state]);

  const cityOptions = useMemo(() => {
    const exists = cities.some(c => c.code === city);
    let opts = cities.map(c => ({
      value: c.code,
      label: c.name,
    }));
    if (city && !exists) {
      opts = [
        ...opts,
        { value: city, label: city }
      ];
    }
    return opts;
  }, [cities, city]);

  if (!quote) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100 font-sans">
      <div className="container max-w-7xl mx-auto py-10 px-2 md:px-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-blue-800 mb-8 tracking-tight drop-shadow-sm">Order Confirmation</h1>
        {/* 订单进度步骤条 */}
        <div className="mb-10">
          <OrderStepBar currentStatus={orderStatus} />
        </div>
        <div className="grid grid-cols-12 gap-8">
          {/* 左侧主要内容区域 */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            {/* PCB 规格信息 */}
            <Card className="shadow-lg border-blue-100 bg-white/90">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-xl font-bold text-blue-700">PCB Specifications</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* PCB 文件上传区域（顶部，紧凑横向布局） */}
                <div className="mb-6 flex flex-col md:flex-row items-start gap-4">
                  <div className="flex-1 max-w-xs">
                    <Input
                      type="file"
                      accept=".zip,.rar,.7z,.pcb,.gerber"
                      ref={fileInputRef}
                      onChange={e => { setPcbFile(e.target.files?.[0] || null); e.target.value = ""; }}
                      className="file:rounded-md file:border file:border-blue-200 file:bg-blue-50 file:text-blue-700 file:font-semibold file:px-3 file:py-1.5 file:mr-3"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">Supported: .zip, .rar, .7z, .pcb, .gerber</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    {pcbFile && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                        <p className="text-sm text-green-700 truncate font-medium">✓ {pcbFile.name}</p>
                      </div>
                    )}
                    {!pcbFile && quote?.gerber && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                        <p className="text-sm text-blue-700 truncate font-medium">ℹ {quote.gerber.name}</p>
                      </div>
                    )}
                  </div>
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
                  <Input className="mt-1" value={pcbNote} onChange={e => setPcbNote(e.target.value)} placeholder="Enter any note for your PCB (optional)" />
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
                      isLoading={loadingCountry}
                      isDisabled={loadingCountry}
                      options={countryOptions}
                      value={countryOptions.find(opt => opt.value === country) || undefined}
                      onChange={(option: any) => setCountry(option ? option.value : "")}
                      placeholder={loadingCountry ? "Loading..." : "Select country"}
                      isClearable
                      styles={{
                        control: (base: any) => ({
                          ...base,
                          minHeight: 40,
                          borderColor: "#cbd5e1",
                          boxShadow: "none",
                          '&:hover': { borderColor: "#3b82f6" },
                        }),
                        menu: (base: any) => ({
                          ...base,
                          zIndex: 9999,
                        }),
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-blue-700">State/Province <span className="text-red-500">*</span></label>
                    <ReactSelect
                      className="mt-1"
                      isLoading={loadingState}
                      isDisabled={!country || loadingState}
                      options={stateOptions}
                      value={stateOptions.find(opt => opt.value === state) || undefined}
                      onChange={(option: any) => {
                        setState(option ? option.value : "");
                        setCity("");
                      }}
                      placeholder={
                        loadingState
                          ? "Loading..."
                          : (!country
                              ? "Select Country First"
                              : (states.length === 0 ? "No states available" : "Select state/province"))
                      }
                      isClearable
                      styles={{
                        control: (base: any) => ({
                          ...base,
                          minHeight: 40,
                          borderColor: "#cbd5e1",
                          boxShadow: "none",
                          '&:hover': { borderColor: "#3b82f6" },
                        }),
                        menu: (base: any) => ({
                          ...base,
                          zIndex: 9999,
                        }),
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-blue-700">City <span className="text-red-500">*</span></label>
                    <ReactSelect
                      className="mt-1"
                      isLoading={loadingCity}
                      isDisabled={!state || loadingCity}
                      options={cityOptions}
                      value={cityOptions.find(opt => opt.value === city) || undefined}
                      onChange={(option: any) => setCity(option ? option.value : "")}
                      placeholder={
                        loadingCity
                          ? "Loading..."
                          : (!state
                              ? "Select State First"
                              : (cities.length === 0 ? "No cities available" : "Select city"))
                      }
                      isClearable
                      styles={{
                        control: (base: any) => ({
                          ...base,
                          minHeight: 40,
                          borderColor: "#cbd5e1",
                          boxShadow: "none",
                          '&:hover': { borderColor: "#3b82f6" },
                        }),
                        menu: (base: any) => ({
                          ...base,
                          zIndex: 9999,
                        }),
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-blue-700">Zip/Postal Code <span className="text-red-500">*</span></label>
                    <Input className="mt-1" value={zip} onChange={e => setZip(e.target.value)} placeholder="Enter zip/postal code" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-blue-700">Phone <span className="text-red-500">*</span></label>
                    <Input className="mt-1" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter phone number" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-blue-700">Email <span className="text-red-500">*</span></label>
                    <Input className="mt-1" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter email address" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-semibold text-blue-700">Detailed Address <span className="text-red-500">*</span></label>
                    <Input className="mt-1" value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter your detailed address" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-semibold text-blue-700">Courier <span className="text-red-500">*</span></label>
                    <select className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-400" value={courier} onChange={e => setCourier(e.target.value as "dhl" | "fedex" | "ups" | "")}> <option key="default" value="">Select Courier</option> <option key="dhl" value="dhl">DHL Express</option> <option key="fedex" value="fedex">FedEx International</option> <option key="ups" value="ups">UPS Worldwide</option> </select>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-semibold text-blue-700">User Note</label>
                  <Input className="mt-1" value={userNote} onChange={e => setUserNote(e.target.value)} placeholder="Enter any note for your order (optional)" />
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
                    <Select value={declarationMethod} onValueChange={v => { setDeclarationMethod(v); setPurpose(""); setDeclaredValue(""); setTaxId(""); setPersonalId(""); }}>
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
                    {(["agent", "ddp"].includes(declarationMethod)) && (
                      <div className="text-xs text-blue-600 mt-1">The courier will assist with customs declaration. Please ensure all information is accurate and complete.</div>
                    )}
                  </div>
                  {declarationMethod !== "dutyfree" && (
                    <>
                      <div>
                        <label className="text-sm font-semibold text-blue-700">Company Name (optional)</label>
                        <Input className="mt-1" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Enter company name" />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-blue-700">Tax ID / VAT ID / EORI{countryRequiresTaxIdMemo && <span className="text-red-500">*</span>}</label>
                        <Input className="mt-1" value={taxId} onChange={e => setTaxId(e.target.value)} placeholder="Enter tax or VAT ID" required={countryRequiresTaxIdMemo} />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-blue-700">Personal ID / Passport No.{countryRequiresPersonalIdMemo && <span className="text-red-500">*</span>}</label>
                        <Input className="mt-1" value={personalId} onChange={e => setPersonalId(e.target.value)} placeholder="Enter personal ID or passport number" required={countryRequiresPersonalIdMemo} />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-blue-700">Purpose {declarationMethod !== "dutyfree" && <span className="text-red-500">*</span>}</label>
                        <Select value={purpose} onValueChange={setPurpose}>
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
                        <label className="text-sm font-semibold text-blue-700">Declared Value (USD) {declarationMethod !== "dutyfree" && <span className="text-red-500">*</span>}</label>
                        <Input className="mt-1" value={declaredValue} onChange={e => setDeclaredValue(e.target.value)} placeholder="Enter declared value" required />
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-semibold text-blue-700">Customs Note</label>
                        <Input className="mt-1" value={customsNote} onChange={e => setCustomsNote(e.target.value)} placeholder="Any note for customs (optional)" />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          {/* 右侧订单摘要 */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <Card className="sticky top-24 shadow-xl border-blue-200 bg-gradient-to-br from-blue-100/80 via-white to-blue-50/80">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-xl font-bold text-blue-800">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">PCB Price</span>
                    <span className="text-lg font-bold text-blue-700">¥ {calcPcbPrice(quote).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Production Time</span>
                    <span className="text-base font-semibold text-gray-700">{calcProductionCycle(quote).cycleDays} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Estimated Finish</span>
                    <span className="text-base font-semibold text-gray-700">{quote ? getRealDeliveryDate(new Date(), calcProductionCycle(quote).cycleDays).toLocaleDateString() : '-'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3">
                    <span className="text-sm text-muted-foreground">Shipping Cost</span>
                    <span className="text-lg font-bold text-blue-700">${(shippingCost ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col mb-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Customs Fee</span>
                      <span className="text-base font-semibold text-blue-700">${(customsFee?.total ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="ml-2 text-xs text-gray-500">
                      Duty: ${(customsFee?.duty ?? 0).toFixed(2)} | VAT: ${(customsFee?.vat ?? 0).toFixed(2)}{(customsFee?.agentFee ?? 0) > 0 ? ` | Agent: $${customsFee?.agentFee.toFixed(2)}` : ""}
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-blue-900">Total</span>
                      <span className="text-2xl font-extrabold text-blue-700">¥ {(calcPcbPrice(quote) + (shippingCost ?? 0) + (customsFee?.total ?? 0)).toFixed(2)}</span>
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