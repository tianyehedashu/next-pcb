"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Check, Truck, Plane, Package } from "lucide-react";
import dynamic from "next/dynamic";
import { supabase } from '@/lib/supabaseClient';

// 动态导入 ReactSelect 避免 SSR 问题
const ReactSelect = dynamic(() => import("react-select"), { ssr: false });

// 类型定义
export type OptionType = { value: string; label: string };

// 快递选项类型
type CourierOptionType = { value: string; label: string; icon: React.ComponentType<{ className?: string }>; color: string };

// 快递选项配置
const COURIER_OPTIONS: CourierOptionType[] = [
  { 
    value: 'dhl', 
    label: 'DHL',
    icon: Package,
    color: 'bg-yellow-400 text-black'
  },
  { 
    value: 'fedex', 
    label: 'FedEx',
    icon: Plane,
    color: 'bg-purple-600 text-white'
  },
  { 
    value: 'ups', 
    label: 'UPS',
    icon: Truck,
    color: 'bg-amber-700 text-white'
  }
];

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

// 地址类型
export interface AddressFormValue {
  id?: string;
  country: string;
  countryName?: string; // 国家友好名称，如 "United States"
  state: string;
  stateName?: string; // 州/省友好名称，如 "California"
  city: string;
  cityName?: string; // 城市友好名称，如 "Los Angeles"
  address: string;
  zipCode: string;
  contactName: string;
  phone: string;
  courier?: string;
  courierName?: string; // 快递公司友好名称，如 "DHL"
  isDefault?: boolean;
  label?: string; // 地址标签，如 "Home", "Office"
}

interface AddressFormComponentProps {
  value?: AddressFormValue;
  onChange?: (value: AddressFormValue) => void;
  userId?: string; // 用户ID，用于获取地址列表
}

// 国家列表
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
  // 欧盟成员国
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

// 支持的国家
const SUPPORTED_COUNTRIES = ['US', 'CN', 'JP', 'DE', 'GB', 'FR', 'IT', 'ES', 'NL', 'BE', 'CH', 'SE', 'NO', 'DK', 'FI', 'CA', 'AU', 'KR', 'SG', 'IN', 'BR', 'RU', 'MX', 'AT', 'BG', 'HR', 'CY', 'CZ', 'EE', 'GR', 'HU', 'IE', 'LV', 'LT', 'LU', 'MT', 'PL', 'PT', 'RO', 'SK', 'SI'];

// 国家选项
const countriesOptions = COUNTRY_LIST
  .filter(c => SUPPORTED_COUNTRIES.includes(c.iso2))
  .map(c => ({ 
    value: c.iso2, 
    label: `${c.emoji ? c.emoji + " " : ""}${c.name}` 
  }));

// ReactSelect 样式
const selectStyles = {
  control: (base: Record<string, unknown>) => ({
    ...base,
    minHeight: 40,
    borderColor: "#d1d5db",
    borderRadius: "0.375rem",
    boxShadow: "none",
    '&:hover': { borderColor: "#3b82f6" },
    '&:focus-within': { 
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)"
    },
  }),
  menu: (base: Record<string, unknown>) => ({
    ...base,
    zIndex: 9999,
    borderRadius: "0.375rem",
    border: "1px solid #d1d5db",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  }),
  option: (base: Record<string, unknown>, state: { isSelected: boolean; isFocused: boolean }) => ({
    ...base,
    backgroundColor: state.isSelected 
      ? "#3b82f6" 
      : state.isFocused 
        ? "#eff6ff" 
        : "white",
    color: state.isSelected ? "white" : "#374151",
    cursor: "pointer",
  }),
  placeholder: (base: Record<string, unknown>) => ({
    ...base,
    color: "#9ca3af",
  }),
};

// 过滤选项函数
const filterOptions = (option: OptionType, input: string) => {
  return option.label.toLowerCase().includes(input.toLowerCase());
};

