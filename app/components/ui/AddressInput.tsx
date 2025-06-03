import React from "react";
import { connect, mapProps } from "@formily/react";
import { AddressFormComponent } from "@/app/quote2/components/AddressFormComponent";

interface AddressValue {
  id?: string;
  country: string;
  state?: string;
  city: string;
  address: string;
  zipCode: string;
  phone?: string;
  contactName: string;
  courier?: string;
  isDefault?: boolean;
  label?: string;
}

interface AddressInputProps {
  value?: AddressValue;
  onChange?: (value: AddressValue) => void;
  disabled?: boolean;
  userId?: string; // 用户ID，用于获取地址列表
}

const AddressInput: React.FC<AddressInputProps> = ({ value, onChange, disabled, userId }) => {
  // 如果组件被禁用，显示只读版本
  if (disabled) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 w-full">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📍</span>
          <h4 className="text-lg font-semibold text-gray-600">Shipping Address (Read Only)</h4>
        </div>
        <div className="space-y-2 text-sm text-gray-600">
          <div><strong>Contact:</strong> {value?.contactName || 'N/A'}</div>
          <div><strong>Phone:</strong> {value?.phone || 'N/A'}</div>
          <div><strong>Address:</strong> {value?.address || 'N/A'}</div>
          <div><strong>City:</strong> {value?.city || 'N/A'}</div>
          <div><strong>State:</strong> {value?.state || 'N/A'}</div>
          <div><strong>ZIP:</strong> {value?.zipCode || 'N/A'}</div>
          <div><strong>Country:</strong> {value?.country || 'N/A'}</div>
          <div><strong>Courier:</strong> {value?.courier || 'N/A'}</div>
        </div>
      </div>
    );
  }

  return (
    <AddressFormComponent
      value={value}
      onChange={onChange}
      userId={userId}
    />
  );
};

export default connect(
  AddressInput,
  mapProps((props) => {
    return {
      ...props,
    };
  })
); 