"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Edit, Plus, MapPin, Phone, User, Package, Star, StarOff } from "lucide-react";
import { AddressFormComponent, AddressFormValue } from "@/app/quote2/components/AddressFormComponent";
import { supabase } from '@/lib/supabaseClient';
import { toast } from "sonner";

// 地址管理页面组件
export default function AddressManagementPage() {
  const [addresses, setAddresses] = useState<AddressFormValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressFormValue | null>(null);
  const [currentAddress, setCurrentAddress] = useState<AddressFormValue>({
    country: '',
    state: '',
    city: '',
    address: '',
    zipCode: '',
    contactName: '',
    phone: '',
    courier: '',
  });

  // 获取用户信息
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    getUser();
  }, []);

  // 获取地址列表
  const fetchAddresses = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        toast.error('Authentication required');
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
        toast.error('Failed to load addresses');
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchAddresses();
    }
  }, [userId]);

  // 保存地址
  const handleSaveAddress = async (address: AddressFormValue) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        toast.error('Authentication required');
        return;
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
        toast.success(address.id ? 'Address updated successfully!' : 'Address added successfully!');
        setIsDialogOpen(false);
        setEditingAddress(null);
        setCurrentAddress({
          country: '',
          state: '',
          city: '',
          address: '',
          zipCode: '',
          contactName: '',
          phone: '',
          courier: '',
        });
        await fetchAddresses(); // 重新获取地址列表
      } else {
        toast.error(data.error || 'Failed to save address');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    }
  };

  // 删除地址
  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      
      const response = await fetch(`/api/user/addresses?addressId=${addressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        toast.success('Address deleted successfully!');
        await fetchAddresses();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete address');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };

  // 设置默认地址
  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        toast.error('Authentication required');
        return;
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
        toast.success('Default address updated!');
        await fetchAddresses();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to set default address');
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Failed to set default address');
    }
  };

  // 编辑地址
  const handleEditAddress = (address: AddressFormValue) => {
    setEditingAddress(address);
    setCurrentAddress(address);
    setIsDialogOpen(true);
  };

  // 添加新地址
  const handleAddAddress = () => {
    setEditingAddress(null);
    setCurrentAddress({
      country: '',
      state: '',
      city: '',
      address: '',
      zipCode: '',
      contactName: '',
      phone: '',
      courier: '',
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading addresses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和添加按钮 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-600" />
            Shipping Addresses
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your shipping addresses for faster checkout
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddAddress} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add New Address
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <AddressFormComponent
                value={currentAddress}
                onChange={setCurrentAddress}
                userId={userId || undefined}
              />
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingAddress(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleSaveAddress(currentAddress)}
                  disabled={
                    !currentAddress.country ||
                    !currentAddress.address ||
                    !currentAddress.contactName ||
                    !currentAddress.phone
                  }
                >
                  {editingAddress ? 'Update Address' : 'Save Address'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 地址列表 */}
      {addresses.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses yet</h3>
            <p className="text-gray-600 mb-6">
              Add your first shipping address to get started
            </p>
            <Button onClick={handleAddAddress} className="flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" />
              Add Your First Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {addresses.map((address) => (
            <Card key={address.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* 地址信息 */}
                  <div className="flex-1 space-y-3">
                    {/* 标题行 */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {address.label || 'Address'}
                      </h3>
                      {address.isDefault && (
                        <Badge variant="default" className="w-fit">
                          <Star className="w-3 h-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>

                    {/* 联系人信息 */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{address.contactName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{address.phone}</span>
                      </div>
                    </div>

                    {/* 地址详情 */}
                    <div className="space-y-1 text-sm text-gray-700">
                      <div className="font-medium">{address.address}</div>
                      <div>
                        {address.cityName || address.city}, {address.stateName || address.state} {address.zipCode}
                      </div>
                      <div>
                        {address.countryName || address.country}
                      </div>
                    </div>

                    {/* 快递信息 */}
                    {address.courier && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Package className="w-4 h-4" />
                        <span>Preferred Courier: {address.courierName || address.courier}</span>
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-wrap gap-2 lg:flex-col lg:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAddress(address)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    
                    {!address.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefaultAddress(address.id!)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                      >
                        <StarOff className="w-4 h-4" />
                        <span className="hidden sm:inline">Set Default</span>
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAddress(address.id!)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 