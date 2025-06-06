"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Menu,
  ShoppingCart,
  CreditCard,
  List,
  Truck,
  Package,
  ClipboardList,
  Lock,
  User,
  MessageCircle,
  HelpCircle,
  ChevronLeft,
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

const menu = [
  {
    title: "My Orders",
    items: [
      { label: "My NextPCB", href: "/profile", icon: User },
      { label: "My Shopping Cart", href: "/profile/cart", icon: ShoppingCart },
      { label: "Pay the difference", href: "/profile/pay-diff", icon: CreditCard },
      { label: "All Orders", href: "/profile/orders", icon: List },
      { label: "Unfinished Payment", href: "/profile/unfinished", icon: CreditCard },
      { label: "DFA Review", href: "/profile/dfa-review", icon: ClipboardList },
      { label: "Production Status", href: "/profile/production-status", icon: Package },
      { label: "Delivery", href: "/profile/delivery", icon: Truck },
      { label: "Awaiting Feedback", href: "/profile/feedback", icon: MessageCircle },
      { label: "Complete", href: "/profile/complete", icon: List },
      { label: "Refunds & Disputes", href: "/profile/refunds", icon: HelpCircle },
    ],
  },
  {
    title: "Engineer Questions (EQ)",
    items: [
      { label: "EQ List", href: "/profile/eq", icon: List },
    ],
  },
  {
    title: "My Account",
    items: [
      { label: "My Message", href: "/profile/message", icon: MessageCircle },
      { label: "Account Balance", href: "/profile/balance", icon: CreditCard },
      { label: "My Coupon", href: "/profile/coupon", icon: CreditCard },
    ],
  },
  {
    title: "Setting",
    items: [
      { label: "My Profile", href: "/profile", icon: User },
      { label: "Billing Details", href: "/profile/billing", icon: CreditCard },
      { label: "My Shipping Address", href: "/profile/address", icon: Truck },
      { label: "Change the Password", href: "/profile/password", icon: Lock },
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