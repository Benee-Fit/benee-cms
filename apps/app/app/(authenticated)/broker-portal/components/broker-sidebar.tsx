'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@repo/design-system/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  FileSpreadsheet,
  LineChart,
  Users2,
  PieChart,
  Presentation,
  AreaChart,
  FileText,
  File,
  ClipboardList,
  Percent,
  BadgePercent,
  LayoutGrid,
  BarChartHorizontal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Define navigation links for each section
interface LinkItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

type SectionLinks = Record<string, LinkItem[]>;

const sectionLinks: SectionLinks = {
  'revenue-breakdown': [
    { title: 'Revenue Overview', href: '/broker-portal/revenue-breakdown', icon: BarChart3 },
    { title: 'Commission Report', href: '/broker-portal/revenue-breakdown#commission', icon: PieChart },
    { title: 'Carrier Analysis', href: '/broker-portal/revenue-breakdown#carrier', icon: Percent },
    { title: 'Growth Trends', href: '/broker-portal/revenue-breakdown#growth', icon: AreaChart },
  ],
  'client-insights': [
    { title: 'Client Dashboard', href: '/broker-portal/client-insights', icon: Users2 },
    { title: 'Client Metrics', href: '/broker-portal/client-insights#metrics', icon: LayoutGrid },
    { title: 'Performance Indicators', href: '/broker-portal/client-insights#performance', icon: BarChartHorizontal },
    { title: 'Upload History', href: '/broker-portal/client-insights#uploads', icon: File },
  ],
  'industry-insight': [
    { title: 'Industry Overview', href: '/broker-portal/industry-insight', icon: LineChart },
    { title: 'Market Benchmarks', href: '/broker-portal/industry-insight#benchmarks', icon: BadgePercent },
    { title: 'Premium Analysis', href: '/broker-portal/industry-insight#premiums', icon: Presentation },
    { title: 'Quote Sources', href: '/broker-portal/industry-insight#sources', icon: ClipboardList },
  ],
  'outstanding-quotes': [
    { title: 'Active Quotes', href: '/broker-portal/outstanding-quotes', icon: FileSpreadsheet },
    { title: 'Follow-up Queue', href: '/broker-portal/outstanding-quotes#followup', icon: ClipboardList },
    { title: 'Aging Analysis', href: '/broker-portal/outstanding-quotes#aging', icon: FileText },
    { title: 'Quote History', href: '/broker-portal/outstanding-quotes#history', icon: File },
  ],
};

export function BrokerSidebar() {
  const pathname = usePathname();
  
  // Determine the current section
  let currentSection: string | null = null;
  if (pathname.includes('/revenue-breakdown')) {
    currentSection = 'revenue-breakdown';
  } else if (pathname.includes('/client-insights')) {
    currentSection = 'client-insights';
  } else if (pathname.includes('/industry-insight')) {
    currentSection = 'industry-insight';
  } else if (pathname.includes('/outstanding-quotes')) {
    currentSection = 'outstanding-quotes';
  }
  
  // If not in a specific section or on homepage, don't render sidebar
  if (!currentSection) {
    return null;
  }

  const links = sectionLinks[currentSection];
  const sectionTitle = currentSection
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{sectionTitle}</SidebarGroupLabel>
          <SidebarMenu>
            {links.map((item: LinkItem) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <Link href={item.href}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
