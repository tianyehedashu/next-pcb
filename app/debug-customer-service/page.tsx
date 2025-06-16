'use client';

import React, { useState, useEffect } from 'react';
import { useChatwoot } from '@/lib/hooks/useChatwoot';
import { useUserStore } from '@/lib/userStore';

export default function DebugCustomerServicePage() {
  const [mounted, setMounted] = useState(false);
  const { isLoaded, isOpen, unreadCount } = useChatwoot();
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
          Customer Service Debug
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">User Status</h2>
            <div className="space-y-2">
              <p><strong>Is Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
              <p><strong>User:</strong> {user ? 'Logged In' : 'Guest'}</p>
              {user && (
                <div className="ml-4 space-y-1">
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Email:</strong> {user.email || 'N/A'}</p>
                  <p><strong>Name:</strong> {user.full_name || 'N/A'}</p>
                  <p><strong>Role:</strong> {user.role || 'N/A'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Chatwoot Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Chatwoot Status</h2>
            <div className="space-y-2">
              <p><strong>Is Loaded:</strong> {isLoaded ? 'Yes' : 'No'}</p>
              <p><strong>Is Open:</strong> {isOpen ? 'Yes' : 'No'}</p>
              <p><strong>Unread Count:</strong> {unreadCount}</p>
            </div>
          </div>

          {/* Expected Behavior */}
          <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Expected Behavior</h2>
            <div className="space-y-2">
              {user ? (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-800">Logged In User</p>
                  <p className="text-blue-600">Should see: Simple button (no dropdown)</p>
                  <p className="text-blue-600">Clicking opens chat directly</p>
                </div>
              ) : (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="font-medium text-green-800">Guest User</p>
                  <p className="text-green-600">Should see: Button with dropdown arrow</p>
                  <p className="text-green-600">Clicking shows: &ldquo;Continue&rdquo; and &ldquo;New Conversation&rdquo; options</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Test Button */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Area</h2>
          <p className="text-gray-600 mb-4">
            The SmartCustomerServiceButton should appear in the bottom-right corner.
            Check if it matches the expected behavior above.
          </p>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-yellow-800">
              <strong>Note:</strong> If you don&apos;t see the button, check:
            </p>
            <ul className="list-disc list-inside mt-2 text-yellow-700">
              <li>Browser console for errors</li>
              <li>Network tab for failed requests</li>
              <li>Z-index conflicts with other elements</li>
            </ul>
          </div>
          
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-green-800">
              <strong>✅ Updated:</strong> The customer service button is now provided by ChatwootProvider and will only appear after Chatwoot is fully initialized.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 