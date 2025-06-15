'use client';

import { useEffect, useRef } from 'react';
import { useChatwoot } from '@/app/components/ChatwootProvider';
import { useUserStore } from '@/lib/userStore';

/**
 * This component is responsible for synchronizing the logged-in user's
 * information with Chatwoot. It runs in the background and renders no UI.
 */
export function ChatwootUserSyncer() {
  const { sdk, isLoading } = useChatwoot();
  const { user } = useUserStore();
  const lastSyncedUserRef = useRef<string | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Ensure the SDK is ready and not in a loading state
    if (isLoading || !sdk) {
      return;
    }

    // Clear any pending sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Debounce user sync to avoid rapid API calls
    syncTimeoutRef.current = setTimeout(() => {
      const currentUserId = user?.id || null;
      
      // Only sync if user has actually changed
      if (lastSyncedUserRef.current === currentUserId) {
        console.log('[ChatwootUserSyncer] User unchanged, skipping sync');
        return;
      }

      if (user && user.id) {
        console.log('[ChatwootUserSyncer] Syncing user:', user.id);
        try {
          // User is logged in, identify them in Chatwoot
          // 使用 user.id 作为 identifier 确保对话历史连续性
          sdk.setUser(user.id, {
            name: String(user.display_name ?? 'User'),
            email: String(user.email ?? ''),
          });

          // Set additional business-related attributes for more context
          sdk.setCustomAttributes({
            'user_id': user.id,
            'company_name': String(user.company_name ?? ''),
            'current_page': window.location.pathname,
            'user_type': 'registered',
          });
          
          lastSyncedUserRef.current = user.id;
          console.log('[ChatwootUserSyncer] User synced successfully');
        } catch (error) {
          console.error('[ChatwootUserSyncer] Failed to sync user:', error);
        }
      } else {
        console.log('[ChatwootUserSyncer] User logged out, resetting session');
        try {
          // User is logged out, reset the Chatwoot session
          if (window.$chatwoot?.reset) {
            window.$chatwoot.reset();
          }
          lastSyncedUserRef.current = null;
        } catch (error) {
          console.error('[ChatwootUserSyncer] Failed to reset session:', error);
        }
      }
    }, 500); // 500ms debounce

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [sdk, isLoading, user]);

  return null; // This component does not render anything
} 