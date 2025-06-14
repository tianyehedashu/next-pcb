"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, User, Star, Home } from 'lucide-react';

// This type should be created based on the user_addresses table schema.
// I'll define a basic version here.
interface UserAddress {
  id: number;
  label: string;
  contact_name: string;
  phone: string;
  country_name: string;
  state_name: string;
  city_name: string;
  address: string;
  zip_code: string;
  is_default: boolean;
}

interface UserAddressesProps {
  userId: string;
}

export function UserAddresses({ userId }: UserAddressesProps) {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}/addresses`);
      if (!response.ok) {
        throw new Error('Failed to fetch addresses');
      }
      const data = await response.json();
      setAddresses(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-gray-500">Loading addresses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="p-3 bg-red-100 rounded-full">
          <MapPin className="h-6 w-6 text-red-600" />
        </div>
        <div className="text-center">
          <p className="text-red-600 font-medium">Error loading addresses</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="p-4 bg-gray-100 rounded-full">
          <Home className="h-8 w-8 text-gray-400" />
        </div>
        <div className="text-center">
          <p className="text-gray-500 font-medium">No addresses found</p>
          <p className="text-gray-400 text-sm">This user hasn&apos;t added any addresses yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {addresses.map((addr) => (
        <Card key={addr.id} className="border border-gray-200 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                {addr.label || 'Address'}
              </CardTitle>
              {addr.is_default && (
                <Badge variant="default" className="bg-blue-100 text-blue-800 flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Default
                </Badge>
              )}
            </div>
            <CardDescription className="flex items-center gap-2 text-gray-600">
              <User className="h-4 w-4" />
              {addr.contact_name}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Phone className="h-4 w-4 text-gray-400" />
              {addr.phone}
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="font-medium text-gray-900">{addr.address}</div>
              <div className="text-gray-600">
                {addr.city_name}, {addr.state_name} {addr.zip_code}
              </div>
              <div className="text-gray-600 font-medium">{addr.country_name}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 