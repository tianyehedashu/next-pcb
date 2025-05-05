"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useAdminGuard } from "@/lib/useAdminGuard";

export default function AdminQuotePage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { loading: adminLoading, error: adminError, isAdmin: isAdminGuard } = useAdminGuard();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      // 获取所有quote
      const { data, error: ordersError } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (ordersError) {
        setError("Failed to fetch orders.");
        setLoading(false);
        return;
      }
      setQuotes(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading || adminLoading) return <div className="flex justify-center items-center min-h-[60vh]">Loading...</div>;
  if (error || adminError) return <div className="flex justify-center items-center min-h-[60vh] text-destructive">{error || adminError}</div>;
  if (!isAdminGuard) return null;

  return (
    <div className="flex flex-col items-center min-h-screen bg-background py-10">
      <Card className="w-full max-w-5xl shadow-lg">
        <CardHeader>
          <CardTitle>Admin Quote Review</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-2 border">ID</th>
                <th className="p-2 border">User</th>
                <th className="p-2 border">PCB Type</th>
                <th className="p-2 border">Layers</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map(q => (
                <tr key={q.id} className="border-b hover:bg-slate-50">
                  <td className="p-2 border">{q.id}</td>
                  <td className="p-2 border">{q.user_id}</td>
                  <td className="p-2 border">{q.pcbType}</td>
                  <td className="p-2 border">{q.layers}</td>
                  <td className="p-2 border">{q.status || "pending"}</td>
                  <td className="p-2 border">
                    <Button size="sm" variant="outline" onClick={() => router.push(`/quote/admin/orders/${q.id}`)}>Review</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
} 