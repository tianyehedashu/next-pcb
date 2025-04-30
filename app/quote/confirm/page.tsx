"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { useQuoteStore } from "@/lib/quoteStore";
import { calcPcbPrice, calcProductionCycle, getRealDeliveryDate } from "@/lib/pcb-calc";
import { calculateShippingCost } from "@/lib/shipping-calculator";

// 添加类型定义
interface GeoState {
  code: string;
  name: string;
}

interface GeoCity {
  code: string;
  name: string;
}

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
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<GeoState[]>([]);
  const [cities, setCities] = useState<GeoCity[]>([]);
  const [loadingCountry, setLoadingCountry] = useState(false);
  const [loadingState, setLoadingState] = useState(false);
  const [loadingCity, setLoadingCity] = useState(false);

  useEffect(() => {
    // 登录校验
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push(`/login?redirect=/quote/confirm`);
    });
    // 取回表单数据
    if (!quote) router.push("/quote"); // 没有数据返回表单页
  }, [router, quote]);

  // 获取国家
  useEffect(() => {
    setLoadingCountry(true);
    fetch("/api/geo/countries")
      .then(res => res.json())
      .then(data => {
        setCountries(data);
        setLoadingCountry(false);
      });
  }, []);

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
    fetch(`/api/geo/states?country=${country}`)
      .then(res => res.json())
      .then(data => {
        // 确保数据格式正确，过滤掉无效数据
        const validStates = data.filter((s: any) => s && typeof s.code === 'string' && typeof s.name === 'string');
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
      return;
    }
    setLoadingCity(true);
    fetch(`/api/geo/cities?country=${country}&state=${state}`)
      .then(res => res.json())
      .then(data => {
        // 确保数据格式正确，过滤掉无效数据
        const validCities = Array.isArray(data) ? data.map((cityData: string | any) => {
          // 处理不同的数据格式
          if (typeof cityData === 'string') {
            return { code: cityData, name: cityData };
          }
          if (typeof cityData === 'object' && cityData !== null) {
            return {
              code: cityData.code || cityData.name || '',
              name: cityData.name || cityData.code || ''
            };
          }
          return null;
        }).filter((city): city is GeoCity => city !== null && city.code !== '' && city.name !== '') : [];
        
        setCities(validCities);
        setLoadingCity(false);
        setCity("");
      })
      .catch(err => {
        console.error('Failed to fetch cities:', err);
        setCities([]);
        setLoadingCity(false);
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

  const checkRequired = () => {
    if (!address) {
      setError("Please enter your detailed address.");
      return false;
    }
    if (!pcbFile) {
      setError("Please upload your PCB file.");
      return false;
    }
    return true;
  };

  const handleFinalSubmit = async () => {
    setError("");
    if (!checkRequired()) return;
    setLoading(true);
    // 上传 PCB 文件到 Supabase Storage (或你自己的后端)
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
    }
    // 计算 PCB 报价和交期
    const pcbPrice = quote ? calcPcbPrice(quote) : 0;
    const cycle = quote ? calcProductionCycle(quote) : { cycleDays: 0, reason: [] };
    const finishDate = quote ? getRealDeliveryDate(new Date(), cycle.cycleDays) : null;
    // 提交所有数据到后端
    const submitData = { ...quote, address, country, state, city, zip, courier, pcbFile: pcbFileUrl };
    const res = await fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submitData),
    });
    setLoading(false);
    if (res.ok) {
      clearForm();
      router.push("/quote/success");
    } else {
      setError("Failed to submit. Please try again.");
    }
  };

  if (!quote) return null;

  return (
    <div className="flex justify-center items-start min-h-screen bg-background py-8">
      <div className="w-full max-w-[1400px] px-4 grid grid-cols-3 gap-6">
        {/* 左侧：报价信息 */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Quote Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 展示所有已填写信息 */}
            <div className="space-y-1">
              {Object.entries(quote).map(([k, v], index) => (
                <div key={`quote-${k}-${index}`} className="flex flex-row items-center">
                  <span className="font-semibold text-muted-foreground text-xs w-36 truncate">{k}</span>
                  <span className="break-all text-sm flex-1">{String(v)}</span>
                </div>
              ))}
            </div>
            {/* PCB 报价与交期信息 */}
            <div className="border rounded-md p-3 bg-slate-50 space-y-2">
              <div key="pcb-price" className="flex flex-row items-center">
                <span className="font-semibold text-muted-foreground text-xs w-36 truncate">PCB Price</span>
                <span className="break-all text-sm flex-1 text-blue-700 font-bold">¥ {calcPcbPrice(quote).toFixed(2)}</span>
              </div>
              <div key="production-cycle" className="flex flex-row items-center">
                <span className="font-semibold text-muted-foreground text-xs w-36 truncate">Production Cycle</span>
                <span className="break-all text-sm flex-1 text-blue-700 font-bold">{calcProductionCycle(quote).cycleDays} days</span>
              </div>
              <div key="estimated-finish" className="flex flex-row items-center">
                <span className="font-semibold text-muted-foreground text-xs w-36 truncate">Estimated Finish</span>
                <span className="break-all text-sm flex-1 text-blue-700 font-bold">{quote ? getRealDeliveryDate(new Date(), calcProductionCycle(quote).cycleDays).toLocaleDateString() : '-'}</span>
              </div>
              <div key="shipping-cost" className="flex flex-row items-center">
                <span className="font-semibold text-muted-foreground text-xs w-36 truncate">Shipping Cost</span>
                <span className="break-all text-sm flex-1 text-blue-700 font-bold">{shippingCost !== null ? `$${shippingCost.toFixed(2)}` : '-'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 中间：PCB文件上传 */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">PCB File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-md p-4 space-y-3 bg-slate-50/50">
              <Input
                type="file"
                accept=".zip,.rar,.7z,.pcb,.gerber"
                ref={fileInputRef}
                onChange={e => { setPcbFile(e.target.files?.[0] || null); e.target.value = ""; }}
              />
              {pcbFile && <span className="text-xs text-green-600 block mt-1">{pcbFile.name}</span>}
              {!pcbFile && quote?.gerber && <span className="text-xs text-blue-600 block mt-1">{quote.gerber.name}</span>}
            </div>
          </CardContent>
        </Card>

        {/* 右侧：地址信息 */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Shipping Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-xs text-muted-foreground">Country</label>
                <Select value={country} onValueChange={setCountry} disabled={loadingCountry}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={loadingCountry ? "Loading..." : "Select country"} />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c: any) => (
                      <SelectItem key={`country-${c.code}`} value={c.code}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-semibold text-xs text-muted-foreground">State/Province</label>
                <Select value={state} onValueChange={setState} disabled={!country || loadingState}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={loadingState ? "Loading..." : (!country ? "Select Country First" : "Select state/province")} />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((s: GeoState, index: number) => (
                      <SelectItem 
                        key={s.code ? `state-${s.code}` : `state-${index}`} 
                        value={s.code}
                      >
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-semibold text-xs text-muted-foreground">City</label>
                <Select value={city} onValueChange={setCity} disabled={!state || loadingCity}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={loadingCity ? "Loading..." : (!state ? "Select State First" : "Select city")} />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c: GeoCity, index: number) => (
                      <SelectItem 
                        key={c.code ? `city-${c.code}` : `city-${index}`} 
                        value={c.code}
                      >
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-semibold text-xs text-muted-foreground">Zip/Postal Code</label>
                <Input value={zip} onChange={e => setZip(e.target.value)} placeholder="Enter zip/postal code" />
              </div>
              <div>
                <label className="font-semibold text-xs text-muted-foreground">Courier</label>
                <select className="w-full border rounded px-3 py-2 text-sm" value={courier} onChange={e => setCourier(e.target.value as "dhl" | "fedex" | "ups" | "")}>
                  <option key="default" value="">Select Courier</option>
                  <option key="dhl" value="dhl">DHL</option>
                  <option key="fedex" value="fedex">FedEx</option>
                  <option key="ups" value="ups">UPS</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-xs text-muted-foreground">Detailed Address</label>
                <Input
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Enter your detailed address"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 底部按钮和错误信息 */}
        <div className="col-span-3 space-y-4">
          {error && <div className="text-destructive text-sm font-medium">{error}</div>}
          <Button
            className="w-full"
            onClick={handleFinalSubmit}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Confirm and Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
} 