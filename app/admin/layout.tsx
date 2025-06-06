import React, { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* 移动端顶部栏 */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <span className="text-xl font-bold text-blue-700">Admin Panel</span>
        <button onClick={() => setSidebarOpen(v => !v)} className="p-2 rounded-md hover:bg-blue-100">
          <Menu className="h-6 w-6 text-blue-700" />
        </button>
      </div>
      {/* Sidebar */}
      <aside className={`fixed md:static z-40 top-0 left-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col py-6 px-4 transition-transform duration-200 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ minHeight: '100vh' }}>
        <div className="mb-8 hidden md:block">
          <span className="text-2xl font-bold text-blue-700">Admin Panel</span>
        </div>
        <nav className="flex-1 space-y-2">
          <Link href="/admin/orders" className="block px-3 py-2 rounded-md text-gray-700 hover:bg-blue-100 hover:text-blue-700 font-medium">Orders</Link>
          <Link href="/admin/quote" className="block px-3 py-2 rounded-md text-gray-700 hover:bg-blue-100 hover:text-blue-700 font-medium">Quotes</Link>
          <Link href="/admin/users" className="block px-3 py-2 rounded-md text-gray-700 hover:bg-blue-100 hover:text-blue-700 font-medium">Users</Link>
          <Link href="/admin/site" className="block px-3 py-2 rounded-md text-gray-700 hover:bg-blue-100 hover:text-blue-700 font-medium">Site Management</Link>
        </nav>
        <div className="mt-auto pt-8 border-t text-xs text-gray-400">&copy; {new Date().getFullYear()} NextPCB Admin</div>
      </aside>
      {/* 遮罩层（移动端） */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {/* Main Content */}
      <main className="flex-1 container max-w-screen-xl mx-auto p-4 sm:p-6 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
} 