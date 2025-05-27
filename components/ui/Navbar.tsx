'use client';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useUserStore ,logoutAndRedirect} from "@/lib/userStore";
import { User, ListOrdered, LogOut } from "lucide-react";


const ANCHORS = ["services", "why", "testimonials", "contact"];

export default function Navbar() {
  const [show, setShow] = useState(true);
  const [hover, setHover] = useState(false);
  const [navAnim, setNavAnim] = useState(false);
  const user = useUserStore(state => state.user);

  useEffect(() => {

    const onScroll = () => {
      // 检查是否在锚点区域
      let inAnchor = false;
      for (const id of ANCHORS) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 80 && rect.bottom > 80) {
            inAnchor = true;
            break;
          }
        }
      }
      if (window.scrollY <= 10 || inAnchor) {
        setShow(true);
      } else if (!hover) {
        setShow(false);
      }
    
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [hover]);

  // Logo动画控制
  useEffect(() => {
    if (show) {
      setNavAnim(true);
      setTimeout(() => setNavAnim(false), 400);
    }
  }, [show]);

  const handleSignOut = async () => {
    logoutAndRedirect("/");
  };

  return (
    <div
      className="w-full"
      onMouseEnter={() => { setShow(true); setHover(true); }}
      onMouseLeave={() => { setHover(false); if (window.scrollY > 10) setShow(false); }}
      style={{ position: "relative", zIndex: 50 }}
    >
      <nav
        className={`fixed top-0 left-0 w-full flex items-center justify-between px-8 py-3 bg-white/80 shadow-lg border-b border-blue-100 backdrop-blur-xl transition-all duration-500
        ${show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8 pointer-events-none"}
        ${show ? "shadow-xl" : "shadow-none"}
        `}
        style={{
          WebkitBackdropFilter: "blur(16px)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className={`bg-white rounded-full shadow p-1 flex items-center justify-center transition-transform duration-500 ${navAnim ? "scale-110" : "scale-100"}`}>
            <Image src="/pcb-logo.svg" alt="PCB Logo" width={40} height={40} />
          </div>
          <span className="font-bold text-xl tracking-tight text-blue-700 ml-2">SpeedXPCB</span>
        </div>
        <div className="hidden md:flex gap-6 text-base font-medium">
          {[
            { href: "/", label: "Home" },
            { href: "/quote", label: "Quote" },
            { href: "#services", label: "Services" },
            { href: "#why", label: "Why Us" },
            { href: "#testimonials", label: "Testimonials" },
            { href: "/contact", label: "Contact" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-2 py-1 rounded relative transition-colors duration-150 text-slate-700 hover:text-blue-600"
            >
              {item.label}
              <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-[2px] w-0 bg-blue-500 rounded transition-all duration-300 group-hover:w-4/5 hover:w-4/5" />
            </a>
          ))}
        </div>
        <div className="flex gap-2">
          {user ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button variant="ghost" className="rounded-full px-2 border-2 border-blue-200 shadow-md hover:scale-105 transition">
                  <Avatar>
                    <AvatarFallback className="bg-gradient-to-tr from-blue-400 to-blue-200 text-white">MY</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content sideOffset={8} className="z-[200] min-w-[180px] rounded-2xl bg-white/80 backdrop-blur-xl p-2 shadow-2xl border border-blue-100">
                <DropdownMenu.Item asChild>
                  <Link href="/profile">
                    <Button variant="ghost" className="w-full justify-start gap-2 rounded-xl px-3 py-2 hover:bg-blue-50/80 transition">
                      <User className="w-4 h-4 text-blue-500" />
                      <span>User Center</span>
                    </Button>
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                  <Link href="/quote/orders">
                    <Button variant="ghost" className="w-full justify-start gap-2 rounded-xl px-3 py-2 hover:bg-blue-50/80 transition">
                      <ListOrdered className="w-4 h-4 text-blue-500" />
                      <span>My Orders</span>
                    </Button>
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-2 h-px bg-blue-100" />
                <DropdownMenu.Item>
                  <Button variant="ghost" className="w-full justify-start gap-2 rounded-xl px-3 py-2 text-red-500 hover:bg-red-50/80 transition" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </Button>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          ) : (
            <>
              <Link href="/auth">
                <Button
                  variant="outline"
                  className="rounded-full border-blue-200 text-blue-700 hover:border-blue-400 hover:bg-blue-50 transition"
                >
                  Login
                </Button>
              </Link>
              <Link href="/auth?signup=1">
                <Button
                  className="rounded-full bg-blue-600 text-white hover:bg-blue-700 transition shadow"
                >
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>
      {/* 悬浮区 */}
      <div className="fixed top-0 left-0 w-full h-6 z-40" style={{ cursor: "pointer" }} />
    </div>
  );
} 