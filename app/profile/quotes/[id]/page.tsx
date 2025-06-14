"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { Layers, Settings, UserCheck, FileEdit, ShoppingCart, Mail, Phone, Calendar, DollarSign, UserPlus } from "lucide-react";
import { fieldMap } from "@/lib/fieldMap";
import { PcbQuoteForm } from "@/types/pcbQuoteForm";
import { ShipmentType } from "@/types/form";
import { Database } from "@/types/supabase";
import { useUserStore } from "@/lib/userStore";
import { toast } from "sonner";

type Quote = Database["public"]["Tables"]["pcb_quotes"]["Row"];

const BASIC_FIELDS: (keyof PcbQuoteForm)[] = [
  "pcbType", "layers", "thickness", "hdi", "tg", "panelSet", "shipmentType", "border", "differentDesignsCount"
];
const PROCESS_FIELDS: (keyof PcbQuoteForm)[] = [
  "minTrace", "minHole", "solderMask", "silkscreen", "surfaceFinish", "surfaceFinishEnigType", "impedance", "castellated", "goldFingers", "goldFingersBevel", "edgePlating", "halfHole", "edgeCover", "maskCover", "holeCu25um", "outerCopperWeight", "innerCopperWeight"
];
const SERVICE_FIELDS: (keyof PcbQuoteForm)[] = [
  "testMethod", "prodCap", "productReport", "yyPin", "customerCode", "payMethod", "qualityAttach", "smt", "useShengyiMaterial", "holeCount", "bga", "workingGerber", "ulMark", "crossOuts", "ipcClass", "ifDataConflicts", "specialRequests", "pcbNote", "userNote"
];

const statusVariant: {
  [key: string]: "default" | "secondary" | "success" | "warning" | "outline";
} = {
  pending: "outline",
  quoted: "secondary",
  accepted: "success",
  expired: "warning",
  paid: "success",
  draft: "outline",
};

// 反向映射：后端字段名 => 前端字段名
const backendToFrontendMap = Object.fromEntries(
  Object.entries(fieldMap).map(([k, v]) => [v, k])
);

function mapBackendToFrontend(data: Record<string, unknown>): PcbQuoteForm {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [backendToFrontendMap[k] || k, v])
  ) as unknown as PcbQuoteForm;
}

