"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { logoutAndRedirect, useUserStore } from "@/lib/userStore";
import type { Database } from "@/types/supabase";
import { useRequireRole } from "@/lib/hooks/useRequireRole";

export default function AdminQuotePage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Database["public"]["Tables"]["orders"]["Row"][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = useUserStore(state => state.user);

  // 基于角色的访问控制，未登录自动跳转，已登录但不是管理员弹窗提示
  const { isAllowed, isDenied, isLoading: roleLoading } = useRequireRole(["admin"], "/quote/admin");

  useEffect(() => {
    if (!user) return;
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
  }, [user]);

  // 弹窗样式（可用 shadcn/ui 的 Dialog 组件，示例用简单 div）
  if (roleLoading || loading) return <div className="flex justify-center items-center min-h-[60vh]">Loading...</div>;
  if (error) return <div className="flex justify-center items-center min-h-[60vh] text-destructive">{error}</div>;

  if (isDenied) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full flex flex-col items-center">
          <div className="text-2xl font-bold text-red-600 mb-2">Access Denied</div>
          <div className="text-base text-gray-700 mb-4 text-center">You do not have permission to access this page.<br />Please log in with an administrator account.</div>
          <div className="flex gap-3 w-full justify-center">
            <button
              className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
              onClick={() => logoutAndRedirect("/auth?redirect=/quote/admin")}
            >
              Switch Account
            </button>
            <button
              className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 font-semibold shadow hover:bg-gray-300 transition"
              onClick={() => router.replace("/")}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAllowed) return null;

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
                  <td className="p-2 border">{q.pcb_spec?.pcbType ?? '-'}</td>
                  <td className="p-2 border">{q.pcb_spec?.layers ?? '-'}</td>
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