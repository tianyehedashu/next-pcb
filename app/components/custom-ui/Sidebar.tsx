"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { label: "Orders", href: "/admin/orders", icon: FileText },
  { label: "Quotes", href: "/admin/quote", icon: FileText },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Site Management", href: "/admin/site", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex sticky top-0 h-[calc(100vh-4rem)] w-56 flex-col bg-card border-r border-border z-40 shadow-sm">
      {/* 顶部Logo+标题 */}
      <div className="flex items-center gap-3 h-16 px-6 border-b border-border">
        <div className="bg-primary rounded-lg p-2 flex items-center justify-center">
          <span className="text-white font-bold text-lg">N</span>
        </div>
        <span className="text-xl font-bold text-primary">Admin Panel</span>
      </div>
      {/* 导航菜单 */}
      <nav className="flex-1 flex flex-col gap-1 px-2 py-6">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} legacyBehavior passHref>
            <Button
              asChild
              variant={pathname.startsWith(href) ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 rounded-lg px-3 py-2 text-base font-medium transition-colors ${pathname.startsWith(href) ? "bg-accent text-primary" : "text-foreground hover:bg-accent hover:text-primary"}`}
            >
              <a>
                <Icon className="w-5 h-5" />
                {label}
              </a>
            </Button>
          </Link>
        ))}
      </nav>
      <Separator className="my-2" />
      {/* 底部用户区 */}
      <div className="flex items-center gap-3 px-6 py-4 border-t border-border">
        <Avatar>
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Admin</span>
          <span className="text-xs text-muted-foreground">admin@nextpcb.com</span>
        </div>
      </div>
    </aside>
  );
} 