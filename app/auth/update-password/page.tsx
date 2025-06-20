"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';

function UpdatePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Pre-fill email from URL parameter for better user experience
    const emailFromQuery = searchParams.get('email');
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    }
  }, [searchParams]);

  const handlePasswordReset = async () => {
    if (newPassword.length < 6) {
      setError('Password should be at least 6 characters long.');
      return;
    }
    if (!token) {
        setError('Recovery code is required.');
        return;
    }

    setLoading(true);
    setError('');

    // 1. Verify the OTP. This will sign the user in temporarily.
    const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email', // Use 'email' type as we initiated with signInWithOtp
    });

    if (verifyError) {
      setError(`Invalid or expired recovery code. Please try again. Error: ${verifyError.message}`);
      setLoading(false);
      return;
    }

    // If verification is successful, a session is created. Now update the user's password.
    if (sessionData.session) {
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (updateError) {
            setError(`Failed to update password. ${updateError.message}`);
        } else {
            toast({
                title: 'Success!',
                description: 'Your password has been reset successfully. Please sign in.',
            });
            // It's good practice to sign the user out after a password reset
            await supabase.auth.signOut();
            router.push('/auth');
        }
    } else {
        setError("Could not establish a session. Please try the recovery process again.");
    }


    setLoading(false);
  };

  return (
    <Card className="w-full max-w-[380px] shadow-2xl border-0 bg-white/85 backdrop-blur-md rounded-2xl p-4 md:p-6" style={{ boxShadow: '0 8px 32px 0 rgba(56, 189, 248, 0.10), 0 1.5px 8px 0 rgba(30, 64, 175, 0.08)' }}>
      <CardHeader className="p-0 mb-4 text-center">
        <CardTitle className="text-xl font-bold text-blue-800">Set a New Password</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <form onSubmit={(e) => { e.preventDefault(); handlePasswordReset(); }} className="space-y-4">
          <Input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            readOnly // Pre-filled and read-only to avoid errors
            className="h-11 text-base rounded-lg border-blue-200 focus:border-blue-400 bg-slate-100/80 shadow-sm"
          />
          <Input
            placeholder="Recovery Code from Email"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            autoFocus
            className="h-11 text-base rounded-lg border-blue-200 focus:border-blue-400 bg-white/80 shadow-sm"
          />
          <Input
            type="password"
            placeholder="Enter your new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="h-11 text-base rounded-lg border-blue-200 focus:border-blue-400 bg-white/80 shadow-sm"
          />
          <Button className="w-full h-11 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-all" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
          {error && <p className="text-sm text-center text-red-500 pt-1">{error}</p>}
        </form>
      </CardContent>
    </Card>
  );
}

export default function UpdatePasswordPage() {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 font-sans overflow-hidden">
        <Image
          src="/pcb-bg.png"
          alt="PCB background"
          fill
          className="absolute inset-0 w-full h-full object-cover object-center opacity-60 z-0 pointer-events-none select-none"
          style={{ filter: 'blur(2px) brightness(0.85)' }}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/80 via-white/60 to-blue-200/80 z-10" />
        <div className="relative z-20 flex flex-col items-center justify-center w-full px-4">
            <Suspense>
                <UpdatePasswordForm />
            </Suspense>
        </div>
      </div>
    );
} 