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
}

export function RevenueBreakdown({ className }: RevenueBreakdownProps) {
  const [timeframe, setTimeframe] = useState('ytd');

  // Mock revenue data for different timeframes
  const revenueData = {
    ytd: 1004200,
    mtd: 124500,
    qtd: 386700,
  };

  // Mock MRR data for different timeframes
  const mrrData = {
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

  // Mock product type split data
  const productTypeSplits = [
    { name: 'Health', value: 62, fill: '#000000' }, // Black
    { name: 'Dental', value: 24, fill: '#444444' }, // Dark grey
    { name: 'Vision', value: 14, fill: '#888888' }, // Medium grey
  ];

  // Mock carrier split data
  const carrierSplits = [
    { name: 'Manulife', value: 28, fill: '#1a1a1a' }, // Very dark grey
    { name: 'Sun Life', value: 22, fill: '#4d4d4d' }, // Dark grey
    { name: 'Others', value: 50, fill: '#808080' }, // Medium grey
  ];

  // Mock business type split data
  const businessTypeSplits = [
    { name: 'New Business', value: 45, fill: '#333333' }, // Dark grey
    { name: 'Renewals', value: 55, fill: '#666666' }, // Medium grey
  ];

  // Mock data
  const teamMembers = [
    {
      name: 'John Smith',
      revenue: 342500,
      quotes: 56,
      conversionRate: 68,
      clients: 14,
    },
    {
      name: 'Emily Davis',
      revenue: 278900,
      quotes: 42,
      conversionRate: 72,
      clients: 12,
    },
    {
      name: 'Michael Johnson',
      revenue: 197600,
      quotes: 38,
      conversionRate: 59,
      clients: 9,
    },
    {
      name: 'Sarah Williams',
      revenue: 185200,
      quotes: 31,
      conversionRate: 64,
      clients: 8,
    },
  ];

  const commissionSplits = [
    { carrier: 'Manulife', totalCommission: 54800, percentage: 28 },
    { carrier: 'Sun Life', totalCommission: 42600, percentage: 22 },
    { carrier: 'Great-West Life', totalCommission: 39000, percentage: 20 },
    { carrier: 'Blue Cross', totalCommission: 31200, percentage: 16 },
    { carrier: 'Other Carriers', totalCommission: 27300, percentage: 14 },
  ];

  const revenueSources = [
    { source: 'New Business', amount: 124500, percentage: 45 },
    { source: 'Renewals', amount: 89700, percentage: 32 },
    { source: 'Plan Adjustments', amount: 41800, percentage: 15 },
    { source: 'Special Commissions', amount: 22400, percentage: 8 },
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
    name: item.carrier,
    value: item.percentage,
    fill: `hsl(var(--primary) / ${0.9 - index * 0.2})`,
  }));

  // Bar chart data for revenue by source
  const revenueBarData = revenueSources.map((item) => ({
    name: item.source,
    value: item.amount,
  }));

  return (
    <div className={cn('space-y-6 p-6', className)}>
      <div>
        <h2 className="text-2xl font-semibold mb-1">Revenue Breakdown</h2>
        <p className="text-muted-foreground">
          Track earnings, performance, and commissions across your broker
          portfolio.
        </p>
      </div>

      {/* Revenue Overview */}
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
                Monthly Recurring Revenue (MRR)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                ${mrrData[timeframe as keyof typeof mrrData].toLocaleString()}
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
        </div>
      </section>

      {/* Revenue Split Section */}
      <section aria-labelledby="revenue-split-title" className="mt-6">
        <h3 id="revenue-split-title" className="text-xl font-medium mb-2">
          Revenue Split
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Product Type Pie Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">By Product Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                id="product-type-pie"
                className="h-60"
                config={{
                  value: {
                    color: '#000000', // Black
                  },
                }}
              >
                <PieChart>
                  <Pie
                    data={productTypeSplits}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}%`}
                    labelLine={false}
                  >
                    {productTypeSplits.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
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
                                {Math.round(
                                  (revenueData[
                                    timeframe as keyof typeof revenueData
                                  ] *
                                    (payload[0].value as number)) /
                                    100
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Carrier Pie Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">By Carrier</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                id="carrier-pie"
                className="h-60"
                config={{
                  value: {
                    color: '#1a1a1a', // Very dark grey
                  },
                }}
              >
                <PieChart>
                  <Pie
                    data={carrierSplits}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}%`}
                    labelLine={false}
                  >
                    {carrierSplits.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
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
                                {Math.round(
                                  (revenueData[
                                    timeframe as keyof typeof revenueData
                                  ] *
                                    (payload[0].value as number)) /
                                    100
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Business Type Pie Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">By Business Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                id="business-type-pie"
                className="h-60"
                config={{
                  value: {
                    color: '#333333', // Dark grey
                  },
                }}
              >
                <PieChart>
                  <Pie
                    data={businessTypeSplits}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}%`}
                    labelLine={false}
                  >
                    {businessTypeSplits.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
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
                                {Math.round(
                                  (revenueData[
                                    timeframe as keyof typeof revenueData
                                  ] *
                                    (payload[0].value as number)) /
                                    100
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="growth-trendline-title">
        <h3 id="growth-trendline-title" className="text-xl font-medium mb-2">
          Growth Trendline
        </h3>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Growth Trendline (YoY)</CardTitle>
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
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="previous"
                  name="Previous Year"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                  stroke="black"
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
      </section>

      {/* Team Performance */}
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
                  <TableHead>Team Member</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Quotes</TableHead>
                  <TableHead className="text-right">Conversion Rate</TableHead>
                  <TableHead className="text-right">Clients</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.name}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="text-right">
                      ${member.revenue.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.quotes}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.conversionRate}%
                    </TableCell>
                    <TableCell className="text-right">
                      {member.clients}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Commission Splits */}
      <section aria-labelledby="commission-splits-title">
        <h3 id="commission-splits-title" className="text-xl font-medium mb-2">
          Commission Splits
        </h3>
        <Card className="mb-4">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Carrier</TableHead>
                  <TableHead className="text-right">Total Commission</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissionSplits.map((commission) => (
                  <TableRow key={commission.carrier}>
                    <TableCell className="font-medium">
                      {commission.carrier}
                    </TableCell>
                    <TableCell className="text-right">
                      ${commission.totalCommission.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {commission.percentage}%
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
                <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <Pie
                    data={commissionPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }: { name: string; value: number }) =>
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
              <CardTitle className="text-base">Revenue by Source</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ChartContainer
                className="h-[280px] aspect-[4/3] w-full"
                config={{
                  value: {
                    label: 'Revenue',
                    color: 'hsl(var(--primary) / 0.7)',
                  },
                }}
              >
                <BarChart
                  data={revenueBarData}
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
                  <Bar
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                    className="fill-primary/70"
                  />
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
                                  revenueSources.find(
                                    (item) => item.source === payload[0].name
                                  )?.percentage
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

      {/* Revenue by Source - Already covered in the charts above */}

      {/* Forecasting */}
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
    </div>
  );
}