function renderField(label: string, value: unknown) {
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
  const user = useUserStore((state) => state.user);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [pcbSpec, setPcbSpec] = useState<PcbQuoteForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claiming, setClaiming] = useState(false);

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
      setQuote(result.data);
      if (result.data.pcb_spec) {
        setPcbSpec(mapBackendToFrontend(result.data.pcb_spec));
      }
      setLoading(false);
    }
    if (id) fetchQuote();
  }, [id]);

  const getQuoteAmount = () => {
    if (!quote) return 0;
    
    // 从cal_values中获取价格信息
    if (quote.cal_values && typeof quote.cal_values === 'object') {
      const calValues = quote.cal_values as { totalPrice?: number; pcbPrice?: number };
      return calValues.totalPrice || calValues.pcbPrice || 0;
    }
    return 0;
  };

  const handleClaimQuote = async () => {
    if (!quote || !user || claiming) return;
    
    setClaiming(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const access_token = session?.access_token;
      
      if (!access_token) {
        toast.error("Please login to claim this quote.");
        return;
      }

      const response = await fetch(`/api/quote/${id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        }
      });

      if (response.ok) {
        toast.success("Quote claimed successfully! This quote is now linked to your account.");
        // 刷新页面数据
        window.location.reload();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to claim quote.");
      }
    } catch (error) {
      console.error("Error claiming quote:", error);
      toast.error("Failed to claim quote. Please try again.");
    } finally {
      setClaiming(false);
    }
  };

  // 判断是否为游客报价（user_id为空）
  const isGuestQuote = quote && !quote.user_id;

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]">Loading...</div>;
  if (error) return <div className="flex justify-center items-center min-h-[60vh] text-destructive">{error}</div>;
  if (!quote) return <div className="flex justify-center items-center min-h-[60vh] text-muted-foreground">No quote found.</div>;

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="flex flex-row items-center gap-4">
          <Layers className="text-blue-600" size={28} />
          <div className="flex-1">
            <CardTitle className="text-2xl font-bold tracking-wide">
              {isGuestQuote ? `Guest Quote #${quote.id}` : `Quote #${quote.id}`}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                {new Date(quote.created_at!).toLocaleDateString()}
              </div>
              <Badge variant={statusVariant[quote.status!] || "default"}>
                {quote.status}
              </Badge>
              {getQuoteAmount() > 0 && (
                <div className="flex items-center gap-1">
                  <DollarSign size={14} />
                  ${getQuoteAmount().toFixed(2)}
                </div>
              )}
              {isGuestQuote && (
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  Guest Quote
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {isGuestQuote && (
              <Button 
                variant="default" 
                size="sm" 
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700" 
                onClick={handleClaimQuote}
                disabled={claiming}
              >
                <UserPlus size={16} />
                {claiming ? "Claiming..." : "Claim Quote"}
              </Button>
            )}
            <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => router.push(`/quote2?edit=${id}`)}>
              <FileEdit size={16} /> Edit Quote
            </Button>
            {quote.status === 'quoted' && (
              <Button variant="default" size="sm" className="flex items-center gap-2" onClick={() => alert('Order functionality coming soon!')}>
                <ShoppingCart size={16} /> Place Order
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 mt-1 px-6 py-4">
          {/* Claim Quote Notice */}
          {isGuestQuote && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <UserPlus className="text-blue-600 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Claim This Quote</h3>
                                     <p className="text-sm text-blue-800 mb-3">
                     This quote was submitted as a guest. Click &quot;Claim Quote&quot; to link it to your account for easier tracking and management.
                   </p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Track quote status and updates</li>
                    <li>• Access quote history anytime</li>
                    <li>• Faster reordering process</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Mail className="text-blue-600" size={16} />
              <span className="font-semibold text-base">Contact Information</span>
            </div>
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-muted-foreground" />
                <span className="text-sm">{quote.email}</span>
              </div>
              {quote.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-muted-foreground" />
                  <span className="text-sm">{quote.phone}</span>
                </div>
              )}
            </div>
          </div>

          {pcbSpec && (
            <>
              {/* Basic Info */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="text-blue-600" size={16} />
                  <span className="font-semibold text-base">Basic Information</span>
                </div>
                <div className="grid grid-cols-3 gap-x-4 gap-y-2 p-4 bg-gray-50 rounded-lg">
                  {BASIC_FIELDS.filter(f => pcbSpec[f] !== undefined).map(f => {
                    if (f === "singleDimensions" || f === "singleCount" || f === "panelDimensions") return null;
                    return renderField(f, pcbSpec[f]);
                  })}
                  {pcbSpec?.singleDimensions && (
                    <div className="flex flex-row items-center mb-1">
                      <span className="font-semibold text-muted-foreground text-xs w-36 truncate">{getSizeLabel(pcbSpec.shipmentType)}</span>
                      <span className="break-all text-sm flex-1">{pcbSpec.singleDimensions.length} × {pcbSpec.singleDimensions.width} <span className="text-xs text-muted-foreground">cm</span></span>
                    </div>
                  )}
                  {pcbSpec?.singleCount !== undefined && pcbSpec?.singleCount !== null && (
                    <div className="flex flex-row items-center mb-1">
                      <span className="font-semibold text-muted-foreground text-xs w-36 truncate">{getCountLabel(pcbSpec.shipmentType)}</span>
                      <span className="break-all text-sm flex-1">{pcbSpec.singleCount} <span className="text-xs text-muted-foreground">{getCountUnit(pcbSpec.shipmentType)}</span></span>
                    </div>
                  )}
                  {pcbSpec?.panelDimensions && (pcbSpec.shipmentType === ShipmentType.PanelByGerber || pcbSpec.shipmentType === ShipmentType.PanelBySpeedx) && (
                    <div className="flex flex-row items-center mb-1">
                      <span className="font-semibold text-muted-foreground text-xs w-36 truncate">Panel Size (pcs)</span>
                      <span className="break-all text-sm flex-1">{pcbSpec.panelDimensions.row} × {pcbSpec.panelDimensions.column} <span className="text-xs text-muted-foreground">pcs</span></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Process Info */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="text-blue-600" size={16} />
                  <span className="font-semibold text-base">Process Information</span>
                </div>
                <div className="grid grid-cols-3 gap-x-4 gap-y-2 p-4 bg-gray-50 rounded-lg">
                  {PROCESS_FIELDS.filter(f => pcbSpec[f] !== undefined).map(f => renderField(f, pcbSpec[f]))}
                </div>
              </div>

              {/* Service Info */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck className="text-blue-600" size={16} />
                  <span className="font-semibold text-base">Service Information</span>
                </div>
                <div className="grid grid-cols-3 gap-x-4 gap-y-2 p-4 bg-gray-50 rounded-lg">
                  {SERVICE_FIELDS.filter(f => pcbSpec[f] !== undefined).map(f => renderField(f, pcbSpec[f]))}
                </div>
              </div>
            </>
          )}

          {/* Gerber File */}
          {quote.gerber_file_url && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileEdit className="text-blue-600" size={16} />
                <span className="font-semibold text-base">Gerber File</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <Button variant="outline" size="sm" asChild>
                  <a href={quote.gerber_file_url} target="_blank" rel="noopener noreferrer">
                    Download Gerber File
                  </a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 