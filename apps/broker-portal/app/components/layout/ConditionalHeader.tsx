'use client';

import { usePathname } from 'next/navigation';
import { AppHeader } from '@repo/design-system';
import type { ReactNode } from 'react';

interface ConditionalHeaderProps {
  navItems: Array<{ href: string; label: string }>;
  children: ReactNode;
}

export function ConditionalHeader({ navItems, children }: ConditionalHeaderProps) {
  const pathname = usePathname();
  
  // Don't show header on auth pages
  const showHeader = 
    !pathname.startsWith('/sign-in') &&
    !pathname.startsWith('/sign-up');

  return (
    <>
      {showHeader && (
        <AppHeader 
          portalName="Benee-fit Broker Portal" 
          navItems={navItems} 
          afterSignOutUrl="/sign-in" 
        />
      )}
      {children}
    </>
  );
}