import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import FileUpload from "@/app/components/custom-ui/FileUpload";
import React from "react";

interface PcbSpecBlockProps {
  pcbFile: File | null;
  setPcbFile: (file: File | null) => void;
  quote: any;
  pcbNote: string;
  setPcbNote: (v: string) => void;
}

export default function PcbSpecBlock({ pcbFile, setPcbFile, quote, pcbNote, setPcbNote }: PcbSpecBlockProps) {
  return (
    <Card className="shadow-lg border-blue-100 bg-white/90">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-xl font-bold text-blue-700">PCB Specifications</CardTitle>
      </CardHeader>
      <CardContent className="pt-2 pb-6 px-6">
        {/* PCB 文件上传区域 */}
        <div className="mb-2">
          <FileUpload value={pcbFile} onChange={setPcbFile} required />
          {!pcbFile && quote?.gerber && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-2 w-full mt-2">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
              <p className="text-sm text-blue-700 truncate font-medium">ℹ {quote.gerber.name}</p>
            </div>
          )}
        </div>
        {/* PCB参数信息 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(quote).map(([k, v], index) => (
            <div key={`quote-${k}-${index}`} className="space-y-1">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{k}</span>
              <p className="text-base font-semibold text-gray-800">{String(v)}</p>
            </div>
          ))}
        </div>
        {/* 订单备注 */}
        <div className="mt-6">
          <label className="text-sm font-semibold text-blue-700">User Note</label>
          <Input className="mt-1" value={pcbNote} onChange={e => setPcbNote(e.target.value)} placeholder="Enter any note for your PCB (optional)" />
        </div>
      </CardContent>
    </Card>
  );
} 