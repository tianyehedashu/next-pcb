"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Github, Chrome } from "lucide-react";
import Image from "next/image";
import { useUserStore } from "@/lib/userStore";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/userStore";

export default function AuthPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 font-sans overflow-hidden">
      {/* 背景图层 */}
      <Image
        src="/pcb-bg.png"
        alt="PCB background"
        fill
        className="absolute inset-0 w-full h-full object-cover object-center opacity-60 z-0 pointer-events-none select-none"
        style={{ filter: 'blur(2px) brightness(0.85)' }}
        priority
      />
      {/* 深色遮罩，提升卡片可读性 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/80 via-white/60 to-blue-200/80 z-10" />
      {/* 卡片内容 */}
      <div className="relative z-20 flex flex-col items-center justify-center w-full px-4" style={{ minHeight: 'calc(100vh - 80px)', paddingTop: '64px', paddingBottom: '32px' }}>
        <Suspense>
          <AuthContent />
        </Suspense>
      </div>
    </div>
  );
}

function isSafeRedirect(redirect: string | null): string {
  // 只允许跳转到本站内的路径，防止 open redirect
  if (!redirect || typeof redirect !== "string") return "/";
  if (redirect.startsWith("/") && !redirect.startsWith("//")) return redirect;
  return "/";
}

function mapSupabaseUserToUserInfo(user: SupabaseUser) {
  let role: UserRole | undefined;
  if (user.user_metadata?.role === "admin" || user.user_metadata?.role === "user" || user.user_metadata?.role === "guest") {
    role = user.user_metadata.role;
  } else {
    role = undefined;
  }
  return {
    id: user.id,
    email: user.email,
    avatar_url: user.user_metadata?.avatar_url,
    role,
    ...user.user_metadata,
  };
}

function AuthContent() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loginMethod, setLoginMethod] = useState<'email' | 'google' | 'github'>('email');
  const user = useUserStore(state => state.user);
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (searchParams.get("signup")) setIsSignUp(true);
  }, [searchParams]);

  // 登录成功后自动跳转（只跳一次）
  useEffect(() => {
    if (user && !hasRedirected.current) {
      hasRedirected.current = true;
      const redirect = isSafeRedirect(searchParams.get("redirect"));
      toast({
        title: "Login successful!",
        description: "Redirecting...",
        duration: 1200,
      });
      setTimeout(() => {
        // 清理 URL，避免刷新后重复跳转
        window.history.replaceState({}, document.title, "/auth");
        router.replace(redirect);
      }, 1000);
    }
  }, [user, router, searchParams, toast]);

  // 新增：登录状态变化时自动同步 user 到全局 store
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        useUserStore.setState({ user: mapSupabaseUserToUserInfo(session.user) });
      } else {
        useUserStore.setState({ user: null });
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleEmailAuth = async () => {
    setLoading(true);
    setMessage("");
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else setMessage("Registration successful! Please check your email inbox to confirm your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    const redirect = isSafeRedirect(searchParams.get("redirect")) || "/";
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth?redirect=${encodeURIComponent(redirect)}`,
        queryParams: {
          prompt: "select_account"
        }
      }
    });
    setLoading(false);
  };

  const handleGithub = async () => {
    setLoading(true);
    const redirect = isSafeRedirect(searchParams.get("redirect")) || "/";
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth?redirect=${encodeURIComponent(redirect)}`,
        queryParams: {
          prompt: "select_account consent"
        }
      }
    });
    setLoading(false);
  };

  // 登录方式切换按钮
  const loginOptions = [
    {
      key: 'email',
      icon: <Mail className="w-6 h-6" />, 
      label: 'Email',
      onClick: () => setLoginMethod('email'),
    },
    {
      key: 'google',
      icon: <Chrome className="w-6 h-6" />, 
      label: 'Google',
      onClick: handleGoogle,
    },
    {
      key: 'github',
      icon: <Github className="w-6 h-6" />, 
      label: 'GitHub',
      onClick: handleGithub,
    },
  ];

  return (
    <Card className="w-full max-w-[380px] shadow-2xl border-0 bg-white/85 backdrop-blur-md rounded-2xl px-0 md:px-0" style={{ boxShadow: '0 8px 32px 0 rgba(56, 189, 248, 0.10), 0 1.5px 8px 0 rgba(30, 64, 175, 0.08)' }}>
      <CardHeader className="pb-0 border-0 pt-6 flex flex-col items-center">
        <div className="flex flex-col items-center gap-2 w-full">
          <span className="inline-flex items-center gap-2 text-blue-700 font-extrabold text-xl tracking-tight mb-2">
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="16" fill="#3B82F6"/><path d="M10 17.5L15 22.5L22 10.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            SpeedXPCB
          </span>
          <CardTitle className="text-center text-xl font-bold text-blue-800 mt-1 mb-0">
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="py-3 px-4 md:px-2 space-y-3 flex flex-col items-center">
        {/* 邮箱登录表单 */}
        {loginMethod === 'email' && (
          <form onSubmit={(e) => { e.preventDefault(); handleEmailAuth(); }} autoComplete="off" className="w-full flex flex-col gap-4">
            <Input
              placeholder="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
              autoComplete="username"
              className="h-11 text-base rounded-lg border-blue-200 focus:border-blue-400 bg-white/80 shadow-sm"
            />
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              className="h-11 text-base rounded-lg border-blue-200 focus:border-blue-400 bg-white/80 shadow-sm"
            />
            <Button
              className="w-full h-11 text-base font-bold mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-all"
              onClick={handleEmailAuth}
              disabled={loading}
            >
              {isSignUp ? "Sign Up with Email" : "Sign In with Email"}
            </Button>
          </form>
        )}
        {/* 登录方式切换icon按钮（缩小，主按钮下方） */}
        <div className="flex items-center justify-center gap-3 mt-2 mb-2">
          {loginOptions.filter(opt => opt.key !== 'email').map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={opt.onClick}
              className={`flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg border transition-all shadow-sm
                text-gray-400 hover:bg-blue-100 hover:text-blue-600
                focus:outline-none focus:ring-2 focus:ring-blue-300`}
              style={{ minWidth: 38 }}
            >
              {opt.icon}
              <span className="text-xs font-medium mt-0.5">{opt.label}</span>
            </button>
          ))}
        </div>
        {/* 错误/提示信息 */}
        {message && <div className="text-sm text-destructive text-center w-full -mt-2">{message}</div>}
        {/* 登录/注册切换 */}
        <div className="flex items-center justify-center mt-2 w-full">
          <div className="text-sm">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button className="text-blue-600 hover:underline font-semibold" onClick={() => setIsSignUp(false)}>Sign In</button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <button className="text-blue-600 hover:underline font-semibold" onClick={() => setIsSignUp(true)}>Sign Up</button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
