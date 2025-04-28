'use client';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { useState, useRef } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { MapPin } from "lucide-react";
import { Tabs, Tab } from "@/components/ui/tabs";
import QuoteForm from "./QuoteForm";
import SectionNav from "./SectionNav";
import SideInfoPanel from "./SideInfoPanel";

function RadioGroup({ name, options, value, onChange }: any) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt: any) => (
        <button
          type="button"
          key={opt.value}
          className={`px-4 py-2 rounded-md border text-sm font-medium transition-all ${
            value === opt.value
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
          }`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function CheckboxGroup({ name, options, value, onChange }: any) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt: any) => (
        <label key={opt.value} className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={value.includes(opt.value)}
            onChange={() => {
              if (value.includes(opt.value)) {
                onChange(value.filter((v: any) => v !== opt.value));
              } else {
                onChange([...value, opt.value]);
              }
            }}
            className="accent-blue-600"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

export default function QuotePage() {
  // 表单状态
  const [form, setForm] = useState({
    pcbType: "fr4",
    layers: 2,
    thickness: "1.6",
    boardColor: "green",
    surfaceFinish: "hasl",
    copperWeight: "1",
    minTrace: "6/6",
    minHole: "0.2",
    solderMask: "green",
    silkscreen: "white",
    goldFingers: "no",
    castellated: "no",
    impedance: "no",
    flyingProbe: "no",
    quantity: 10,
    delivery: "standard",
    gerber: null as File | null,
    hdi: "none",
    tg: "TG170",
    panelCount: 1,
    shipmentType: "single",
    singleLength: "10",
    singleWidth: "10",
    singleCount: "10",
    border: "5",
    maskCover: "cover",
    edgePlating: "no",
    halfHole: "none",
    edgeCover: "none",
    testMethod: "free",
    prodCap: "auto",
    productReport: ["none"],
    rejectBoard: "accept",
    yyPin: "none",
    customerCode: "none",
    payMethod: "auto",
    qualityAttach: "standard",
    smt: "none",
  });
  const [errors, setErrors] = useState<any>({});

  // 当前分区索引
  const [activeSection, setActiveSection] = useState(0);
  const sectionRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const sectionList = [
    { label: "Basic Information" },
    { label: "Process Information" },
    { label: "Service Information" },
  ];

  // 滚动监听，自动高亮当前分区
  function handleScroll() {
    const offsets = sectionRefs.map(ref => ref.current?.getBoundingClientRect().top ?? 9999);
    const active = offsets.findIndex(offset => offset > 60);
    setActiveSection(active === -1 ? 2 : Math.max(0, active - 1));
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 pt-16">
      <div className="relative flex flex-row w-full min-h-[600px]">
        {/* 左侧分区导航（fixed） */}
        <aside className="hidden md:flex flex-col w-64 gap-3 fixed left-8 top-1/2 -translate-y-1/2 z-30">
          <SectionNav
            sectionList={sectionList}
            activeSection={activeSection}
            onTabChange={setActiveSection}
            sectionRefs={sectionRefs}
          />
          {/* PCB Cost Details Card */}
          <Card className="py-2">
            <CardHeader className="py-2">
              <span className="font-semibold text-sm">PCB Cost Details</span>
            </CardHeader>
            <CardContent className="py-2">
              <div className="border rounded-md bg-slate-50 text-xs text-muted-foreground mb-2 p-2">No price yet, please fill in parameters</div>
            </CardContent>
          </Card>
          {/* Cost Details Card 吸底 */}
          <Card className="py-2">
            <CardHeader className="py-2">
              <span className="font-semibold text-sm">Cost Details</span>
            </CardHeader>
            <CardContent className="py-2">
              <div className="border rounded-md bg-slate-50 text-xs mb-2 p-2">
                <div className="flex justify-between"><span>PCB Cost:</span><span>¥ 0.00</span></div>
                <div className="flex justify-between"><span>Shipping:</span><span>¥ 0.00</span></div>
                <div className="flex justify-between"><span>Tax:</span><span>¥ 0.00</span></div>
                <div className="flex justify-between"><span>Discount:</span><span className="text-green-600">-¥ 0.00</span></div>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Estimated Total:</span>
                <span className="text-lg font-bold text-red-600">¥ 0.00</span>
              </div>
              <div className="text-xs text-muted-foreground">For reference only, final price is subject to review.</div>
            </CardContent>
          </Card>
        </aside>
        {/* 主内容和右侧信息栏容器 */}
        <div className="flex-1 flex flex-row justify-center max-w-6xl mx-auto gap-8">
          <main className="flex-1 max-w-3xl ml-32">
            <Card>
              <CardHeader>
                <CardTitle>PCB Instant Quote</CardTitle>
              </CardHeader>
              <CardContent>
                <QuoteForm
                  form={form}
                  errors={errors}
                  setForm={setForm}
                  setErrors={setErrors}
                  sectionRefs={sectionRefs}
                />
              </CardContent>
            </Card>
          </main>
          {/* 右侧信息栏 */}
          <aside className="hidden md:block w-80">
            <SideInfoPanel />
          </aside>
        </div>
      </div>
      <Button className="w-full mt-2 text-xs" type="button">Estimate Shipping & Tax</Button>
    </div>
  );
} 