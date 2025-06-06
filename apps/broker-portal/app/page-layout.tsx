'use client';

import type { ReactNode } from 'react';
//import { SidebarController } from './components/sidebar-controller';

export function PageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-grow">{children}</main>
    </div>
  );
}
