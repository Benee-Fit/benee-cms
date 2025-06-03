'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/design-system/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/design-system/components/ui/select';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@repo/design-system/components/ui/alert';
import { Badge } from '@repo/design-system/components/ui/badge';
import { cn } from '@repo/design-system/lib/utils';
import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

// Creating a simple chart placeholder since the actual Chart component isn't available
interface ChartProps {
  type: string;
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string[] | string;
      borderColor?: string[] | string;
      borderWidth?: number;
    }>;
  };
  height?: number;
  width?: number;
  options?: {
    responsive?: boolean;
    maintainAspectRatio?: boolean;
    plugins?: {
      legend?: {
        display?: boolean;
        position?: string;
      };
    };
    scales?: {
      y?: {
        beginAtZero?: boolean;
        max?: number;
      };
    };
  };
}

const Chart = ({ type, data, height = 200 }: ChartProps) => {
  return (
    <div className="border rounded-md p-2" style={{ height }}>
      <div className="text-sm font-medium mb-2">{type.toUpperCase()} Chart (placeholder)</div>
      <div className="text-xs text-muted-foreground">
        <div className="mb-1">Labels: {data.labels.join(', ')}</div>
        {data.datasets.map((dataset, index) => (
          <div key={index} className="mb-1">
            <span className="font-semibold">{dataset.label}:</span> {dataset.data.join(', ')}
          </div>
        ))}
      </div>
    </div>
  );
};

interface RevenueBreakdownProps {
  className?: string;
}

export function RevenueBreakdown({ className }: RevenueBreakdownProps) {
  const [timeframe, setTimeframe] = useState('ytd');
  
  // Mock data
  const teamMembers = [
    { name: 'John Smith', revenue: 342500, quotes: 56, conversionRate: 68, clients: 14 },
    { name: 'Emily Davis', revenue: 278900, quotes: 42, conversionRate: 72, clients: 12 },
    { name: 'Michael Johnson', revenue: 197600, quotes: 38, conversionRate: 59, clients: 9 },
    { name: 'Sarah Williams', revenue: 185200, quotes: 31, conversionRate: 64, clients: 8 },
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
  const growthChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Revenue (Current Year)',
        data: [65000, 72000, 74000, 81000, 83000, 88000, 91000, 92000, 97000, 99000, 102000, 104000],
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'transparent',
        tension: 0.4,
      },
      {
        label: 'Revenue (Previous Year)',
        data: [58000, 63000, 65000, 68000, 72000, 76000, 79000, 83000, 86000, 89000, 91000, 93000],
        borderColor: 'hsl(var(--muted-foreground) / 0.5)',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4,
      },
    ],
  };

  // Pie chart data for commission by partner
  const commissionPieData = {
    labels: commissionSplits.map(item => item.carrier),
    datasets: [
      {
        data: commissionSplits.map(item => item.percentage),
        backgroundColor: [
          'hsl(var(--primary) / 0.9)',
          'hsl(var(--primary) / 0.7)',
          'hsl(var(--primary) / 0.5)',
          'hsl(var(--primary) / 0.3)',
          'hsl(var(--primary) / 0.2)',
        ],
        borderWidth: 1,
        borderColor: 'hsl(var(--background))',
      },
    ],
  };

  // Bar chart data for revenue by source
  const revenueBarData = {
    labels: revenueSources.map(item => item.source),
    datasets: [
      {
        label: 'Revenue',
        data: revenueSources.map(item => item.amount),
        backgroundColor: 'hsl(var(--primary) / 0.7)',
        borderColor: 'hsl(var(--primary))',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <h2 className="text-2xl font-semibold mb-1">Revenue Breakdown</h2>
        <p className="text-muted-foreground">Track earnings, performance, and commissions across your broker portfolio.</p>
      </div>

      {/* A. Revenue Overview */}
      <section aria-labelledby="revenue-overview-title">
        <h3 id="revenue-overview-title" className="text-xl font-medium mb-2">A. Revenue Overview</h3>
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
                  <SelectItem value="ytd">YTD</SelectItem>
                  <SelectItem value="mtd">MTD</SelectItem>
                  <SelectItem value="qtd">Quarterly</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-3xl font-bold">$1,004,200</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Monthly Recurring Revenue (MRR)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">$83,700</p>
              <p className="text-sm text-muted-foreground mt-1">
                <Badge variant="outline" className="mr-1">+3.2%</Badge> from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Revenue Split</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="flex justify-between mb-1">
                <span>Product Type:</span>
                <span>Health (62%), Dental (24%), Vision (14%)</span>
              </p>
              <p className="flex justify-between mb-1">
                <span>Carrier:</span>
                <span>Manulife (28%), Sun Life (22%), Others (50%)</span>
              </p>
              <p className="flex justify-between">
                <span>Type:</span>
                <span>New Business (45%), Renewals (55%)</span>
              </p>
            </CardContent>
          </Card>
        </div>
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Growth Trendline (YoY)</CardTitle>
          </CardHeader>
          <CardContent>
            <Chart
              type="line"
              data={growthChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  tooltip: {
                    mode: 'index',
                  },
                },
                scales: {
                  y: {
                    beginAtZero: false,
                    ticks: {
                      callback: (value) => `$${value.toLocaleString()}`,
                    },
                  },
                },
              }}
            />
          </CardContent>
        </Card>
      </section>

      {/* B. Team Performance */}
      <section aria-labelledby="team-performance-title">
        <h3 id="team-performance-title" className="text-xl font-medium mb-2">B. Team Performance</h3>
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
                    <TableCell className="text-right">${member.revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{member.quotes}</TableCell>
                    <TableCell className="text-right">{member.conversionRate}%</TableCell>
                    <TableCell className="text-right">{member.clients}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* C. Commission Splits */}
      <section aria-labelledby="commission-splits-title">
        <h3 id="commission-splits-title" className="text-xl font-medium mb-2">C. Commission Splits</h3>
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
                    <TableCell className="font-medium">{commission.carrier}</TableCell>
                    <TableCell className="text-right">${commission.totalCommission.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{commission.percentage}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">% Commission by Partner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <Chart
                  type="pie"
                  data={commissionPieData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Revenue by Source</CardTitle>
            </CardHeader>
            <CardContent>
              <Chart
                type="bar"
                data={revenueBarData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: (value) => `$${value.toLocaleString()}`,
                      },
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* D. Revenue by Source - Already covered in the charts above */}

      {/* E. Forecasting */}
      <section aria-labelledby="forecasting-title">
        <h3 id="forecasting-title" className="text-xl font-medium mb-2">E. Forecasting (Next 12 months)</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Projected Revenue (30/60/90 days)</CardTitle>
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
              <CardTitle className="text-base">Expected Plan Member Growth</CardTitle>
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
                    <Badge variant="outline" className="ml-1">+18%</Badge>
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Smart Alert</AlertTitle>
          <AlertDescription>
            Pipeline is 15% lower than Q1 average. Consider scheduling follow-ups with prospects.
          </AlertDescription>
        </Alert>
      </section>
    </div>
  );
}
