"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../../types/supabase";
import OrderDetailClient from "./OrderDetailClient";
import { useEnsureLogin } from "@/lib/auth";
import { useUserStore } from "@/lib/userStore";

type Order = Database["public"]["Tables"]["orders"]["Row"];

export default function OrderDetailPage() {
  useEnsureLogin();
  const params = useParams();
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    async function fetchOrder() {
      if (!user || !params.id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("id", params.id as string)
          .eq("user_id", user.id)
          .single();

        if (error || !data) {
          setError("Order not found or no permission");
          return;
        }

        setOrder(data);
      } catch (err) {
        console.error("Failed to fetch order:", err);
        setError("Failed to load order");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [user, params.id, supabase]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-gray-500">Loading order...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
        <div className="text-red-500">{error || "Order not found"}</div>
        <button 
          onClick={() => router.push("/quote/orders")}
          className="text-blue-600 hover:underline"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return <OrderDetailClient user={user} order={order} />;
} 