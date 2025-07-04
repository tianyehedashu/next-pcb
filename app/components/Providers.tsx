'use client';

import { useBridgeUser } from '@/lib/userStore';
import { ReactNode, useEffect } from 'react';
import { checkVersion } from '@/lib/versionCheck';
import { ChatwootUserSyncer } from './ChatwootUserSyncer';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  useBridgeUser(); // 在客户端根部调用 hook 来同步用户状态

  useEffect(() => {
    checkVersion();
  }, []);

  return (
    <>
      {children}
      <ChatwootUserSyncer />
      {/* ChatwootWidget 已移除，使用 SmartCustomerServiceButton 替代 */}
    </>
  );
} 