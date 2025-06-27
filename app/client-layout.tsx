'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <main className={isHomePage ? '' : 'pt-16 sm:pt-20'}>
      {children}
    </main>
  );
}