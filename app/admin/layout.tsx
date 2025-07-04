import React, { Suspense } from "react";
import { requireAuth } from '@/lib/auth-utils'
import { AdminSidebar } from "./components/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Use official docs pattern: always use supabase.auth.getUser() to protect pages
  await requireAuth({ requireAdmin: true, redirectTo: '/auth?redirect=/admin' })

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-4 md:p-6 overflow-y-auto">
        <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]">加载中...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
} 