// useGeoOptions hook
function useGeoOptions(country: string, state: string) {
  const [states, setStates] = useState<OptionType[]>([]);
  const [cities, setCities] = useState<OptionType[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const geonamesUser = "leodennis";

  // 通过 iso2 获取 geonameId
  function getCountryGeonameId(iso2: string): number | undefined {
    return COUNTRY_LIST.find(c => c.iso2 === iso2)?.geonameId;
  }

  useEffect(() => {
    if (!country) { 
      setStates([]); 
      return; 
    }
    
    const geonameId = getCountryGeonameId(country);
    if (!geonameId) { 
      setStates([]); 
      return; 
    }
    
    setLoadingStates(true);
    fetch(`https://secure.geonames.org/childrenJSON?geonameId=${geonameId}&username=${geonamesUser}`)
      .then(res => res.json())
      .then(data => {
        setStates(
          Array.isArray(data.geonames)
            ? data.geonames.map((s: GeoNamesState) => ({
                value: s.adminCode1 || String(s.geonameId),
                label: s.name
              }))
            : []
        );
      })
      .catch(() => setStates([]))
      .finally(() => setLoadingStates(false));
  }, [country]);

  useEffect(() => {
    if (!country || !state) { 
      setCities([]); 
      return; 
    }
    
    setLoadingCities(true);
    fetch(`https://secure.geonames.org/searchJSON?country=${country}&adminCode1=${state}&featureClass=P&maxRows=1000&username=${geonamesUser}`)
      .then(res => res.json())
      .then(data => {
        setCities(
          Array.isArray(data.geonames)
            ? data.geonames.map((c: GeoNamesCity) => ({
                value: String(c.geonameId),
                label: c.name
              }))
            : []
        );
      })
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
  }, [country, state]);

  return { states, cities, loadingStates, loadingCities };
}

// 地址列表管理 Hook
function useAddressList(userId?: string) {
  const [addresses, setAddresses] = useState<AddressFormValue[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取用户地址列表
  useEffect(() => {
    if (!userId) return;
    
    const fetchAddresses = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        if (!token) {
          console.error('No authentication token available');
          setAddresses([]);
          setLoading(false);
          return;
        }
        
        const response = await fetch('/api/user/addresses', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (response.ok && data.addresses) {
          setAddresses(data.addresses);
        } else {
          console.error('Error fetching addresses:', data.error);
          setAddresses([]);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
        setAddresses([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAddresses();
  }, [userId]);

  const saveAddress = async (address: AddressFormValue) => {
    if (!userId) return address;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          address: {
            ...address,
            // 如果当前没有任何地址，第一个地址自动设为默认
            isDefault: address.isDefault || addresses.length === 0
          }
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const savedAddress = data.address;
        
        if (address.id) {
          // 更新现有地址
          setAddresses(prev => prev.map(addr => ({
            ...addr,
            // 如果保存的地址设为默认，其他地址的默认状态需要清除
            isDefault: savedAddress.isDefault ? addr.id === savedAddress.id : addr.isDefault,
            // 更新对应的地址
            ...(addr.id === savedAddress.id ? savedAddress : {})
          })));
        } else {
          // 添加新地址
          setAddresses(prev => {
            // 如果新地址是默认地址，清除其他地址的默认状态
            const updatedAddresses = savedAddress.isDefault 
              ? prev.map(addr => ({ ...addr, isDefault: false }))
              : prev;
            return [...updatedAddresses, savedAddress];
          });
        }
        
        return savedAddress;
      } else {
        throw new Error(data.error || 'Failed to save address');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      throw error;
    }
  };

  const deleteAddress = async (addressId: string) => {
    if (!userId) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch(`/api/user/addresses?addressId=${addressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setAddresses(prev => prev.filter(addr => addr.id !== addressId));
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete address');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  };

  const setDefaultAddress = async (addressId: string) => {
    if (!userId) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch('/api/user/addresses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          addressId,
          action: 'setDefault'
        }),
      });
      
      if (response.ok) {
        setAddresses(prev => prev.map(addr => ({
          ...addr,
          isDefault: addr.id === addressId
        })));
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to set default address');
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      throw error;
    }
  };

  return { addresses, loading, saveAddress, deleteAddress, setDefaultAddress };
}

export function AddressFormComponent({ value, onChange, userId }: AddressFormComponentProps) {
  const { states, cities, loadingStates, loadingCities } = useGeoOptions(value?.country || '', value?.state || '');
  const { addresses, loading, saveAddress, deleteAddress, setDefaultAddress } = useAddressList(userId);
  const [showAddressList, setShowAddressList] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressFormValue | null>(null);
  const [addressLabel, setAddressLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [originalAddress, setOriginalAddress] = useState<AddressFormValue | null>(null);
  const hasAutoFilled = React.useRef(false);

  // 清除保存消息
  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  // 自动填充用户信息
  useEffect(() => {
    const autoFillUserInfo = async () => {
      if (!userId || hasAutoFilled.current || value?.contactName || value?.phone) {
        // 如果没有用户ID、已经自动填充过或者已经有联系人信息，则不自动填充
        return;
      }

      // 检查是否有默认地址
      const defaultAddress = addresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        // 如果有默认地址，使用默认地址
        onChange?.(defaultAddress);
        hasAutoFilled.current = true;
        return;
      }

      // 如果没有默认地址，从用户信息中获取姓名和电话
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // 从 user_metadata 获取用户信息
          const userMetadata = session.user.user_metadata || {};
          const userEmail = session.user.email || '';
          
          // 尝试从 profiles 表获取更详细的用户信息
          const { data: profile } = await supabase
            .from('profiles')
            .select('phone, company_name')
            .eq('id', userId)
            .single();

          const autoFilledValue = {
            country: '',
            state: '',
            city: '',
            address: '',
            zipCode: '',
            courier: '',
            ...value,
            // 自动填充联系人姓名（优先使用 username，其次使用 email 的用户名部分）
            contactName: value?.contactName || userMetadata.username || userEmail.split('@')[0] || '',
            // 自动填充电话号码
            phone: value?.phone || profile?.phone || userMetadata.phone || '',
          };

          onChange?.(autoFilledValue);
          hasAutoFilled.current = true;
        }
      } catch (error) {
        console.error('Error auto-filling user info:', error);
      }
    };

    // 只在地址列表加载完成后执行自动填充
    if (!loading && addresses) {
      autoFillUserInfo();
    }
  }, [userId, loading, addresses, onChange]);

  // 重置自动填充标记当用户ID改变时
  useEffect(() => {
    hasAutoFilled.current = false;
  }, [userId]);

  // 检查地址是否有变更
  const hasAddressChanged = (): boolean => {
    if (!value || !originalAddress) return true;
    
    const fieldsToCompare: (keyof AddressFormValue)[] = [
      'country', 'state', 'city', 'address', 'zipCode', 
      'contactName', 'phone', 'courier', 'isDefault'
    ];
    
    return fieldsToCompare.some(field => value[field] !== originalAddress[field]) ||
           addressLabel !== (originalAddress.label || '');
  };

  const handleFieldChange = (field: keyof AddressFormValue, fieldValue: string, displayName?: string) => {
    const newValue = {
      country: '',
      state: '',
      city: '',
      address: '',
      zipCode: '',
      contactName: '',
      phone: '',
      courier: '',
      ...value,
      [field]: fieldValue
    };

    // 同时保存显示名称
    if (field === 'country' && displayName) {
      newValue.countryName = displayName;
      // 当国家改变时，清空州和城市及其名称
      newValue.state = '';
      newValue.stateName = '';
      newValue.city = '';
      newValue.cityName = '';
    } else if (field === 'state' && displayName) {
      newValue.stateName = displayName;
      // 当州改变时，清空城市及其名称
      newValue.city = '';
      newValue.cityName = '';
    } else if (field === 'city' && displayName) {
      newValue.cityName = displayName;
    } else if (field === 'courier' && displayName) {
      newValue.courierName = displayName;
    }

    onChange?.(newValue);
  };

  const handleSelectAddress = (address: AddressFormValue) => {
    onChange?.(address);
    setOriginalAddress({...address});
    setAddressLabel(address.label || '');
    setShowAddressList(false);
  };

  return (
    <div className="space-y-4">
      {/* 地址列表切换按钮 - 只在有地址时显示 */}
      {userId && addresses.length > 0 && (
        <div className="flex gap-2 mb-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAddressList(!showAddressList)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {showAddressList ? 'Hide Address List' : 'Choose from Saved Addresses'}
          </Button>
        </div>
      )}

      {/* 地址列表 */}
      {showAddressList && userId && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Saved Addresses</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading addresses...</div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No saved addresses</div>
            ) : (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <div key={address.id} className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <span className="font-medium text-sm sm:text-base truncate">{address.label}</span>
                          {address.isDefault && (
                            <Badge variant="default" className="text-xs w-fit">Default</Badge>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                          <div className="truncate">{address.contactName} • {address.phone}</div>
                          <div className="break-words">{address.address}</div>
                          <div>
                            {address.cityName || address.city}, {address.stateName || address.state} {address.zipCode}
                          </div>
                          <div className="truncate">
                            {address.countryName || COUNTRY_LIST.find(c => c.iso2 === address.country)?.name || address.country}
                          </div>
                          {address.courier && (
                            <div className="truncate">
                              Courier: {address.courierName || address.courier}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap sm:flex-nowrap gap-1 sm:gap-2 justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleSelectAddress(address)}
                          title="Use this address"
                          className="text-xs px-2"
                        >
                          <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline ml-1">Use</span>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingAddress(address);
                            setAddressLabel(address.label || '');
                            setOriginalAddress({...address});
                            onChange?.(address);
                          }}
                          title="Edit address"
                          className="text-xs px-2"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline ml-1">Edit</span>
                        </Button>
                        {!address.isDefault && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setDefaultAddress(address.id!)}
                            title="Set as default"
                            className="text-blue-600 hover:text-blue-700 text-xs px-2"
                          >
                            <span className="hidden sm:inline">Set Default</span>
                            <span className="sm:hidden">Default</span>
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const isDefault = address.isDefault || false;
                            await deleteAddress(address.id!);
                            
                            // 如果删除的是默认地址且还有其他地址，自动设置第一个地址为默认
                            if (isDefault && addresses.length > 1) {
                              const remainingAddresses = addresses.filter(addr => addr.id !== address.id);
                              if (remainingAddresses.length > 0) {
                                await setDefaultAddress(remainingAddresses[0].id!);
                                onChange?.(remainingAddresses[0]);
                              }
                            } else if (addresses.length === 1) {
                              // 如果删除的是唯一地址，清空当前表单
                              onChange?.({
                                country: '',
                                state: '',
                                city: '',
                                address: '',
                                zipCode: '',
                                contactName: '',
                                phone: '',
                                courier: '',
                              });
                            }
                          }}
                          title="Delete address"
                          className="text-red-600 hover:text-red-700 text-xs px-2"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline ml-1">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 地址表单 */}
      <Card className="w-full">
        <CardContent className="pt-6 space-y-4">
          {/* 保存消息提示 */}
          {saveMessage && (
            <div className={`p-3 rounded-lg text-sm ${
              saveMessage.includes('Failed') 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {saveMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Preferred Courier - 移到第一列 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Courier <span className="text-red-500">*</span>
              </label>
              <ReactSelect
                options={COURIER_OPTIONS}
                value={COURIER_OPTIONS.find(opt => opt.value === value?.courier) || null}
                onChange={(newValue: unknown) => {
                  const selectedOption = newValue as CourierOptionType | null;
                  handleFieldChange('courier', selectedOption?.value || '', selectedOption?.label);
                }}
                placeholder="Select Courier"
                isClearable
                styles={{
                  ...selectStyles,
                  option: (base: Record<string, unknown>, state: { isSelected: boolean; isFocused: boolean }) => ({
                    ...base,
                    backgroundColor: state.isSelected 
                      ? "#3b82f6" 
                      : state.isFocused 
                        ? "#eff6ff" 
                        : "white",
                    color: state.isSelected ? "white" : "#374151",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }),
                }}
                formatOptionLabel={(option: unknown) => {
                  const courierOption = option as CourierOptionType;
                  const IconComponent = courierOption.icon;
                  return (
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded flex items-center justify-center ${courierOption.color}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span>{courierOption.label}</span>
                    </div>
                  );
                }}
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <ReactSelect
                options={countriesOptions}
                value={countriesOptions.find(opt => opt.value === value?.country) || null}
                onChange={(newValue) => {
                  const selectedOption = newValue as OptionType | null;
                  const countryInfo = COUNTRY_LIST.find(c => c.iso2 === selectedOption?.value);
                  handleFieldChange('country', selectedOption?.value || '', countryInfo?.name);
                }}
                placeholder="Select country"
                isClearable
                styles={selectStyles}
                filterOption={filterOptions}
              />
            </div>

            {/* State/Province */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State/Province <span className="text-red-500">*</span>
              </label>
              <ReactSelect
                options={states}
                value={states.find(opt => opt.value === value?.state) || null}
                onChange={(newValue) => {
                  const selectedOption = newValue as OptionType | null;
                  handleFieldChange('state', selectedOption?.value || '', selectedOption?.label);
                }}
                placeholder={!value?.country ? "Select Country First" : "Select state/province"}
                isDisabled={!value?.country}
                isClearable
                styles={selectStyles}
                filterOption={filterOptions}
                isLoading={loadingStates}
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <ReactSelect
                options={cities}
                value={cities.find(opt => opt.value === value?.city) || null}
                onChange={(newValue) => {
                  const selectedOption = newValue as OptionType | null;
                  handleFieldChange('city', selectedOption?.value || '', selectedOption?.label);
                }}
                placeholder={!value?.state ? "Select State First" : "Select city"}
                isDisabled={!value?.state}
                isClearable
                styles={selectStyles}
                filterOption={filterOptions}
                isLoading={loadingCities}
              />
            </div>

            {/* ZIP Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ZIP/Postal Code <span className="text-red-500">*</span>
              </label>
              <Input
                value={value?.zipCode || ''}
                onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                placeholder="Enter ZIP/postal code"
              />
            </div>

            {/* Contact Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={value?.contactName || ''}
                onChange={(e) => handleFieldChange('contactName', e.target.value)}
                placeholder="Enter contact name"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <Input
                value={value?.phone || ''}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>

            {/* Detailed Address */}
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Address <span className="text-red-500">*</span>
              </label>
              <Input
                value={value?.address || ''}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                placeholder="Enter your detailed address"
                className="text-sm sm:text-base"
              />
            </div>
          </div>

          {/* 地址操作按钮 */}
          {userId && (
            <div className="pt-4 border-t">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                {/* Address Label - 移到这里与 Set as default 同列 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Label (Optional)
                  </label>
                  <Input
                    value={addressLabel}
                    onChange={(e) => setAddressLabel(e.target.value)}
                    placeholder="e.g., Home, Office, etc."
                    className="text-sm sm:text-base"
                  />
                </div>
                
                {/* Set as Default 复选框 */}
                <div className="flex items-end">
                  <div className="flex items-center gap-2 h-10">
                    <input
                      type="checkbox"
                      id="setAsDefault"
                      checked={value?.isDefault || false}
                      onChange={(e) => {
                        if (value) {
                          onChange?.({...value, isDefault: e.target.checked});
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="setAsDefault" className="text-sm font-medium text-gray-700">
                      Set as default address
                    </label>
                  </div>
                </div>
              </div>
              
              {/* 保存按钮 */}
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  if (!value) return;
                  
                  setIsSaving(true);
                  setSaveMessage('');
                  
                  try {
                    const addressToSave = {
                      ...value,
                      label: addressLabel || (value.isDefault ? 'Default Address' : 'New Address'),
                      id: editingAddress?.id
                    };
                    
                    const savedAddress = await saveAddress(addressToSave);
                    setAddressLabel(savedAddress.label || '');
                    setEditingAddress(null);
                    // 更新原始地址状态
                    setOriginalAddress({...savedAddress});
                    // 更新当前值
                    onChange?.(savedAddress);
                    setSaveMessage(savedAddress.isDefault ? 'Address saved and set as default!' : 'Address saved successfully!');
                  } catch (error) {
                    setSaveMessage('Failed to save address. Please try again.');
                    console.error('Error saving address:', error);
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={
                  !value?.country || 
                  !value?.address || 
                  isSaving || 
                  (value?.id ? !hasAddressChanged() : false)
                }
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                {isSaving ? 'Saving...' : (editingAddress ? 'Update Address' : 'Save Address')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 