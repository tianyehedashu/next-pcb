import React from "react";
import { connect, mapProps } from "@formily/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CustomsValue {
  declarationMethod?: string;
  taxId?: string;
  personalId?: string;
  purpose?: string;
  declaredValue?: string;
  companyName?: string;
  customsNote?: string;
}

interface CustomsInputProps {
  value?: CustomsValue;
  onChange?: (value: CustomsValue) => void;
  disabled?: boolean;
}

const CustomsInput: React.FC<CustomsInputProps> = ({ value, onChange, disabled }) => {
  const handleChange = (field: keyof CustomsValue, fieldValue: string) => {
    const newValue = { ...value, [field]: fieldValue };
    onChange?.(newValue);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="declarationMethod">Declaration Method</Label>
          <Input
            id="declarationMethod"
            value={value?.declarationMethod || ""}
            onChange={(e) => handleChange("declarationMethod", e.target.value)}
            disabled={disabled}
            placeholder="Enter declaration method"
          />
        </div>
        <div>
          <Label htmlFor="purpose">Purpose</Label>
          <Input
            id="purpose"
            value={value?.purpose || ""}
            onChange={(e) => handleChange("purpose", e.target.value)}
            disabled={disabled}
            placeholder="Enter purpose"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="taxId">Tax ID</Label>
          <Input
            id="taxId"
            value={value?.taxId || ""}
            onChange={(e) => handleChange("taxId", e.target.value)}
            disabled={disabled}
            placeholder="Enter tax ID"
          />
        </div>
        <div>
          <Label htmlFor="personalId">Personal ID</Label>
          <Input
            id="personalId"
            value={value?.personalId || ""}
            onChange={(e) => handleChange("personalId", e.target.value)}
            disabled={disabled}
            placeholder="Enter personal ID"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="declaredValue">Declared Value</Label>
          <Input
            id="declaredValue"
            value={value?.declaredValue || ""}
            onChange={(e) => handleChange("declaredValue", e.target.value)}
            disabled={disabled}
            placeholder="Enter declared value"
          />
        </div>
        <div>
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            value={value?.companyName || ""}
            onChange={(e) => handleChange("companyName", e.target.value)}
            disabled={disabled}
            placeholder="Enter company name"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="customsNote">Customs Note</Label>
        <Textarea
          id="customsNote"
          value={value?.customsNote || ""}
          onChange={(e) => handleChange("customsNote", e.target.value)}
          disabled={disabled}
          placeholder="Additional customs information..."
          maxLength={500}
        />
      </div>
    </div>
  );
};

export default connect(
  CustomsInput,
  mapProps((props) => {
    return {
      ...props,
    };
  })
); 