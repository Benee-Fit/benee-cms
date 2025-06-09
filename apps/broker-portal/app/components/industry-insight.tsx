'use client';

import { Badge } from '@repo/design-system/components/ui/badge';
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
import { cn } from '@repo/design-system/lib/utils';
// import { useState } from 'react'; // No longer needed as mock data is static for now

const bluePaletteConst = ['#0D47A1', '#1976D2', '#2196F3', '#64B5F6', '#90CAF9', '#BBDEFB'];
const extendedBluePaletteConst = ['#0D47A1', '#1565C0', '#1976D2', '#1E88E5', '#2196F3', '#42A5F5', '#64B5F6', '#90CAF9', '#BBDEFB', '#E3F2FD'];

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  // Line, // Unused Line import
  // LineChart, // Unused LineChart import
  Pie,
  PieChart,
  ResponsiveContainer, // Added for responsive charts
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string[] | string;
  borderColor?: string[] | string;
  borderWidth?: number;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    legend?: {
      display?: boolean;
      position?: 'top' | 'left' | 'bottom' | 'right' | 'chartArea';
    };
  };
  scales?: {
    y?: {
      beginAtZero?: boolean;
      max?: number;
    };
  };
}

interface ChartComponentProps {
  type: 'bar' | 'pie';
  data: ChartData;
  height?: number;
  options?: ChartOptions;
}

const ChartComponent = ({
  type,
  data,
  height = 200,
  options = {},
}: ChartComponentProps) => {
  if (!data || !data.datasets || data.datasets.length === 0) {
    return (
      <div style={{ height, textAlign: 'center', paddingTop: '20px' }}>
        No data to display
      </div>
    );
  }

  const chartDataProcessed = data.datasets[0].data.map((value, index) => ({
    name: data.labels[index] || `Item ${index + 1}`,
    value,
  }));

  const legendProps = () => {
    if (!options?.plugins?.legend?.position) {
      return {};
    }
    const { position } = options.plugins.legend;
    let layout: 'vertical' | 'horizontal' = 'horizontal';
    let align: 'left' | 'center' | 'right' = 'center';
    let verticalAlign: 'top' | 'middle' | 'bottom' = 'middle';

    if (position === 'left' || position === 'right') {
      layout = 'vertical';
      align = position;
    } else if (position === 'top' || position === 'bottom') {
      verticalAlign = position;
    }
    return { layout, align, verticalAlign };
  };

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartDataProcessed}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" className="text-xs text-muted-foreground" />
          <YAxis className="text-xs text-muted-foreground" />
          <Tooltip />
          {options?.plugins?.legend?.display !== false && (
            <Legend {...legendProps()} />
          )}
          <Bar
            dataKey="value"
            fill={ // Default fill if not an array or if Cells are not used
              !Array.isArray(data.datasets[0].backgroundColor)
                ? (data.datasets[0].backgroundColor as string) || 'hsl(var(--primary) / 0.7)'
                : undefined // Let Cells handle fill if backgroundColor is an array
            }
          >
            {Array.isArray(data.datasets[0].backgroundColor) &&
              chartDataProcessed.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    (data.datasets[0].backgroundColor as string[])[
                      index % (data.datasets[0].backgroundColor as string[]).length
                    ]
                  }
                />
              ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartDataProcessed}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartDataProcessed.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  Array.isArray(data.datasets[0].backgroundColor)
                    ? data.datasets[0].backgroundColor[
                        index % data.datasets[0].backgroundColor.length
                      ]
                    : data.datasets[0].backgroundColor || '#8884d8'
                }
              />
            ))}
          </Pie>
          {options?.plugins?.legend?.display !== false &&
            options?.plugins?.legend?.position && <Legend {...legendProps()} />}
        </PieChart>
      </ResponsiveContainer>
    );
  }
  return (
    <div style={{ height, textAlign: 'center', paddingTop: '20px' }}>
      Unsupported chart type
    </div>
  );
};

interface IndustryInsightProps {
  className?: string;
  sectionId?: string;
}

