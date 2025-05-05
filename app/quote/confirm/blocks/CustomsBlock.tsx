import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import React from "react";

interface CustomsBlockProps {
  declarationMethod: string;
  setDeclarationMethod: (v: string) => void;
  companyName: string;
  setCompanyName: (v: string) => void;
  taxId: string;
  setTaxId: (v: string) => void;
  personalId: string;
  setPersonalId: (v: string) => void;
  purpose: string;
  setPurpose: (v: string) => void;
  declaredValue: string;
  setDeclaredValue: (v: string) => void;
  customsNote: string;
  setCustomsNote: (v: string) => void;
  countryRequiresTaxId: boolean;
  countryRequiresPersonalId: boolean;
}

export default function CustomsBlock(props: CustomsBlockProps) {
  const {
    declarationMethod, setDeclarationMethod,
    companyName, setCompanyName,
    taxId, setTaxId,
    personalId, setPersonalId,
    purpose, setPurpose,
    declaredValue, setDeclaredValue,
    customsNote, setCustomsNote,
    countryRequiresTaxId,
    countryRequiresPersonalId,
  } = props;

  return (
    <Card className="shadow-lg border-blue-100 bg-white/90 mt-8">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-xl font-bold text-blue-700">Customs Declaration Information</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-semibold text-blue-700">Declaration Method <span className="text-red-500">*</span></label>
            <Select value={declarationMethod} onValueChange={v => { setDeclarationMethod(v); setPurpose(""); setDeclaredValue(""); setTaxId(""); setPersonalId(""); }}>
              <SelectTrigger className="mt-1" size="default">
                <SelectValue placeholder="Select declaration method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self">Self-declare</SelectItem>
                <SelectItem value="agent">Agent declare (by courier)</SelectItem>
                <SelectItem value="dutyfree">Duty Free</SelectItem>
                <SelectItem value="ddp">DDP (Delivered Duty Paid)</SelectItem>
                <SelectItem value="dap">DAP (Delivered At Place)</SelectItem>
              </SelectContent>
            </Select>
            {(["agent", "ddp"].includes(declarationMethod)) && (
              <div className="text-xs text-blue-600 mt-1">The courier will assist with customs declaration. Please ensure all information is accurate and complete.</div>
            )}
          </div>
          {declarationMethod !== "dutyfree" && (
            <>
              <div>
                <label className="text-sm font-semibold text-blue-700">Company Name (optional)</label>
                <Input className="mt-1" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Enter company name" />
              </div>
              <div>
                <label className="text-sm font-semibold text-blue-700">Tax ID / VAT ID / EORI{countryRequiresTaxId && <span className="text-red-500">*</span>}</label>
                <Input className="mt-1" value={taxId} onChange={e => setTaxId(e.target.value)} placeholder="Enter tax or VAT ID" required={countryRequiresTaxId} />
              </div>
              <div>
                <label className="text-sm font-semibold text-blue-700">Personal ID / Passport No.{countryRequiresPersonalId && <span className="text-red-500">*</span>}</label>
                <Input className="mt-1" value={personalId} onChange={e => setPersonalId(e.target.value)} placeholder="Enter personal ID or passport number" required={countryRequiresPersonalId} />
              </div>
              <div>
                <label className="text-sm font-semibold text-blue-700">Purpose <span className="text-red-500">*</span></label>
                <Select value={purpose} onValueChange={setPurpose}>
                  <SelectTrigger className="mt-1" size="default">
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="sample">Sample</SelectItem>
                    <SelectItem value="gift">Gift</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold text-blue-700">Declared Value (USD) <span className="text-red-500">*</span></label>
                <Input className="mt-1" value={declaredValue} onChange={e => setDeclaredValue(e.target.value)} placeholder="Enter declared value" required />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-semibold text-blue-700">Customs Note</label>
                <Input className="mt-1" value={customsNote} onChange={e => setCustomsNote(e.target.value)} placeholder="Any note for customs (optional)" />
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 