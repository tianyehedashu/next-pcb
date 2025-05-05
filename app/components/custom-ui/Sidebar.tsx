"use client";
import { usePathname, useRouter } from "next/navigation";
import { useUserStore } from "@/lib/userStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const user = useUserStore(state => state.user);
  const router = useRouter();
  const pathname = usePathname();

  // 菜单配置
  const menu = [
    { label: "My Orders", path: "/quote/orders" },
    { label: "New Quote", path: "/quote" },
    { label: "Profile", path: "/profile" },
  ];

  return (
    <aside className="w-56 shrink-0 hidden md:flex flex-col items-center py-8 bg-white/90 rounded-2xl shadow-lg border border-primary/10">

      {/* 菜单 */}
      <nav className="flex flex-col gap-1 w-full px-4">
        {menu.map(item => (
          <Button
            key={item.path}
            variant="ghost"
            className={cn(
              "justify-start w-full rounded-lg px-4 py-2 font-medium transition-all",
              pathname === item.path
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-gray-700 hover:bg-primary/5 hover:text-primary"
            )}
            aria-current={pathname === item.path ? "page" : undefined}
            onClick={() => router.push(item.path)}
          >
            {item.label}
          </Button>
        ))}
      </nav>
    </aside>
  );
} 