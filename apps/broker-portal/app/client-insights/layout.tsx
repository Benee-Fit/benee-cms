'use client';

import { usePathname } from 'next/navigation';
import { Tabs, TabsList } from '@repo/design-system/components/ui/tabs';
import { cn } from '@repo/design-system/lib/utils';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { usePageTitle } from '@/app/components/layout/PageTitleContext';
import { useEffect } from 'react';

export default function ClientInsightsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { setTitle } = usePageTitle();
  
  useEffect(() => {
    setTitle('Client Insights');
  }, [setTitle]);
  
  const tabs = [
    { value: 'overview', label: 'Client Metrics Overview', href: '/client-insights/overview', sectionId: 'client-metrics-overview-title' },
    { value: 'revenue-per-client', label: 'Revenue Per Client', href: '/client-insights/revenue-per-client', sectionId: 'revenue-per-client-title' },
    { value: 'risk-and-opportunity', label: 'Risk and Opportunity', href: '/client-insights/risk-and-opportunity', sectionId: 'risk-and-opportunity-title' },
  ];
  
  const currentTab = tabs.find(tab => pathname === tab.href)?.value || 'overview';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Tabs value={currentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-6">
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