 'use client';

import { useEffect } from 'react';
import { checkVersion } from '@/lib/versionCheck';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    checkVersion();
  }, []);

  return <>{children}</>;
}