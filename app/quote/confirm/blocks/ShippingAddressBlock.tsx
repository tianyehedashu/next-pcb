import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import React from "react";
import dynamic from "next/dynamic";

const ReactSelect = dynamic(() => import("react-select"), { ssr: false });

interface Option {
  value: string;
  label: string;
}

interface ShippingAddressBlockProps {
  country: string;
  setCountry: (v: string) => void;
  state: string;
  setState: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  zip: string;
  setZip: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  courier: string;
  setCourier: (v: string) => void;
  countryOptions: Option[];
  stateOptions: Option[];
  cityOptions: Option[];
  loadingCountry: boolean;
  loadingState: boolean;
  loadingCity: boolean;
  userNote: string;
  setUserNote: (v: string) => void;
}

export default function ShippingAddressBlock(props: ShippingAddressBlockProps) {
  const {
    country, setCountry,
    state, setState,
    city, setCity,
    zip, setZip,
    phone, setPhone,
    email, setEmail,
    address, setAddress,
    courier, setCourier,
    countryOptions, stateOptions, cityOptions,
    loadingCountry, loadingState, loadingCity,
    userNote, setUserNote,
  } = props;

  return (
    <Card className="shadow-lg border-blue-100 bg-white/90">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-xl font-bold text-blue-700">Shipping Address</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-semibold text-blue-700">Country <span className="text-red-500">*</span></label>
            <ReactSelect
              className="mt-1"
              isLoading={loadingCountry}
              isDisabled={loadingCountry}
              options={countryOptions}
              value={countryOptions.find(opt => opt.value === country) || undefined}
              onChange={(option: any) => setCountry(option ? option.value : "")}
              placeholder={loadingCountry ? "Loading..." : "Select country"}
              isClearable
              styles={{
                control: (base: any) => ({
                  ...base,
                  minHeight: 40,
                  borderColor: "#cbd5e1",
                  boxShadow: "none",
                  '&:hover': { borderColor: "#3b82f6" },
                }),
                menu: (base: any) => ({
                  ...base,
                  zIndex: 9999,
                }),
              }}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-blue-700">State/Province <span className="text-red-500">*</span></label>
            <ReactSelect
              className="mt-1"
              isLoading={loadingState}
              isDisabled={!country || loadingState}
              options={stateOptions}
              value={stateOptions.find(opt => opt.value === state) || undefined}
              onChange={(option: any) => {
                setState(option ? option.value : "");
                setCity("");
              }}
              placeholder={
                loadingState
                  ? "Loading..."
                  : (!country
                      ? "Select Country First"
                      : (stateOptions.length === 0 ? "No states available" : "Select state/province"))
              }
              isClearable
              styles={{
                control: (base: any) => ({
                  ...base,
                  minHeight: 40,
                  borderColor: "#cbd5e1",
                  boxShadow: "none",
                  '&:hover': { borderColor: "#3b82f6" },
                }),
                menu: (base: any) => ({
                  ...base,
                  zIndex: 9999,
                }),
              }}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-blue-700">City <span className="text-red-500">*</span></label>
            <ReactSelect
              className="mt-1"
              isLoading={loadingCity}
              isDisabled={!state || loadingCity}
              options={cityOptions}
              value={cityOptions.find(opt => opt.value === city) || undefined}
              onChange={(option: any) => setCity(option ? option.value : "")}
              placeholder={
                loadingCity
                  ? "Loading..."
                  : (!state
                      ? "Select State First"
                      : (cityOptions.length === 0 ? "No cities available" : "Select city"))
              }
              isClearable
              styles={{
                control: (base: any) => ({
                  ...base,
                  minHeight: 40,
                  borderColor: "#cbd5e1",
                  boxShadow: "none",
                  '&:hover': { borderColor: "#3b82f6" },
                }),
                menu: (base: any) => ({
                  ...base,
                  zIndex: 9999,
                }),
              }}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-blue-700">Zip/Postal Code <span className="text-red-500">*</span></label>
            <Input className="mt-1" value={zip} onChange={e => setZip(e.target.value)} placeholder="Enter zip/postal code" />
          </div>
          <div>
            <label className="text-sm font-semibold text-blue-700">Phone <span className="text-red-500">*</span></label>
            <Input className="mt-1" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter phone number" />
          </div>
          <div>
            <label className="text-sm font-semibold text-blue-700">Email <span className="text-red-500">*</span></label>
            <Input className="mt-1" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter email address" />
          </div>
          <div className="col-span-2">
            <label className="text-sm font-semibold text-blue-700">Detailed Address <span className="text-red-500">*</span></label>
            <Input className="mt-1" value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter your detailed address" />
          </div>
          <div className="col-span-2">
            <label className="text-sm font-semibold text-blue-700">Courier <span className="text-red-500">*</span></label>
            <select className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-400" value={courier} onChange={e => setCourier(e.target.value as any)}>
              <option key="default" value="">Select Courier</option>
              <option key="dhl" value="dhl">DHL Express</option>
              <option key="fedex" value="fedex">FedEx International</option>
              <option key="ups" value="ups">UPS Worldwide</option>
            </select>
          </div>
        </div>
        <div className="col-span-2">
          <label className="text-sm font-semibold text-blue-700">User Note</label>
          <Input className="mt-1" value={userNote} onChange={e => setUserNote(e.target.value)} placeholder="Enter any note for your order (optional)" />
        </div>
      </CardContent>
    </Card>
  );
} 