export function IndustryInsight({
  className,
  sectionId,
}: IndustryInsightProps) {
  const shouldRenderSection = (id: string) => {
    return !sectionId || sectionId === id;
  };

  // Mock data from the original component
  const industryPerformance = [
    {
      industry: 'Technology',
      clients: 12,
      revenue: 340000,
      growth: 14,
      avgPremium: 28300,
    },
    {
      industry: 'Healthcare',
      clients: 8,
      revenue: 245000,
      growth: 9,
      avgPremium: 30600,
    },
    {
      industry: 'Manufacturing',
      clients: 7,
      revenue: 182000,
      growth: 6,
      avgPremium: 26000,
    },
    {
      industry: 'Professional Services',
      clients: 6,
      revenue: 156000,
      growth: 11,
      avgPremium: 26000,
    },
    {
      industry: 'Education',
      clients: 5,
      revenue: 112000,
      growth: 4,
      avgPremium: 22400,
    },
    {
      industry: 'Retail',
      clients: 3,
      revenue: 72000,
      growth: 2,
      avgPremium: 24000,
    },
    {
      industry: 'Other',
      clients: 2,
      revenue: 47000,
      growth: 5,
      avgPremium: 23500,
    },
  ];

  const companySize = [
    {
      tier: 'Small (1-49)',
      clients: 18,
      avgPremium: 19200,
      totalRevenue: 345600,
    },
    {
      tier: 'Medium (50-199)',
      clients: 16,
      avgPremium: 28400,
      totalRevenue: 454400,
    },
    {
      tier: 'Large (200+)',
      clients: 9,
      avgPremium: 34500,
      totalRevenue: 310500,
    },
  ];

  const quoteChartData: ChartData = {
    labels: industryPerformance.map((item) => item.industry),
    datasets: [
      {
        label: 'Quotes Submitted',
        data: [48, 37, 29, 22, 19, 14, 8],
        backgroundColor: ['#0D47A1', '#1565C0', '#1976D2', '#1E88E5', '#2196F3', '#42A5F5', '#64B5F6'], // extendedBluePalette (7 needed)
        borderColor: 'hsl(var(--primary))',
        borderWidth: 1,
      },
    ],
  };

  const conversionChartData: ChartData = {
    labels: industryPerformance.map((item) => item.industry),
    datasets: [
      {
        label: 'Conversion Rate (%)',
        data: [72, 65, 59, 68, 55, 42, 63],
        backgroundColor: ['#0D47A1', '#1565C0', '#1976D2', '#1E88E5', '#2196F3', '#42A5F5', '#64B5F6'], // extendedBluePalette (7 needed)
        borderColor: 'hsl(var(--primary))',
        borderWidth: 1,
      },
    ],
  };

  const sourceChartData: ChartData = {
    labels: ['Referrals', 'Cold Outreach', 'Website', 'Events', 'Partners'],
    datasets: [
      {
        label: 'Source Breakdown',
        data: [42, 23, 15, 12, 8],
        backgroundColor: bluePaletteConst.slice(0, 5), // bluePalette (5 needed)

        borderWidth: 1,
        borderColor: 'hsl(var(--background))',
      },
    ],
  };

  const efficiencyChartData: ChartData = {
    labels: ['Referrals', 'Cold Outreach', 'Website', 'Events', 'Partners'],
    datasets: [
      {
        label: 'Conversion Rate (%)',
        data: [68, 22, 34, 51, 47],
        backgroundColor: bluePaletteConst[0],
        borderColor: 'hsl(var(--primary))',
        borderWidth: 1,
      },
      {
        label: 'Avg. Client Value ($K)',
        data: [28.4, 22.7, 19.5, 26.2, 24.8],
        backgroundColor: bluePaletteConst[1],
        borderColor: 'hsl(var(--muted-foreground))',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className={cn('space-y-6 p-6', className)}>
      {shouldRenderSection('industry-insight-main-header') && (
        <div>
          <h2 className="text-2xl font-semibold mb-1">Industry Insight</h2>
          <p className="text-muted-foreground">
            Visualize where your business thrives by industry and client
            segments.
          </p>
        </div>
      )}

      {/* A. Industry Performance */}
      {shouldRenderSection('industry-performance-title') && (
        <section aria-labelledby="industry-perf-title">
          <h3 id="industry-perf-title" className="text-xl font-medium mb-2">
            Industry Performance
          </h3>
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
                      <TableCell className="font-medium">
                        {industry.industry}
                      </TableCell>
                      <TableCell className="text-right">
                        {industry.clients}
                      </TableCell>
                      <TableCell className="text-right">
                        ${industry.revenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {industry.growth}%
                      </TableCell>
                      <TableCell className="text-right">
                        ${industry.avgPremium.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <p className="mt-2 text-sm text-muted-foreground">
            Highlight top verticals and growth areas:
            <Badge variant="outline" className="ml-2 mr-1">
              Technology
            </Badge>
            <Badge variant="outline">Healthcare</Badge>
          </p>
        </section>
      )}

      {/* B. Premium Benchmarks */}
      {shouldRenderSection('premium-bench-title') && (
        <section aria-labelledby="premium-bench-title">
          <h3 id="premium-bench-title" className="text-xl font-medium mb-2">
            Premium Benchmarks
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Largest Premiums/Industry
                </CardTitle>
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
      )}

      {/* C. Company Size Tiers */}
      {shouldRenderSection('company-size-tiers-title') && (
        <section aria-labelledby="company-size-title">
          <h3 id="company-size-title" className="text-xl font-medium mb-2">
            Company Size Tiers
          </h3>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Size Tier</TableHead>
                    <TableHead className="text-right">
                      Number of Clients
                    </TableHead>
                    <TableHead className="text-right">
                      Avg. Premium/Client
                    </TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companySize.map((size) => (
                    <TableRow key={size.tier}>
                      <TableCell className="font-medium">{size.tier}</TableCell>
                      <TableCell className="text-right">
                        {size.clients}
                      </TableCell>
                      <TableCell className="text-right">
                        ${size.avgPremium.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${size.totalRevenue.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Quote & Source Analytics */}
      {shouldRenderSection('quote-source-analytics-title') && (
        <section aria-labelledby="quote-source-analytics-title">
          <h3
            id="quote-source-analytics-title"
            className="text-xl font-medium mb-2"
          >
            Quote & Source Analytics
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Quotes Submitted per Vertical
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartComponent
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
                <CardTitle className="text-base">
                  Conversion % per Vertical
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartComponent
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
                <CardTitle className="text-base">
                  Source Breakdown per Industry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ChartComponent
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
                <CardTitle className="text-base">
                  Lead Source Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartComponent
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
      )}
    </div>
  );
}
