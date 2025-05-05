"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAdminGuard } from "@/lib/useAdminGuard";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../../../types/supabase";
import AdminOrderDetailClient from "./AdminOrderDetailClient";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [order, setOrder] = useState<Database["public"]["Tables"]["orders"]["Row"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { loading: adminLoading, error: adminError, isAdmin: isAdminGuard } = useAdminGuard();

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
    if (id && isAdminGuard) fetchOrder();
  }, [id, isAdminGuard]);

  if (loading || adminLoading) return <div className="flex justify-center items-center min-h-[60vh]">加载中...</div>;
  if (error || adminError) return <div className="flex justify-center items-center min-h-[60vh] text-destructive">{error || adminError}</div>;
  if (!isAdminGuard || !order) return null;

  return <AdminOrderDetailClient order={order} />;
} 