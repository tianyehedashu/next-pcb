import React from "react";
import BasicInfoSection from "./sections/BasicInfoSection";
import ProcessInfoSection from "./sections/ProcessInfoSection";
import ServiceInfoSection from "./sections/ServiceInfoSection";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Layers, Settings, UserCheck } from "lucide-react";

export default function QuoteForm({ form, errors, setForm, setErrors, sectionRefs }: any) {
  return (
    <form className="flex flex-col gap-4 text-xs">
      <Card className="mb-4 rounded-2xl shadow-lg border-blue-100">
        <CardHeader className="pb-1 flex flex-row items-center gap-2 bg-gradient-to-r from-blue-50 to-white rounded-t-2xl">
          <Layers className="text-blue-600" size={18} />
          <CardTitle className="text-base font-bold tracking-wide">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-3 pb-4 px-4">
          <BasicInfoSection form={form} errors={errors} setForm={setForm} sectionRef={sectionRefs[0]} />
        </CardContent>
      </Card>
      <Card className="mb-4 rounded-2xl shadow-lg border-blue-100">
        <CardHeader className="pb-1 flex flex-row items-center gap-2 bg-gradient-to-r from-blue-50 to-white rounded-t-2xl">
          <Settings className="text-blue-600" size={18} />
          <CardTitle className="text-base font-bold tracking-wide">Process Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-3 pb-4 px-4">
          <ProcessInfoSection form={form} errors={errors} setForm={setForm} sectionRef={sectionRefs[1]} />
        </CardContent>
      </Card>
      <Card className="mb-4 rounded-2xl shadow-lg border-blue-100">
        <CardHeader className="pb-1 flex flex-row items-center gap-2 bg-gradient-to-r from-blue-50 to-white rounded-t-2xl">
          <UserCheck className="text-blue-600" size={18} />
          <CardTitle className="text-base font-bold tracking-wide">Service Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-3 pb-4 px-4">
          <ServiceInfoSection form={form} errors={errors} setForm={setForm} sectionRef={sectionRefs[2]} />
        </CardContent>
      </Card>
      <Button type="submit" className="w-full mt-2 h-10 text-xs font-semibold rounded-xl">
        Get Quote
      </Button>
    </form>
  );
} 