import RadioGroup from "../RadioGroup";
import React from "react";
import { Check } from "lucide-react";

export default function ProcessInfoSection({ form, errors, setForm, sectionRef }: any) {
  return (
    <div ref={sectionRef} className="scroll-mt-32">
      <div className="flex flex-col gap-3 text-xs">
        {/* Copper Weight (oz) */}
        <div className="flex items-center gap-4">
          <label className="w-32 text-xs font-normal text-right">Copper Weight (oz)</label>
          <RadioGroup
            name="copperWeight"
            options={["1","2","3","4"].map(v => ({ value: v, label: v+"oz" }))}
            value={form.copperWeight}
            onChange={(v: string) => setForm({ ...form, copperWeight: v })}
          />
        </div>
        {/* Min Trace/Spacing (mil) */}
        <div className="flex items-center gap-4">
          <label className="w-32 text-xs font-normal text-right">Min Trace/Spacing (mil)</label>
          <RadioGroup
            name="minTrace"
            options={["10/10","8/8","6/6","5/5","4/4","3.5/3.5"].map(v => ({ value: v, label: v }))}
            value={form.minTrace}
            onChange={(v: string) => setForm({ ...form, minTrace: v })}
          />
        </div>
        {/* Min Hole Size (mm) */}
        <div className="flex items-center gap-4">
          <label className="w-32 text-xs font-normal text-right">Min Hole Size (mm)</label>
          <RadioGroup
            name="minHole"
            options={["0.3","0.25","0.2","0.15"].map(v => ({ value: v, label: v }))}
            value={form.minHole}
            onChange={(v: string) => setForm({ ...form, minHole: v })}
          />
        </div>
        {/* Solder Mask Color */}
        <div className="flex items-center gap-4">
          <label className="w-32 text-xs font-normal text-right">Solder Mask Color</label>
          <div className="flex flex-wrap gap-3">
            {["green","blue","red","yellow","black","white"].map(v => (
              <button
                key={v}
                type="button"
                className={`relative w-12 h-8 rounded-md border text-xs font-normal transition-all flex items-center justify-center
                  ${form.solderMask === v
                    ? "ring-2 ring-blue-500 border-blue-600"
                    : "border-gray-300 hover:border-blue-400"}
                  ${v === "green" ? "bg-green-500 text-white" : ""}
                  ${v === "blue" ? "bg-blue-500 text-white" : ""}
                  ${v === "red" ? "bg-red-500 text-white" : ""}
                  ${v === "black" ? "bg-neutral-800 text-white" : ""}
                  ${v === "white" ? "bg-white text-gray-700 border" : ""}
                  ${v === "yellow" ? "bg-yellow-300 text-gray-900" : ""}
                `}
                onClick={() => setForm({ ...form, solderMask: v })}
                aria-label={v.charAt(0).toUpperCase() + v.slice(1)}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
                {form.solderMask === v && (
                  <span className="absolute right-0.5 bottom-0.5">
                    <Check size={14} className="text-blue-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        {/* Silkscreen Color */}
        <div className="flex items-center gap-4">
          <label className="w-32 text-xs font-normal text-right">Silkscreen Color</label>
          <div className="flex flex-wrap gap-3">
            {[{ value: "white", label: "White" }, { value: "black", label: "Black" }].map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`relative w-16 h-8 rounded-md border text-xs font-normal transition-all flex items-center justify-center
                  ${form.silkscreen === opt.value
                    ? "ring-2 ring-blue-500 border-blue-600"
                    : "border-gray-300 hover:border-blue-400"}
                  ${opt.value === "white" ? "bg-white text-gray-700" : ""}
                  ${opt.value === "black" ? "bg-neutral-800 text-white" : ""}
                `}
                onClick={() => setForm({ ...form, silkscreen: opt.value })}
                aria-label={opt.label}
              >
                {opt.label}
                {form.silkscreen === opt.value && (
                  <span className="absolute right-0.5 bottom-0.5">
                    <Check size={14} className="text-blue-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        {/* Surface Finish */}
        <div className="flex items-center gap-4">
          <label className="w-32 text-xs font-normal text-right">Surface Finish</label>
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
          <label className="w-32 text-xs font-normal text-right">Impedance Control</label>
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
          <label className="w-32 text-xs font-normal text-right">Castellated Holes</label>
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
          <label className="w-32 text-xs font-normal text-right">Edge Gold Fingers</label>
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
          <label className="w-32 text-xs font-normal text-right">Edge Plating</label>
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
          <label className="w-32 text-xs font-normal text-right">Half Holes</label>
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
          <label className="w-32 text-xs font-normal text-right">Edge Covering</label>
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
          <label className="w-32 text-xs font-normal text-right">Solder Mask Coverage</label>
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