"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Check } from "lucide-react";
import dynamic from "next/dynamic";
import { supabase } from '@/lib/supabaseClient';

// 动态导入 ReactSelect 避免 SSR 问题
const ReactSelect = dynamic(() => import("react-select"), { ssr: false });

// 类型定义
export type OptionType = { value: string; label: string };

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
  state: string;
  city: string;
  address: string;
  zipCode: string;
  contactName: string;
  phone: string;
  courier?: string;
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
    borderColor: "#cbd5e1",
    boxShadow: "none",
    '&:hover': { borderColor: "#3b82f6" },
  }),
  menu: (base: Record<string, unknown>) => ({
    ...base,
    zIndex: 9999,
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
    
    setLoading(true);
    fetch(`/api/user/addresses?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.addresses) {
          setAddresses(data.addresses);
        }
      })
      .catch(error => {
        console.error('Error fetching addresses:', error);
        setAddresses([]);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const saveAddress = async (address: AddressFormValue) => {
    if (!userId) return address;
    
    try {
      const response = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          address
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const savedAddress = data.address;
        
        if (address.id) {
          // 更新现有地址
          setAddresses(prev => prev.map(addr => addr.id === address.id ? savedAddress : addr));
        } else {
          // 添加新地址
          setAddresses(prev => [...prev, savedAddress]);
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
      const response = await fetch(`/api/user/addresses?userId=${userId}&addressId=${addressId}`, {
        method: 'DELETE',
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
      const response = await fetch('/api/user/addresses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
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
  const hasAutoFilled = React.useRef(false);

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

  const handleFieldChange = (field: keyof AddressFormValue, fieldValue: string) => {
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

    // 当国家改变时，清空州和城市
    if (field === 'country') {
      newValue.state = '';
      newValue.city = '';
    }
    // 当州改变时，清空城市
    else if (field === 'state') {
      newValue.city = '';
    }

    onChange?.(newValue);
  };

  const handleSelectAddress = (address: AddressFormValue) => {
    onChange?.(address);
    setShowAddressList(false);
  };

  const handleSaveCurrentAddress = async () => {
    if (!value) return;
    
    const addressToSave = {
      ...value,
      label: addressLabel || 'New Address',
      id: editingAddress?.id
    };
    
    await saveAddress(addressToSave);
    setAddressLabel('');
    setEditingAddress(null);
  };

  const handleSetAsDefault = async () => {
    if (!value?.id) {
      // 如果当前地址还没保存，先保存再设为默认
      const savedAddress = await saveAddress({
        ...value!,
        label: addressLabel || 'Default Address'
      });
      await setDefaultAddress(savedAddress.id!);
      // 更新当前值为保存后的地址（包含ID）
      onChange?.({...savedAddress, isDefault: true});
    } else {
      // 如果地址已经存在，直接设置为默认
      await setDefaultAddress(value.id);
      // 更新当前值的默认状态
      onChange?.({...value, isDefault: true});
    }
  };

  // 处理删除地址（包括默认地址）
  const handleDeleteAddress = async (addressId: string, isDefault: boolean) => {
    await deleteAddress(addressId);
    
    // 如果删除的是默认地址且还有其他地址，自动设置第一个地址为默认
    if (isDefault && addresses.length > 1) {
      const remainingAddresses = addresses.filter(addr => addr.id !== addressId);
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
  };

  return (
    <div className="space-y-4">
      {/* 地址列表切换按钮 */}
      {userId && (
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
                  <div key={address.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{address.label}</span>
                          {address.isDefault && (
                            <Badge variant="default" className="text-xs">Default</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          <div>{address.contactName} • {address.phone}</div>
                          <div>{address.address}</div>
                          <div>{address.city}, {address.state} {address.zipCode}</div>
                          <div>{countriesOptions.find((c: OptionType) => c.value === address.country)?.label}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleSelectAddress(address)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingAddress(address);
                            setAddressLabel(address.label || '');
                            onChange?.(address);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {/* 修改删除按钮逻辑：允许删除默认地址，但需要检查是否是唯一地址 */}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteAddress(address.id!, address.isDefault || false)}
                          title="Delete address"
                        >
                          <Trash2 className="w-4 h-4" />
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 w-full">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-lg">📍</span>
          <h4 className="text-lg font-semibold text-blue-600">Shipping Address</h4>
        </div>

        {/* 地址标签输入 */}
        {userId && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address Label (Optional)
            </label>
            <Input
              value={addressLabel}
              onChange={(e) => setAddressLabel(e.target.value)}
              placeholder="e.g., Home, Office, etc."
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country <span className="text-red-500">*</span>
            </label>
            <ReactSelect
              options={countriesOptions}
              value={countriesOptions.find(opt => opt.value === value?.country) || null}
              onChange={(newValue) => handleFieldChange('country', (newValue as OptionType)?.value || '')}
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
              onChange={(newValue) => handleFieldChange('state', (newValue as OptionType)?.value || '')}
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
              onChange={(newValue) => handleFieldChange('city', (newValue as OptionType)?.value || '')}
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
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Address <span className="text-red-500">*</span>
            </label>
            <Input
              value={value?.address || ''}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              placeholder="Enter your detailed address"
            />
          </div>

          {/* Courier Selection */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Courier <span className="text-red-500">*</span>
            </label>
            <select 
              className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-400"
              value={value?.courier || ''}
              onChange={(e) => handleFieldChange('courier', e.target.value)}
            >
              <option value="">Select Courier</option>
              <option value="dhl">DHL Express</option>
              <option value="fedex">FedEx International</option>
              <option value="ups">UPS Worldwide</option>
            </select>
          </div>
        </div>

        {/* 地址操作按钮 */}
        {userId && (
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveCurrentAddress}
              disabled={!value?.country || !value?.address}
            >
              {editingAddress ? 'Update Address' : 'Save Address'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSetAsDefault}
              disabled={!value?.country || !value?.address}
            >
              Set as Default
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 