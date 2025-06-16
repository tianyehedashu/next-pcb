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
import { 
  MessageCircle, 
  ChevronUp, 
  User, 
  UserX, 
  Headphones,
  Sparkles
} from 'lucide-react';
import { useChatwoot } from '@/lib/hooks/useChatwoot';
import { useUserStore } from '@/lib/userStore';

export function SmartCustomerServiceButton() {
  const { toggle, reset, isLoaded, unreadCount } = useChatwoot();
  const { user } = useUserStore();
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

  // 登录用户：只显示继续对话选项
  if (user) {
    return (
      <div className="fixed bottom-6 right-6 z-50 group">
        <Button
          onClick={handleContinueConversation}
          size="lg"
          className="h-16 w-16 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 relative border-2 border-blue-500"
          title="Contact Customer Service"
        >
          <Headphones className="h-7 w-7 text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-7 w-7 flex items-center justify-center font-semibold animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          {/* 登录用户标识 */}
          <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1">
            <User className="h-3 w-3" />
          </div>
        </Button>
        
        {/* Tooltip for logged in users */}
        <div className="absolute bottom-20 right-0 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          Customer Service
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    );
  }

  // 游客：显示下拉菜单选项
  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 relative border-2 border-blue-400"
            title="Customer Service Options"
          >
            <MessageCircle className="h-7 w-7 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-7 w-7 flex items-center justify-center font-semibold animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <ChevronUp className="h-4 w-4 absolute -top-1 right-1 text-white opacity-80" />
            {/* 游客标识 */}
            <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white rounded-full p-1">
              <UserX className="h-3 w-3" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          side="top" 
          className="w-64 mb-3 bg-white border-2 border-gray-200 shadow-xl rounded-xl"
        >
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Customer Service</p>
            <p className="text-xs text-gray-500">Choose how you&apos;d like to chat</p>
          </div>
          
          <DropdownMenuItem 
            onClick={handleContinueConversation}
            className="cursor-pointer p-3 hover:bg-blue-50 transition-colors"
          >
            <MessageCircle className="h-5 w-5 mr-3 text-blue-600" />
            <div className="flex flex-col">
              <span className="font-medium text-gray-900">Continue Chat</span>
              <span className="text-xs text-gray-500">
                Resume your existing conversation
              </span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="my-1" />
          
          <DropdownMenuItem 
            onClick={handleNewConversation}
            className="cursor-pointer p-3 hover:bg-green-50 transition-colors"
          >
            <div className="relative mr-3">
              <Sparkles className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-900">Start Fresh</span>
              <span className="text-xs text-gray-500">
                Begin a new conversation
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Tooltip for guests */}
      {!isOpen && (
        <div className="absolute bottom-20 right-0 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          Customer Service
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
} 