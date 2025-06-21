import { createSupabaseAdminClient } from "@/utils/supabase/server";
import Link from "next/link";
import React from "react";

export default async function AdminDashboard() {
  const supabase = createSupabaseAdminClient();
  
  const { count: orderCount, error: orderError } = await supabase.from("pcb_quotes").select("*", { count: "exact", head: true });
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  const userCount = users.length;
  
  // Get content statistics
  const { count: contentCount, error: contentError } = await supabase.from("content_pages").select("*", { count: "exact", head: true });
  const { count: publishedCount, error: publishedError } = await supabase.from("content_pages").select("*", { count: "exact", head: true }).eq("status", "published");

  return (
    <div className="w-full max-w-screen-xl mx-auto space-y-8">
      <h1 className="text-3xl md:text-4xl font-extrabold text-blue-800 mb-8 text-center tracking-tight drop-shadow-sm">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/admin/orders" className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center hover:bg-gray-50 transition-colors">
          <div className="text-2xl font-semibold text-blue-700">Orders</div>
          <div className="text-4xl font-bold mt-2 mb-1">{orderError ? "Error" : orderCount ?? 0}</div>
          <div className="text-gray-500">Total Orders</div>
        </Link>
        <Link href="/admin/users" className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center hover:bg-gray-50 transition-colors">
          <div className="text-2xl font-semibold text-blue-700">Users</div>
          <div className="text-4xl font-bold mt-2 mb-1">{userError ? "Error" : userCount ?? 0}</div>
          <div className="text-gray-500">Total Users</div>
        </Link>
        <Link href="/admin/content" className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center hover:bg-gray-50 transition-colors">
          <div className="text-2xl font-semibold text-blue-700">Content</div>
          <div className="text-4xl font-bold mt-2 mb-1">{contentError ? "Error" : contentCount ?? 0}</div>
          <div className="text-gray-500">{publishedError ? "Error" : publishedCount ?? 0} Published</div>
        </Link>
        <Link href="/admin/site" className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center hover:bg-gray-50 transition-colors">
          <div className="text-2xl font-semibold text-blue-700">Site</div>
          <div className="text-4xl font-bold mt-2 mb-1">--</div>
          <div className="text-gray-500">Site Settings</div>
        </Link>
      </div>
      <div className="mt-10 text-gray-400 text-sm text-center">Welcome to the SpeedXPCB Admin Panel. Select a section from the sidebar to get started.</div>
    </div>
  );
} 