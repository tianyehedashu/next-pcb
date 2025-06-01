import React from "react";
import { connect, mapProps } from "@formily/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddressValue {
  country: string;
  state?: string;
  city: string;
  address: string;
  zipCode: string;
  phone?: string;
  contactName: string;
}

interface AddressInputProps {
  value?: AddressValue;
  onChange?: (value: AddressValue) => void;
  disabled?: boolean;
}

const AddressInput: React.FC<AddressInputProps> = ({ value, onChange, disabled }) => {
  const handleChange = (field: keyof AddressValue, fieldValue: string) => {
    const defaultValue = {
      country: "",
      city: "",
      address: "",
      zipCode: "",
      contactName: "",
      state: "",
      phone: "",
    };
    const newValue = { ...defaultValue, ...value, [field]: fieldValue };
    onChange?.(newValue);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="country">Country *</Label>
          <Input
            id="country"
            value={value?.country || ""}
            onChange={(e) => handleChange("country", e.target.value)}
            disabled={disabled}
            placeholder="Enter country"
          />
        </div>
        <div>
          <Label htmlFor="state">State/Province</Label>
          <Input
            id="state"
            value={value?.state || ""}
            onChange={(e) => handleChange("state", e.target.value)}
            disabled={disabled}
            placeholder="Enter state/province"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={value?.city || ""}
            onChange={(e) => handleChange("city", e.target.value)}
            disabled={disabled}
            placeholder="Enter city"
          />
        </div>
        <div>
          <Label htmlFor="zipCode">Zip Code *</Label>
          <Input
            id="zipCode"
            value={value?.zipCode || ""}
            onChange={(e) => handleChange("zipCode", e.target.value)}
            disabled={disabled}
            placeholder="Enter zip code"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          value={value?.address || ""}
          onChange={(e) => handleChange("address", e.target.value)}
          disabled={disabled}
          placeholder="Enter full address"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contactName">Contact Name *</Label>
          <Input
            id="contactName"
            value={value?.contactName || ""}
            onChange={(e) => handleChange("contactName", e.target.value)}
            disabled={disabled}
            placeholder="Enter contact name"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={value?.phone || ""}
            onChange={(e) => handleChange("phone", e.target.value)}
            disabled={disabled}
            placeholder="Enter phone number"
          />
        </div>
      </div>
    </div>
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