'use client';

import { usePathname } from 'next/navigation';
import { Tabs, TabsList } from '@repo/design-system/components/ui/tabs';
import { cn } from '@repo/design-system/lib/utils';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { usePageTitle } from '@/app/components/layout/PageTitleContext';
import { useEffect } from 'react';

export default function RevenueBreakdownLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { setTitle } = usePageTitle();
  
  useEffect(() => {
    setTitle('Revenue Breakdown');
  }, [setTitle]);
  
  const tabs = [
    { value: 'overview', label: 'Revenue Overview', href: '/revenue-breakdown/overview', sectionId: 'revenue-overview-title' },
    { value: 'team-performance', label: 'Team Performance', href: '/revenue-breakdown/team-performance', sectionId: 'team-performance-title' },
    { value: 'carrier-breakdown', label: 'Carrier Breakdown', href: '/revenue-breakdown/carrier-breakdown', sectionId: 'commission-splits-title' },
    { value: 'revenue-sources', label: 'Revenue Sources', href: '/revenue-breakdown/revenue-sources', sectionId: 'revenue-sources-title' },
    { value: 'forecasting', label: 'Forecasting', href: '/revenue-breakdown/forecasting', sectionId: 'forecasting-title' },
  ];
  
  const currentTab = tabs.find(tab => pathname === tab.href)?.value || 'overview';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Tabs value={currentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-6">
            {tabs.map(tab => (
              <Link 
                href={tab.href} 
                key={tab.value} 
                className={cn(
                  'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                  pathname === tab.href
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {tab.label}
              </Link>
            ))}
          </TabsList>
        </Tabs>
      </div>
      
      <div>
        {children}
      </div>
    </div>
  );
}
