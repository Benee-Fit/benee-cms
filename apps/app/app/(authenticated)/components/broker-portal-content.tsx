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

// Import components from broker portal - we'll need to adapt these
// For now, let's create simplified versions that work with the main app

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

// Simplified BenefitSearchForm component
const BenefitSearchForm = () => {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Benefit Search</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search for benefits, carriers, or coverage types..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors">
            Search Benefits
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

// Simplified CalendarGrid component
const CalendarGrid = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold">Client Meeting</h4>
            <p className="text-sm text-gray-600">Tomorrow at 2:00 PM</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold">Quote Deadline</h4>
            <p className="text-sm text-gray-600">Friday at 5:00 PM</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold">Team Meeting</h4>
            <p className="text-sm text-gray-600">Next Monday at 9:00 AM</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function BrokerPortalContent() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">Welcome to Broker Portal</h1>
        <p className="text-blue-100">
          Manage your clients, track revenue, and access industry insights all in one place.
        </p>
      </div>

      {/* Benefit Search Section */}
      <section className="py-6">
        <BenefitSearchForm />
      </section>

      {/* Main Dashboard Tiles */}
      <section className="py-6">
        <h2 className="text-2xl font-semibold mb-6">Dashboard</h2>
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
                    Go to {tile.title} <ArrowRight className="ml-1 h-3 w-3" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Calendar Section */}
      <section className="py-6">
        <CalendarGrid />
      </section>
    </div>
  );
}