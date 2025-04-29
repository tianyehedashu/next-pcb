import React, { useRef, useState, useEffect } from "react";
import BasicInfoSection from "./sections/BasicInfoSection";
import ProcessInfoSection from "./sections/ProcessInfoSection";
import ServiceInfoSection from "./sections/ServiceInfoSection";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Layers, Settings, UserCheck, UploadCloud } from "lucide-react";
import JSZip from "jszip";
import { createParser } from "@tracespace/parser";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { fieldMap, mapFormToBackend } from '@/lib/fieldMap';

export default function QuoteForm({ form, errors, setForm, setErrors, sectionRefs }: any) {
  const [debugInfo, setDebugInfo] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleGerberUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDebugInfo("Parsing...\n");
    try {
      let files: { name: string; content: Uint8Array }[] = [];
      if (file.name.endsWith(".zip")) {
        const zip = await JSZip.loadAsync(file);
        for (const fname of Object.keys(zip.files)) {
          const entry = zip.files[fname];
          if (!entry.dir && /\.(gbr|gbx|gtl|gbl|gts|gbs|gto|gbo|gml|gm1|gm2|drl|txt)$/i.test(fname)) {
            const content = await entry.async("uint8array");
            files.push({ name: fname, content });
          }
        }
      } else {
        const arrayBuffer = await file.arrayBuffer();
        files.push({ name: file.name, content: new Uint8Array(arrayBuffer) });
      }
      setDebugInfo((d) => d + `Found ${files.length} Gerber/Drill files\n`);
      let layerCount = 0;
      let minTrace = Infinity;
      let minHole = Infinity;
      let boardOutline = null;
      let copperWeight = "1";
      let solderMask = "green";
      let silkscreen = "white";
      let goldFingers = "no";
      let castellated = "no";
      let edgePlating = "no";
      let halfHole = "none";
      let edgeCover = "none";
      let maskCover = "cover";
      let singleLength = form.singleLength;
      let singleWidth = form.singleWidth;
      let layers = 2;
      for (const f of files) {
        try {
          const parser = createParser();
          const text = new TextDecoder().decode(f.content);
          parser.feed(text);
          const result = parser.results();
          setDebugInfo((d) => d + `Parsed: ${f.name}\n`);
          if (result.filetype === "gerber") {
            if (/top/i.test(f.name)) layers = Math.max(layers, 2);
            if (/bot/i.test(f.name)) layers = Math.max(layers, 2);
            if (/inner/i.test(f.name)) layers = Math.max(layers, 4);
            const findMinTrace = (node: any) => {
              if (!node) return;
              if (Array.isArray(node.children)) {
                for (const child of node.children) findMinTrace(child);
              }
              if (node.type === "graphic" && node.graphic === "segment" && node.width) {
                minTrace = Math.min(minTrace, node.width * 1000);
              }
            };
            findMinTrace(result);
            if (/solder/i.test(f.name)) solderMask = /green/i.test(f.name) ? "green" : solderMask;
            if (/silk/i.test(f.name)) silkscreen = /white/i.test(f.name) ? "white" : silkscreen;
            if (/gold/i.test(f.name)) goldFingers = "yes";
            if (/castell/i.test(f.name)) castellated = "yes";
            if (/edgeplating/i.test(f.name)) edgePlating = "yes";
            if (/half/i.test(f.name)) halfHole = "1";
          }
          if (result.filetype === "drill") {
            const findMinHole = (node: any) => {
              if (!node) return;
              if (Array.isArray(node.children)) {
                for (const child of node.children) findMinHole(child);
              }
              if (node.type === "toolDefinition" && node.hole && node.hole.diameter) {
                minHole = Math.min(minHole, node.hole.diameter);
              }
            };
            findMinHole(result);
          }
        } catch (err: any) {
          setDebugInfo((d) => d + `解析失败: ${f.name} - ${err.message}\n`);
        }
      }
      setForm((prev: any) => ({
        ...prev,
        layers,
        minTrace: minTrace !== Infinity ? (minTrace <= 4 ? "4/4" : minTrace <= 6 ? "6/6" : "10/10") : prev.minTrace,
        minHole: minHole !== Infinity ? (minHole <= 0.2 ? "0.2" : minHole <= 0.3 ? "0.3" : "0.4") : prev.minHole,
        solderMask,
        silkscreen,
        goldFingers,
        castellated,
        edgePlating,
        halfHole,
        edgeCover,
        maskCover,
        singleLength,
        singleWidth,
        copperWeight,
        gerber: file,
      }));
      setDebugInfo((d) => d + `\n自动填充完成！\n`);
    } catch (err: any) {
      setDebugInfo((d) => d + `解析异常: ${err.message}\n`);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setDebugInfo("");
    // 判断用户是否登录
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.localStorage.setItem("quote_auto_submit", "1");
      alert("Please login to continue your quote.");
      router.push("/auth?redirect=quote");
      return;
    }
    // 组装所有需要传递的数据
    setForm({
      ...form,
      // 可扩展：quotePrice, gerberFiles 等
    });
    router.push("/quote/confirm");
  }

  return (
    <form id="quote-form" className="flex flex-col gap-4 text-xs" onSubmit={handleSubmit}>
      <div className="flex items-center gap-3 mb-2">
        <input
          type="file"
          accept=".zip,.gbr,.gtl,.gbl,.gts,.gbs,.gto,.gbo,.drl,.txt"
          ref={fileInputRef}
          onChange={e => { handleGerberUpload(e); e.target.value = ""; }}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud size={16} /> Upload Gerber/Zip
        </Button>
        <span className="text-muted-foreground text-xs">Auto parse and fill PCB parameters</span>
      </div>
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
      <div className="mt-4 p-3 bg-slate-100 rounded text-xs text-left whitespace-pre-wrap border border-blue-100 text-blue-900">
        <b>Debug Info:</b>\n{debugInfo}
      </div>
    </form>
  );
} 