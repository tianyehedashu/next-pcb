'use client';

import React, { useState, useEffect } from 'react';
import { useChatwoot } from '@/lib/hooks/useChatwoot';
import { useUserStore } from '@/lib/userStore';

export default function TestGuestSimplePage() {
  const [mounted, setMounted] = useState(false);
  const { toggle, reset, isLoaded, isOpen, unreadCount } = useChatwoot();
  const { user, isLoading } = useUserStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Guest Simple Test
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <div className="space-y-2">
            <p><strong>User Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
            <p><strong>User Status:</strong> {user ? 'Logged In' : 'Guest'}</p>
            <p><strong>Chatwoot Loaded:</strong> {isLoaded ? 'Yes' : 'No'}</p>
            <p><strong>Chat Open:</strong> {isOpen ? 'Yes' : 'No'}</p>
            <p><strong>Unread Count:</strong> {unreadCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
          <div className="space-y-2">
            <p>1. Check the bottom-right corner for the customer service button</p>
            <p>2. As a guest user, you should see a gradient button with dropdown options</p>
            <p>3. Click the button to see &ldquo;Continue Chat&rdquo; and &ldquo;Start Fresh&rdquo; options</p>
            <p>4. Test both options to ensure they work correctly</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Manual Controls</h2>
          <div className="space-x-4">
            <button
              onClick={() => toggle('open')}
              disabled={!isLoaded}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
            >
              Open Chat
            </button>
            <button
              onClick={() => toggle('close')}
              disabled={!isLoaded}
              className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
            >
              Close Chat
            </button>
            <button
              onClick={reset}
              disabled={!isLoaded}
              className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
            >
              Reset Chat
            </button>
          </div>
        </div>
      </div>
      
      {/* 注意：SmartCustomerServiceButton 已经在 ChatwootProvider 中全局提供，无需重复添加 */}
    </div>
  );
} 