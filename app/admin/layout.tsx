"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background flex flex-row pt-16">
      {/* 移动端顶部栏 */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border shadow-sm sticky top-0 z-30">
        <span className="text-xl font-bold text-primary">Admin Panel</span>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(v => !v)} className="rounded-md">
          <Menu className="h-6 w-6 text-primary" />
        </Button>
      </div>
      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 md:top-16 left-0 h-full md:h-[calc(100vh-4rem)] w-44 bg-card border-r border-border flex flex-col z-40 transition-transform duration-200 py-6 px-3 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        >
        <div className="mb-8 hidden md:block">
          <span className="text-2xl font-bold text-primary">Admin Panel</span>
        </div>
        <nav className="flex-1 space-y-2">
          <Link href="/admin/orders" className="block px-3 py-2 rounded-md text-foreground hover:bg-accent hover:text-primary font-medium transition-colors">Orders</Link>
          <Link href="/admin/quote" className="block px-3 py-2 rounded-md text-foreground hover:bg-accent hover:text-primary font-medium transition-colors">Quotes</Link>
          <Link href="/admin/users" className="block px-3 py-2 rounded-md text-foreground hover:bg-accent hover:text-primary font-medium transition-colors">Users</Link>
          <Link href="/admin/site" className="block px-3 py-2 rounded-md text-foreground hover:bg-accent hover:text-primary font-medium transition-colors">Site Management</Link>
        </nav>
        <Separator className="mt-8 mb-4" />
        <div className="text-xs text-muted-foreground text-center">&copy; {new Date().getFullYear()} NextPCB Admin</div>
      </aside>
      {/* 遮罩层（移动端） */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {/* Main Content */}
      <main className="flex-1 min-w-0 p-0 md:p-2 overflow-y-auto">
        {children}
      </main>
    </div>
  );
} 