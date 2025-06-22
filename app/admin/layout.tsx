import React, { Suspense } from "react";
import { AdminSidebar } from "./components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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