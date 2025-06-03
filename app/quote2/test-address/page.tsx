"use client";

import React, { useState } from 'react';
import { AddressFormComponent } from '../components/AddressFormComponent';

interface AddressValue {
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
  label?: string;
}

export default function TestAddressPage() {
  const [address, setAddress] = useState<AddressValue>({
    country: '',
    state: '',
    city: '',
    address: '',
    zipCode: '',
    contactName: '',
    phone: '',
    courier: ''
  });

  // 模拟用户ID
  const userId = "test-user-123";

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Address Management Test</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Current Address Data:</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(address, null, 2)}
        </pre>
      </div>

      <AddressFormComponent
        value={address}
        onChange={setAddress}
        userId={userId}
      />
    </div>
  );
} 