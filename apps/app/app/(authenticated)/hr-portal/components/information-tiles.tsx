'use client';

import Link from 'next/link';
import { ClipboardList, Users, UserPlus, Archive, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@repo/design-system/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/design-system/components/ui/tooltip';

interface TileInfo {
  title: string;
  description: string;
  tooltipContent: string;
  href: string;
  icon: LucideIcon;
}

const tiles: TileInfo[] = [
  {
    title: 'Claims History',
    description: 'Review past and current claims activity.',
    tooltipContent: 'View current claims, premiums, loss ratio, cost per employee, by coverage or division.',
    href: '/hr-portal/claims-history',
    icon: ClipboardList,
  },
  {
    title: 'Employee Trends',
    description: 'Analyze workforce and coverage patterns.',
    tooltipContent: 'Explore headcount, coverage types, age/gender breakdowns, division stats.',
    href: '/hr-portal/employee-trends',
    icon: Users,
  },
  {
    title: 'Enrolment',
    description: 'Manage employee enrolment and changes.',
    tooltipContent: 'Add or remove employees, update coverage, fill enrolment forms, submit change requests.',
    href: '/hr-portal/enrolment',
    icon: UserPlus,
  },
  {
    title: 'Document Library',
    description: 'Access important plan documents.',
    tooltipContent: 'Access plan booklets, monthly invoices, renewal documents, and upload files.',
    href: '/hr-portal/document-library',
    icon: Archive,
  },
];

export function InformationTiles() {
  return (
    <section className="py-6">
      <TooltipProvider delayDuration={100}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((tile) => (
            <Tooltip key={tile.title}>
              <TooltipTrigger asChild>
                <Link href={tile.href} className="h-full">
                  <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200 ease-in-out group border-primary/30 hover:border-primary">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-lg font-semibold text-primary">{tile.title}</CardTitle>
                      <tile.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground">{tile.description}</p>
                    </CardContent>
                    <div className="p-6 pt-0">
                        <span className="text-xs text-primary group-hover:underline flex items-center">
                            Go to {tile.title} <ArrowRight className="ml-1 h-3 w-3" />
                        </span>
                    </div>
                  </Card>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p>{tile.tooltipContent}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </section>
  );
}
