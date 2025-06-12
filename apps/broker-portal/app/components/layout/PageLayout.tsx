'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@repo/design-system/components/ui/sidebar';
import { PageTitleProvider, usePageTitle } from './PageTitleContext';

interface PageLayoutProps {
  children: ReactNode;
}

function PageLayoutContent({ children }: PageLayoutProps) {
  const { title } = usePageTitle();

  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
          <SidebarTrigger className="md:hidden" />
          {title && (
            <h1 className="text-2xl font-bold ml-2">{title}</h1>
          )}
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          {children}
        </div>
      </SidebarInset>
    </>
  );
}

export function PageLayout({ children }: PageLayoutProps) {
  const pathname = usePathname();
  const showSidebar =
    pathname !== '/' &&
    !pathname.includes('/client-list') &&
    !pathname.includes('/upload-documents');

  // Only show sidebar on sub-pages, not on homepage or header-only pages
  if (!showSidebar) {
    return <div className="w-full">{children}</div>;
  }

  return (
    <PageTitleProvider>
      <SidebarProvider>
        <PageLayoutContent>{children}</PageLayoutContent>
      </SidebarProvider>
    </PageTitleProvider>
  );
}
