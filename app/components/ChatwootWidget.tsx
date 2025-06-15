'use client';

import { useEffect, useRef } from 'react';
import { MessageSquare, AlertTriangle, Loader2 } from 'lucide-react';
import { useChatwoot } from '@/app/components/ChatwootProvider';

export default function ChatwootWidget() {
  const { sdk, isLoading, error } = useChatwoot();
  const initRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (initRef.current) return;
    
    if (sdk && !isLoading) {
      console.log('[ChatwootWidget] SDK is loaded, widget should be available');
      initRef.current = true;
      
      // According to Chatwoot documentation, the widget should automatically
      // initialize when the SDK is ready. We don't need to manually initialize it.
      // The widget visibility is controlled by hideMessageBubble setting.
      
      // If we need to show the widget programmatically, we can use:
      // window.$chatwoot?.toggleBubbleVisibility('show');
    }

    if (error) {
      console.error('[ChatwootWidget] Error loading Chatwoot:', error);
    }
  }, [sdk, isLoading, error]);

  const toggleChatWindow = () => {
    if (window.$chatwoot?.toggle) {
      console.log('[ChatwootWidget] Toggling chat window');
      window.$chatwoot.toggle();
    } else {
      console.warn('[ChatwootWidget] Chatwoot SDK not available');
    }
  };

  const buttonClasses = "fixed bottom-5 right-5 h-14 w-14 rounded-full shadow-lg flex items-center justify-center text-white transition-transform transform hover:scale-110 z-50";

  if (error) {
    return (
      <div
        className={`${buttonClasses} bg-red-600`}
        title={`Chatwoot Error: ${error.message}`}
      >
        <AlertTriangle size={28} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`${buttonClasses} bg-gray-400 cursor-not-allowed`}>
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }
  
  if (!sdk) return null;

  return (
    <button
      className={`${buttonClasses} bg-blue-600 hover:bg-blue-700`}
      onClick={toggleChatWindow}
      aria-label="Toggle chat widget"
    >
      <MessageSquare size={28} />
    </button>
  );
} 