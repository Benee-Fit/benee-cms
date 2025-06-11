'use client';

import {
  Alert,
  AlertDescription,
} from '@repo/design-system/components/ui/alert';
// Badge import removed - was only used in document uploads section
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import {} from '@repo/design-system/components/ui/select';
import { cn } from '@repo/design-system/lib/utils';
import {
  CalendarDays as CalendarIcon,
  FileIcon,
  FlameIcon,
  TrendingDownIcon,
} from 'lucide-react';
import { useState } from 'react';

interface ClientInsightsProps {
  className?: string;
}

export function ClientInsights({ className }: ClientInsightsProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const clientOverview = {
    totalClients: 43,
    totalPlanMembers: 4782,
    avgGroupSize: 111,
    avgPremiumPerClient: 2340,
    avgLossRatio: 74,
    percentFlagged: 12,
  };

  // Client flags for demonstration
  const clientFlags = [
    {
      id: 1,
      type: 'warning',
      icon: FileIcon,
      message: 'Missing documents for ABC Technology (Group #12345)',
    },
    {
      id: 2,
      type: 'default',
      icon: CalendarIcon,
      message: 'Renewal in 30 days for Meadow Healthcare (Group #54321)',
    },
    {
      id: 3,
      type: 'destructive',
      icon: FlameIcon,
      message: 'High loss ratio (92%) for GlobalTech Inc. (Group #67890)',
    },
    {
      id: 4,
      type: 'default',
      icon: TrendingDownIcon,
      message:
        '📉 Low engagement with portal for Smith Manufacturing (Group #98765)',
    },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Client Flags */}
      <section aria-labelledby="client-flags-title">
        <h3 id="client-flags-title" className="text-xl font-medium mb-2">
          Flags
        </h3>
        <div className="space-y-2">
          {clientFlags.map((flag) => (
            <Alert
              key={flag.id}
              variant={flag.type === 'warning' ? 'default' : 'destructive'}
            >
              <flag.icon className="h-4 w-4" />
              <AlertDescription>{flag.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      </section>

      {/* Client Overview */}
      <section aria-labelledby="client-overview-title">
        <h3
          id="client-overview-title"
          className="text-xl font-medium mb-2 sr-only"
        >
          Client Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Total Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {clientOverview.totalClients}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Total Plan Members</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {clientOverview.totalPlanMembers.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Avg. Company Size</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {clientOverview.avgGroupSize}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Avg. Premium/Client</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                ${clientOverview.avgPremiumPerClient}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Avg. Loss Ratio (Book-wide)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {clientOverview.avgLossRatio}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Flagged Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {clientOverview.percentFlagged}%
              </p>
              <p className="text-xs text-muted-foreground">
                {Math.round(
                  (clientOverview.totalClients *
                    clientOverview.percentFlagged) /
                    100
                )}{' '}
                clients with alerts
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Client Search & Filter 
      <section aria-labelledby="client-search-filter-title">
        <h3
          id="client-search-filter-title"
          className="text-xl font-medium mb-2"
        >
          Client Search & Filter
        </h3>

        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients by name, industry, or group number..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              <SelectItem value="tech">Technology</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="manufacturing">Manufacturing</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Renewal Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="30days">Next 30 Days</SelectItem>
              <SelectItem value="60days">Next 60 Days</SelectItem>
              <SelectItem value="90days">Next 90 Days</SelectItem>
              <SelectItem value="6months">Next 6 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {searchQuery && (
          <Card className="mt-4">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                No results for "{searchQuery}". Try a different search term.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
      */}
    </div>
  );
}
