import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import React from "react";

export default function SideInfoPanel() {
  return (
    <div className="flex flex-col gap-4 w-full max-w-xs text-sm">
      {/* Production Cycle */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Production Cycle</span>
            <a href="#" className="text-blue-600 text-xs underline">Shipping Standard</a>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="border rounded-md bg-slate-50 mb-2">
            <table className="w-full text-xs text-center">
              <thead>
                <tr className="border-b">
                  <th className="py-1 font-medium">#</th>
                  <th className="py-1 font-medium">Cycle</th>
                  <th className="py-1 font-medium">Oil</th>
                  <th className="py-1 font-medium">Thickness</th>
                  <th className="py-1 font-medium">Urgent</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="py-2 text-muted-foreground">No cycle</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="text-xs text-muted-foreground mb-3">
            No shipping time yet, please fill in the parameters.
            <ul className="list-disc pl-4 mt-1">
              <li><span className="text-red-500">18:00</span> order, test board: <span className="font-semibold">1 day</span></li>
              <li><span className="text-red-500">21:00</span> after, test board: <span className="font-semibold">1 day</span></li>
              <li>User order not scheduled, production cycle is consistent with <span className="font-semibold">Monday</span></li>
            </ul>
          </div>
        </CardContent>
      </Card>
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