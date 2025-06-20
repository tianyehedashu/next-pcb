"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sessionExists, setSessionExists] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // The onAuthStateChange listener is the primary mechanism.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setDebugInfo(`Event: ${event}, Session: ${session ? 'Exists' : 'null'}`);

      if (session) {
        setSessionExists(true);
        // Clean the URL hash to prevent the token from being used again.
        if (window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
        }
      }
    });

    // Fallback for mobile browsers: manually parse the token from the URL hash.
    // Supabase's client library should do this automatically, but some mobile
    // webviews might interfere.
    try {
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1)); // remove #
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          setDebugInfo(prev => prev + '\nFound tokens in hash. Setting session...');
          // This will trigger the onAuthStateChange listener above
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
      }
    } catch (e) {
      // In case of any error parsing URL, log it for debugging.
      setDebugInfo(prev => prev + `\nError parsing hash: ${e instanceof Error ? e.message : String(e)}`);
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(`Error updating password: ${error.message}`);
    } else {
      setMessage('Password updated successfully! Redirecting to login...');
      toast({
        title: 'Success!',
        description: 'Your password has been updated.',
      });
      setTimeout(() => {
        router.push('/auth');
      }, 2000);
    }
    setLoading(false);
  };

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
        <Card className="w-full max-w-[380px] shadow-2xl border-0 bg-white/85 backdrop-blur-md rounded-2xl p-4 md:p-6" style={{ boxShadow: '0 8px 32px 0 rgba(56, 189, 248, 0.10), 0 1.5px 8px 0 rgba(30, 64, 175, 0.08)' }}>
          <CardHeader className="p-0 mb-4 text-center">
            <CardTitle className="text-xl font-bold text-blue-800">Update Your Password</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {sessionExists ? (
              <form onSubmit={(e) => { e.preventDefault(); handleUpdatePassword(); }} className="space-y-4">
                <Input
                  type="password"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  className="h-11 text-base rounded-lg border-blue-200 focus:border-blue-400 bg-white/80 shadow-sm"
                />
                <Button className="w-full h-11 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-all" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
                {error && <p className="text-sm text-center text-red-500 pt-1">{error}</p>}
                {message && <p className="text-sm text-center text-green-500 pt-1">{message}</p>}
              </form>
            ) : (
              <div className='text-center text-gray-600 py-4'>
                <p className="font-semibold">Verifying your request...</p>
                <p className='text-sm mt-2'>Please wait a moment.</p>
                {debugInfo && (
                  <div className="mt-4 p-2 bg-slate-100 border border-slate-300 rounded-md text-xs text-left">
                    <p className="font-bold">Debug Info:</p>
                    <pre className="whitespace-pre-wrap break-all">{debugInfo}</pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 