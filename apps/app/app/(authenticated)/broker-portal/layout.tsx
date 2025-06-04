'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { BrokerSidebar } from './components/broker-sidebar';

export default function BrokerPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  
  // Only show broker sidebar if not on the main broker portal page
  const isHomePage = pathname === '/broker-portal' || pathname === '/broker-portal/';
  
  if (isHomePage) {
    return <>{children}</>;
  }
  
  return (
    <div className="flex">
      <BrokerSidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
