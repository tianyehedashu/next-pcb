"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

const ADMIN_EMAILS = ["admin@example.com"];

export default function AdminQuotePage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdminAndFetch() {
      setLoading(true);
      setError("");
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      if (!user || !session) {
        setError("Please login as admin.");
        setLoading(false);
        return;
      }
      // 简单用邮箱判断管理员
      if (!ADMIN_EMAILS.includes(user.email!)) {
        setError("You are not authorized to view this page.");
        setLoading(false);
        return;
      }
      setIsAdmin(true);
      // 获取所有quote
      const access_token = session.access_token;
      const res = await fetch("/api/quote/admin", {
        headers: { "Authorization": `Bearer ${access_token}` }
      });
      if (!res.ok) {
        setError("Failed to fetch quotes.");
        setLoading(false);
        return;
      }
      const result = await res.json();
      setQuotes(result.data || []);
      setLoading(false);
    }
    checkAdminAndFetch();
  }, []);

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]">Loading...</div>;
  if (error) return <div className="flex justify-center items-center min-h-[60vh] text-destructive">{error}</div>;
  if (!isAdmin) return null;

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
                    <Button size="sm" variant="outline" onClick={() => router.push(`/quote/admin/${q.id}`)}>Review</Button>
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