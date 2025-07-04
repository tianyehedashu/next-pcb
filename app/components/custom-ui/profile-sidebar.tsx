"use client";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Menu,
  List,
  ClipboardList,
  Lock,
  User,
  ChevronLeft,
  CreditCard,
  MapPin,
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

const menu = [
  {
    title: "My Business",
    items: [
      { label: "My Orders", href: "/profile/orders", icon: List },
      { label: "Pending Payments", href: "/profile/orders?type=pending-payment", icon: CreditCard },
      { label: "My Quotes", href: "/profile/quotes", icon: ClipboardList },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Knowledge Center", href: "/content", icon: Menu },
      { label: "Technical Guides", href: "/content/guides", icon: ClipboardList },
      { label: "Industry News", href: "/content/news", icon: ClipboardList },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Profile", href: "/profile", icon: User },
      { label: "Shipping Addresses", href: "/profile/address", icon: MapPin },
      { label: "Change Password", href: "/profile/password", icon: Lock },
    ],
  },
];

export default function ProfileSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  // 检查当前 URL 是否与菜单项匹配
  const isActive = (href: string) => {
    const [path, query] = href.split('?');
    if (pathname !== path) return false;
    
    if (!query) {
      // 如果菜单项没有查询参数，则检查当前 URL 也没有相关查询参数
      return !searchParams.get('type');
    }
    
    // 如果菜单项有查询参数，检查当前 URL 的查询参数是否匹配
    const params = new URLSearchParams(query);
    for (const [key, value] of params.entries()) {
      if (searchParams.get(key) !== value) return false;
    }
    return true;
  };

  // 侧边栏内容
  const sidebarContent = (
    <nav className="w-full bg-transparent p-4 flex flex-col gap-6 h-full">
      {menu.map((section) => (
        <div key={section.title}>
          <div className="text-xs font-bold text-gray-500 mb-2">{section.title}</div>
          <ul className="space-y-1">
            {section.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded transition-colors",
                    isActive(item.href)
                      ? "bg-primary text-white font-semibold"
                      : "hover:bg-muted"
                  )}
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  // 桌面端侧边栏内容
  const desktopSidebarContent = (
    <nav className="w-64 bg-white rounded-lg shadow-md p-4 flex flex-col gap-6 h-full">
      {menu.map((section) => (
        <div key={section.title}>
          <div className="text-xs font-bold text-gray-500 mb-2">{section.title}</div>
          <ul className="space-y-1">
            {section.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded transition-colors",
                    isActive(item.href)
                      ? "bg-primary text-white font-semibold"
                      : "hover:bg-muted"
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* 移动端菜单按钮 */}
      <div className="md:hidden flex items-center p-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              className="inline-flex items-center gap-2 text-primary bg-white rounded shadow px-3 py-2"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
              <span>Menu</span>
            </button>
          </DialogTrigger>
          <DialogContent className="p-0 max-w-sm w-full sm:max-w-xs fixed left-4 top-4 bottom-4 right-auto translate-x-0 translate-y-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left rounded-lg shadow-2xl border">
            <DialogTitle className="sr-only">Navigation Menu</DialogTitle>
            <div className="flex items-center gap-2 p-4 border-b bg-white">
              <button
                className="rounded p-1 hover:bg-muted transition-colors"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-bold text-lg">Menu</span>
            </div>
            <div className="flex-1 overflow-y-auto bg-white">
              {sidebarContent}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {/* 桌面端侧边栏 */}
      <aside className="hidden md:block">
        {desktopSidebarContent}
      </aside>
    </>
  );
} 