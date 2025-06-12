"use client";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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
    title: "Account",
    items: [
      { label: "Profile", href: "/profile", icon: User },
      { label: "Change Password", href: "/profile/password", icon: Lock },
    ],
  },
];

export default function ProfileSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // 侧边栏内容
  const sidebarContent = (
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
                    pathname === item.href
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
          <DialogContent className="p-0 max-w-xs left-0 top-0 h-full rounded-none shadow-lg">
            <div className="flex items-center gap-2 p-4 border-b">
              <button
                className="rounded p-1 hover:bg-muted"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-bold text-lg">Menu</span>
            </div>
            {sidebarContent}
          </DialogContent>
        </Dialog>
      </div>
      {/* 桌面端侧边栏 */}
      <aside className="hidden md:block min-h-screen">
        {sidebarContent}
      </aside>
    </>
  );
} 