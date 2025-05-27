"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { logoutAndRedirect } from "@/lib/userStore";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../../../types/supabase";
import AdminOrderDetailClient from "./AdminOrderDetailClient";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [order, setOrder] = useState<Database["public"]["Tables"]["orders"]["Row"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAllowed, isDenied, isLoading: roleLoading } = useRequireRole(["admin"], `/quote/admin/orders/${id}`);

  useEffect(() => {
    async function fetchOrder() {
      setLoading(true);
      setError("");
      const supabase = createClientComponentClient<Database>();
      const { data, error } = await supabase.from("orders").select("*").eq("id", id).single();
      if (error || !data) {
        setError("订单不存在");
        setLoading(false);
        return;
      }
      setOrder(data);
      setLoading(false);
    }
    if (id && isAllowed) fetchOrder();
  }, [id, isAllowed]);

  if (roleLoading || loading) return <div className="flex justify-center items-center min-h-[60vh]">加载中...</div>;
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
              onClick={() => logoutAndRedirect(`/auth?redirect=/quote/admin/orders/${id}`)}
            >
              Switch Account
            </button>
            <button
              className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 font-semibold shadow hover:bg-gray-300 transition"
              onClick={() => window.location.replace("/")}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (!isAllowed || !order) return null;

  return <AdminOrderDetailClient order={order} />;
} 