'use client';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@repo/design-system/components/ui/alert';
import { Badge } from '@repo/design-system/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
} from '@repo/design-system/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/design-system/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/design-system/components/ui/table';
import { cn } from '@repo/design-system/lib/utils';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';

interface RevenueBreakdownProps {
  className?: string;
  sectionId?: string;
}

export function RevenueBreakdown({
  className,
  sectionId,
}: RevenueBreakdownProps) {
  const bluePalette = [
    '#0D47A1',
    '#1976D2',
    '#2196F3',
    '#64B5F6',
    '#90CAF9',
    '#BBDEFB',
  ];
  const extendedBluePalette = [
    '#0D47A1',
    '#1565C0',
    '#1976D2',
    '#1E88E5',
    '#2196F3',
    '#42A5F5',
    '#64B5F6',
    '#90CAF9',
    '#BBDEFB',
    '#E3F2FD',
  ];

  const [timeframe, setTimeframe] = useState('ytd');

  // Mock revenue data for different timeframes
  const revenueData = {
    ytd: 1004200,
    mtd: 124500,
    qtd: 386700,
  };

  // Mock Total Recurring Revenue data for different timeframes (quoted + claims)
  const totalRecurringRevenueData = {
    ytd: 83700,
    mtd: 89200,
    qtd: 85800,
  };

  // Mock growth rates for different timeframes
  const growthRates = {
    ytd: 3.2,
    mtd: 5.8,
    qtd: 2.1,
  };

  // Mock Average Revenue per Plan Member data for different timeframes
  const avgRevenuePerMemberData = {
    ytd: 210.32,
    mtd: 198.75,
    qtd: 205.18,
  };

  // Mock growth rates for Average Revenue per Plan Member
  const avgRevenuePerMemberGrowthRates = {
    ytd: 2.8,
    mtd: 4.2,
    qtd: 1.9,
  };

  // Mock HSA breakdown data
  const hsaData = {
    avgCoverageAmount: 2850.00,
    avgTotalRevenue: 485.75,
    totalRevenue: 127450,
  };

  // Mock product type split data
  const productTypeSplits = [
    { name: 'Health', value: 62, fill: bluePalette[0] },
    { name: 'Dental', value: 24, fill: bluePalette[1] },
    { name: 'Vision', value: 14, fill: bluePalette[2] },
  ];

  // Mock carrier split data
  const carrierSplits = [
    { name: 'Manulife', value: 28, fill: bluePalette[3] },
    { name: 'Sun Life', value: 22, fill: bluePalette[4] },
    { name: 'Others', value: 50, fill: bluePalette[5] },
  ];

  // Mock business type split data
  const businessTypeSplits = [
    { name: 'New Business', value: 45, fill: bluePalette[0] },
    { name: 'Renewals', value: 55, fill: bluePalette[1] },
  ];

  // Mock data for Team Performance
  const teamMembers = [
    {
      name: 'John Smith',
      clients: 14,
      members: 350,
      avgGroupSize: 25,
      totalRevenue: 342500,
      topIndustry: 'Technology',
    },
    {
      name: 'Emily Davis',
      clients: 12,
      members: 420,
      avgGroupSize: 35,
      totalRevenue: 278900,
      topIndustry: 'Healthcare',
    },
    {
      name: 'Michael Johnson',
      clients: 9,
      members: 270,
      avgGroupSize: 30,
      totalRevenue: 197600,
      topIndustry: 'Manufacturing',
    },
    {
      name: 'Sarah Williams',
      clients: 8,
      members: 320,
      avgGroupSize: 40,
      totalRevenue: 185200,
      topIndustry: 'Finance',
    },
  ];

  // Mock data for Sales Funnel Performance
  const salesFunnelData = [
    {
      name: 'John Smith',
      quotesSent: 56,
      closeRate: 68,
      avgDaysToClose: 15,
      avgIndustryQuoted: 'Technology',
      avgCompanySizeQuoted: 'Medium (50-199)',
      bestPerformingSegments: 'Tech SMEs, Manufacturing 200+',
      quoteSource: 'Warm referrals, Cold outreach',
    },
    {
      name: 'Emily Davis',
      quotesSent: 42,
      closeRate: 72,
      avgDaysToClose: 12,
      avgIndustryQuoted: 'Healthcare',
      avgCompanySizeQuoted: 'Large (200+)',
      bestPerformingSegments: 'Healthcare 100+, Finance SMEs',
      quoteSource: 'Existing clients, Partnerships',
    },
    {
      name: 'Michael Johnson',
      quotesSent: 38,
      closeRate: 59,
      avgDaysToClose: 20,
      avgIndustryQuoted: 'Manufacturing',
      avgCompanySizeQuoted: 'Medium (50-199)',
      bestPerformingSegments: 'Manufacturing 50-199, Retail SMEs',
      quoteSource: 'Events, Inbound website',
    },
    {
      name: 'Sarah Williams',
      quotesSent: 31,
      closeRate: 64,
      avgDaysToClose: 18,
      avgIndustryQuoted: 'Finance',
      avgCompanySizeQuoted: 'Large (200+)',
      bestPerformingSegments: 'Finance 200+, Professional Services',
      quoteSource: 'Warm referrals, Events',
    },
  ];

  const commissionSplits = [
    {
      partner: 'Manulife',
      type: 'Internal Broker',
      percentSplit: 28,
      clients: 45,
      planMembers: 2850,
      totalCommission: 54800,
      carrier: 'Manulife',
    },
    {
      partner: 'Sun Life',
      type: 'Referral',
      percentSplit: 22,
      clients: 38,
      planMembers: 2180,
      totalCommission: 42600,
      carrier: 'Sun Life',
    },
    {
      partner: 'Great-West Life',
      type: 'Internal Broker',
      percentSplit: 20,
      clients: 30,
      planMembers: 1920,
      totalCommission: 39000,
      carrier: 'Great-West Life',
    },
    {
      partner: 'Blue Cross',
      type: 'Internal Broker',
      percentSplit: 16,
      clients: 25,
      planMembers: 1450,
      totalCommission: 31200,
      carrier: 'Blue Cross',
    },
    {
      partner: 'Other Carriers',
      type: 'Referral',
      percentSplit: 14,
      clients: 20,
      planMembers: 980,
      totalCommission: 27300,
      carrier: 'Various',
    },
  ];

  // Revenue by source data
  const revenueSourceData = [
    { source: 'Paid Advertising', value: 36800, percentage: 13 },
    { source: 'Organic & Inbound Marketing', value: 62500, percentage: 22 },
    { source: 'Outbound & Direct Outreach', value: 84300, percentage: 30 },
    { source: 'Referrals & Partnerships', value: 45300, percentage: 16 },
    { source: 'Authority Building', value: 19700, percentage: 7 },
    { source: 'Events & Workshops', value: 42100, percentage: 15 },
  ];

  // Chart data for growth trendline
  const growthChartData = [
    { month: 'Jan', current: 65000, previous: 52000 },
    { month: 'Feb', current: 72000, previous: 58000 },
    { month: 'Mar', current: 74000, previous: 60000 },
    { month: 'Apr', current: 81000, previous: 65000 },
    { month: 'May', current: 83000, previous: 68000 },
    { month: 'Jun', current: 88000, previous: 72000 },
    { month: 'Jul', current: 91000, previous: 75000 },
    { month: 'Aug', current: 92000, previous: 79000 },
    { month: 'Sep', current: 97000, previous: 80000 },
    { month: 'Oct', current: 99000, previous: 82000 },
    { month: 'Nov', current: 102000, previous: 85000 },
    { month: 'Dec', current: 104000, previous: 87000 },
  ];

  // Pie chart data for commission by partner
  const commissionPieData = commissionSplits.map((item, index) => ({
    name: item.partner,
    value: item.percentSplit,
    fill: bluePalette[index % bluePalette.length],
  }));

  // Bar chart data for commission by carrier
  const carrierCommissionData = commissionSplits.map((item) => ({
    name: item.carrier,
    value: item.totalCommission,
  }));

  // Helper function to determine if a section should be rendered
  const shouldRenderSection = (id: string): boolean => {
    if (!sectionId) {
      return true; // If no sectionId prop, render all
    }
    return sectionId === id;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Revenue Overview */}
      {shouldRenderSection('revenue-overview-title') && (
        <section aria-labelledby="revenue-overview-title">
          <Alert className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Smart Alert</AlertTitle>
            <AlertDescription>
              Pipeline is 15% lower than Q1 average. Consider scheduling
              follow-ups with prospects.
            </AlertDescription>
          </Alert>
          <h3 id="revenue-overview-title" className="text-xl font-medium mb-2">
            Revenue Overview
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total Block Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <Select defaultValue={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="w-full mb-2">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ytd">Year to Date</SelectItem>
                    <SelectItem value="mtd">Month to Date</SelectItem>
                    <SelectItem value="qtd">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-3xl font-bold">
                  $
                  {revenueData[
                    timeframe as keyof typeof revenueData
                  ].toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {timeframe === 'ytd' && 'Jan 1 - Dec 31, 2025'}
                  {timeframe === 'mtd' && 'Jun 1 - Jun 30, 2025'}
                  {timeframe === 'qtd' && 'Apr 1 - Jun 30, 2025'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Total Recurring Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  $
                  {totalRecurringRevenueData[
                    timeframe as keyof typeof totalRecurringRevenueData
                  ].toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  <Badge variant="outline" className="mr-1">
                    +{growthRates[timeframe as keyof typeof growthRates]}%
                  </Badge>{' '}
                  from last {timeframe === 'ytd' && 'year'}
                  {timeframe === 'qtd' && 'quarter'}
                  {timeframe === 'mtd' && 'month'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Average Revenue per Plan Member
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  $
                  {avgRevenuePerMemberData[
                    timeframe as keyof typeof avgRevenuePerMemberData
                  ].toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  <Badge variant="outline" className="mr-1">
                    +{avgRevenuePerMemberGrowthRates[timeframe as keyof typeof avgRevenuePerMemberGrowthRates]}%
                  </Badge>{' '}
                  from last {timeframe === 'ytd' && 'year'}
                  {timeframe === 'qtd' && 'quarter'}
                  {timeframe === 'mtd' && 'month'}
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6">
            <h4 className="text-lg font-medium mb-3">HSA Breakdown</h4>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Avg Coverage Amount</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    ${hsaData.avgCoverageAmount.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Avg Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    ${hsaData.avgTotalRevenue.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    ${hsaData.totalRevenue.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Growth Trendline (YoY)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ChartContainer
                  className="h-[300px] aspect-[4/3] w-full"
                  config={{
                    current: {
                      label: 'Current Year',
                      color: 'hsl(var(--primary))',
                    },
                    previous: {
                      label: 'Previous Year',
                      color: 'hsl(var(--primary) / 0.5)',
                    },
                  }}
                >
                  <LineChart
                    data={growthChartData}
                    margin={{ top: 10, right: 30, bottom: 30, left: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      className="text-xs text-muted-foreground"
                    />
                    <YAxis
                      className="text-xs text-muted-foreground"
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                      width={60}
                    />
                    <Line
                      type="monotone"
                      dataKey="current"
                      name="Current Year"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="previous"
                      stroke={bluePalette[1]}
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      dot={false}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col">
                                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    Current
                                  </span>
                                  <span className="font-bold text-muted-foreground">
                                    ${payload[0].value?.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    Previous
                                  </span>
                                  <span className="font-bold text-muted-foreground">
                                    ${payload[1].value?.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ChartLegend />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Team Performance */}
      {shouldRenderSection('team-performance-title') && (
        <section aria-labelledby="team-performance-title">
          <h3 id="team-performance-title" className="text-xl font-medium mb-2">
            Team Performance
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <Select defaultValue="all">
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
                <SelectItem value="mtd">Month to Date</SelectItem>
                <SelectItem value="qtd">Quarter to Date</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Quote Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Client Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sizes</SelectItem>
                <SelectItem value="small">Small (1-49)</SelectItem>
                <SelectItem value="medium">Medium (50-199)</SelectItem>
                <SelectItem value="large">Large (200+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Broker</TableHead>
                    <TableHead className="text-right"># of Clients</TableHead>
                    <TableHead className="text-right"># of Members</TableHead>
                    <TableHead className="text-right">
                      Avg. Group Size
                    </TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                    <TableHead>Top Industry</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.name}>
                      <TableCell className="font-medium">
                        {member.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {member.clients}
                      </TableCell>
                      <TableCell className="text-right">
                        {member.members}
                      </TableCell>
                      <TableCell className="text-right">
                        {member.avgGroupSize}
                      </TableCell>
                      <TableCell className="text-right">
                        ${member.totalRevenue.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {member.topIndustry}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {/* Sales Funnel Performance */}
          <div className="mt-6">
            <h4 className="text-lg font-medium mb-3">Sales Funnel Performance</h4>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Broker Name</TableHead>
                      <TableHead className="text-right">Quotes Sent</TableHead>
                      <TableHead className="text-right">Close Rate</TableHead>
                      <TableHead className="text-right">Avg Days to Close</TableHead>
                      <TableHead>Avg Industry Quoted</TableHead>
                      <TableHead>Avg Company Size Quoted</TableHead>
                      <TableHead>Best Performing Industries & Company Sizes</TableHead>
                      <TableHead>Where is quote coming from</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesFunnelData.map((broker) => (
                      <TableRow key={broker.name}>
                        <TableCell className="font-medium">
                          {broker.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {broker.quotesSent}
                        </TableCell>
                        <TableCell className="text-right">
                          {broker.closeRate}%
                        </TableCell>
                        <TableCell className="text-right">
                          {broker.avgDaysToClose}
                        </TableCell>
                        <TableCell>
                          {broker.avgIndustryQuoted}
                        </TableCell>
                        <TableCell>
                          {broker.avgCompanySizeQuoted}
                        </TableCell>
                        <TableCell>
                          {broker.bestPerformingSegments}
                        </TableCell>
                        <TableCell>
                          {broker.quoteSource}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Carrier Breakdown */}
      {shouldRenderSection('commission-splits-title') && (
        <section aria-labelledby="commission-splits-title">
          <h3 id="commission-splits-title" className="text-xl font-medium mb-2">
            Carrier Breakdown
          </h3>
          <Card className="mb-4">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Carrier</TableHead>
                    <TableHead className="text-right">% Split</TableHead>
                    <TableHead className="text-right">Clients</TableHead>
                    <TableHead className="text-right"># of Plan Members</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissionSplits.map((commission) => (
                    <TableRow key={commission.partner}>
                      <TableCell className="font-medium">
                        {commission.partner}
                      </TableCell>
                      <TableCell className="text-right">
                        {commission.percentSplit}%
                      </TableCell>
                      <TableCell className="text-right">
                        {commission.clients}
                      </TableCell>
                      <TableCell className="text-right">
                        {commission.planMembers?.toLocaleString() || '0'}
                      </TableCell>
                      <TableCell className="text-right">
                        ${commission.totalCommission.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  % Commission by Partner
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ChartContainer
                  className="h-[280px] aspect-[4/3] w-full"
                  config={commissionSplits.reduce(
                    (acc, item, index) => {
                      acc[item.carrier] = {
                        label: item.carrier,
                        color: `hsl(var(--primary) / ${0.9 - index * 0.2})`,
                      };
                      return acc;
                    },
                    {} as Record<string, { label: string; color: string }>
                  )}
                >
                  <PieChart
                    margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  >
                    <Pie
                      data={commissionPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({
                        name,
                        value,
                      }: { name: string; value: number }) =>
                        `${name}: ${value}%`
                      }
                      labelLine={false}
                    >
                      {commissionPieData.map(
                        (
                          entry: { name: string; value: number; fill: string },
                          index
                        ) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        )
                      )}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  {payload[0].name}
                                </span>
                                <span className="font-bold text-muted-foreground">
                                  {payload[0].value}%
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  $
                                  {commissionSplits
                                    .find(
                                      (item) => item.carrier === payload[0].name
                                    )
                                    ?.totalCommission.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ChartLegend />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  $ of Commission by Carrier
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ChartContainer
                  className="h-[280px] aspect-[4/3] w-full"
                  config={{
                    value: {
                      label: 'Revenue',
                      // color property removed to allow Cell fills to take precedence
                    },
                  }}
                >
                  <BarChart
                    data={carrierCommissionData}
                    margin={{ top: 10, right: 20, bottom: 30, left: 50 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="name"
                      className="text-xs text-muted-foreground"
                    />
                    <YAxis
                      className="text-xs text-muted-foreground"
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {carrierCommissionData.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            extendedBluePalette[
                              index % extendedBluePalette.length
                            ]
                          }
                        />
                      ))}
                    </Bar>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  {payload[0].name}
                                </span>
                                <span className="font-bold text-muted-foreground">
                                  ${payload[0].value?.toLocaleString()}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {
                                    commissionSplits.find(
                                      (item) => item.carrier === payload[0].name
                                    )?.percentSplit
                                  }
                                  % of total
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Revenue Sources */}
      {shouldRenderSection('revenue-sources-title') && (
        <section aria-labelledby="revenue-sources-title" className="pt-6">
          <h3 id="revenue-sources-title" className="text-xl font-medium mb-2">
            Revenue by Source
          </h3>
          <Card className="mb-4">
            <CardContent className="p-4">
              <ChartContainer
                className="h-[280px] w-full"
                config={{
                  value: {
                    label: 'Revenue',
                    color: 'hsl(var(--primary) / 0.7)',
                  },
                }}
              >
                <BarChart
                  data={revenueSourceData}
                  margin={{ top: 10, right: 20, bottom: 30, left: 50 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="source"
                    className="text-xs text-muted-foreground"
                  />
                  <YAxis
                    className="text-xs text-muted-foreground"
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {revenueSourceData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          extendedBluePalette[
                            index % extendedBluePalette.length
                          ]
                        }
                      />
                    ))}
                  </Bar>
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                {payload[0].payload.source}
                              </span>
                              <span className="font-bold text-muted-foreground">
                                ${payload[0].value?.toLocaleString()}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {payload[0].payload.percentage}% of total
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Forecasting */}
      {shouldRenderSection('forecasting-title') && (
        <section aria-labelledby="forecasting-title" className="pt-6">
          <h3 id="forecasting-title" className="text-xl font-medium mb-2">
            Forecasting (Next 12 months)
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Projected Revenue (30/60/90 days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="flex justify-between">
                    <span>30 Days:</span>
                    <span className="font-medium">$86,200</span>
                  </p>
                  <p className="flex justify-between">
                    <span>60 Days:</span>
                    <span className="font-medium">$172,500</span>
                  </p>
                  <p className="flex justify-between">
                    <span>90 Days:</span>
                    <span className="font-medium">$258,800</span>
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Expected Plan Member Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="flex justify-between">
                    <span>Current Members:</span>
                    <span className="font-medium">4,782</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Projected (EOY):</span>
                    <span className="font-medium">5,640</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Growth Rate:</span>
                    <span className="font-medium">
                      <Badge variant="outline" className="ml-1">
                        +18%
                      </Badge>
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}
