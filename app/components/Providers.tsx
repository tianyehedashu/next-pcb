'use client';

import { useBridgeUser } from '@/lib/userStore';
import { ReactNode, useEffect } from 'react';
import { checkVersion } from '@/lib/versionCheck';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  useBridgeUser(); // 在客户端根部调用 hook 来同步用户状态

  useEffect(() => {
    checkVersion();
  }, []);

  // 可以在这里添加其他客户端 Provider，比如主题 Provider 等

  return (
    <>
      {children}
    </>
  );
} 