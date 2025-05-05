import { useState, useEffect, useRef, useMemo } from "react";
import { useQuoteStore } from "@/lib/quoteStore";
import { useUserStore } from "@/lib/userStore";
import { checkQuoteConfirmRequired, countryRequiresTaxId, countryRequiresPersonalId } from "../validate";
import { supabase } from "@/lib/supabaseClient";

export function useQuoteForm() {
  const { form: quote, setForm } = useQuoteStore();
  const user = useUserStore(state => state.user);

  // 所有表单状态
  const [address, setAddress] = useState("");
  const [pcbFile, setPcbFile] = useState<File | null>(null);
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [courier, setCourier] = useState<"dhl" | "fedex" | "ups" | "">("");
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

  // 省市区数据
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loadingCountry, setLoadingCountry] = useState(false);
  const [loadingState, setLoadingState] = useState(false);
  const [loadingCity, setLoadingCity] = useState(false);

  // 恢复表单
  useEffect(() => {
    if (quote) {
      if (quote.country) setCountry(quote.country);
      if (quote.state) setState(quote.state);
      if (quote.city) setCity(quote.city);
      if (quote.zip) setZip(quote.zip);
      if (quote.phone) setPhone(quote.phone);
      if (quote.email) setEmail(quote.email);
      if (quote.address) setAddress(quote.address);
      if (quote.courier) setCourier(quote.courier as "dhl" | "fedex" | "ups" | "");
      if (quote.pcbFile) setPcbFile(quote.pcbFile);
      if (quote.companyName) setCompanyName(quote.companyName);
      if (quote.taxId) setTaxId(quote.taxId);
      if (quote.personalId) setPersonalId(quote.personalId);
      if (quote.declarationMethod) setDeclarationMethod(quote.declarationMethod);
      if (quote.purpose) setPurpose(quote.purpose);
      if (quote.declaredValue) setDeclaredValue(quote.declaredValue);
      if (quote.customsNote) setCustomsNote(quote.customsNote);
      if (quote.pcbNote) setPcbNote(quote.pcbNote);
      if (quote.userNote) setUserNote(quote.userNote);
    }
  }, [quote]);

  // 自动保存表单
  useEffect(() => {
    const data: any = {
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
      companyName,
      customsNote,
      pcbNote,
      userNote,
    };
    setForm((prev: any) => ({ ...prev, ...data }));
    // eslint-disable-next-line
  }, [country, state, city, zip, phone, email, address, courier, pcbFile, declarationMethod, taxId, personalId, purpose, declaredValue, companyName, customsNote, pcbNote, userNote]);

  // 自动填充邮箱和电话
  useEffect(() => {
    if (user?.email) setEmail(user.email);
    if (user?.phone) {
      setPhone(user.phone);
    } else if (user?.id) {
      supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile?.phone) setPhone(profile.phone);
        });
    }
  }, [user]);

  return {
    address, setAddress,
    pcbFile, setPcbFile,
    country, setCountry,
    state, setState,
    city, setCity,
    zip, setZip,
    courier, setCourier,
    phone, setPhone,
    email, setEmail,
    customsDeclareType, setCustomsDeclareType,
    companyName, setCompanyName,
    taxId, setTaxId,
    personalId, setPersonalId,
    declarationMethod, setDeclarationMethod,
    incoterm, setIncoterm,
    purpose, setPurpose,
    declaredValue, setDeclaredValue,
    customsNote, setCustomsNote,
    pcbNote, setPcbNote,
    userNote, setUserNote,
    states, setStates,
    cities, setCities,
    loadingCountry, setLoadingCountry,
    loadingState, setLoadingState,
    loadingCity, setLoadingCity,
    quote,
  };
} 