'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NewConversationButton } from '@/components/custom-ui/NewConversationButton';
import { EnhancedCustomerServiceButton } from '@/components/custom-ui/EnhancedCustomerServiceButton';
import { useChatwoot } from '@/lib/hooks/useChatwoot';
import { MessageCircle, RotateCcw, History, Plus } from 'lucide-react';

export default function TestNewConversationPage() {
  const { toggle, reset, isLoaded, isOpen, unreadCount } = useChatwoot();
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

  const handleContinueConversation = () => {
    if (isLoaded) {
      toggle('open');
      addLog('Opened existing conversation');
    }
  };

  const handleNewConversation = async () => {
    if (!isLoaded) return;
    
    addLog('Starting new conversation...');
    try {
      reset();
      await new Promise(resolve => setTimeout(resolve, 300));
      toggle('open');
      addLog('New conversation started successfully');
    } catch (error) {
      addLog(`Failed to start new conversation: ${error}`);
    }
  };

  const handleResetOnly = () => {
    if (isLoaded) {
      reset();
      addLog('Conversation reset (without opening)');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            New Conversation Feature Test
          </h1>
          <p className="text-gray-600">
            Test different ways users can start new conversations in Chatwoot
          </p>
        </div>

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
                <Badge variant="outline">
                  {typeof window !== 'undefined' ? window.location.pathname : 'Unknown'}
                </Badge>
                <p className="text-sm text-gray-600 mt-1">Current Page</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={handleContinueConversation}
                disabled={!isLoaded}
                variant="outline"
                className="h-20 flex flex-col gap-2"
              >
                <History className="h-5 w-5" />
                <span>Continue Conversation</span>
                <span className="text-xs text-muted-foreground">
                  Resume existing chat
                </span>
              </Button>

              <Button
                onClick={handleNewConversation}
                disabled={!isLoaded}
                className="h-20 flex flex-col gap-2"
              >
                <Plus className="h-5 w-5" />
                <span>New Conversation</span>
                <span className="text-xs text-muted-foreground">
                  Reset & start fresh
                </span>
              </Button>

              <Button
                onClick={handleResetOnly}
                disabled={!isLoaded}
                variant="destructive"
                className="h-20 flex flex-col gap-2"
              >
                <RotateCcw className="h-5 w-5" />
                <span>Reset Only</span>
                <span className="text-xs text-muted-foreground">
                  Clear without opening
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Component Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Component Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <NewConversationButton />
              <NewConversationButton variant="outline" />
              <NewConversationButton variant="ghost" showIcon={false}>
                Start Fresh Chat
              </NewConversationButton>
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">
                Enhanced floating button (check bottom-right corner):
              </p>
              <Badge variant="outline">EnhancedCustomerServiceButton is active</Badge>
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
                             <li>First, click &quot;Continue Conversation&quot; to open the existing chat</li>
               <li>Send a test message and close the widget</li>
               <li>Click &quot;New Conversation&quot; to reset and start fresh</li>
              <li>Notice that the previous conversation history is cleared</li>
              <li>Try the enhanced floating button in the bottom-right corner</li>
              <li>Test different component variations above</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Floating Button */}
      <EnhancedCustomerServiceButton />
    </div>
  );
} 