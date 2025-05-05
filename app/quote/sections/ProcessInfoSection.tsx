import RadioGroup from "../RadioGroup";
import React from "react";
import { Check } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";

export default function ProcessInfoSection({ form, errors, setForm, sectionRef }: any) {
  return (
    <div ref={sectionRef} className="scroll-mt-32">
      <div className="flex flex-col gap-3 text-xs">
        {/* Copper Weight (oz) */}
        <div className="flex items-center gap-4">
          <Tooltip content={<div className="max-w-xs text-left">Copper thickness per square foot. 1oz is standard for most PCBs.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">Copper Weight (oz)</label>
          </Tooltip>
          <RadioGroup
            name="copperWeight"
            options={["1","2","3","4"].map(v => ({ value: v, label: v+"oz" }))}
            value={form.copperWeight}
            onChange={(v: string) => setForm({ ...form, copperWeight: v })}
          />
        </div>
        {/* Min Trace/Spacing (mil) */}
        <div className="flex items-center gap-4">
          <Tooltip content={<div className="max-w-xs text-left">Minimum width and spacing of copper traces. Smaller values allow for denser routing but are harder to manufacture.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">Min Trace/Spacing (mil)</label>
          </Tooltip>
          <RadioGroup
            name="minTrace"
            options={["10/10","8/8","6/6","5/5","4/4","3.5/3.5"].map(v => ({ value: v, label: v }))}
            value={form.minTrace}
            onChange={(v: string) => setForm({ ...form, minTrace: v })}
          />
        </div>
        {/* Min Hole Size (mm) */}
        <div className="flex items-center gap-4">
          <Tooltip content={<div className="max-w-xs text-left">Smallest drill hole diameter allowed on your PCB.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">Min Hole Size (mm)</label>
          </Tooltip>
          <RadioGroup
            name="minHole"
            options={["0.3","0.25","0.2","0.15"].map(v => ({ value: v, label: v }))}
            value={form.minHole}
            onChange={(v: string) => setForm({ ...form, minHole: v })}
          />
        </div>
        {/* Solder Mask Color */}
        <div className="flex items-center gap-4">
          <Tooltip content={<div className="max-w-xs text-left">Protective layer color applied to PCB surface. Green is most common.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">Solder Mask Color</label>
          </Tooltip>
          <RadioGroup
            name="solderMask"
            options={[
              { value: "green", label: <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-green-500 border border-gray-300"></span>Green</span> },
              { value: "blue", label: <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-blue-500 border border-gray-300"></span>Blue</span> },
              { value: "red", label: <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-red-500 border border-gray-300"></span>Red</span> },
              { value: "yellow", label: <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-yellow-300 border border-gray-300"></span>Yellow</span> },
              { value: "black", label: <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-neutral-800 border border-gray-300"></span>Black</span> },
              { value: "white", label: <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-white border border-gray-300"></span>White</span> },
            ]}
            value={form.solderMask}
            onChange={(v: string) => setForm({ ...form, solderMask: v })}
          />
        </div>
        {/* Silkscreen Color */}
        <div className="flex items-center gap-4">
          <Tooltip content={<div className="max-w-xs text-left">Color of printed text/graphics on PCB. White is standard.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">Silkscreen Color</label>
          </Tooltip>
          <RadioGroup
            name="silkscreen"
            options={[
              { value: "white", label: <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-white border border-gray-300"></span>White</span> },
              { value: "black", label: <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-neutral-800 border border-gray-300"></span>Black</span> },
            ]}
            value={form.silkscreen}
            onChange={(v: string) => setForm({ ...form, silkscreen: v })}
          />
        </div>
        {/* Surface Finish */}
        <div className="flex items-center gap-4">
          <Tooltip content={<div className="max-w-xs text-left">Final coating on exposed copper pads. Affects solderability and shelf life.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">Surface Finish</label>
          </Tooltip>
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
        {/* Impedance Control */}
        <div className="flex items-center gap-4">
          <Tooltip content={<div className="max-w-xs text-left">Required for high-speed signal PCBs to ensure signal integrity.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">Impedance Control</label>
          </Tooltip>
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
        {/* Castellated Holes */}
        <div className="flex items-center gap-4">
          <Tooltip content={<div className="max-w-xs text-left">Half-plated holes on PCB edge, used for board-to-board soldering.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">Castellated Holes</label>
          </Tooltip>
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
        {/* Edge Gold Fingers */}
        <div className="flex items-center gap-4">
          <Tooltip content={<div className="max-w-xs text-left">Gold-plated contacts on PCB edge, used for connectors.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">Edge Gold Fingers</label>
          </Tooltip>
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
        {/* Edge Plating */}
        <div className="flex items-center gap-4">
          <Tooltip content={<div className="max-w-xs text-left">Plating on the edge of the PCB for special connection needs.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">Edge Plating</label>
          </Tooltip>
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
        {/* Half Holes */}
        <div className="flex items-center gap-4">
          <Tooltip content={<div className="max-w-xs text-left">Plated half-holes on PCB edge, often for module mounting.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">Half Holes</label>
          </Tooltip>
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
        {/* Edge Covering */}
        <div className="flex items-center gap-4">
          <Tooltip content={<div className="max-w-xs text-left">Solder mask coverage on PCB edge for protection.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">Edge Covering</label>
          </Tooltip>
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
        {/* Solder Mask Coverage */}
        <div className="flex items-center gap-4">
          <Tooltip content={<div className="max-w-xs text-left">Choose how vias are covered or plugged with solder mask.</div>}>
            <label className="w-32 text-xs font-normal text-right cursor-help">Solder Mask Coverage</label>
          </Tooltip>
          <div className="flex-1">
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
            <div className="text-xs text-muted-foreground mt-1">
              If Gerber file, select [Via Plugging] or [Via Opening] as needed. For special process, please contact us.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 