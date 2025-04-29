import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import React from "react";

export default function ShippingTaxEstimationPanel() {
  return (
    <div className="flex flex-col gap-4 w-full max-w-xs text-sm">
      {/* Shipping/Tax Estimation & Place Order */}
      <Card>
        <CardHeader>
          <span className="font-semibold">Shipping/Tax Estimation</span>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3">
            <div>
              <label className="block mb-1 font-medium">Country</label>
              <select className="border rounded-md px-3 py-2 w-full text-sm">
                <option value="">Select Country</option>
                <option value="us">United States</option>
                <option value="ca">Canada</option>
                <option value="uk">United Kingdom</option>
                <option value="de">Germany</option>
                <option value="fr">France</option>
                <option value="au">Australia</option>
                <option value="jp">Japan</option>
                <option value="cn">China</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">State / Province</label>
              <input className="border rounded-md px-3 py-2 w-full text-sm" placeholder="State or Province" />
            </div>
            <div>
              <label className="block mb-1 font-medium">City</label>
              <input className="border rounded-md px-3 py-2 w-full text-sm" placeholder="City" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Postal Code</label>
              <input className="border rounded-md px-3 py-2 w-full text-sm" placeholder="Postal Code" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Address Line</label>
              <input className="border rounded-md px-3 py-2 w-full text-sm" placeholder="Street, Building, etc." />
            </div>
            <div>
              <label className="block mb-1 font-medium">Courier</label>
              <select className="border rounded-md px-3 py-2 w-full text-sm">
                <option value="">Select Courier</option>
                <option value="dhl">DHL</option>
                <option value="fedex">FedEx</option>
                <option value="sf">SF Express</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Invoice Type</label>
              <select className="border rounded-md px-3 py-2 w-full text-sm">
                <option value="">Select Invoice Type</option>
                <option value="no">No Invoice</option>
                <option value="vat">VAT Invoice</option>
              </select>
            </div>
            <Button className="w-full mt-2" type="button">Estimate Shipping & Tax</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 