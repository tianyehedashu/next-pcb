'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { MessageCircle, Plus, History, ChevronUp } from 'lucide-react';
import { useChatwoot } from '@/lib/hooks/useChatwoot';

export function EnhancedCustomerServiceButton() {
  const { toggle, reset, isLoaded, unreadCount } = useChatwoot();
  const [isOpen, setIsOpen] = useState(false);

  const handleContinueConversation = () => {
    if (isLoaded) {
      toggle('open');
    }
    setIsOpen(false);
  };

  const handleNewConversation = async () => {
    if (!isLoaded) return;
    
    try {
      // 重置当前对话
      reset();
      
      // 等待一小段时间确保重置完成
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 打开聊天窗口
      toggle('open');
    } catch (error) {
      console.error('Failed to start new conversation:', error);
    }
    
    setIsOpen(false);
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-6 z-50">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 relative"
          >
            <MessageCircle className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <ChevronUp className="h-3 w-3 absolute -top-1 right-1 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          side="top" 
          className="w-56 mb-2"
        >
          <DropdownMenuItem 
            onClick={handleContinueConversation}
            className="cursor-pointer"
          >
            <History className="h-4 w-4 mr-2" />
            <div className="flex flex-col">
              <span>Continue Conversation</span>
              <span className="text-xs text-muted-foreground">
                Resume previous chat
              </span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleNewConversation}
            className="cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            <div className="flex flex-col">
              <span>New Conversation</span>
              <span className="text-xs text-muted-foreground">
                Start fresh chat
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 