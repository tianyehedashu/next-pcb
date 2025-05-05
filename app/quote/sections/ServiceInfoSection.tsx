import RadioGroup from "../RadioGroup";
import CheckboxGroup from "../CheckboxGroup";
import React from "react";
import { Tooltip } from "@/components/ui/tooltip";

export default function ServiceInfoSection({ form, errors, setForm, sectionRef }: any) {
  return (
    <div ref={sectionRef} className="scroll-mt-32">
      <div className="flex flex-col gap-3 text-xs">
        {/* Test Method */}
        <div className="flex items-center gap-4">
          <Tooltip content={<div className="max-w-xs text-left">Electrical test method for finished PCBs. Sample free: basic test; Paid: full test for all boards.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">Test Method</label>
          </Tooltip>
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
          <Tooltip content={<div className="max-w-xs text-left">Confirm production capacity before order. Auto: system confirms; Manual: staff confirms.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">Production Cap Confirmation</label>
          </Tooltip>
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
          <Tooltip content={<div className="max-w-xs text-left">Select which reports you need with your shipment, e.g. cut sheet, sample coupon, etc.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">Product Report</label>
          </Tooltip>
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
          <Tooltip content={<div className="max-w-xs text-left">Accept or reject boards that do not meet quality standards.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">Reject Board</label>
          </Tooltip>
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
          <Tooltip content={<div className="max-w-xs text-left">Special pin for assembly orientation. Required for some assembly processes.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">Yin Yang Pin</label>
          </Tooltip>
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
          <Tooltip content={<div className="max-w-xs text-left">Add customer-specific code or marking to the PCB.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">Customer Code</label>
          </Tooltip>
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
          <Tooltip content={<div className="max-w-xs text-left">Choose how to confirm and pay for your order.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">Payment Method</label>
          </Tooltip>
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
          <Tooltip content={<div className="max-w-xs text-left">Standard: basic quality documents. Full: all available quality documents (extra cost).</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">Quality Attachment</label>
          </Tooltip>
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
          <Tooltip content={<div className="max-w-xs text-left">Surface Mount Technology assembly service for your PCBs.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">SMT Assembly</label>
          </Tooltip>
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