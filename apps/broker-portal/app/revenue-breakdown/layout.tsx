'use client';

import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@repo/design-system/components/ui/tabs';
import Link from 'next/link';
import type { ReactNode } from 'react';

export default function RevenueBreakdownLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  
  const tabs = [
    { value: 'overview', label: 'Revenue Overview', href: '/revenue-breakdown/overview', sectionId: 'revenue-overview-title' },
    { value: 'team-performance', label: 'Team Performance', href: '/revenue-breakdown/team-performance', sectionId: 'team-performance-title' },
    { value: 'commission-splits', label: 'Commission Splits', href: '/revenue-breakdown/commission-splits', sectionId: 'commission-splits-title' },
    { value: 'revenue-sources', label: 'Revenue Sources', href: '/revenue-breakdown/revenue-sources', sectionId: 'revenue-sources-title' },
    { value: 'forecasting', label: 'Forecasting', href: '/revenue-breakdown/forecasting', sectionId: 'forecasting-title' },
  ];
  
  const currentTab = tabs.find(tab => pathname === tab.href)?.value || 'overview';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Revenue Breakdown</h1>
        
        <Tabs value={currentTab} className="w-full">
          <TabsList className="w-full justify-start h-auto flex-wrap">
            {tabs.map(tab => (
              <Link href={tab.href} key={tab.value} passHref>
                <TabsTrigger 
                  value={tab.value}
                  className="data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  {tab.label}
                </TabsTrigger>
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
