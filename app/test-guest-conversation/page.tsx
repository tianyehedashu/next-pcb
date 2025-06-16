'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GuestNewConversationButton } from '@/components/custom-ui/GuestNewConversationButton';
import { useChatwoot } from '@/lib/hooks/useChatwoot';
import { useUserStore } from '@/lib/userStore';
import { MessageCircle, User, UserX, Info, LogIn, LogOut } from 'lucide-react';

export default function TestGuestConversationPage() {
  const { toggle, reset, isLoaded, isOpen, unreadCount } = useChatwoot();
  const { user } = useUserStore();
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setActionLog(prev => [`${timestamp}: ${message}`, ...prev.slice(0, 9)]);
  };

  const handleOpenChat = () => {
    if (isLoaded) {
      toggle('open');
      addLog('Opened chat widget');
    }
  };

  const handleResetChat = () => {
    if (isLoaded) {
      reset();
      addLog('Reset chat session');
    }
  };

  const simulateLogin = () => {
    // 这里只是模拟，实际项目中不要这样做
    addLog('⚠️ This is just a simulation for testing');
  };

  const simulateLogout = () => {
    // 这里只是模拟，实际项目中不要这样做
    addLog('⚠️ This is just a simulation for testing');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Guest New Conversation Test
          </h1>
          <p className="text-gray-600">
            Test new conversation feature specifically designed for guests
          </p>
        </div>

        {/* User Status Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {user ? (
              <span className="flex items-center gap-2">
                <User className="h-4 w-4 text-green-600" />
                <strong>Logged in as:</strong> {user.display_name || user.email || user.id}
                <Badge variant="default">Registered User</Badge>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UserX className="h-4 w-4 text-gray-600" />
                <strong>Status:</strong> Guest User (Not logged in)
                <Badge variant="outline">Guest</Badge>
              </span>
            )}
          </AlertDescription>
        </Alert>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chatwoot Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Badge variant={isLoaded ? "default" : "secondary"}>
                  {isLoaded ? "Loaded" : "Loading"}
                </Badge>
                <p className="text-sm text-gray-600 mt-1">SDK Status</p>
              </div>
              <div className="text-center">
                <Badge variant={isOpen ? "default" : "outline"}>
                  {isOpen ? "Open" : "Closed"}
                </Badge>
                <p className="text-sm text-gray-600 mt-1">Widget State</p>
              </div>
              <div className="text-center">
                <Badge variant={unreadCount > 0 ? "warning" : "outline"}>
                  {unreadCount}
                </Badge>
                <p className="text-sm text-gray-600 mt-1">Unread Count</p>
              </div>
              <div className="text-center">
                <Badge variant={user ? "default" : "outline"}>
                  {user ? "Logged In" : "Guest"}
                </Badge>
                <p className="text-sm text-gray-600 mt-1">User Status</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Explanation */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Explanation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Logged In Users
                </h3>
                <ul className="text-sm space-y-1">
                  <li>• Only see &quot;Continue Conversation&quot; option</li>
                  <li>• Chat history is preserved</li>
                  <li>• No &quot;New Conversation&quot; button</li>
                  <li>• Prevents accidental history loss</li>
                </ul>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                  <UserX className="h-4 w-4" />
                  Guest Users
                </h3>
                <ul className="text-sm space-y-1">
                  <li>• Can choose &quot;Continue&quot; or &quot;New Conversation&quot;</li>
                  <li>• New conversation clears chat history</li>
                  <li>• Safe to reset without user conflicts</li>
                  <li>• Perfect for fresh inquiries</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={handleOpenChat}
                disabled={!isLoaded}
                variant="outline"
                className="h-16 flex flex-col gap-1"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Open Chat</span>
              </Button>

              <Button
                onClick={handleResetChat}
                disabled={!isLoaded}
                variant="destructive"
                className="h-16 flex flex-col gap-1"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Reset Chat</span>
              </Button>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={simulateLogin}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Simulate Login
                </Button>
                <Button
                  onClick={simulateLogout}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Simulate Logout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Component Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Component Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Guest New Conversation Button</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Only visible to guests. Hidden when user is logged in.
                </p>
                <div className="flex flex-wrap gap-4">
                  <GuestNewConversationButton />
                  <GuestNewConversationButton variant="outline" />
                  <GuestNewConversationButton variant="ghost" showIcon={false}>
                    Start Fresh Chat
                  </GuestNewConversationButton>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Log */}
        <Card>
          <CardHeader>
            <CardTitle>Action Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 rounded-lg p-4 h-40 overflow-y-auto">
              {actionLog.length === 0 ? (
                <p className="text-gray-500 text-sm">No actions yet...</p>
              ) : (
                <div className="space-y-1">
                  {actionLog.map((log, index) => (
                    <div key={index} className="text-sm font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>As a guest, notice the dropdown menu in the floating button</li>
              <li>Try both &quot;Continue Conversation&quot; and &quot;New Conversation&quot;</li>
              <li>Send some messages and test the reset functionality</li>
              <li>Log in to see how the interface changes for registered users</li>
              <li>Notice that logged-in users only see a simple chat button</li>
              <li>Test the guest-only components above</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 