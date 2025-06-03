"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { useUserStore } from "@/lib/userStore";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { Mail, Phone, Calendar, DollarSign, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface GuestQuote {
  id: number;
  email: string;
  phone?: string;
  pcb_spec: Record<string, unknown>;
  shipping_address?: Record<string, unknown>;
  status: string;
  admin_quote_price?: number;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminGuestQuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<GuestQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<GuestQuote | null>(null);
  const [adminPrice, setAdminPrice] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const user = useUserStore(state => state.user);

  // 基于角色的访问控制
  const { isAllowed, isDenied, isLoading: roleLoading } = useRequireRole(["admin"], "/quote/admin/guest-quotes");

  useEffect(() => {
    if (!user || !isAllowed) return;
    
    fetchGuestQuotes();
  }, [user, isAllowed]);

  const fetchGuestQuotes = async () => {
    setLoading(true);
    setError("");
    
    try {
      const { data, error: fetchError } = await supabase
        .from('guest_quotes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        setError("Failed to fetch guest quotes.");
        return;
      }
      
      setQuotes(data || []);
    } catch {
      setError("An error occurred while fetching quotes.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuote = async () => {
    if (!selectedQuote) return;
    
    setUpdating(true);
    
    try {
      const { error: updateError } = await supabase
        .from('guest_quotes')
        .update({
          admin_quote_price: adminPrice ? parseFloat(adminPrice) : null,
          admin_notes: adminNotes,
          status: adminPrice ? 'quoted' : 'pending'
        })
        .eq('id', selectedQuote.id);
      
      if (updateError) {
        toast.error("Failed to update quote");
        return;
      }
      
      toast.success("Quote updated successfully");
      setSelectedQuote(null);
      setAdminPrice("");
      setAdminNotes("");
      fetchGuestQuotes();
    } catch {
      toast.error("An error occurred while updating quote");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      pending: "outline",
      quoted: "default",
      completed: "secondary"
    };
    
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (roleLoading || loading) {
    return <div className="flex justify-center items-center min-h-[60vh]">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-[60vh] text-destructive">{error}</div>;
  }

  if (isDenied) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full flex flex-col items-center">
          <div className="text-2xl font-bold text-red-600 mb-2">Access Denied</div>
          <div className="text-base text-gray-700 mb-4 text-center">
            You do not have permission to access this page.
          </div>
          <Button onClick={() => router.replace("/")} variant="outline">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (!isAllowed) return null;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Guest Quotes Management</h1>
          <p className="text-gray-600 mt-2">Manage quotes from guest users</p>
        </div>
        <Button onClick={fetchGuestQuotes} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 报价列表 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Guest Quotes ({quotes.length})</h2>
          {quotes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No guest quotes found
              </CardContent>
            </Card>
          ) : (
            quotes.map((quote) => (
              <Card 
                key={quote.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedQuote?.id === quote.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => {
                  setSelectedQuote(quote);
                  setAdminPrice(quote.admin_quote_price?.toString() || "");
                  setAdminNotes(quote.admin_notes || "");
                }}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{quote.email}</span>
                    </div>
                    {getStatusBadge(quote.status)}
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    {quote.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        <span>{quote.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(quote.created_at).toLocaleDateString()}</span>
                    </div>
                    {quote.admin_quote_price && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3" />
                        <span>${quote.admin_quote_price}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* PCB规格预览 - 简化版本 */}
                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                    <div className="text-gray-600">
                      PCB Quote Request - Click to view details
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* 报价详情和编辑 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Quote Details</h2>
          {selectedQuote ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Quote #{selectedQuote.id}</span>
                  {getStatusBadge(selectedQuote.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 客户信息 */}
                <div>
                  <h3 className="font-medium mb-2">Customer Information</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{selectedQuote.email}</span>
                    </div>
                    {selectedQuote.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{selectedQuote.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* PCB规格 - 简化版本 */}
                <div>
                  <h3 className="font-medium mb-2">PCB Specifications</h3>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <pre className="whitespace-pre-wrap text-xs">
                      {JSON.stringify(selectedQuote.pcb_spec, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* 管理员报价 */}
                <div>
                  <h3 className="font-medium mb-2">Admin Quote</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Quote Price ($)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={adminPrice}
                        onChange={(e) => setAdminPrice(e.target.value)}
                        placeholder="Enter quote price"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Notes</label>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add notes for the customer..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <Button 
                      onClick={handleUpdateQuote}
                      disabled={updating}
                      className="w-full"
                    >
                      {updating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Update Quote
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Select a quote to view details and provide pricing
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 