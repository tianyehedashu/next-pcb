import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { notFound, redirect } from "next/navigation";
import type { Database } from "../../../../types/supabase";
import OrderDetailClient from "./OrderDetailClient";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
  // 获取 session 和用户
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth?redirect=/quote/orders/${params.id}`);
  }
  // 获取订单
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();
  if (error || !order) {
    notFound();
  }
  return <OrderDetailClient user={user} order={order} />;
} 