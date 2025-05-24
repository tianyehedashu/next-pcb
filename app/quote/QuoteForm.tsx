import React, { useRef } from "react";
import BasicInfoSection from "./sections/BasicInfoSection";
import ProcessInfoSection from "./sections/ProcessInfoSection";
import ServiceInfoSection from "./sections/ServiceInfoSection";
import ShippingCostEstimationSection from "./sections/ShippingCostEstimationSection";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Layers, Settings, UserCheck, UploadCloud, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Tooltip } from "@/components/ui/tooltip";
import type { PcbQuoteForm } from "@/types/pcbQuoteForm";

export interface QuoteFormProps {
  form: PcbQuoteForm & { gerber?: File };
  errors: any;
  setForm: React.Dispatch<React.SetStateAction<PcbQuoteForm & { gerber?: File }>>;
  setErrors: React.Dispatch<React.SetStateAction<any>>;
  sectionRefs: React.RefObject<HTMLDivElement>[];
  setShippingCost: (cost: number) => void;
}

export default function QuoteForm({ form, errors, setForm, setErrors, sectionRefs, setShippingCost }: QuoteFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleGerberUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, gerber: file }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // 这里只做简单跳转，登录校验和后端交互可在父组件处理
    router.push("/quote/confirm");
  }

  return (
    <form id="quote-form" className="flex flex-col gap-4 text-xs w-full" onSubmit={handleSubmit}>
      <div className="flex items-center gap-3 mb-2">
        <input
          type="file"
          accept=".zip,.gbr,.gtl,.gbl,.gts,.gbs,.gto,.gbo,.drl,.txt"
          ref={fileInputRef}
          onChange={e => { handleGerberUpload(e); e.target.value = ""; }}
          className="hidden"
        />
        <Tooltip content={<div className="whitespace-pre-line max-w-xs text-left">Accepted formats: .zip, .gbr, .gtl, .gbl, .gts, .gbs, .gto, .gbo, .drl, .txt.\nUsed for auto parsing PCB parameters.</div>}>
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud size={16} /> Upload Gerber/Zip
          </Button>
        </Tooltip>
        {form.gerber && (
          <span className="text-xs text-blue-600 ml-2">{form.gerber.name}</span>
        )}
      </div>
      {/* Basic Information */}
      <Card className="mb-4 w-full">
        <CardHeader className="pb-1 flex flex-row items-center gap-2 border-b border-blue-100 bg-white">
          <Layers className="text-blue-600" size={20} />
          <CardTitle className="text-lg font-bold tracking-wide text-blue-800">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-2 pb-4 px-2 md:px-4">
          <BasicInfoSection form={form} errors={errors} setForm={setForm} sectionRef={sectionRefs[0]} />
        </CardContent>
      </Card>
      {/* Process Information */}
      <Card className="mb-4 w-full">
        <CardHeader className="pb-1 flex flex-row items-center gap-2 border-b border-blue-100 bg-white">
          <Settings className="text-blue-600" size={20} />
          <CardTitle className="text-lg font-bold tracking-wide text-blue-800">Process Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-2 pb-4 px-2 md:px-4">
          <ProcessInfoSection form={form} errors={errors} setForm={setForm} sectionRef={sectionRefs[1]} />
        </CardContent>
      </Card>
      {/* Service Information */}
      <Card className="mb-4 w-full">
        <CardHeader className="pb-1 flex flex-row items-center gap-2 border-b border-blue-100 bg-white">
          <UserCheck className="text-blue-600" size={20} />
          <CardTitle className="text-lg font-bold tracking-wide text-blue-800">Service Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-2 pb-4 px-2 md:px-4">
          <ServiceInfoSection form={form} errors={errors} setForm={setForm} sectionRef={sectionRefs[2]} />
        </CardContent>
      </Card>
      {/* Shipping Cost Estimation */}
      <Card className="mb-4 w-full">
        <CardHeader className="pb-1 flex flex-row items-center gap-2 border-b border-blue-100 bg-white">
          <Truck className="text-blue-600" size={20} />
          <CardTitle className="text-lg font-bold tracking-wide text-blue-800">Shipping Cost Estimation</CardTitle>
        </CardHeader>
        <CardContent className="pt-2 pb-4 px-2 md:px-4">
          <ShippingCostEstimationSection form={form} setShippingCost={setShippingCost} sectionRef={sectionRefs[3]} />
        </CardContent>
      </Card>
      <Button type="submit" className="w-full mt-2 mb-8 h-12 text-base font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition">Get Quote</Button>
    </form>
  );
} 