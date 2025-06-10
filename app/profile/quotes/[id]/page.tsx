"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { Layers, Settings, UserCheck, FileEdit, ShoppingCart } from "lucide-react";
import { fieldMap } from "@/lib/fieldMap";
import { PcbQuoteForm } from "@/types/pcbQuoteForm";
import { ShipmentType } from "@/types/form";

const BASIC_FIELDS: (keyof PcbQuoteForm)[] = [
  "pcbType", "layers", "thickness", "hdi", "tg", "panelSet", "shipmentType", "border", "differentDesignsCount"
];
const PROCESS_FIELDS: (keyof PcbQuoteForm)[] = [
  "minTrace", "minHole", "solderMask", "silkscreen", "surfaceFinish", "surfaceFinishEnigType", "impedance", "castellated", "goldFingers", "goldFingersBevel", "edgePlating", "halfHole", "edgeCover", "maskCover", "holeCu25um", "outerCopperWeight", "innerCopperWeight"
];
const SERVICE_FIELDS: (keyof PcbQuoteForm)[] = [
  "testMethod", "prodCap", "productReport", "yyPin", "customerCode", "payMethod", "qualityAttach", "smt", "useShengyiMaterial", "holeCount", "bga", "workingGerber", "ulMark", "crossOuts", "ipcClass", "ifDataConflicts", "specialRequests", "pcbNote", "userNote"
];

// 反向映射：后端字段名 => 前端字段名
const backendToFrontendMap = Object.fromEntries(
  Object.entries(fieldMap).map(([k, v]) => [v, k])
);

function mapBackendToFrontend(data: Record<string, any>): PcbQuoteForm {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [backendToFrontendMap[k] || k, v])
  ) as PcbQuoteForm;
}

function renderField(label: string, value: any) {
  if (Array.isArray(value)) value = value.join(", ");
  return (
    <div className="flex flex-row items-center mb-1" key={label}>
      <span className="font-semibold text-muted-foreground text-xs w-36 truncate">{label}</span>
      <span className="break-all text-sm flex-1">{String(value)}</span>
    </div>
  );
}

function getSizeLabel(shipmentType: ShipmentType) {
  return shipmentType === ShipmentType.Single ? "Single Size (cm)" : "Panel Size (cm)";
}
function getCountLabel(shipmentType: ShipmentType) {
  return shipmentType === ShipmentType.Single ? "Single Count" : "Panel Count";
}
function getCountUnit(shipmentType: ShipmentType) {
  return shipmentType === ShipmentType.Single ? "Pcs" : "Set";
}

export default function QuoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [quote, setQuote] = useState<PcbQuoteForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchQuote() {
      setLoading(true);
      setError("");
      const { data: { session } } = await supabase.auth.getSession();
      const access_token = session?.access_token;
      if (!access_token) {
        setError("Please login to view your quote.");
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/quote/${id}`, {
        headers: { "Authorization": `Bearer ${access_token}` }
      });
      if (!res.ok) {
        setError("No permission or quote not found.");
        setLoading(false);
        return;
      }
      const result = await res.json();
      setQuote(mapBackendToFrontend(result.data));
      setLoading(false);
    }
    if (id) fetchQuote();
  }, [id]);

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]">Loading...</div>;
  if (error) return <div className="flex justify-center items-center min-h-[60vh] text-destructive">{error}</div>;
  if (!quote) return <div className="flex justify-center items-center min-h-[60vh] text-muted-foreground">No quote found.</div>;

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader className="flex flex-row items-center gap-4">
          <Layers className="text-blue-600" size={28} />
          <CardTitle className="text-2xl font-bold tracking-wide flex-1">Quote Detail</CardTitle>
          <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => router.push(`/quote/${id}/edit`)}>
            <FileEdit size={16} /> Supplement Info
          </Button>
          <Button variant="default" size="sm" className="flex items-center gap-2" onClick={() => alert('Order placed! (TODO: implement order logic)')}>
            <ShoppingCart size={16} /> Place Order
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 mt-1 px-4 py-2">
          {/* Basic Info */}
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Layers className="text-blue-600" size={16} />
              <span className="font-semibold text-sm">Basic Information</span>
            </div>
            <div className="grid grid-cols-3 gap-x-2 gap-y-1">
              {BASIC_FIELDS.filter(f => quote[f] !== undefined).map(f => {
                if (f === "singleDimensions" || f === "singleCount" || f === "panelDimensions") return null;
                return renderField(f, quote[f]);
              })}
              {quote?.singleDimensions && (
                <div>
                  <span className="font-semibold text-muted-foreground text-xs w-36 truncate">{getSizeLabel(quote.shipmentType)}</span>
                  <span className="break-all text-sm flex-1">{quote.singleDimensions.length} × {quote.singleDimensions.width} <span className="text-xs text-muted-foreground">cm</span></span>
                </div>
              )}
              {quote?.singleCount !== undefined && quote?.singleCount !== null && (
                <div>
                  <span className="font-semibold text-muted-foreground text-xs w-36 truncate">{getCountLabel(quote.shipmentType)}</span>
                  <span className="break-all text-sm flex-1">{quote.singleCount} <span className="text-xs text-muted-foreground">{getCountUnit(quote.shipmentType)}</span></span>
                </div>
              )}
              {quote?.panelDimensions && (quote.shipmentType === ShipmentType.PanelByCustom || quote.shipmentType === ShipmentType.PanelBySpeedx) && (
                <div>
                  <span className="font-semibold text-muted-foreground text-xs w-36 truncate">Panel Size (pcs)</span>
                  <span className="break-all text-sm flex-1">{quote.panelDimensions.row} × {quote.panelDimensions.column} <span className="text-xs text-muted-foreground">pcs</span></span>
                </div>
              )}
            </div>
          </div>
          {/* Process Info */}
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Settings className="text-blue-600" size={16} />
              <span className="font-semibold text-sm">Process Information</span>
            </div>
            <div className="grid grid-cols-3 gap-x-2 gap-y-1">
              {PROCESS_FIELDS.filter(f => quote[f] !== undefined).map(f => renderField(f, quote[f]))}
            </div>
          </div>
          {/* Service Info */}
          <div>
            <div className="flex items-center gap-1 mb-1">
              <UserCheck className="text-blue-600" size={16} />
              <span className="font-semibold text-sm">Service Information</span>
            </div>
            <div className="grid grid-cols-3 gap-x-2 gap-y-1">
              {SERVICE_FIELDS.filter(f => quote[f] !== undefined).map(f => renderField(f, quote[f]))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 