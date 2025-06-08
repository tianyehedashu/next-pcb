"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Menu, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  const NavLinks = () => (
    <nav className="flex-1 space-y-1">
      <Link 
        href="/admin/orders" 
        className="block px-3 py-2 rounded-md text-foreground hover:bg-accent hover:text-primary font-medium transition-colors text-sm md:text-base"
        onClick={() => setSidebarOpen(false)}
      >
        Orders
      </Link>
      <Link 
        href="/admin/quote" 
        className="block px-3 py-2 rounded-md text-foreground hover:bg-accent hover:text-primary font-medium transition-colors text-sm md:text-base"
        onClick={() => setSidebarOpen(false)}
      >
        Quotes
      </Link>
      <Link 
        href="/admin/users" 
        className="block px-3 py-2 rounded-md text-foreground hover:bg-accent hover:text-primary font-medium transition-colors text-sm md:text-base"
        onClick={() => setSidebarOpen(false)}
      >
        Users
      </Link>
      <Link 
        href="/admin/site" 
        className="block px-3 py-2 rounded-md text-foreground hover:bg-accent hover:text-primary font-medium transition-colors text-sm md:text-base"
        onClick={() => setSidebarOpen(false)}
      >
        Site Management
      </Link>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row pt-16">
      {/* 移动端顶部栏 */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border shadow-sm sticky top-0 z-30">
        <span className="text-lg font-semibold text-primary">Admin Panel</span>
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-md">
              <Menu className="h-5 w-5 text-primary" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="text-xl font-bold text-primary">Admin Panel</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col h-[calc(100%-4rem)]">
              <div className="flex-1 p-4">
                <NavLinks />
              </div>
              <div className="p-4 border-t">
                <div className="text-xs text-muted-foreground text-center">
                  &copy; {new Date().getFullYear()} NextPCB Admin
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* 桌面端侧边栏 */}
      <aside 
        className={`
          hidden md:flex sticky top-16 h-[calc(100vh-4rem)] 
          bg-card border-r border-border flex-col z-40 
          transition-all duration-300 ease-in-out
          ${desktopSidebarOpen ? 'w-64' : 'w-16'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b">
          {desktopSidebarOpen && (
            <span className="text-xl font-bold text-primary">Admin Panel</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
          >
            <ChevronLeft className={`h-5 w-5 text-primary transition-transform duration-300 ${!desktopSidebarOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>
        <div className="flex-1 py-4 px-2">
          <NavLinks />
        </div>
        <div className="p-4 border-t">
          <div className="text-xs text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} NextPCB Admin
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-4 md:p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
} 