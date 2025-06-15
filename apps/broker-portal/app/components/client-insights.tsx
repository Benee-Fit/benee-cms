'use client';

import { useState } from 'react';
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
import { Button } from '@repo/design-system/components/ui/button';
import { cn } from '@repo/design-system/lib/utils';
import {
  SortableTable,
  type ColumnConfig,
} from './sortable-table/sortable-table';
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { useClientInsights, type ClientInsightData } from '../hooks/useClientInsights';

interface ClientInsightsProps {
  className?: string;
  sectionId?: string;
  editMode?: boolean;
  clientId?: string;
}

export function ClientInsights({ 
  className, 
  sectionId, 
  editMode = false,
  clientId 
}: ClientInsightsProps) {
  const [isEditMode, setIsEditMode] = useState(editMode);
  const [selectedInsight, setSelectedInsight] = useState<ClientInsightData | null>(null);
  
  // Data hooks
  const { 
    insights, 
    loading, 
    error,
    createInsight, 
    updateInsight, 
    deleteInsight,
    refetch 
  } = useClientInsights({ clientId });

  // Helper function to determine if a section should be rendered
  const shouldRenderSection = (id: string): boolean => {
    if (!sectionId) {
      return true; // If no sectionId prop, render all
    }
    return sectionId === id;
  };

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get data by category
  const getDataByCategory = (category: string) => {
    return insights.filter(insight => insight.category === category);
  };

  // Extract overview metrics
  const overviewMetrics = getDataByCategory('METRIC');
  const revenueData = getDataByCategory('REVENUE');
  const riskData = getDataByCategory('RISK');
  const opportunityData = getDataByCategory('OPPORTUNITY');

  // Aggregate overview data
  const clientOverview = {
    totalClients: overviewMetrics.find(m => m.type === 'total_clients')?.value?.count || 0,
    totalMembers: overviewMetrics.find(m => m.type === 'total_members')?.value?.count || 0,
    totalRevenue: revenueData.reduce((sum, r) => sum + (r.value?.annualRevenue || 0), 0),
    avgRevenue: revenueData.length > 0 ? revenueData.reduce((sum, r) => sum + (r.value?.annualRevenue || 0), 0) / revenueData.length : 0,
  };

  // Prepare client metrics data for table
  const clientMetricsData = overviewMetrics
    .map((metric, index) => ({
      rank: index + 1,
      clientName: metric.client?.companyName || metric.title.replace(' Metrics', ''),
      industry: metric.client?.industry || 'Unknown',
      planMembers: metric.value?.count || metric.value?.currentMembers || metric.client?.headcount || 0,
      annualRevenue: metric.client ? parseInt(metric.client.revenue || '0') || 0 : 0,
      revenuePerMember: metric.client && metric.client.headcount 
        ? Math.round((parseInt(metric.client.revenue || '0') || 0) / metric.client.headcount)
        : 0,
    }));

  // Revenue per client data
  const revenueByClientData = revenueData.map((revenue, index) => ({
    rank: index + 1,
    clientName: revenue.client?.companyName || revenue.title.replace(' Revenue', ''),
    annualRevenue: revenue.value?.annualRevenue || 0,
    monthlyRevenue: revenue.value?.monthlyRevenue || 0,
    premium: revenue.value?.premium || 0,
    managementFeePercent: `${revenue.value?.managementFeePercent || 0}%`,
  }));

  // Risk and opportunity data
  const riskOpportunityData = [...riskData, ...opportunityData].map((item, index) => ({
    rank: index + 1,
    clientName: item.client?.companyName || item.title.replace(/ (Risk Profile|Opportunities)/, ''),
    category: item.category,
    riskScore: item.value?.riskScore || 0,
    riskLevel: item.value?.riskLevel || 'Low',
    opportunityValue: item.value?.opportunityValue || 0,
    opportunityType: item.value?.opportunityType || 'N/A',
  }));

  // Growth chart data - mock for now, would come from time series
  const clientGrowthData = [
    { month: 'Jan', currentYear: 35, lastYear: 28 },
    { month: 'Feb', currentYear: 36, lastYear: 29 },
    { month: 'Mar', currentYear: 38, lastYear: 31 },
    { month: 'Apr', currentYear: 41, lastYear: 33 },
    { month: 'May', currentYear: 43, lastYear: 35 },
    { month: 'Jun', currentYear: 43, lastYear: 37 },
  ];

  // Handler for updating insights from inline editing
  const handleUpdateInsight = async (item: any, newValue: any) => {
    try {
      // Find the corresponding insight to update
      const insight = insights.find(i => 
        i.client?.companyName === item.clientName ||
        i.title.includes(item.clientName.replace(' Revenue', '').replace(' Metrics', '').replace(' Risk Profile', '').replace(' Opportunities', ''))
      );
      
      if (insight) {
        await updateInsight(insight.id, {
          title: insight.title,
          description: insight.description || null,
          value: { ...insight.value, [Object.keys(item).find(key => item[key] === newValue) || 'updated']: newValue },
          category: insight.category,
          type: insight.type,
          period: insight.period || null,
        });
      }
    } catch (error) {
      console.error('Failed to update insight:', error);
    }
  };

  // Column configurations
  const clientMetricsColumns: ColumnConfig<(typeof clientMetricsData)[0]>[] = [
    { key: 'rank' as const, header: 'Rank', type: 'number' as const },
    { key: 'clientName' as const, header: 'Client Name', type: 'string' as const, editable: true, onUpdate: handleUpdateInsight },
    { key: 'industry' as const, header: 'Industry', type: 'string' as const, editable: true, onUpdate: handleUpdateInsight },
    { key: 'planMembers' as const, header: 'Plan Members', type: 'number' as const, editable: true, onUpdate: handleUpdateInsight },
    { key: 'annualRevenue' as const, header: 'Annual Revenue', type: 'currency' as const, editable: true, onUpdate: handleUpdateInsight },
    { key: 'revenuePerMember' as const, header: 'Revenue/Member', type: 'currency' as const, editable: true, onUpdate: handleUpdateInsight },
  ];

  const revenueColumns: ColumnConfig<(typeof revenueByClientData)[0]>[] = [
    { key: 'rank' as const, header: 'Rank', type: 'number' as const },
    { key: 'clientName' as const, header: 'Client Name', type: 'string' as const, editable: true, onUpdate: handleUpdateInsight },
    { key: 'annualRevenue' as const, header: 'Annual Revenue', type: 'currency' as const, editable: true, onUpdate: handleUpdateInsight },
    { key: 'monthlyRevenue' as const, header: 'Monthly Revenue', type: 'currency' as const, editable: true, onUpdate: handleUpdateInsight },
    { key: 'premium' as const, header: 'Premium', type: 'currency' as const, editable: true, onUpdate: handleUpdateInsight },
    { key: 'managementFeePercent' as const, header: 'Management Fee %', type: 'string' as const, editable: true, onUpdate: handleUpdateInsight },
  ];

  const riskOpportunityColumns: ColumnConfig<(typeof riskOpportunityData)[0]>[] = [
    { key: 'rank' as const, header: 'Rank', type: 'number' as const },
    { key: 'clientName' as const, header: 'Client Name', type: 'string' as const, editable: true, onUpdate: handleUpdateInsight },
    { key: 'category' as const, header: 'Category', type: 'string' as const },
    { key: 'riskScore' as const, header: 'Risk Score', type: 'number' as const, editable: true, onUpdate: handleUpdateInsight },
    { key: 'riskLevel' as const, header: 'Risk Level', type: 'string' as const, editable: true, onUpdate: handleUpdateInsight },
    { key: 'opportunityValue' as const, header: 'Opportunity Value', type: 'currency' as const, editable: true, onUpdate: handleUpdateInsight },
    { key: 'opportunityType' as const, header: 'Opportunity Type', type: 'string' as const, editable: true, onUpdate: handleUpdateInsight },
  ];

  // Loading state
  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading client insights...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('space-y-6', className)}>
        <Card className="border-red-200">
          <CardContent className="p-6">
            <p className="text-red-600">Error loading client insights: {error}</p>
            <Button onClick={refetch} className="mt-4" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAddInsight = async (category: 'METRIC' | 'REVENUE' | 'RISK' | 'OPPORTUNITY') => {
    // Use a default clientId if none provided - we'll get this from our seeded data
    const defaultClientId = 'cmbvdcgi200070l0r399v9p9m'; // First client from our seed data
    
    const newInsight = {
      clientId: clientId || defaultClientId,
      category,
      type: 'custom',
      title: `New ${category.toLowerCase()} insight`,
      value: { count: 0 },
      period: '2024-Q4',
    };
    
    try {
      await createInsight(newInsight);
    } catch (err) {
      console.error('Error creating insight:', err);
    }
  };

  const handleEditInsight = async (insight: ClientInsightData, newValue: any) => {
    try {
      await updateInsight(insight.id, { value: newValue });
    } catch (err) {
      console.error('Error updating insight:', err);
    }
  };

  const handleDeleteInsight = async (insightId: string) => {
    if (confirm('Are you sure you want to delete this insight?')) {
      try {
        await deleteInsight(insightId);
      } catch (err) {
        console.error('Error deleting insight:', err);
      }
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Edit Mode Toggle */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Client Insights</h2>
          <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
            {insights.length} Records • Live Data
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            <Edit className="h-4 w-4 mr-2" />
            {isEditMode ? 'Exit Edit' : 'Edit Mode'}
          </Button>
        </div>
      </div>

      {/* Client Metrics Overview */}
      {shouldRenderSection('client-metrics-overview-title') && (
        <section aria-labelledby="client-metrics-overview-title">
          <div className="flex justify-between items-center mb-4">
            <h3 id="client-metrics-overview-title" className="text-xl font-medium">
              Client Metrics Overview
            </h3>
            {isEditMode && (
              <Button size="sm" variant="outline" onClick={() => handleAddInsight('METRIC')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Metric
              </Button>
            )}
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                  {isEditMode && (
                    <Button size="sm" variant="ghost">
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{clientOverview.totalClients}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                  {isEditMode && (
                    <Button size="sm" variant="ghost">
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{clientOverview.totalMembers.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  {isEditMode && (
                    <Button size="sm" variant="ghost">
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(clientOverview.totalRevenue)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Revenue</CardTitle>
                  {isEditMode && (
                    <Button size="sm" variant="ghost">
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(clientOverview.avgRevenue)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Client Growth Chart */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Member Growth Over Time</CardTitle>
                  {isEditMode && (
                    <Button size="sm" variant="ghost">
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  className="h-[300px] w-full"
                  config={{
                    currentYear: { label: 'Current Year', color: '#2563eb' },
                    lastYear: { label: 'Last Year', color: '#60a5fa' },
                  }}
                >
                  <LineChart data={clientGrowthData} width={800} height={300} margin={{ top: 10, right: 30, bottom: 30, left: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" className="text-xs text-muted-foreground" />
                    <YAxis className="text-xs text-muted-foreground" />
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
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line type="monotone" dataKey="currentYear" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} />
                    <Line type="monotone" dataKey="lastYear" stroke="#60a5fa" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4, fill: '#60a5fa' }} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Client Metrics Table */}
            {clientMetricsData.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">Client Metrics Details</CardTitle>
                    {isEditMode && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleAddInsight('METRIC')}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Client
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <SortableTable
                    data={clientMetricsData}
                    columns={clientMetricsColumns}
                    defaultSortKey="annualRevenue"
                    defaultSortDirection="desc"
                    isEditMode={isEditMode}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Revenue Per Client */}
      {shouldRenderSection('revenue-per-client-title') && (
        <section aria-labelledby="revenue-per-client-title">
          <div className="flex justify-between items-center mb-4">
            <h3 id="revenue-per-client-title" className="text-xl font-medium">
              Revenue Per Client
            </h3>
            {isEditMode && (
              <Button size="sm" variant="outline" onClick={() => handleAddInsight('REVENUE')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Revenue Data
              </Button>
            )}
          </div>

          {revenueByClientData.length > 0 ? (
            <Card>
              <CardContent className="p-6">
                <SortableTable
                  data={revenueByClientData}
                  columns={revenueColumns}
                  defaultSortKey="annualRevenue"
                  defaultSortDirection="desc"
                  isEditMode={isEditMode}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No revenue data available</p>
                {isEditMode && (
                  <Button className="mt-4" onClick={() => handleAddInsight('REVENUE')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Revenue Data
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* Risk and Opportunity */}
      {shouldRenderSection('risk-and-opportunity-title') && (
        <section aria-labelledby="risk-and-opportunity-title">
          <div className="flex justify-between items-center mb-4">
            <h3 id="risk-and-opportunity-title" className="text-xl font-medium">
              Risk and Opportunity
            </h3>
            {isEditMode && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleAddInsight('RISK')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Risk
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleAddInsight('OPPORTUNITY')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Opportunity
                </Button>
              </div>
            )}
          </div>

          {riskOpportunityData.length > 0 ? (
            <Card>
              <CardContent className="p-6">
                <SortableTable
                  data={riskOpportunityData}
                  columns={riskOpportunityColumns}
                  defaultSortKey="riskScore"
                  defaultSortDirection="desc"
                  isEditMode={isEditMode}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No risk or opportunity data available</p>
                {isEditMode && (
                  <div className="flex gap-2 justify-center mt-4">
                    <Button onClick={() => handleAddInsight('RISK')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Risk Assessment
                    </Button>
                    <Button onClick={() => handleAddInsight('OPPORTUNITY')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Opportunity
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </section>
      )}
    </div>
  );
}
