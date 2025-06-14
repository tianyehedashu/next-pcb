"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Inbox, Info, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUserStore } from "@/lib/userStore";
import { Database } from "@/types/supabase";
import { toast } from "sonner";

type Quote = Database["public"]["Tables"]["pcb_quotes"]["Row"];

const statusVariant: {
  [key: string]: "default" | "secondary" | "success" | "warning" | "outline";
} = {
  sent: "default",
  accepted: "success",
  expired: "warning",
  draft: "outline",
  pending: "outline",
  quoted: "secondary",
  paid: "success",
};

export default function QuotesPage() {
  const user = useUserStore((state) => state.user);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingAll, setClaimingAll] = useState(false);

  useEffect(() => {
    const fetchQuotes = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("pcb_quotes")
          .select("*")
          .is("user_id", null)
          .eq("email", user.email)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setQuotes(data || []);
      } catch (error) {
        console.error("Error fetching guest quotes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, [user]);

  const getQuoteAmount = (quote: Quote) => {
    if (quote.cal_values && typeof quote.cal_values === 'object') {
      const calValues = quote.cal_values as { totalPrice?: number; pcbPrice?: number };
      return calValues.totalPrice || calValues.pcbPrice || 0;
    }
    return 0;
  };

  const handleClaimAll = async () => {
    if (!user || claimingAll || quotes.length === 0) return;
    
    setClaimingAll(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const access_token = session?.access_token;
      
      if (!access_token) {
        toast.error("Please login to claim quotes.");
        return;
      }

      const response = await fetch('/api/quote/claim-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        }
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Successfully claimed ${result.claimedCount} quote(s)!`);
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to claim quotes.");
      }
    } catch (error) {
      console.error("Error claiming all quotes:", error);
      toast.error("Failed to claim quotes. Please try again.");
    } finally {
      setClaimingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Guest Quotes</CardTitle>
              <CardDescription>
                Here are the quotes you submitted as a guest before registering.
              </CardDescription>
            </div>
            {quotes.length > 0 && (
              <Button 
                onClick={handleClaimAll}
                disabled={claimingAll}
                className="bg-green-600 hover:bg-green-700"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {claimingAll ? "Claiming..." : `Claim All (${quotes.length})`}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {quotes.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="text-blue-600 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">About Guest Quotes</h3>
                  <p className="text-sm text-blue-800 mb-2">
                    These quotes were submitted before you created your account. You can claim them to link them to your account for better tracking and management.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-blue-700">
                    <UserPlus size={14} />
                    <span>Click on any quote to view details and claim it, or use the &quot;Claim All&quot; button above</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <p>Loading guest quotes...</p>
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Inbox className="mx-auto h-12 w-12" />
              <h3 className="mt-2 text-sm font-medium">No guest quotes found</h3>
              <p className="mt-1 text-sm">You have not submitted any quotes as a guest.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        #{quote.id}
                        <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                          Guest
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(quote.created_at!).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[quote.status!] || "default"}>
                        {quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      ${getQuoteAmount(quote).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/profile/quotes/${quote.id}`}>
                          View & Claim <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 