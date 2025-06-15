'use client';

import { useState } from 'react';
import { ClientInsightsEnhanced } from '../../components/client-insights-enhanced';
import { ClientInsightsAdmin } from '../../components/client-insights-admin';
import { ClientInsights } from '../../components/client-insights';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/design-system/components/ui/tabs';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Database, Eye, Settings, Compare } from 'lucide-react';

export default function ClientInsightsDemoPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Client Insights Demo</h1>
          <p className="text-muted-foreground">
            Compare the original mock data with the new database-backed implementation
          </p>
        </div>
        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
          Demo Environment
        </Badge>
      </div>

      {/* Admin Controls */}
      <ClientInsightsAdmin onDataSeeded={handleDataRefresh} />

      <Tabs defaultValue="enhanced" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="enhanced" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Enhanced (Database)
          </TabsTrigger>
          <TabsTrigger value="original" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Original (Mock Data)
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <Compare className="h-4 w-4" />
            Comparison
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enhanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-green-600" />
                Enhanced Client Insights (Database-Backed)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This version connects to the database and displays real client data with full CRUD capabilities.
              </p>
              <ClientInsightsEnhanced key={refreshKey} editMode={false} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="original" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Original Client Insights (Mock Data)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This is the original implementation with hardcoded mock data for comparison.
              </p>
              <ClientInsights />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🆕 Enhanced Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
                    <span><strong>Real Database Integration:</strong> Connects to PostgreSQL with Prisma ORM</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
                    <span><strong>CRUD Operations:</strong> Create, read, update, and delete insights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
                    <span><strong>Edit Mode:</strong> Toggle between view and edit modes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
                    <span><strong>Time Series Data:</strong> Historical data for charts and trends</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
                    <span><strong>Intelligent APIs:</strong> Smart filtering and aggregation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
                    <span><strong>Optimistic Updates:</strong> Immediate UI feedback</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
                    <span><strong>Auto-refresh:</strong> Real-time data updates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
                    <span><strong>Bulk Operations:</strong> Efficient batch processing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📊 Data Architecture</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                    <span><strong>Flexible Schema:</strong> JSON fields for adaptable data structures</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                    <span><strong>Category-based:</strong> METRIC, REVENUE, RISK, OPPORTUNITY</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                    <span><strong>Multi-tenant:</strong> Isolated data per broker</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                    <span><strong>Audit Trail:</strong> Created/updated timestamps</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                    <span><strong>Performance:</strong> Indexed queries and efficient joins</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                    <span><strong>Scalable:</strong> Handles large datasets efficiently</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🚀 Implementation Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">✅</div>
                  <div className="text-sm font-medium">Database Schema</div>
                  <div className="text-xs text-muted-foreground">2 core models</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">✅</div>
                  <div className="text-sm font-medium">API Routes</div>
                  <div className="text-xs text-muted-foreground">4 intelligent endpoints</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">✅</div>
                  <div className="text-sm font-medium">React Hooks</div>
                  <div className="text-xs text-muted-foreground">Data management</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">✅</div>
                  <div className="text-sm font-medium">UI Components</div>
                  <div className="text-xs text-muted-foreground">Enhanced with editing</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}