'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/design-system/components/ui/dialog';
import { cn } from '@repo/design-system/lib/utils';
import {
  SortableTable,
  type ColumnConfig,
} from './sortable-table/sortable-table';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const bluePaletteConst = [
  '#0D47A1',
  '#1976D2',
  '#2196F3',
  '#64B5F6',
  '#90CAF9',
  '#BBDEFB',
];

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
    // Handle multiple datasets for bar charts
    if (data.datasets.length > 1) {
      const multiDataProcessed = data.labels.map((label, index) => {
        const item: Record<string, string | number> = { name: label };
        data.datasets.forEach((dataset, dsIndex) => {
          item[`dataset${dsIndex}`] = dataset.data[index];
        });
        return item;
      });

      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={multiDataProcessed}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs text-muted-foreground" />
            <YAxis className="text-xs text-muted-foreground" />
            <Tooltip />
            {(options?.plugins?.legend?.display ?? true) && <Legend />}
            {data.datasets.map((dataset, index) => (
              <Bar
                key={index}
                dataKey={`dataset${index}`}
                name={dataset.label}
                fill={
                  Array.isArray(dataset.backgroundColor)
                    ? dataset.backgroundColor[0]
                    : dataset.backgroundColor || bluePaletteConst[index]
                }
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // Single dataset bar chart
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
          {(options?.plugins?.legend?.display ?? true) && (
            <Legend {...legendProps()} />
          )}
          <Bar
            dataKey="value"
            name={data.datasets[0].label || "Leads"}
            fill={
              Array.isArray(data.datasets[0].backgroundColor)
                ? undefined
                : (data.datasets[0].backgroundColor as string) ||
                  'hsl(var(--primary) / 0.7)'
            }
          >
            {Array.isArray(data.datasets[0].backgroundColor) &&
              chartDataProcessed.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    (data.datasets[0].backgroundColor as string[])[
                      index %
                        (data.datasets[0].backgroundColor as string[]).length
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
    // Calculate total for percentage calculation
    const total = chartDataProcessed.reduce((sum, entry) => sum + entry.value, 0);
    
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
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0];
                const value = typeof data.value === 'number' ? data.value : 0;
                const percentage = ((value / total) * 100).toFixed(1);
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        {data.name}
                      </span>
                      <span className="font-bold text-muted-foreground">
                        {value} leads
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {percentage}% of total
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          {(options?.plugins?.legend?.display ?? true) &&
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

interface Client {
  id: string;
  name: string;
  companySize: number;
  industry: string;
}

interface SizeTierClients {
  [key: string]: Client[];
}

export function IndustryInsight({
  className,
  sectionId,
}: IndustryInsightProps) {
  const [selectedSizeTier, setSelectedSizeTier] = useState<string | null>(null);
  const [isSizeTierModalOpen, setIsSizeTierModalOpen] = useState(false);

  const shouldRenderSection = (id: string) => {
    return !sectionId || sectionId === id;
  };

  // Mock client data for size tier drilldown
  const sizeTierClients: SizeTierClients = {
    'Small (1-49)': [
      { id: 'C-001', name: 'Acme Consulting', companySize: 25, industry: 'Professional Services' },
      { id: 'C-002', name: 'TechStart Solutions', companySize: 12, industry: 'Technology' },
      { id: 'C-003', name: 'Green Valley Dental', companySize: 8, industry: 'Healthcare' },
      { id: 'C-004', name: 'Artisan Bakery Co.', companySize: 35, industry: 'Retail' },
      { id: 'C-005', name: 'Mountain View Law', companySize: 18, industry: 'Professional Services' },
      { id: 'C-006', name: 'Digital Dreams Agency', companySize: 22, industry: 'Technology' },
      { id: 'C-007', name: 'Riverside Clinic', companySize: 15, industry: 'Healthcare' },
      { id: 'C-008', name: 'Custom Furniture Works', companySize: 30, industry: 'Manufacturing' },
      { id: 'C-009', name: 'City Center Pharmacy', companySize: 6, industry: 'Healthcare' },
      { id: 'C-010', name: 'Swift Delivery Co.', companySize: 45, industry: 'Transportation' },
      { id: 'C-011', name: 'Elite Personal Training', companySize: 9, industry: 'Fitness' },
      { id: 'C-012', name: 'Sunset Marketing Group', companySize: 28, industry: 'Professional Services' },
      { id: 'C-013', name: 'Precision Auto Repair', companySize: 12, industry: 'Automotive' },
      { id: 'C-014', name: 'Fresh Start Catering', companySize: 16, industry: 'Food Services' },
      { id: 'C-015', name: 'Metro Pet Clinic', companySize: 11, industry: 'Healthcare' },
      { id: 'C-016', name: 'Innovative Web Design', companySize: 19, industry: 'Technology' },
      { id: 'C-017', name: 'Heritage Real Estate', companySize: 24, industry: 'Real Estate' },
      { id: 'C-018', name: 'Coastal Insurance Agency', companySize: 14, industry: 'Financial Services' },
    ],
    'Medium (50-199)': [
      { id: 'C-019', name: 'Regional Medical Center', companySize: 125, industry: 'Healthcare' },
      { id: 'C-020', name: 'BlueTech Manufacturing', companySize: 89, industry: 'Manufacturing' },
      { id: 'C-021', name: 'Metro School District', companySize: 156, industry: 'Education' },
      { id: 'C-022', name: 'Quantum Software Solutions', companySize: 67, industry: 'Technology' },
      { id: 'C-023', name: 'Central Bank & Trust', companySize: 98, industry: 'Financial Services' },
      { id: 'C-024', name: 'Premier Engineering Group', companySize: 78, industry: 'Professional Services' },
      { id: 'C-025', name: 'Pacific Coast Logistics', companySize: 145, industry: 'Transportation' },
      { id: 'C-026', name: 'Advanced Materials Corp', companySize: 112, industry: 'Manufacturing' },
      { id: 'C-027', name: 'Citywide Construction', companySize: 134, industry: 'Construction' },
      { id: 'C-028', name: 'Summit Healthcare Network', companySize: 87, industry: 'Healthcare' },
      { id: 'C-029', name: 'DataFlow Technologies', companySize: 92, industry: 'Technology' },
      { id: 'C-030', name: 'Gateway Insurance Group', companySize: 76, industry: 'Financial Services' },
      { id: 'C-031', name: 'Riverside Manufacturing', companySize: 158, industry: 'Manufacturing' },
      { id: 'C-032', name: 'Elite Consulting Partners', companySize: 103, industry: 'Professional Services' },
      { id: 'C-033', name: 'Northern Telecom Inc.', companySize: 119, industry: 'Technology' },
      { id: 'C-034', name: 'Meridian Hospitality Group', companySize: 167, industry: 'Hospitality' },
    ],
    'Large (200+)': [
      { id: 'C-035', name: 'Global Tech Industries', companySize: 450, industry: 'Technology' },
      { id: 'C-036', name: 'Metropolitan Hospital System', companySize: 890, industry: 'Healthcare' },
      { id: 'C-037', name: 'United Manufacturing Corp', companySize: 320, industry: 'Manufacturing' },
      { id: 'C-038', name: 'State University System', companySize: 1250, industry: 'Education' },
      { id: 'C-039', name: 'National Financial Services', companySize: 675, industry: 'Financial Services' },
      { id: 'C-040', name: 'Continental Airlines Group', companySize: 2100, industry: 'Transportation' },
      { id: 'C-041', name: 'Premier Healthcare Network', companySize: 567, industry: 'Healthcare' },
      { id: 'C-042', name: 'Advanced Technologies Inc.', companySize: 298, industry: 'Technology' },
      { id: 'C-043', name: 'Mega Retail Corporation', companySize: 1890, industry: 'Retail' },
    ],
  };

  const handleSizeTierClick = (tier: string) => {
    setSelectedSizeTier(tier);
    setIsSizeTierModalOpen(true);
  };

  const handleCloseSizeTierModal = () => {
    setIsSizeTierModalOpen(false);
    setSelectedSizeTier(null);
  };

  // Column configuration for sortable industry performance table
  const industryColumns: ColumnConfig<(typeof industryPerformance)[0]>[] = [
    {
      key: 'industry',
      header: 'Industry',
      type: 'string',
      align: 'left',
    },
    {
      key: 'clients',
      header: 'Clients',
      type: 'number',
      align: 'right',
    },
    {
      key: 'revenue',
      header: 'Revenue',
      type: 'currency',
      align: 'right',
    },
    {
      key: 'growth',
      header: 'YoY Growth',
      type: 'number',
      align: 'right',
      render: (value) => `${value}%`,
    },
    {
      key: 'avgPremium',
      header: 'Avg. Premium',
      type: 'currency',
      align: 'right',
    },
  ];

  // Column configuration for sortable company size tiers table
  const companySizeColumns: ColumnConfig<(typeof companySize)[0]>[] = [
    {
      key: 'tier',
      header: 'Size Tier',
      type: 'string',
      align: 'left',
    },
    {
      key: 'clients',
      header: 'Number of Clients',
      type: 'number',
      align: 'right',
    },
    {
      key: 'percentOfBusiness',
      header: '% of Business',
      type: 'number',
      align: 'right',
      render: (value) => `${value}%`,
    },
    {
      key: 'planMembers',
      header: '# of Plan Members',
      type: 'number',
      align: 'right',
    },
    {
      key: 'avgPremium',
      header: 'Avg. Premium/Client',
      type: 'currency',
      align: 'right',
    },
    {
      key: 'totalRevenue',
      header: 'Total Revenue',
      type: 'currency',
      align: 'right',
    },
  ];

  // Column configuration for client drilldown table
  const clientColumns: ColumnConfig<Client>[] = [
    {
      key: 'name',
      header: 'Client Name',
      type: 'string',
      align: 'left',
    },
    {
      key: 'companySize',
      header: 'Company Size',
      type: 'number',
      align: 'right',
      render: (value) => `${value} employees`,
    },
    {
      key: 'industry',
      header: 'Industry',
      type: 'string',
      align: 'left',
    },
  ];

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
      percentOfBusiness: 41.5,
      planMembers: 450,
    },
    {
      tier: 'Medium (50-199)',
      clients: 16,
      avgPremium: 28400,
      totalRevenue: 454400,
      percentOfBusiness: 37.2,
      planMembers: 1850,
    },
    {
      tier: 'Large (200+)',
      clients: 9,
      avgPremium: 34500,
      totalRevenue: 310500,
      percentOfBusiness: 21.3,
      planMembers: 3200,
    },
  ];

  const quoteChartData: ChartData = {
    labels: industryPerformance.map((item) => item.industry),
    datasets: [
      {
        label: 'Quotes Submitted',
        data: [48, 37, 29, 22, 19, 14, 8],
        backgroundColor: [
          '#0D47A1',
          '#1565C0',
          '#1976D2',
          '#1E88E5',
          '#2196F3',
          '#42A5F5',
          '#64B5F6',
        ], // extendedBluePalette (7 needed)
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
        backgroundColor: [
          '#0D47A1',
          '#1565C0',
          '#1976D2',
          '#1E88E5',
          '#2196F3',
          '#42A5F5',
          '#64B5F6',
        ], // extendedBluePalette (7 needed)
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
    labels: [
      'Paid Advertising',
      'Organic & Inbound Marketing',
      'Outbound & Direct Outreach',
      'Referrals & Partnerships',
      'Authority Building',
      'Events & Workshops'
    ],
    datasets: [
      {
        label: 'Conversion Rate (%)',
        data: [42, 58, 35, 72, 28, 51],
        backgroundColor: bluePaletteConst[0],
        borderColor: 'hsl(var(--primary))',
        borderWidth: 1,
      },
      {
        label: 'Avg. Client Value ($K)',
        data: [22.5, 31.2, 24.8, 35.6, 18.9, 27.3],
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
          <SortableTable
            data={industryPerformance}
            columns={industryColumns}
            defaultSortKey="revenue"
            defaultSortDirection="desc"
          />
        </section>
      )}

      {/* B. Premium Benchmarks - COMMENTED OUT FOR FUTURE RESTORATION */}
      {/* 
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
      */}

      {/* C. Company Size Tiers */}
      {shouldRenderSection('company-size-tiers-title') && (
        <section aria-labelledby="company-size-title">
          <h3 id="company-size-title" className="text-xl font-medium mb-2">
            Company Size Tiers
          </h3>
          <SortableTable
            data={companySize}
            columns={companySizeColumns}
            defaultSortKey="totalRevenue"
            defaultSortDirection="desc"
            onRowClick={(sizeData) => handleSizeTierClick(sizeData.tier)}
          />
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
                  Lead Source
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

      {/* Size Tier Clients Modal */}
      <Dialog open={isSizeTierModalOpen} onOpenChange={handleCloseSizeTierModal}>
        <DialogContent
          className="!max-w-[80vw] !w-[80vw] max-h-[80vh] overflow-hidden flex flex-col"
          style={{ maxWidth: '80vw', width: '80vw' }}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {selectedSizeTier ? `${selectedSizeTier} Clients` : 'Clients'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto space-y-6">
            {selectedSizeTier && sizeTierClients[selectedSizeTier] && (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Clients
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="text-2xl font-bold">
                        {sizeTierClients[selectedSizeTier].length}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Avg Company Size
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="text-2xl font-bold">
                        {Math.round(
                          sizeTierClients[selectedSizeTier].reduce(
                            (sum, client) => sum + client.companySize,
                            0
                          ) / sizeTierClients[selectedSizeTier].length
                        )} employees
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Top Industry
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="text-lg font-bold">
                        {(() => {
                          const industries = sizeTierClients[selectedSizeTier].map(c => c.industry);
                          const counts = industries.reduce((acc, industry) => {
                            acc[industry] = (acc[industry] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>);
                          return Object.entries(counts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Clients Table */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Client List</h3>
                  <SortableTable
                    data={sizeTierClients[selectedSizeTier]}
                    columns={clientColumns}
                    defaultSortKey="companySize"
                    defaultSortDirection="desc"
                  />
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
