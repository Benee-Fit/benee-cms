import type { ElementType } from 'react';

export interface NavItem {
  label: string;
  href: string;
  icon?: ElementType; // Optional: if you plan to add icons later
  subItems?: NavItem[];
}

export const mainNavItems: NavItem[] = [
  {
    label: 'Home',
    href: '/',
    // icon: HomeIcon, // Example
  },
  {
    label: 'Revenue Breakdown',
    href: '/revenue-breakdown',
    // icon: BarChartIcon, // Example
    subItems: [
      { label: 'Revenue Overview', href: '/revenue-breakdown/overview' },
      { label: 'Team Performance', href: '/revenue-breakdown/team-performance' },
      { label: 'Commission Splits', href: '/revenue-breakdown/commission-splits' },
      { label: 'Revenue Sources', href: '/revenue-breakdown/revenue-sources' },
      { label: 'Forecasting', href: '/revenue-breakdown/forecasting' },
    ],
  },
  {
    label: 'Client Insights',
    href: '/client-insights',
    // icon: UsersIcon, // Example
    // No sub-items as this is now a single page
  },
  {
    label: 'Industry Insight',
    href: '/industry-insight',
    // icon: LineChartIcon, // Example
    subItems: [], // Placeholder for future sub-items
  },
  {
    label: 'Outstanding Quotes',
    href: '/outstanding-quotes',
    // icon: FileSpreadsheetIcon, // Example
    // No sub-items as this is now a single page
  },
];
