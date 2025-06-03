'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useChatwoot } from '@/lib/hooks/useChatwoot';
import { MessageCircle, User, Settings } from 'lucide-react';

export const CustomerServiceExample = () => {
  const { isLoaded, isOpen, toggle, setUser, setCustomAttributes } = useChatwoot();

  const handleOpenChat = () => {
    toggle('open');
  };

  const handleSetUserInfo = () => {
    setUser({
      identifier: 'demo-user-123',
      name: 'Demo User',
      email: 'demo@example.com',
      avatar_url: 'https://via.placeholder.com/150',
    });
  };

  const handleSetCustomAttributes = () => {
    setCustomAttributes({
      plan: 'Premium',
      company: 'Demo Company',
      role: 'Manager',
      page: window.location.pathname,
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Customer Service Demo
        </CardTitle>
        <CardDescription>
          Test the integrated Chatwoot customer service functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status:</span>
          <span className={`text-sm font-medium ${isLoaded ? 'text-green-600' : 'text-gray-400'}`}>
            {isLoaded ? 'Ready' : 'Loading...'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Chat Window:</span>
          <span className={`text-sm font-medium ${isOpen ? 'text-blue-600' : 'text-gray-400'}`}>
            {isOpen ? 'Open' : 'Closed'}
          </span>
        </div>

        <div className="grid gap-2">
          <Button 
            onClick={handleOpenChat} 
            disabled={!isLoaded}
            className="w-full"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Open Customer Support
          </Button>
          
          <Button 
            onClick={handleSetUserInfo} 
            disabled={!isLoaded}
            variant="outline"
            className="w-full"
          >
            <User className="h-4 w-4 mr-2" />
            Set User Info
          </Button>
          
          <Button 
            onClick={handleSetCustomAttributes} 
            disabled={!isLoaded}
            variant="outline"
            className="w-full"
          >
            <Settings className="h-4 w-4 mr-2" />
            Set Custom Attributes
          </Button>
        </div>

        <div className="text-xs text-gray-500 mt-4">
          💡 You can also use the floating button in the bottom-right corner
        </div>
      </CardContent>
    </Card>
  );
}; 