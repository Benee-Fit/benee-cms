'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
} from '@repo/design-system/components/ui/chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/design-system/components/ui/table';
import { cn } from '@repo/design-system/lib/utils';
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface ClientInsightsProps {
  className?: string;
  sectionId?: string;
}

export function ClientInsights({ className, sectionId }: ClientInsightsProps) {
  // Mock data
  const clientOverview = {
    totalClients: 43,
    totalPlanMembers: 4782,
    avgGroupSize: 111,
  };

  // Client Growth YOY data
  const clientGrowthData = [
    { month: 'Jan', currentYear: 35, lastYear: 28 },
    { month: 'Feb', currentYear: 36, lastYear: 29 },
    { month: 'Mar', currentYear: 37, lastYear: 30 },
    { month: 'Apr', currentYear: 38, lastYear: 31 },
    { month: 'May', currentYear: 39, lastYear: 32 },
    { month: 'Jun', currentYear: 40, lastYear: 33 },
    { month: 'Jul', currentYear: 41, lastYear: 34 },
    { month: 'Aug', currentYear: 41, lastYear: 35 },
    { month: 'Sep', currentYear: 42, lastYear: 36 },
    { month: 'Oct', currentYear: 43, lastYear: 37 },
    { month: 'Nov', currentYear: 43, lastYear: 37 },
    { month: 'Dec', currentYear: 43, lastYear: 38 },
  ];

  // Helper function to determine if a section should be rendered
  const shouldRenderSection = (id: string): boolean => {
    if (!sectionId) {
      return true; // If no sectionId prop, render all
    }
    return sectionId === id;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Client Metrics Overview */}
      {shouldRenderSection('client-metrics-overview-title') && (
        <section aria-labelledby="client-metrics-overview-title">
          <h3
            id="client-metrics-overview-title"
            className="text-xl font-medium mb-2"
          >
            Client Metrics Overview
          </h3>

          {/* Client Overview */}
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <CardTitle className="text-base">
                    Total Plan Members
                  </CardTitle>
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
            </div>

            {/* Client Growth YOY Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Client Growth YOY</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  className="h-[300px] w-full"
                  config={{
                    currentYear: {
                      label: 'Current Year',
                      color: '#2563eb',
                    },
                    lastYear: {
                      label: 'Last Year',
                      color: '#60a5fa',
                    },
                  }}
                >
                  <LineChart
                    data={clientGrowthData}
                    width={800}
                    height={300}
                    margin={{ top: 10, right: 30, bottom: 30, left: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      className="text-xs text-muted-foreground" 
                    />
                    <YAxis 
                      className="text-xs text-muted-foreground" 
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  {payload[0].payload.month}
                                </span>
                                <div className="flex flex-col gap-1">
                                  <span className="text-xs">
                                    <span className="font-medium">Current Year:</span> {payload[0].payload.currentYear} clients
                                  </span>
                                  <span className="text-xs">
                                    <span className="font-medium">Last Year:</span> {payload[0].payload.lastYear} clients
                                  </span>
                                  <span className="text-xs text-green-600">
                                    +{((payload[0].payload.currentYear - payload[0].payload.lastYear) / payload[0].payload.lastYear * 100).toFixed(0)}% growth
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="currentYear" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#2563eb' }}
                      name="Current Year"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="lastYear" 
                      stroke="#60a5fa" 
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ r: 4, fill: '#60a5fa' }}
                      name="Last Year"
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Revenue Per Client */}
      {shouldRenderSection('revenue-per-client-title') && (
        <section aria-labelledby="revenue-per-client-title">
          <h3
            id="revenue-per-client-title"
            className="text-xl font-medium mb-2"
          >
            Revenue Per Client
          </h3>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Avg Plan Member Premium
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">$485</p>
                <p className="text-xs text-muted-foreground">
                  Per member per month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Avg Plan Member Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">$58</p>
                <p className="text-xs text-muted-foreground">
                  Per member per month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Avg Plan Management Fee %
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">12.0%</p>
                <p className="text-xs text-muted-foreground">
                  Of total premium
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Clients by Revenue */}
          <div>
            <h4 className="text-lg font-medium mb-3">Top Clients by Revenue</h4>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Rank</TableHead>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead className="text-right">Plan Members</TableHead>
                      <TableHead className="text-right">Annual Revenue</TableHead>
                      <TableHead className="text-right">Revenue per Member</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">1</TableCell>
                      <TableCell className="font-medium">TechCorp Solutions</TableCell>
                      <TableCell>Technology</TableCell>
                      <TableCell className="text-right">380</TableCell>
                      <TableCell className="text-right font-semibold">$89,500</TableCell>
                      <TableCell className="text-right">$236</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">2</TableCell>
                      <TableCell className="font-medium">Global Manufacturing</TableCell>
                      <TableCell>Manufacturing</TableCell>
                      <TableCell className="text-right">315</TableCell>
                      <TableCell className="text-right font-semibold">$76,200</TableCell>
                      <TableCell className="text-right">$242</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">3</TableCell>
                      <TableCell className="font-medium">HealthCare Partners</TableCell>
                      <TableCell>Healthcare</TableCell>
                      <TableCell className="text-right">285</TableCell>
                      <TableCell className="text-right font-semibold">$68,900</TableCell>
                      <TableCell className="text-right">$242</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">4</TableCell>
                      <TableCell className="font-medium">Financial Services Co.</TableCell>
                      <TableCell>Financial Services</TableCell>
                      <TableCell className="text-right">270</TableCell>
                      <TableCell className="text-right font-semibold">$65,400</TableCell>
                      <TableCell className="text-right">$242</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">5</TableCell>
                      <TableCell className="font-medium">Digital Innovations</TableCell>
                      <TableCell>Technology</TableCell>
                      <TableCell className="text-right">243</TableCell>
                      <TableCell className="text-right font-semibold">$58,750</TableCell>
                      <TableCell className="text-right">$242</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">6</TableCell>
                      <TableCell className="font-medium">Educational Institute</TableCell>
                      <TableCell>Education</TableCell>
                      <TableCell className="text-right">216</TableCell>
                      <TableCell className="text-right font-semibold">$52,300</TableCell>
                      <TableCell className="text-right">$242</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Risk and Opportunity */}
      {shouldRenderSection('risk-and-opportunity-title') && (
        <section aria-labelledby="risk-and-opportunity-title">
          <h3
            id="risk-and-opportunity-title"
            className="text-xl font-medium mb-2"
          >
            Risk and Opportunity
          </h3>

          <div className="grid gap-6">
            {/* High Risk Clients */}
            <div>
              <h4 className="text-lg font-medium mb-3 text-red-600">
                High Risk Clients
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-red-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-red-700">
                      GlobalTech Inc.
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-red-600 font-medium">
                      Loss Ratio: 92%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      285 members • $67,500 revenue
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                      Renewal in 45 days
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-red-700">
                      Manufacturing Plus
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-red-600 font-medium">
                      Loss Ratio: 88%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      150 members • $42,800 revenue
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                      Claims trending up
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Growth Opportunities */}
            <div>
              <h4 className="text-lg font-medium mb-3 text-green-600">
                Growth Opportunities
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-green-700">
                      Digital Innovations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-green-600 font-medium">
                      Expanding by 40%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Current: 220 members
                    </p>
                    <p className="text-xs text-green-500 mt-1">
                      +$28K potential revenue
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-green-700">
                      HealthTech Solutions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-green-600 font-medium">
                      Wellness program interest
                    </p>
                    <p className="text-xs text-muted-foreground">185 members</p>
                    <p className="text-xs text-green-500 mt-1">
                      Additional products potential
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-green-700">
                      Finance Corp
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-green-600 font-medium">
                      Referral opportunity
                    </p>
                    <p className="text-xs text-muted-foreground">250 members</p>
                    <p className="text-xs text-green-500 mt-1">
                      Sister company interested
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Risk Summary */}
            <div>
              <h4 className="text-lg font-medium mb-3">Risk Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">At-Risk Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-red-600">$184K</p>
                    <p className="text-xs text-muted-foreground">
                      3 clients (7% of book)
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Growth Potential
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">$156K</p>
                    <p className="text-xs text-muted-foreground">
                      5 opportunities identified
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Action Required</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-orange-600">8</p>
                    <p className="text-xs text-muted-foreground">
                      Clients need attention
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Stable Clients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-600">32</p>
                    <p className="text-xs text-muted-foreground">
                      74% of client base
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      )}

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
