'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs, TabsList } from '@repo/design-system/components/ui/tabs';
import { cn } from '@repo/design-system/lib/utils';
import { usePageTitle } from '@/app/components/layout/PageTitleContext';
import { useEffect } from 'react';

const tabNavItems = [
  {
    label: 'Performance',
    href: '/industry-insight/performance',
    sectionId: 'industry-performance-title',
  },
  {
    label: 'Benchmarks',
    href: '/industry-insight/benchmarks',
    sectionId: 'premium-bench-title',
  },
  {
    label: 'Size Tiers',
    href: '/industry-insight/size-tiers',
    sectionId: 'company-size-tiers-title',
  },
  {
    label: 'Analytics',
    href: '/industry-insight/analytics',
    sectionId: 'quote-source-analytics-title',
  },
];

export default function IndustryInsightLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { setTitle } = usePageTitle();
  
  useEffect(() => {
    setTitle('Industry Insight');
  }, [setTitle]);

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Explore detailed breakdowns of industry performance, benchmarks, and analytics.
      </p>
      <Tabs defaultValue={pathname} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6">
          {tabNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                pathname === item.href
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </TabsList>
      </Tabs>
      {children}
    </div>
  );
}
