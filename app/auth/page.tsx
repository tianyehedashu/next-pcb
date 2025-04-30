"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("signup")) setIsSignUp(true);
  }, [searchParams]);

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
      else {
        setMessage("Login successful!");
        const redirect = searchParams.get("redirect");
        if (redirect) {
          router.push(`/${redirect}`);
        } else {
          router.push("/profile");
        }
      }
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({ provider: "google" });
    setLoading(false);
  };

  const handleGithub = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({ provider: "github" });
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md relative">
        <CardHeader>
          <CardTitle className="text-center">
            {isSignUp ? "Sign Up" : "Sign In"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoFocus
          />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <Button
            className="w-full"
            onClick={handleEmailAuth}
            disabled={loading}
          >
            {isSignUp ? "Sign Up with Email" : "Sign In with Email"}
          </Button>
          <div className="text-center text-sm">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button className="text-blue-600 hover:underline" onClick={() => setIsSignUp(false)}>Sign In</button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <button className="text-blue-600 hover:underline" onClick={() => setIsSignUp(true)}>Sign Up</button>
              </>
            )}
          </div>
          {message && <div className="text-center text-destructive text-sm">{message}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
