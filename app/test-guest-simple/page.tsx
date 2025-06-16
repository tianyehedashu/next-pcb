'use client';

import { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GuestNewConversationButton } from '@/components/custom-ui/GuestNewConversationButton';
import { SmartCustomerServiceButton } from '@/components/custom-ui/SmartCustomerServiceButton';
import { MessageCircle } from 'lucide-react';

export default function TestGuestSimplePage() {
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Guest New Conversation Test (Simple)
          </h1>
          <p className="text-gray-600">
            Simple test page for guest new conversation feature
          </p>
        </div>

        {/* Component Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Guest New Conversation Components
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Guest New Conversation Buttons</h3>
              <p className="text-sm text-gray-600 mb-4">
                These buttons are only visible to guests (non-logged-in users):
              </p>
              <div className="flex flex-wrap gap-4">
                <GuestNewConversationButton />
                <GuestNewConversationButton variant="outline" />
                <GuestNewConversationButton variant="ghost" showIcon={false}>
                  Start Fresh Chat
                </GuestNewConversationButton>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3">Smart Customer Service Button</h3>
              <p className="text-sm text-gray-600 mb-4">
                Check the bottom-right corner for the adaptive floating button:
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                                 <li>• <strong>For Guests:</strong> Shows dropdown with &quot;Continue&quot; and &quot;New Conversation&quot; options</li>
                 <li>• <strong>For Logged-in Users:</strong> Shows simple button that directly opens chat</li>
                <li>• <strong>Visual Indicators:</strong> Different icons show user status</li>
              </ul>
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
              <li>As a guest, you should see the buttons above and a dropdown floating button</li>
                             <li>Click &quot;New Conversation&quot; to reset and start fresh</li>
              <li>Try the floating button in the bottom-right corner</li>
              <li>Log in to see how the interface changes for registered users</li>
              <li>Notice that logged-in users get a simpler, direct chat button</li>
            </ol>
          </CardContent>
        </Card>

        {/* Feature Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-green-700">✅ For Guests</h3>
                <ul className="text-sm space-y-1">
                  <li>• Can start completely fresh conversations</li>
                  <li>• No risk of user identity conflicts</li>
                  <li>• Perfect for new inquiries</li>
                  <li>• Safe to reset chat history</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold text-blue-700">🔒 For Logged-in Users</h3>
                <ul className="text-sm space-y-1">
                  <li>• Preserves valuable chat history</li>
                  <li>• Maintains conversation continuity</li>
                  <li>• Prevents accidental data loss</li>
                  <li>• Streamlined user experience</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Floating Button */}
      <SmartCustomerServiceButton />
    </div>
  );
} 