'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import {
  ArrowRight,
  BarChart3,
  FileSpreadsheet,
  LineChart,
  Users2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { CalendarGrid } from './components/calendar-grid';
import { BenefitSearchForm } from './components/chat/benefit-search-form';

interface TileInfo {
  title: string;
  description: string;
  tooltipContent: string;
  href: string;
  icon: LucideIcon;
}

const tiles: TileInfo[] = [
  {
    title: 'Revenue Breakdown',
    description: 'Analyze commission and revenue metrics.',
    tooltipContent:
      'View team performance, carrier revenue, and commission trends.',
    href: '/broker-portal/revenue-breakdown',
    icon: BarChart3,
  },
  {
    title: 'Client Insights',
    description: 'Monitor client portfolio performance.',
    tooltipContent:
      'Track client metrics, uploads, and performance indicators.',
    href: '/broker-portal/client-insights',
    icon: Users2,
  },
  {
    title: 'Industry Insight',
    description: 'Benchmark against industry standards.',
    tooltipContent:
      'Compare premiums, analyze company size tiers, and track quote sources.',
    href: '/broker-portal/industry-insight',
    icon: LineChart,
  },
  {
    title: 'Outstanding Quotes',
    description: 'Track and manage your active quotes.',
    tooltipContent:
      'View quote statuses, follow-ups needed, and aging analysis.',
    href: '/broker-portal/outstanding-quotes',
    icon: FileSpreadsheet,
  },
];

export default function BrokerPortalPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Broker Portal</h1>
        <p className="text-muted-foreground">
          Monitor your broker activities, track commissions, and get insights on
          your client portfolio.
        </p>
      </div>

      <section className="mt-10 mb-10 p-6 max-w-2xl mx-auto">
        <BenefitSearchForm />
      </section>

      <section className="py-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {tiles.map((tile) => (
            <Link key={tile.title} href={tile.href} className="h-full">
              <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200 ease-in-out group border-primary/30 hover:border-primary">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-semibold text-primary">
                    {tile.title}
                  </CardTitle>
                  <tile.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">
                    {tile.description}
                  </p>
                </CardContent>
                <div className="p-6 pt-0">
                  <span className="text-xs text-primary group-hover:underline flex items-center">
                    Go to {tile.title}{' '}
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-6">
        <CalendarGrid />
      </section>
    </div>
  );
}
