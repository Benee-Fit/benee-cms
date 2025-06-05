'use client';

import {
  Alert,
  AlertDescription,
} from '@repo/design-system/components/ui/alert';
import { Badge } from '@repo/design-system/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import { Input } from '@repo/design-system/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/design-system/components/ui/select';
import { cn } from '@repo/design-system/lib/utils';
import {
  CalendarDays as CalendarIcon,
  FileIcon,
  FlameIcon,
  SearchIcon,
  TrendingDownIcon,
  Upload,
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
    <div className={cn('space-y-6 p-6', className)}>
      <div>
        <h2 className="text-2xl font-semibold mb-1">Client Insights</h2>
        <p className="text-muted-foreground">
          Everything tied to your client block in one place.
        </p>
      </div>

      {/* Client Overview */}
      <section aria-labelledby="client-overview-title">
        <h3 id="client-overview-title" className="text-xl font-medium mb-2">
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
              <CardTitle className="text-base">Avg. Group Size</CardTitle>
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
                  (clientOverview.totalClients * clientOverview.percentFlagged) /
                    100
                )}{' '}
                clients with alerts
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Client Search & Filter */}
      <section aria-labelledby="client-search-filter-title">
        <h3 id="client-search-filter-title" className="text-xl font-medium mb-2">
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

      {/* Document Uploads */}
      <section aria-labelledby="doc-upload-title">
        <h3 id="doc-upload-title" className="text-xl font-medium mb-2">
          Document Uploads
        </h3>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">
              Drag/drop claims experience, renewals, forms, and any client
              documents.
            </p>

            <div className="mt-2 p-6 border-2 border-dashed rounded-md text-center">
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium">
                Drag files here or click to upload
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports PDF, Excel, Word, and image files up to 10MB
              </p>
              <Input type="file" className="hidden" id="file-upload" multiple />
              <label
                htmlFor="file-upload"
                className="mt-4 inline-flex h-8 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 cursor-pointer"
              >
                Select Files
              </label>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <p className="text-xs text-muted-foreground w-full mb-1">
                Tag by type/date/client:
              </p>
              <Badge variant="outline" className="bg-background">
                Claims Experience
              </Badge>
              <Badge variant="outline" className="bg-background">
                Renewal
              </Badge>
              <Badge variant="outline" className="bg-background">
                Forms
              </Badge>
              <Badge variant="outline" className="bg-background">
                Census
              </Badge>
              <Badge variant="outline" className="bg-background">
                + Add Custom Tag
              </Badge>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Client Flags */}
      <section aria-labelledby="client-flags-title">
        <h3 id="client-flags-title" className="text-xl font-medium mb-2">
          Client Flags
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
    </div>
  );
}
