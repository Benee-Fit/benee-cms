'use client';

import { usePathname } from 'next/navigation';
import { AppSidebar } from './AppSidebar';
import type { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  const pathname = usePathname();
  const showSidebar = pathname !== '/' && !pathname.includes('/client-list') && !pathname.includes('/upload-documents');

  // Only show sidebar on sub-pages, not on homepage or header-only pages
  if (!showSidebar) {
    return <div className="w-full">{children}</div>;
  }

  return (
    <div className="flex">
      <AppSidebar />
      <div className="flex-1 p-6 md:ml-64">{children}</div>
    </div>
  );
}
