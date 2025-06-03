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
// Creating a simple chart placeholder since the actual Chart component might not be available
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
import { Badge } from '@repo/design-system/components/ui/badge';
import { cn } from '@repo/design-system/lib/utils';

interface IndustryInsightProps {
  className?: string;
}

export function IndustryInsight({ className }: IndustryInsightProps) {
  // Mock data
  const industryPerformance = [
    { industry: 'Technology', clients: 12, revenue: 340000, growth: 14, avgPremium: 28300 },
    { industry: 'Healthcare', clients: 8, revenue: 245000, growth: 9, avgPremium: 30600 },
    { industry: 'Manufacturing', clients: 7, revenue: 182000, growth: 6, avgPremium: 26000 },
    { industry: 'Professional Services', clients: 6, revenue: 156000, growth: 11, avgPremium: 26000 },
    { industry: 'Education', clients: 5, revenue: 112000, growth: 4, avgPremium: 22400 },
    { industry: 'Retail', clients: 3, revenue: 72000, growth: 2, avgPremium: 24000 },
    { industry: 'Other', clients: 2, revenue: 47000, growth: 5, avgPremium: 23500 },
  ];

  const companySize = [
    { tier: 'Small (1-49)', clients: 18, avgPremium: 19200, totalRevenue: 345600 },
    { tier: 'Medium (50-199)', clients: 16, avgPremium: 28400, totalRevenue: 454400 },
    { tier: 'Large (200+)', clients: 9, avgPremium: 34500, totalRevenue: 310500 },
  ];

  // Chart data for quotes submitted per vertical
  const quoteChartData = {
    labels: industryPerformance.map(item => item.industry),
    datasets: [
      {
        label: 'Quotes Submitted',
        data: [48, 37, 29, 22, 19, 14, 8],
        backgroundColor: 'hsl(var(--primary) / 0.7)',
        borderColor: 'hsl(var(--primary))',
        borderWidth: 1,
      }
    ],
  };

  // Chart data for conversion rate per vertical
  const conversionChartData = {
    labels: industryPerformance.map(item => item.industry),
    datasets: [
      {
        label: 'Conversion Rate (%)',
        data: [72, 65, 59, 68, 55, 42, 63],
        backgroundColor: 'hsl(var(--primary) / 0.7)',
        borderColor: 'hsl(var(--primary))',
        borderWidth: 1,
      }
    ],
  };

  // Chart data for source breakdown
  const sourceChartData = {
    labels: ['Referrals', 'Cold Outreach', 'Website', 'Events', 'Partners'],
    datasets: [
      {
        label: 'Source Breakdown',
        data: [42, 23, 15, 12, 8],
        backgroundColor: [
          'hsl(var(--primary) / 0.9)',
          'hsl(var(--primary) / 0.7)',
          'hsl(var(--primary) / 0.5)',
          'hsl(var(--primary) / 0.3)',
          'hsl(var(--primary) / 0.2)',
        ],
        borderWidth: 1,
        borderColor: 'hsl(var(--background))',
      }
    ],
  };

  // Chart data for lead source efficiency
  const efficiencyChartData = {
    labels: ['Referrals', 'Cold Outreach', 'Website', 'Events', 'Partners'],
    datasets: [
      {
        label: 'Conversion Rate (%)',
        data: [68, 22, 34, 51, 47],
        backgroundColor: 'hsl(var(--primary) / 0.7)',
        borderColor: 'hsl(var(--primary))',
        borderWidth: 1,
      },
      {
        label: 'Avg. Client Value ($K)',
        data: [28.4, 22.7, 19.5, 26.2, 24.8],
        backgroundColor: 'hsl(var(--muted-foreground) / 0.5)',
        borderColor: 'hsl(var(--muted-foreground))',
        borderWidth: 1,
      }
    ],
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <h2 className="text-2xl font-semibold mb-1">Industry Insight</h2>
        <p className="text-muted-foreground">Visualize where your business thrives by industry and client segments.</p>
      </div>

      {/* A. Industry Performance */}
      <section aria-labelledby="industry-perf-title">
        <h3 id="industry-perf-title" className="text-xl font-medium mb-2">A. Industry Performance</h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Industry</TableHead>
                  <TableHead className="text-right">Clients</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">YoY Growth</TableHead>
                  <TableHead className="text-right">Avg. Premium</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {industryPerformance.map((industry) => (
                  <TableRow key={industry.industry}>
                    <TableCell className="font-medium">{industry.industry}</TableCell>
                    <TableCell className="text-right">{industry.clients}</TableCell>
                    <TableCell className="text-right">${industry.revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{industry.growth}%</TableCell>
                    <TableCell className="text-right">${industry.avgPremium.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <p className="mt-2 text-sm text-muted-foreground">
          Highlight top verticals and growth areas: 
          <Badge className="ml-2 mr-1">Technology</Badge>
          <Badge>Healthcare</Badge>
        </p>
      </section>

      {/* B. Premium Benchmarks */}
      <section aria-labelledby="premium-bench-title">
        <h3 id="premium-bench-title" className="text-xl font-medium mb-2">B. Premium Benchmarks</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Largest Premiums/Industry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="flex justify-between">
                <span>Healthcare:</span>
                <span className="font-medium">$30,600/client</span>
              </p>
              <p className="flex justify-between">
                <span>Technology:</span>
                <span className="font-medium">$28,300/client</span>
              </p>
              <p className="flex justify-between">
                <span>Manufacturing:</span>
                <span className="font-medium">$26,000/client</span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Avg. Premium/Member</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="flex justify-between">
                <span>Healthcare:</span>
                <span className="font-medium">$2,840/member</span>
              </p>
              <p className="flex justify-between">
                <span>Technology:</span>
                <span className="font-medium">$2,560/member</span>
              </p>
              <p className="flex justify-between">
                <span>Industry Average:</span>
                <span className="font-medium">$2,320/member</span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Avg. Premium/Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="flex justify-between">
                <span>All Industries:</span>
                <span className="font-medium">$25,800/client</span>
              </p>
              <p className="flex justify-between">
                <span>YoY Change:</span>
                <span className="font-medium">
                  <Badge variant="outline">+7.3%</Badge>
                </span>
              </p>
              <p className="flex justify-between">
                <span>Industry Benchmark:</span>
                <span className="font-medium">$23,400/client</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* C. Company Size Tiers */}
      <section aria-labelledby="company-size-title">
        <h3 id="company-size-title" className="text-xl font-medium mb-2">C. Company Size Tiers</h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Size Tier</TableHead>
                  <TableHead className="text-right">Number of Clients</TableHead>
                  <TableHead className="text-right">Avg. Premium/Client</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companySize.map((size) => (
                  <TableRow key={size.tier}>
                    <TableCell className="font-medium">{size.tier}</TableCell>
                    <TableCell className="text-right">{size.clients}</TableCell>
                    <TableCell className="text-right">${size.avgPremium.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${size.totalRevenue.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* D. Quote & Source Analytics */}
      <section aria-labelledby="quote-source-analytics-title">
        <h3 id="quote-source-analytics-title" className="text-xl font-medium mb-2">D. Quote & Source Analytics</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quotes Submitted per Vertical</CardTitle>
            </CardHeader>
            <CardContent>
              <Chart
                type="bar"
                data={quoteChartData}
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
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Conversion % per Vertical</CardTitle>
            </CardHeader>
            <CardContent>
              <Chart
                type="bar"
                data={conversionChartData}
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
                      max: 100,
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Source Breakdown per Industry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <Chart
                  type="pie"
                  data={sourceChartData}
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
              <CardTitle className="text-base">Lead Source Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <Chart
                type="bar"
                data={efficiencyChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
