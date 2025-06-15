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
import { useClientInsightsAggregate, useOverviewData, useRevenueData, useRiskData } from '../hooks/useClientInsightsAggregate';
import { useClientInsights, ClientInsightData } from '../hooks/useClientInsights';
import { AddInsightModal } from './modals/add-insight-modal';
import { EditInsightModal } from './modals/edit-insight-modal';

interface ClientInsightsEnhancedProps {
  className?: string;
  sectionId?: string;
  editMode?: boolean;
  clientId?: string;
}

export function ClientInsightsEnhanced({ 
  className, 
  sectionId, 
  editMode = false,
  clientId 
}: ClientInsightsEnhancedProps) {
  const [isEditMode, setIsEditMode] = useState(editMode);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<ClientInsightData | null>(null);
  const [addModalCategory, setAddModalCategory] = useState<'METRIC' | 'REVENUE' | 'RISK' | 'OPPORTUNITY'>('METRIC');
  
  // Data hooks
  const { data: overviewData, loading: overviewLoading, error: overviewError, refetch: refetchOverview } = useOverviewData(clientId);
  const { data: revenueData, loading: revenueLoading, error: revenueError, refetch: refetchRevenue } = useRevenueData(clientId);
  const { data: riskData, loading: riskLoading, error: riskError, refetch: refetchRisk } = useRiskData(clientId);
  
  const { 
    insights, 
    loading: insightsLoading, 
    createInsight, 
    updateInsight, 
    deleteInsight,
    refetch: refetchInsights 
  } = useClientInsights({ clientId });

  // Mock clients data - in a real app, this would come from an API
  const mockClients = [
    { id: 'client-1', companyName: 'TechCorp Solutions' },
    { id: 'client-2', companyName: 'Global Manufacturing' },
    { id: 'client-3', companyName: 'HealthCare Partners' },
    { id: 'client-4', companyName: 'Financial Services Co.' },
    { id: 'client-5', companyName: 'Digital Innovations' },
  ];

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

  // Loading state
  if (overviewLoading || revenueLoading || riskLoading) {
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
  if (overviewError || revenueError || riskError) {
    return (
      <div className={cn('space-y-6', className)}>
        <Card className="border-red-200">
          <CardContent className="p-6">
            <p className="text-red-600">
              Error loading client insights: {overviewError || revenueError || riskError}
            </p>
            <Button 
              onClick={() => {
                refetchOverview();
                refetchRevenue();
                refetchRisk();
              }}
              className="mt-4"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare data with fallbacks to mock data for demo
  const clientOverview = overviewData?.overview || {
    totalClients: 43,
    totalRevenue: 2450000,
    totalPremium: 18900000,
    avgRevenue: 57000,
    avgPremium: 439500,
  };

  const topClientsData = revenueData?.revenue?.topClients?.map((client, index) => ({
    rank: index + 1,
    clientName: client.companyName,
    industry: 'Technology', // This would come from client data
    planMembers: client.headcount,
    annualRevenue: Number(client.revenue),
    revenuePerMember: Math.round(Number(client.revenue) / client.headcount),
  })) || [
    {
      rank: 1,
      clientName: 'TechCorp Solutions',
      industry: 'Technology',
      planMembers: 380,
      annualRevenue: 89500,
      revenuePerMember: 236,
    },
    // ... other mock data
  ];

  // Column configuration for top clients sortable table
  const topClientsColumns: ColumnConfig<(typeof topClientsData)[0]>[] = [
    {
      key: 'rank',
      header: 'Rank',
      type: 'number',
      align: 'left',
    },
    {
      key: 'clientName',
      header: 'Client Name',
      type: 'string',
      align: 'left',
    },
    {
      key: 'industry',
      header: 'Industry',
      type: 'string',
      align: 'left',
    },
    {
      key: 'planMembers',
      header: 'Plan Members',
      type: 'number',
      align: 'right',
    },
    {
      key: 'annualRevenue',
      header: 'Annual Revenue',
      type: 'currency',
      align: 'right',
    },
    {
      key: 'revenuePerMember',
      header: 'Revenue per Member',
      type: 'currency',
      align: 'right',
    },
  ];

  // Growth chart data from API or fallback
  const clientGrowthData = overviewData?.growth?.chartData?.map(point => ({
    month: point.month.substring(5), // Extract month from YYYY-MM
    currentYear: point.revenue / 1000, // Convert to thousands
    lastYear: point.revenue * 0.85 / 1000, // Mock last year data
  })) || [
    { month: 'Jan', currentYear: 35, lastYear: 28 },
    { month: 'Feb', currentYear: 36, lastYear: 29 },
    // ... other mock data
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Edit Mode Toggle */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Client Insights</h2>
          {overviewData && (
            <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
              Live Data
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchOverview();
              refetchRevenue();
              refetchRisk();
              refetchInsights();
            }}
          >
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
            <h3
              id="client-metrics-overview-title"
              className="text-xl font-medium"
            >
              Client Metrics Overview
            </h3>
            {isEditMode && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setAddModalCategory('METRIC');
                  setShowAddModal(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Metric
              </Button>
            )}
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <EditableMetricCard
                title="Total Clients"
                value={clientOverview.totalClients}
                editable={isEditMode}
                onEdit={() => {
                  // Find the corresponding insight and edit it
                  const insight = insights.find(i => i.type === 'total_clients');
                  if (insight) {
                    setSelectedInsight(insight);
                    setShowEditModal(true);
                  }
                }}
              />

              <EditableMetricCard
                title="Total Revenue"
                value={formatCurrency(clientOverview.totalRevenue)}
                editable={isEditMode}
                onEdit={(value) => console.log('Edit total revenue:', value)}
              />

              <EditableMetricCard
                title="Average Revenue"
                value={formatCurrency(clientOverview.avgRevenue)}
                editable={isEditMode}
                onEdit={(value) => console.log('Edit average revenue:', value)}
              />
            </div>

            {/* Client Growth YOY Chart */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Client Growth YOY</CardTitle>
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
          <div className="flex justify-between items-center mb-4">
            <h3
              id="revenue-per-client-title"
              className="text-xl font-medium"
            >
              Revenue Per Client
            </h3>
            {isEditMode && (
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Revenue Metric
              </Button>
            )}
          </div>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <EditableMetricCard
              title="Avg Plan Member Premium"
              value="$485"
              description="Per member per month"
              editable={isEditMode}
              onEdit={(value) => console.log('Edit premium:', value)}
            />

            <EditableMetricCard
              title="Avg Plan Member Revenue"
              value="$58"
              description="Per member per month"
              editable={isEditMode}
              onEdit={(value) => console.log('Edit member revenue:', value)}
            />

            <EditableMetricCard
              title="Avg Plan Management Fee %"
              value="12.0%"
              description="Of total premium"
              editable={isEditMode}
              onEdit={(value) => console.log('Edit management fee:', value)}
            />
          </div>

          {/* Top Clients by Revenue */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-lg font-medium">Top Clients by Revenue</h4>
              {isEditMode && (
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Table
                </Button>
              )}
            </div>
            <SortableTable
              data={topClientsData}
              columns={topClientsColumns}
              defaultSortKey="annualRevenue"
              defaultSortDirection="desc"
            />
          </div>
        </section>
      )}

      {/* Risk and Opportunity */}
      {shouldRenderSection('risk-and-opportunity-title') && (
        <section aria-labelledby="risk-and-opportunity-title">
          <div className="flex justify-between items-center mb-4">
            <h3
              id="risk-and-opportunity-title"
              className="text-xl font-medium"
            >
              Risk and Opportunity
            </h3>
            {isEditMode && (
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Risk/Opportunity
              </Button>
            )}
          </div>

          <div className="grid gap-6">
            {/* Risk Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <EditableMetricCard
                title="At-Risk Revenue"
                value="$184K"
                description="3 clients (7% of book)"
                cardClassName="border-red-200"
                titleClassName="text-red-600"
                valueClassName="text-red-600"
                editable={isEditMode}
                onEdit={(value) => console.log('Edit at-risk revenue:', value)}
              />

              <EditableMetricCard
                title="Growth Potential"
                value="$156K"
                description="5 opportunities identified"
                cardClassName="border-green-200"
                titleClassName="text-green-600"
                valueClassName="text-green-600"
                editable={isEditMode}
                onEdit={(value) => console.log('Edit growth potential:', value)}
              />

              <EditableMetricCard
                title="Action Required"
                value="8"
                description="Clients need attention"
                cardClassName="border-orange-200"
                titleClassName="text-orange-600"
                valueClassName="text-orange-600"
                editable={isEditMode}
                onEdit={(value) => console.log('Edit action required:', value)}
              />

              <EditableMetricCard
                title="Stable Clients"
                value="32"
                description="74% of client base"
                cardClassName="border-blue-200"
                titleClassName="text-blue-600"
                valueClassName="text-blue-600"
                editable={isEditMode}
                onEdit={(value) => console.log('Edit stable clients:', value)}
              />
            </div>
          </div>
        </section>
      )}

      {/* Modals */}
      <AddInsightModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSubmit={async (data) => {
          await createInsight(data);
          refetchOverview();
          refetchRevenue();
          refetchRisk();
        }}
        clients={mockClients}
        defaultCategory={addModalCategory}
        defaultClientId={clientId}
      />

      <EditInsightModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSubmit={async (id, data) => {
          await updateInsight(id, data);
          refetchOverview();
          refetchRevenue();
          refetchRisk();
        }}
        onDelete={async (id) => {
          await deleteInsight(id);
          refetchOverview();
          refetchRevenue();
          refetchRisk();
        }}
        insight={selectedInsight}
      />
    </div>
  );
}

// Helper component for editable metric cards
interface EditableMetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  editable?: boolean;
  cardClassName?: string;
  titleClassName?: string;
  valueClassName?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

function EditableMetricCard({
  title,
  value,
  description,
  editable = false,
  cardClassName = "",
  titleClassName = "",
  valueClassName = "",
  onEdit,
  onDelete,
}: EditableMetricCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Card className={cn(cardClassName, "relative group")}>
      {editable && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={onEdit}
            >
              <Edit className="h-3 w-3" />
            </Button>
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                onClick={onDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}
      
      <CardHeader className="pb-2">
        <CardTitle className={cn("text-base", titleClassName)}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn("text-3xl font-bold", valueClassName)}>
          {value}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}