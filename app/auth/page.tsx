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
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignUp = !!searchParams.get("signup");
  const isForgotPassword = !!searchParams.get('forgot_password');

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const { toast } = useToast();
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const user = useUserStore(state => state.user);
  const hasRedirected = useRef(false);

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

  const handleToggleMode = (mode: 'signin' | 'signup' | 'forgot_password') => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('signup');
    params.delete('forgot_password');

    if (mode === 'signup') {
      params.set('signup', '1');
    } else if (mode === 'forgot_password') {
      params.set('forgot_password', '1');
    }
    router.push(`/auth?${params.toString()}`);
  };

  const handleEmailAuth = async () => {
    setLoading(true);
    setMessage("");
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message);
      } else if (data.user && data.user.identities && data.user.identities.length === 0) {
        setMessage("This email is already registered. Please sign in or use the 'Forgot Password' option.");
      } else {
        setMessage("Registration successful! Please check your email inbox to confirm your account.");
      }
    } else { // Sign In Logic
      if (loginMethod === 'password') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setMessage(error.message);
      } else { // OTP Logic
        const { error } = await supabase.auth.signInWithOtp({ 
          email,
          options: { shouldCreateUser: false } 
        });
        if (error) {
          setMessage(error.message);
        } else {
          toast({
            title: "Login code sent",
            description: "Check your email for the login code.",
          });
          setMessage(""); // Clear previous messages
          setOtpSent(true); // Show the OTP input form
        }
      }
    }
    setLoading(false);
  };

  const handleOtpVerify = async () => {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });
    if (error) {
      setMessage(`Failed to verify OTP: ${error.message}`);
    }
    // On success, onAuthStateChange will handle the redirect.
    setLoading(false);
  };

  const handlePasswordResetRequest = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    setMessage('');

    // We use the 'signInWithOtp' flow as a vehicle for password recovery.
    // This sends a verifiable OTP to the user's email.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // We don't want to create a new user if they don't exist,
        // as this is a recovery flow.
        shouldCreateUser: false,
      },
    });

    if (error) {
      // Don't expose "User not found" errors to prevent email enumeration.
      if (error.message.includes("User not found")) {
         setMessage("If an account with this email exists, a recovery code has been sent.");
      } else {
         setMessage(error.message);
      }
      setLoading(false);
    } else {
      toast({
        title: "Recovery code sent",
        description: "Check your email for the recovery code.",
      });
      // Redirect to the update-password page, passing the email along.
      router.push(`/auth/update-password?email=${encodeURIComponent(email)}`);
    }
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
      onClick: () => setLoginMethod('password'),
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

  if (isForgotPassword) {
    return (
      <Card className="w-full max-w-[380px] shadow-2xl border-0 bg-white/85 backdrop-blur-md rounded-2xl p-4 md:p-6" style={{ boxShadow: '0 8px 32px 0 rgba(56, 189, 248, 0.10), 0 1.5px 8px 0 rgba(30, 64, 175, 0.08)' }}>
        <CardHeader className="p-0 mb-4 text-center">
          <CardTitle className="text-xl font-bold text-blue-800">Reset your password</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={(e) => { e.preventDefault(); handlePasswordResetRequest(); }} autoComplete="off" className="w-full flex flex-col gap-4">
            <Input
              placeholder="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
              className="h-11 text-base rounded-lg border-blue-200 focus:border-blue-400 bg-white/80 shadow-sm"
            />
            <Button
              className="w-full h-11 text-base font-bold mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-all"
              onClick={handlePasswordResetRequest}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Recovery Code"}
            </Button>
          </form>
          {message && <div className="text-sm text-destructive text-center w-full pt-2">{message}</div>}
          <div className="text-center mt-4 w-full">
            <button className="text-sm text-blue-600 hover:underline font-semibold" onClick={() => handleToggleMode('signin')}>Back to Sign In</button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-[380px] shadow-2xl border-0 bg-white/85 backdrop-blur-md rounded-2xl p-4 md:p-6" style={{ boxShadow: '0 8px 32px 0 rgba(56, 189, 248, 0.10), 0 1.5px 8px 0 rgba(30, 64, 175, 0.08)' }}>
      <CardHeader className="p-0 pb-4 flex flex-col items-center">
        <div className="flex flex-col items-center gap-2 w-full">
          <span className="inline-flex items-center gap-2 text-blue-700 font-extrabold text-xl tracking-tight mb-1">
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="16" fill="#3B82F6"/><path d="M10 17.5L15 22.5L22 10.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            SpeedXPCB
          </span>
          <CardTitle className="text-center text-xl font-bold text-blue-800">
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0 space-y-4 flex flex-col items-center">
        {!otpSent ? (
          <>
            {/* Email/Password Form */}
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
              {loginMethod === 'password' && (
                <div className="space-y-1">
                  <Input
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    className="h-11 text-base rounded-lg border-blue-200 focus:border-blue-400 bg-white/80 shadow-sm"
                  />
                  {!isSignUp && (
                    <div className="text-right pr-1">
                      <button
                        type="button"
                        onClick={() => handleToggleMode('forgot_password')}
                        className="text-xs text-blue-600 hover:underline hover:text-blue-700 font-medium"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </div>
              )}
              <Button
                className="w-full h-11 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-all"
                onClick={handleEmailAuth}
                disabled={loading}
              >
                {isSignUp ? "Sign Up with Email" : (loginMethod === 'password' ? "Sign In with Password" : "Send Login Code")}
              </Button>
            </form>
            
            {/* Login method toggle */}
            {!isSignUp && (
              <div className="text-sm">
                <button 
                  className="text-blue-600 hover:underline font-semibold" 
                  onClick={() => setLoginMethod(prev => prev === 'password' ? 'otp' : 'password')}
                >
                  {loginMethod === 'password' ? "Sign in with code" : "Sign in with password"}
                </button>
              </div>
            )}
          </>
        ) : (
           // OTP Verification Form
          <form onSubmit={(e) => { e.preventDefault(); handleOtpVerify(); }} className="w-full flex flex-col gap-4">
            <p className="text-sm text-center text-gray-600">A login code was sent to <br/><strong className="font-medium text-gray-800">{email}</strong>. Please enter it below.</p>
            <Input
              placeholder="Code from email"
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              autoFocus
              className="h-11 text-base rounded-lg border-blue-200 focus:border-blue-400 bg-white/80 shadow-sm"
            />
            <Button
              className="w-full h-11 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-all"
              onClick={handleOtpVerify}
              disabled={loading}
            >
              Verify Code & Sign In
            </Button>
            <div className="text-sm text-center">
              <button 
                type="button"
                className="text-blue-600 hover:underline font-semibold" 
                onClick={() => {
                  setOtpSent(false);
                  setMessage(""); // Clear any previous OTP error messages
                }}
              >
                Back to login
              </button>
            </div>
          </form>
        )}
        
        {/* Error/Info Message */}
        {message && <div className="text-sm text-center w-full pt-2 text-destructive">{message}</div>}

        {/* Separator and 3rd Party Logins */}
        {!otpSent && (
          <>
            <div className="relative w-full flex items-center justify-center my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative px-2 bg-white/85 text-xs text-gray-500">Or continue with</div>
            </div>
            <div className="flex items-center justify-center gap-3">
              {loginOptions.map(opt => (
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
          </>
        )}
        
        {/* Toggle Sign In/Sign Up */}
        <div className="flex items-center justify-center mt-4 w-full">
          <div className="text-sm">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button className="text-blue-600 hover:underline font-semibold" onClick={() => { handleToggleMode('signin'); setOtpSent(false); }}>Sign In</button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <button className="text-blue-600 hover:underline font-semibold" onClick={() => handleToggleMode('signup')}>Sign Up</button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
