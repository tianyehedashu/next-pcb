import RadioGroup from "../RadioGroup";
import CheckboxGroup from "../CheckboxGroup";
import React from "react";

export default function ServiceInfoSection({ form, errors, setForm, sectionRef }: any) {
  return (
    <div ref={sectionRef} className="scroll-mt-32">
      <div className="flex flex-col gap-3 text-xs">
        {/* Test Method */}
        <div className="flex items-center gap-4">
          <label className="w-32 text-xs font-normal text-right">Test Method</label>
          <RadioGroup
            name="testMethod"
            options={[
              { value: "free", label: "Sample Free" },
              { value: "paid", label: "Paid" },
            ]}
            value={form.testMethod || "free"}
            onChange={(v: string) => setForm({ ...form, testMethod: v })}
          />
        </div>
        {/* Production Cap Confirmation */}
        <div className="flex items-center gap-4">
          <label className="w-32 text-xs font-normal text-right">Production Cap Confirmation</label>
          <RadioGroup
            name="prodCap"
            options={[
              { value: "none", label: "None" },
              { value: "manual", label: "Manual (no auto confirm)" },
              { value: "auto", label: "Auto (system auto confirm)" },
            ]}
            value={form.prodCap || "auto"}
            onChange={(v: string) => setForm({ ...form, prodCap: v })}
          />
        </div>
        {/* Product Report */}
        <div className="flex items-center gap-4">
          <label className="w-32 text-xs font-normal text-right">Product Report</label>
          <CheckboxGroup
            name="productReport"
            options={[
              { value: "none", label: "None" },
              { value: "shipment", label: "Shipment Report" },
              { value: "cut", label: "Cut Sheet" },
              { value: "sample", label: "Sample Coupon" },
            ]}
            value={form.productReport || ["none"]}
            onChange={(v: string[]) => setForm({ ...form, productReport: v })}
          />
        </div>
        {/* Reject Board */}
        <div className="flex items-center gap-4">
          <label className="w-32 text-xs font-normal text-right">Reject Board</label>
          <RadioGroup
            name="rejectBoard"
            options={[
              { value: "accept", label: "Accept" },
              { value: "reject", label: "Reject" },
            ]}
            value={form.rejectBoard || "accept"}
            onChange={(v: string) => setForm({ ...form, rejectBoard: v })}
          />
        </div>
        {/* Yin Yang Pin */}
        <div className="flex items-center gap-4">
          <label className="w-32 text-xs font-normal text-right">Yin Yang Pin</label>
          <RadioGroup
            name="yyPin"
            options={[
              { value: "none", label: "None" },
              { value: "need", label: "Required" },
            ]}
            value={form.yyPin || "none"}
            onChange={(v: string) => setForm({ ...form, yyPin: v })}
          />
        </div>
        {/* Customer Code */}
        <div className="flex items-center gap-4">
          <label className="w-32 text-xs font-normal text-right">Customer Code</label>
          <RadioGroup
            name="customerCode"
            options={[
              { value: "add", label: "Add Code" },
              { value: "add_pos", label: "Add Code (specify position)" },
              { value: "none", label: "None" },
            ]}
            value={form.customerCode || "none"}
            onChange={(v: string) => setForm({ ...form, customerCode: v })}
          />
        </div>
        {/* Payment Method */}
        <div className="flex items-center gap-4">
          <label className="w-32 text-xs font-normal text-right">Payment Method</label>
          <RadioGroup
            name="payMethod"
            options={[
              { value: "auto", label: "Auto Confirm & Pay" },
              { value: "manual", label: "Manual Confirm & Pay" },
            ]}
            value={form.payMethod || "auto"}
            onChange={(v: string) => setForm({ ...form, payMethod: v })}
          />
        </div>
        {/* Quality Attachment */}
        <div className="flex items-center gap-4">
          <label className="w-32 text-xs font-normal text-right">Quality Attachment</label>
          <RadioGroup
            name="qualityAttach"
            options={[
              { value: "standard", label: "Standard" },
              { value: "full", label: "Full (extra cost)" },
            ]}
            value={form.qualityAttach || "standard"}
            onChange={(v: string) => setForm({ ...form, qualityAttach: v })}
          />
        </div>
        {/* SMT Assembly */}
        <div className="flex items-center gap-4">
          <label className="w-32 text-xs font-normal text-right">SMT Assembly</label>
          <RadioGroup
            name="smt"
            options={[
              { value: "need", label: "Required" },
              { value: "none", label: "Not Required" },
            ]}
            value={form.smt || "none"}
            onChange={(v: string) => setForm({ ...form, smt: v })}
          />
        </div>
      </div>
    </div>
  );
} 