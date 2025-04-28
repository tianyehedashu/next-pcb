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

function RadioGroup({ name, options, value, onChange }: any) {
  return (
    <div className="flex flex-wrap gap-2">
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
    <div className="flex flex-wrap gap-4">
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

function SideInfoPanel() {
  return (
    <div className="flex flex-col gap-4 w-full max-w-xs">
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
    singleLength: "",
    singleWidth: "",
    singleCount: "",
    border: "none",
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
        <aside className="hidden md:flex flex-col w-64 gap-2 fixed left-8 top-1/2 -translate-y-1/2 z-30">
          <div className="bg-white/80 shadow-md border border-blue-100 rounded-xl py-4">
            <Tabs
              value={sectionList[activeSection].label}
              onValueChange={v => {
                const idx = sectionList.findIndex(sec => sec.label === v);
                if (idx !== -1) sectionRefs[idx].current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              orientation="vertical"
            >
              <Tab tabValue="Basic Information" icon={<MapPin size={18} />}>
                Basic Information
              </Tab>
              <Tab tabValue="Process Information">
                Process Information
              </Tab>
              <Tab tabValue="Service Information">
                Service Information
              </Tab>
            </Tabs>
          </div>
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
        <div className="flex-1 flex flex-row justify-center max-w-6xl mx-auto gap-6">
          <main className="flex-1 max-w-full ml-32">
            <Card>
              <CardHeader>
                <CardTitle>PCB Instant Quote</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="flex flex-col gap-6">
                  {/* Basic Information */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div ref={sectionRefs[0]} className="scroll-mt-32">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block mb-1 font-medium">PCB Type</label>
                            <RadioGroup
                              name="pcbType"
                              options={[
                                { value: "fr4", label: "FR-4" },
                                { value: "aluminum", label: "Aluminum" },
                                { value: "rogers", label: "Rogers" },
                                { value: "flex", label: "Flex" },
                                { value: "rigid-flex", label: "Rigid-Flex" },
                              ]}
                              value={form.pcbType}
                              onChange={(v: string) => setForm({ ...form, pcbType: v })}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 font-medium">Layers</label>
                            <RadioGroup
                              name="layers"
                              options={Array.from({ length: 12 }, (_, i) => ({
                                value: i + 1,
                                label: `${i + 1}`,
                              }))}
                              value={form.layers}
                              onChange={(v: number) => setForm({ ...form, layers: v })}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 font-medium">Board Thickness (mm)</label>
                            <RadioGroup
                              name="thickness"
                              options={["0.6","0.8","1.0","1.2","1.6","2.0","2.5","3.0","3.2"].map(v => ({ value: v, label: v }))}
                              value={form.thickness}
                              onChange={(v: string) => setForm({ ...form, thickness: v })}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 font-medium">Board Color</label>
                            <RadioGroup
                              name="boardColor"
                              options={["green","blue","red","black","white","yellow"].map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))}
                              value={form.boardColor}
                              onChange={(v: string) => setForm({ ...form, boardColor: v })}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 font-medium">HDI (Blind/Buried Vias)</label>
                            <RadioGroup
                              name="hdi"
                              options={[
                                { value: "none", label: "None" },
                                { value: "1step", label: "1 Step" },
                                { value: "2step", label: "2 Step" },
                                { value: "3step", label: "3 Step" },
                              ]}
                              value={form.hdi}
                              onChange={(v: string) => setForm({ ...form, hdi: v })}
                            />
                          </div>
                          <div>
                            <Tooltip content="TG Value (Glass Transition Temperature) indicates the temperature at which the PCB base material changes from glassy to rubbery state. Higher TG means better heat resistance.">
                              <label className="block mb-1 font-medium cursor-help">TG Value</label>
                            </Tooltip>
                            <RadioGroup
                              name="tg"
                              options={[
                                { value: "TG170", label: "TG170" },
                                { value: "TG150", label: "TG150" },
                                { value: "TG135", label: "TG135" },
                              ]}
                              value={form.tg}
                              onChange={(v: string) => setForm({ ...form, tg: v })}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 font-medium">Panel Count</label>
                            <Input
                              type="number"
                              min={1}
                              value={form.panelCount}
                              onChange={e => setForm({ ...form, panelCount: Number(e.target.value) })}
                            />
                            <span className="text-xs text-muted-foreground">How many different panels in the file <span className="text-blue-600 cursor-pointer">Example</span></span>
                          </div>
                          <div>
                            <label className="block mb-1 font-medium">Shipment Type</label>
                            <RadioGroup
                              name="shipmentType"
                              options={[
                                { value: "single", label: "Single Piece" },
                                { value: "panel", label: "Panel (by file)" },
                                { value: "panel_agent", label: "Panel (Agent)" },
                              ]}
                              value={form.shipmentType}
                              onChange={(v: string) => setForm({ ...form, shipmentType: v })}
                            />
                          </div>
                          <div className="col-span-2 flex gap-2 items-end">
                            <div className="flex flex-col w-32">
                              <label className="block mb-1 font-medium">Single Length (cm)</label>
                              <Input
                                type="number"
                                min={0.1}
                                step={0.01}
                                placeholder="Length"
                                value={form.singleLength}
                                onChange={e => setForm({ ...form, singleLength: e.target.value })}
                                aria-invalid={!!errors.singleLength}
                              />
                            </div>
                            <span className="mb-2">×</span>
                            <div className="flex flex-col w-32">
                              <label className="block mb-1 font-medium">Single Width (cm)</label>
                              <Input
                                type="number"
                                min={0.1}
                                step={0.01}
                                placeholder="Width"
                                value={form.singleWidth}
                                onChange={e => setForm({ ...form, singleWidth: e.target.value })}
                                aria-invalid={!!errors.singleWidth}
                              />
                            </div>
                            <span className="text-destructive text-xs ml-2">* Required</span>
                          </div>
                          <div>
                            <label className="block mb-1 font-medium">Single Count</label>
                            <select
                              className="border rounded-md px-3 py-2 w-full text-sm"
                              value={form.singleCount}
                              onChange={e => setForm({ ...form, singleCount: e.target.value })}
                              aria-invalid={!!errors.singleCount}
                            >
                              <option value="">Select</option>
                              {[1,5,10,20,50,100,200,500,1000].map(v => (
                                <option key={v} value={v}>{v} pcs</option>
                              ))}
                            </select>
                            {errors.singleCount && <span className="text-destructive text-xs">* Required</span>}
                          </div>
                          <div>
                            <label className="block mb-1 font-medium">Process Border (mm)</label>
                            <select
                              className="border rounded-md px-3 py-2 w-full text-sm"
                              value={form.border}
                              onChange={e => setForm({ ...form, border: e.target.value })}
                            >
                              <option value="none">None</option>
                              <option value="5">5</option>
                              <option value="10">10</option>
                            </select>
                            <span className="text-xs text-muted-foreground">If panelization, set ≥5mm. No border may increase cost.</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {/* Process Information */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Process Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div ref={sectionRefs[1]} className="scroll-mt-32">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block mb-1 font-medium">Board Thickness (mm)</label>
                            <RadioGroup
                              name="thickness"
                              options={["0.6","0.8","1.0","1.2","1.6","2.0","2.5","3.0","3.2"].map(v => ({ value: v, label: v }))}
                              value={form.thickness}
                              onChange={(v: string) => setForm({ ...form, thickness: v })}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 font-medium">Copper Weight (oz)</label>
                            <RadioGroup
                              name="copperWeight"
                              options={["1","2","3","4"].map(v => ({ value: v, label: v+"oz" }))}
                              value={form.copperWeight}
                              onChange={(v: string) => setForm({ ...form, copperWeight: v })}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 font-medium">Min Trace/Spacing (mil)</label>
                            <RadioGroup
                              name="minTrace"
                              options={["10/10","8/8","6/6","5/5","4/4","3.5/3.5"].map(v => ({ value: v, label: v }))}
                              value={form.minTrace}
                              onChange={(v: string) => setForm({ ...form, minTrace: v })}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 font-medium">Min Hole Size (mm)</label>
                            <RadioGroup
                              name="minHole"
                              options={["0.3","0.25","0.2","0.15"].map(v => ({ value: v, label: v }))}
                              value={form.minHole}
                              onChange={(v: string) => setForm({ ...form, minHole: v })}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 font-medium">Solder Mask Color</label>
                            <RadioGroup
                              name="solderMask"
                              options={["green","blue","red","yellow","black","white"].map(v => ({ value: v, label: v.charAt(0).toUpperCase()+v.slice(1) }))}
                              value={form.solderMask}
                              onChange={(v: string) => setForm({ ...form, solderMask: v })}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 font-medium">Silkscreen Color</label>
                            <RadioGroup
                              name="silkscreen"
                              options={[
                                { value: "white", label: "White" },
                                { value: "black", label: "Black" },
                              ]}
                              value={form.silkscreen}
                              onChange={(v: string) => setForm({ ...form, silkscreen: v })}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block mb-1 font-medium">Solder Mask Coverage</label>
                            <RadioGroup
                              name="maskCover"
                              options={[
                                { value: "cover", label: "Via Covering" },
                                { value: "open", label: "Via Opening" },
                                { value: "plug", label: "Via Plugging" },
                                { value: "plug_flat", label: "Via Plugging + Flat" },
                              ]}
                              value={form.maskCover || "cover"}
                              onChange={(v: string) => setForm({ ...form, maskCover: v })}
                            />
                            <div className="text-xs text-orange-500 mt-1">If Gerber file, select [Via Plugging] or [Via Opening] as needed. For special process, please contact us.</div>
                          </div>
                          <div>
                            <label className="block mb-1 font-medium">Castellated Holes</label>
                            <RadioGroup
                              name="castellated"
                              options={[
                                { value: "no", label: "None" },
                                { value: "yes", label: "Yes" },
                              ]}
                              value={form.castellated}
                              onChange={(v: string) => setForm({ ...form, castellated: v })}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 font-medium">Surface Finish</label>
                            <RadioGroup
                              name="surfaceFinish"
                              options={[
                                { value: "hasl", label: "HASL" },
                                { value: "leadfree", label: "Lead Free HASL" },
                                { value: "enig", label: "ENIG" },
                                { value: "osp", label: "OSP" },
                                { value: "immersion_silver", label: "Immersion Silver" },
                                { value: "immersion_tin", label: "Immersion Tin" },
                              ]}
                              value={form.surfaceFinish}
                              onChange={(v: string) => setForm({ ...form, surfaceFinish: v })}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 font-medium">Impedance Control</label>
                            <RadioGroup
                              name="impedance"
                              options={[
                                { value: "no", label: "None" },
                                { value: "yes", label: "Yes" },
                              ]}
                              value={form.impedance}
                              onChange={(v: string) => setForm({ ...form, impedance: v })}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 font-medium">Edge Gold Fingers</label>
                            <RadioGroup
                              name="goldFingers"
                              options={[
                                { value: "no", label: "None" },
                                { value: "yes", label: "Required" },
                              ]}
                              value={form.goldFingers}
                              onChange={(v: string) => setForm({ ...form, goldFingers: v })}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 font-medium">Edge Plating</label>
                            <RadioGroup
                              name="edgePlating"
                              options={[
                                { value: "no", label: "None" },
                                { value: "yes", label: "Required" },
                              ]}
                              value={form.edgePlating || "no"}
                              onChange={(v: string) => setForm({ ...form, edgePlating: v })}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 font-medium">Half Holes</label>
                            <RadioGroup
                              name="halfHole"
                              options={[
                                { value: "none", label: "None" },
                                { value: "1", label: "1 Side" },
                                { value: "2", label: "2 Sides" },
                                { value: "3", label: "3 Sides" },
                                { value: "4", label: "4 Sides" },
                                { value: "2half", label: "2 Sides Half" },
                                { value: "3half", label: "3 Sides Half" },
                                { value: "4half", label: "4 Sides Half" },
                              ]}
                              value={form.halfHole || "none"}
                              onChange={(v: string) => setForm({ ...form, halfHole: v })}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 font-medium">Edge Covering</label>
                            <RadioGroup
                              name="edgeCover"
                              options={[
                                { value: "none", label: "None" },
                                { value: "1", label: "1 Side" },
                                { value: "2", label: "2 Sides" },
                                { value: "3", label: "3 Sides" },
                                { value: "4", label: "4 Sides" },
                                { value: "2cover", label: "2 Sides Cover" },
                                { value: "3cover", label: "3 Sides Cover" },
                                { value: "4cover", label: "4 Sides Cover" },
                              ]}
                              value={form.edgeCover || "none"}
                              onChange={(v: string) => setForm({ ...form, edgeCover: v })}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {/* Service Information */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Service Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div ref={sectionRefs[2]} className="scroll-mt-32">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block mb-1 font-medium">Test Method</label>
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
                          <div>
                            <label className="block mb-1 font-medium">Production Cap Confirmation</label>
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
                          <div>
                            <label className="block mb-1 font-medium">Product Report</label>
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
                          <div>
                            <label className="block mb-1 font-medium">Reject Board</label>
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
                          <div>
                            <label className="block mb-1 font-medium">Yin Yang Pin</label>
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
                          <div>
                            <label className="block mb-1 font-medium">Customer Code</label>
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
                          <div>
                            <label className="block mb-1 font-medium">Payment Method</label>
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
                          <div>
                            <label className="block mb-1 font-medium">Quality Attachment</label>
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
                          <div>
                            <label className="block mb-1 font-medium">SMT Assembly</label>
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
                    </CardContent>
                  </Card>
                  <Button type="submit" className="w-full mt-2">
                    Get Quote
                  </Button>
                </form>
              </CardContent>
            </Card>
          </main>
          {/* 右侧信息栏 */}
          <aside className="hidden md:block w-64">
            <SideInfoPanel />
          </aside>
        </div>
      </div>
    </div>
  );
} 