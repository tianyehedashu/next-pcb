'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, RotateCcw } from 'lucide-react';
import { useChatwoot } from '@/lib/hooks/useChatwoot';

interface NewConversationButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function NewConversationButton({ 
  variant = 'default',
  size = 'default',
  showIcon = true,
  children,
  className = ''
}: NewConversationButtonProps) {
  const { reset, toggle, isLoaded } = useChatwoot();
  const [isResetting, setIsResetting] = useState(false);

  const handleStartNewConversation = async () => {
    if (!isLoaded) return;
    
    setIsResetting(true);
    
    try {
      // 重置当前对话
      reset();
      
      // 等待一小段时间确保重置完成
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 打开聊天窗口
      toggle('open');
    } catch (error) {
      console.error('Failed to start new conversation:', error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Button
      onClick={handleStartNewConversation}
      disabled={!isLoaded || isResetting}
      variant={variant}
      size={size}
      className={className}
    >
      {showIcon && (
        isResetting ? (
          <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <MessageCircle className="h-4 w-4 mr-2" />
        )
      )}
      {children || (isResetting ? 'Starting...' : 'New Conversation')}
    </Button>
  );
} 