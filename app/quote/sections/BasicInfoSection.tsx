import { Input } from "@/components/ui/input";
import RadioGroup from "../RadioGroup";
import { Tooltip } from "@/components/ui/tooltip";
import React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import CustomNumberSelect from "@/app/components/custom-ui/CustomNumberSelect";

interface BasicInfoSectionProps {
  form: any;
  errors: any;
  setForm: (form: any) => void;
  sectionRef: React.RefObject<HTMLDivElement>;
}

export default function BasicInfoSection({ form, errors, setForm, sectionRef }: BasicInfoSectionProps) {
  // 联动配置
  const isSingle = form.shipmentType === "single";
  const isPanel = form.shipmentType === "panel" || form.shipmentType === "panel_agent";
  // 单位和label
  const sizeLabel = isSingle ? "Single Size (cm)" : "Panel Size (cm)";
  const countLabel = isSingle ? "Single Count" : "Panel Count";
  const countUnit = isSingle ? "Pcs" : "Set";
  const sizePlaceholder = isSingle ? ["Length/x", "Width/y"] : ["Length/x", "Width/y"];
  const countOptions = isSingle ? [1,5,10,20,50,100,200,500,1000] : [1,2,5,10,20,50,100];
  const sizeRequired = true;
  const countRequired = true;
  const borderTip = isPanel ? "If panelization, set ≥5mm. No border may increase cost." : "If you need panelization, suggest set border ≥5mm.";
  // 常用数量选项
  const commonCounts = [1, 5, 10, 20, 50, 100, 200, 500, 1000];

  return (
    <div ref={sectionRef} className="scroll-mt-32">
      <div className="flex flex-col gap-3 text-xs">
        {/* PCB Type */}
        <div className="flex items-center gap-4">
          <Tooltip content={<div className="max-w-xs text-left">Select the base material for your PCB. FR-4 is the most common.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">PCB Type</label>
          </Tooltip>
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
        {/* Layers */}
        <div className="flex items-center gap-4">
          <Tooltip content={<div className="max-w-xs text-left">Number of copper layers. More layers allow for complex circuits.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">Layers</label>
          </Tooltip>
          <RadioGroup
            name="layers"
            options={[1,2,4,6,8,10,12,14,16,18,20].map(v => ({ value: v, label: `${v}` }))}
            value={form.layers}
            onChange={(v: number) => setForm({ ...form, layers: v })}
          />
        </div>
        {/* Board Thickness */}
        <div className="flex items-center gap-4">
          <Tooltip content={<div className="max-w-xs text-left">Standard thickness is 1.6mm. Thicker boards are more robust but costlier.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">Board Thickness (mm)</label>
          </Tooltip>
          <RadioGroup
            name="thickness"
            options={["0.6","0.8","1.0","1.2","1.6","2.0","2.5","3.0","3.2"].map(v => ({ value: v, label: v }))}
            value={form.thickness}
            onChange={(v: string) => setForm({ ...form, thickness: v })}
          />
        </div>
        {/* HDI */}
        <div className="flex items-center gap-4">
          <Tooltip content={<div className="max-w-xs text-left">High Density Interconnect. Required for fine-pitch and high-layer-count PCBs.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">HDI (Blind/Buried Vias)</label>
          </Tooltip>
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
        {/* TG Value */}
        <div className="flex items-center gap-4">
          <Tooltip content={<div className="whitespace-pre-line max-w-xs text-left">TG Value (Glass Transition Temperature) indicates the temperature at which the PCB base material changes from glassy to rubbery state.\nHigher TG means better heat resistance.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">TG Value</label>
          </Tooltip>
          <RadioGroup
            name="tg"
            options={[
              { value: "TG130", label: "TG130" },
              { value: "TG150", label: "TG150" },
              { value: "TG170", label: "TG170" },
            ]}
            value={form.tg}
            onChange={(v: string) => setForm({ ...form, tg: v })}
          />
        </div>
        {/* Shipment Type */}
        <div className="flex items-center gap-4">
          <Tooltip content={<div className="max-w-xs text-left">Single: Individual boards. Panel: Multiple boards in one panel for assembly.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">Shipment Type</label>
          </Tooltip>
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
        {/* Size (cm) 联动label/placeholder/校验 */}
        <div className="flex items-center gap-4">
          <Tooltip content={<div className="max-w-xs text-left">Enter the finished size of your PCB in centimeters (cm).</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">{sizeLabel}</label>
          </Tooltip>
          <div className="flex items-center gap-3 flex-1">
            <Input
              type="number"
              min={0.1}
              step={0.01}
              placeholder={sizePlaceholder[0]}
              value={form.singleLength ?? ''}
              onChange={e => setForm({ ...form, singleLength: e.target.value })}
              aria-invalid={!!errors.singleLength}
              className="w-24"
            />
            <span className="mx-1">×</span>
            <Input
              type="number"
              min={0.1}
              step={0.01}
              placeholder={sizePlaceholder[1]}
              value={form.singleWidth ?? ''}
              onChange={e => setForm({ ...form, singleWidth: e.target.value })}
              aria-invalid={!!errors.singleWidth}
              className="w-24"
            />
            <span className="ml-2 text-xs text-muted-foreground">cm</span>
            {sizeRequired && <span className="text-destructive text-xs ml-2">* Required</span>}
          </div>
        </div>
        {/* Single Count 区块（批量选项+自定义输入+确定） */}
        <div className="flex items-center gap-2 mb-2">
          <Tooltip content={<div className="max-w-xs text-left">Total quantity of boards or panels you need.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">{countLabel}</label>
          </Tooltip>
          <CustomNumberSelect
            value={form.singleCount}
            onChange={v => setForm({ ...form, singleCount: v })}
            options={[5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 125, 150, 200, 250, 300, 350, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 6500, 7000, 7500, 9000]}
            unit={countUnit}
            placeholder="请选择"
          />
          <span className="ml-2 text-xs text-muted-foreground">{countUnit}</span>
        </div>
        {/* 工艺边框说明联动 */}
        <div className="flex items-center gap-4">
          <Tooltip content={<div className="max-w-xs text-left">If panelization, set border ≥5mm. No border may increase cost.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">Process Border (mm)</label>
          </Tooltip>
          <select
            className="border rounded-md px-3 py-2 flex-1 text-sm"
            value={form.border ?? ''}
            onChange={e => setForm({ ...form, border: e.target.value })}
          >
            <option value="none">None</option>
            <option value="5">5</option>
            <option value="10">10</option>
          </select>
          <span className="text-xs text-muted-foreground">{borderTip}</span>
        </div>
      </div>
    </div>
  );
} 