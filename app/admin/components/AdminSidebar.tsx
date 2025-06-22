"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Menu, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function AdminSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  const NavLinks = () => (
    <nav className="flex-1 space-y-1">
      <Link 
        href="/admin/orders" 
        className={`block px-3 py-2 rounded-md text-foreground hover:bg-accent hover:text-primary font-medium transition-colors text-sm md:text-base ${
          !desktopSidebarOpen ? 'md:text-center' : ''
        }`}
        onClick={() => setSidebarOpen(false)}
        title="订单管理"
      >
        {desktopSidebarOpen ? '订单管理' : 'O'}
      </Link>
      <Link 
        href="/admin/quote" 
        className={`block px-3 py-2 rounded-md text-foreground hover:bg-accent hover:text-primary font-medium transition-colors text-sm md:text-base ${
          !desktopSidebarOpen ? 'md:text-center' : ''
        }`}
        onClick={() => setSidebarOpen(false)}
        title="报价管理"
      >
        {desktopSidebarOpen ? '报价管理' : 'Q'}
      </Link>
      <Link 
        href="/admin/users" 
        className={`block px-3 py-2 rounded-md text-foreground hover:bg-accent hover:text-primary font-medium transition-colors text-sm md:text-base ${
          !desktopSidebarOpen ? 'md:text-center' : ''
        }`}
        onClick={() => setSidebarOpen(false)}
        title="用户管理"
      >
        {desktopSidebarOpen ? '用户管理' : 'U'}
      </Link>
      <Link 
        href="/admin/site" 
        className={`block px-3 py-2 rounded-md text-foreground hover:bg-accent hover:text-primary font-medium transition-colors text-sm md:text-base ${
          !desktopSidebarOpen ? 'md:text-center' : ''
        }`}
        onClick={() => setSidebarOpen(false)}
        title="站点管理"
      >
        {desktopSidebarOpen ? '站点管理' : 'S'}
      </Link>
      <Link 
        href="/admin/content" 
        className={`block px-3 py-2 rounded-md text-foreground hover:bg-accent hover:text-primary font-medium transition-colors text-sm md:text-base ${
          !desktopSidebarOpen ? 'md:text-center' : ''
        }`}
        onClick={() => setSidebarOpen(false)}
        title="内容管理"
      >
        {desktopSidebarOpen ? '内容管理' : 'C'}
      </Link>
      <Link 
        href="/admin/exchange-rates" 
        className={`block px-3 py-2 rounded-md text-foreground hover:bg-accent hover:text-primary font-medium transition-colors text-sm md:text-base ${
          !desktopSidebarOpen ? 'md:text-center' : ''
        }`}
        onClick={() => setSidebarOpen(false)}
        title="汇率管理"
      >
        {desktopSidebarOpen ? '汇率管理' : 'E'}
      </Link>
    </nav>
  );

  return (
    <>
      {/* 移动端顶部栏 */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border shadow-sm sticky top-20 z-[500]">
        <span className="text-lg font-semibold text-primary">管理面板</span>
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-md">
              <Menu className="h-5 w-5 text-primary" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 z-[900]">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="text-xl font-bold text-primary">管理面板</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col h-[calc(100%-4rem)]">
              <div className="flex-1 p-4">
                <nav className="flex-1 space-y-1">
                  <Link 
                    href="/admin/orders" 
                    className="block px-3 py-2 rounded-md text-foreground hover:bg-accent hover:text-primary font-medium transition-colors text-sm md:text-base"
                    onClick={() => setSidebarOpen(false)}
                  >
                    订单管理
                  </Link>
                  <Link 
                    href="/admin/quote" 
                    className="block px-3 py-2 rounded-md text-foreground hover:bg-accent hover:text-primary font-medium transition-colors text-sm md:text-base"
                    onClick={() => setSidebarOpen(false)}
                  >
                    报价管理
                  </Link>
                  <Link 
                    href="/admin/users" 
                    className="block px-3 py-2 rounded-md text-foreground hover:bg-accent hover:text-primary font-medium transition-colors text-sm md:text-base"
                    onClick={() => setSidebarOpen(false)}
                  >
                    用户管理
                  </Link>
                  <Link 
                    href="/admin/site" 
                    className="block px-3 py-2 rounded-md text-foreground hover:bg-accent hover:text-primary font-medium transition-colors text-sm md:text-base"
                    onClick={() => setSidebarOpen(false)}
                  >
                    站点管理
                  </Link>
                  <Link 
                    href="/admin/content" 
                    className="block px-3 py-2 rounded-md text-foreground hover:bg-accent hover:text-primary font-medium transition-colors text-sm md:text-base"
                    onClick={() => setSidebarOpen(false)}
                  >
                    内容管理
                  </Link>
                  <Link 
                    href="/admin/exchange-rates" 
                    className="block px-3 py-2 rounded-md text-foreground hover:bg-accent hover:text-primary font-medium transition-colors text-sm md:text-base"
                    onClick={() => setSidebarOpen(false)}
                  >
                    汇率管理
                  </Link>
                </nav>
              </div>
              <div className="p-4 border-t">
                <div className="text-xs text-muted-foreground text-center">
                  &copy; {new Date().getFullYear()} SpeedXPCB Admin
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* 桌面端侧边栏 */}
      <aside 
        className={`
          hidden md:flex sticky top-24 h-[calc(100vh-6rem)] 
          bg-card border-r border-border flex-col z-[400] 
          transition-all duration-300 ease-in-out overflow-hidden
          ${desktopSidebarOpen ? 'w-64' : 'w-16'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b min-h-[60px]">
          {desktopSidebarOpen && (
            <span className="text-xl font-bold text-primary whitespace-nowrap">管理面板</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={`${desktopSidebarOpen ? 'ml-auto' : 'mx-auto'} flex-shrink-0`}
            onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
          >
            <ChevronLeft className={`h-5 w-5 text-primary transition-transform duration-300 ${!desktopSidebarOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>
        <div className="flex-1 py-4 px-2 overflow-hidden">
          <NavLinks />
        </div>
        {desktopSidebarOpen && (
          <div className="p-4 border-t">
            <div className="text-xs text-muted-foreground text-center">
              &copy; {new Date().getFullYear()} SpeedXPCB Admin
            </div>
          </div>
        )}
      </aside>
    </>
  );
} 