'use client';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useLayoutEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useUserStore ,logoutAndRedirect} from "@/lib/userStore";
import { User, ListOrdered, LogOut, Menu, X } from "lucide-react";


const ANCHORS = ["services", "why", "testimonials", "contact"];

export default function Navbar() {
  const [show, setShow] = useState(true);
  const [hover, setHover] = useState(false);
  const [navAnim, setNavAnim] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const user = useUserStore(state => state.user);
  const isAdmin = user?.role === "admin";

  // 使用 useLayoutEffect 确保在渲染前就设置好状态
  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

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
  }, [hover, mounted]);

  // Logo动画控制
  useEffect(() => {
    if (show && mounted) {
      setNavAnim(true);
      setTimeout(() => setNavAnim(false), 400);
    }
  }, [show, mounted]);

  const handleSignOut = async () => {
    logoutAndRedirect("/");
  };

  let navigationItems = [
    { href: "/", label: "Home" },
    { href: "/quote2", label: "Quote" },
    { href: "#services", label: "Services" },
    { href: "#why", label: "Why Us" },
    { href: "#testimonials", label: "Testimonials" },
    { href: "/contact", label: "Contact" },
  ];
  if (isAdmin) {
    navigationItems = [
      ...navigationItems.slice(0, 1),
      { href: "/admin", label: "Admin" },
      ...navigationItems.slice(1)
    ];
  }

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div
      className="w-full"
      onMouseEnter={mounted ? () => { setShow(true); setHover(true); } : undefined}
      onMouseLeave={mounted ? () => { setHover(false); if (window.scrollY > 10) setShow(false); } : undefined}
      style={{ position: "relative", zIndex: 1000 }}
    >
      <nav
        className={`fixed top-0 left-0 w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 bg-background/80 border-b border-border backdrop-blur-xl transition-all duration-500 ease-out z-[1000]
        ${mounted && show ? "opacity-100 translate-y-0" : mounted ? "opacity-0 -translate-y-8 pointer-events-none" : "opacity-100 translate-y-0"}
        ${mounted && show ? "shadow-lg shadow-primary/5" : "shadow-lg shadow-primary/5"}
        `}
        style={{
          WebkitBackdropFilter: "blur(20px)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Logo Section */}
        <div className="flex items-center gap-4">
          <div className={`bg-card rounded-lg shadow-md border border-border p-2 flex items-center justify-center transition-all duration-500 ease-out ${mounted && navAnim ? "scale-110 rotate-3" : "scale-100 rotate-0"}`}>
            <Image 
              src="/pcb-logo.svg" 
              alt="PCB Logo" 
              width={28} 
              height={28} 
              className="sm:w-8 sm:h-8 transition-all duration-300" 
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-lg sm:text-xl tracking-tight text-primary leading-tight">SpeedXPCB</span>
            <span className="text-xs text-muted-foreground font-medium hidden sm:block leading-tight">Professional PCB Solutions</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navigationItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group relative px-4 py-2 rounded-lg text-sm font-medium text-foreground/80 hover:text-primary transition-all duration-300 ease-out hover:bg-accent/50"
            >
              {item.label}
              <span className="absolute inset-x-2 bottom-1 h-0.5 bg-primary rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />
            </a>
          ))}
        </div>

        {/* Desktop Auth Section */}
        <div className="hidden md:flex items-center gap-3">
          {mounted && user ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative rounded-xl p-2 border border-border/50 hover:border-border hover:bg-accent/50 transition-all duration-300 group"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content 
                sideOffset={12} 
                className="z-[1100] min-w-[220px] rounded-xl bg-popover/95 backdrop-blur-xl p-2 shadow-xl border border-border animate-in slide-in-from-top-2 duration-200"
              >
                <div className="px-3 py-2 border-b border-border/50 mb-2">
                  <p className="text-sm font-medium text-popover-foreground">Signed in as</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenu.Item asChild>
                  <Link href="/profile">
                    <Button variant="ghost" className="w-full justify-start gap-3 rounded-lg px-3 py-2.5 hover:bg-accent transition-colors">
                      <User className="w-4 h-4 text-primary" />
                      <span className="text-sm">User Center</span>
                    </Button>
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                  <Link href="/profile/orders">
                    <Button variant="ghost" className="w-full justify-start gap-3 rounded-lg px-3 py-2.5 hover:bg-accent transition-colors">
                      <ListOrdered className="w-4 h-4 text-primary" />
                      <span className="text-sm">My Orders</span>
                    </Button>
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-2 h-px bg-border" />
                <DropdownMenu.Item>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors" 
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Sign Out</span>
                  </Button>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth">
                <Button
                  variant="ghost"
                  className="rounded-lg border border-border/50 hover:border-border hover:bg-accent/50 transition-all duration-300"
                >
                  Login
                </Button>
              </Link>
              <Link href="/auth?signup=1">
                <Button
                  className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Section */}
        <div className="md:hidden flex items-center gap-2">
          {mounted && user && (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative rounded-xl p-2 border border-border/50 hover:border-border hover:bg-accent/50 transition-all duration-300 group"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content 
                sideOffset={8} 
                className="z-[1100] min-w-[200px] rounded-xl bg-popover/95 backdrop-blur-xl p-2 shadow-xl border border-border"
              >
                <div className="px-3 py-2 border-b border-border/50 mb-2">
                  <p className="text-xs font-medium text-popover-foreground">Signed in as</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenu.Item asChild>
                  <Link href="/profile">
                    <Button variant="ghost" className="w-full justify-start gap-3 rounded-lg px-3 py-2 hover:bg-accent transition-colors">
                      <User className="w-4 h-4 text-primary" />
                      <span className="text-sm">User Center</span>
                    </Button>
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                  <Link href="/quote/orders">
                    <Button variant="ghost" className="w-full justify-start gap-3 rounded-lg px-3 py-2 hover:bg-accent transition-colors">
                      <ListOrdered className="w-4 h-4 text-primary" />
                      <span className="text-sm">My Orders</span>
                    </Button>
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-2 h-px bg-border" />
                <DropdownMenu.Item>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 rounded-lg px-3 py-2 text-destructive hover:bg-destructive/10 transition-colors" 
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Sign Out</span>
                  </Button>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-lg border border-border/50 hover:border-border hover:bg-accent/50 transition-all duration-300"
            onClick={mounted ? () => setMobileMenuOpen(!mobileMenuOpen) : undefined}
          >
            {mounted && mobileMenuOpen ? 
              <X className="w-5 h-5 text-foreground" /> : 
              <Menu className="w-5 h-5 text-foreground" />
            }
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mounted && mobileMenuOpen && (
        <div className="md:hidden fixed top-[76px] left-0 w-full bg-background/95 backdrop-blur-xl border-b border-border shadow-lg z-[999] animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-6 space-y-1">
            {navigationItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block px-4 py-3 rounded-lg text-sm font-medium text-foreground/80 hover:text-primary hover:bg-accent/50 transition-all duration-200"
                onClick={closeMobileMenu}
              >
                {item.label}
              </a>
            ))}
            {!user && (
              <div className="pt-4 space-y-3 border-t border-border/50 mt-4">
                <Link href="/auth" onClick={closeMobileMenu}>
                  <Button
                    variant="ghost"
                    className="w-full rounded-lg border border-border/50 hover:border-border hover:bg-accent/50 transition-all duration-300"
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/auth?signup=1" onClick={closeMobileMenu}>
                  <Button
                    className="w-full rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all duration-300"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hover Detection Area */}
      <div className="fixed top-0 left-0 w-full h-6 z-[998]" />
    </div>
  );
} 