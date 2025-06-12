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
import { ArrowRight, Inbox } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUserStore } from "@/lib/userStore";
import { Database } from "@/types/supabase";

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
};

export default function QuotesPage() {
  const user = useUserStore((state) => state.user);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotes = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("pcb_quotes")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setQuotes(data || []);
      } catch (error) {
        console.error("Error fetching quotes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, [user, supabase]);

  const getQuoteAmount = (quote: Quote) => {
    // Assuming the price is in the pcb_spec jsonb field for now
    // This will need to be adjusted based on the final schema
    if (quote.pcb_spec && typeof quote.pcb_spec === 'object') {
        const spec = quote.pcb_spec as { price?: number };
        return spec.price || 0;
    }
    return 0;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Quotes</CardTitle>
        <CardDescription>
          Here is a list of your recent quotes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p>Loading quotes...</p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Inbox className="mx-auto h-12 w-12" />
            <h3 className="mt-2 text-sm font-medium">No quotes found</h3>
            <p className="mt-1 text-sm">You have not requested any quotes yet.</p>
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
                  <TableCell className="font-medium">#{quote.id}</TableCell>
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
                        View Details <ArrowRight className="ml-2 h-4 w-4" />
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
  );
} 