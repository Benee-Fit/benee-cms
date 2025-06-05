'use client';

import type { ReactNode } from 'react';
import { BrokerHeader } from './components/broker-header';
//import { SidebarController } from './components/sidebar-controller';

export function PageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/*<SidebarController />*/}
      <BrokerHeader />
      <main className="flex-grow">{children}</main>
    </div>
  );
}
