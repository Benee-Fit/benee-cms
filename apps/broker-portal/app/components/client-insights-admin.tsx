'use client';

import { useState } from 'react';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Alert, AlertDescription } from '@repo/design-system/components/ui/alert';
import { Loader2, Database, Trash2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface ClientInsightsAdminProps {
  onDataSeeded?: () => void;
}

export function ClientInsightsAdmin({ onDataSeeded }: ClientInsightsAdminProps) {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeedData = async () => {
    try {
      setIsSeeding(true);
      setError(null);
      
      const response = await fetch('/api/client-insights/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      
      if (result.success) {
        setLastResult(result);
        onDataSeeded?.();
      } else {
        throw new Error(result.error || 'Failed to seed data');
      }
    } catch (err) {
      console.error('Error seeding data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to clear all client insights data? This action cannot be undone.')) {
      return;
    }

    try {
      setIsClearing(true);
      setError(null);
      
      const response = await fetch('/api/client-insights/seed', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      
      if (result.success) {
        setLastResult(result);
        onDataSeeded?.();
      } else {
        throw new Error(result.error || 'Failed to clear data');
      }
    } catch (err) {
      console.error('Error clearing data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card className="border-dashed border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Client Insights Data Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Use these tools to populate your client insights with sample data for testing and demonstration purposes.
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {lastResult && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              {lastResult.message}
              {lastResult.created && (
                <div className="mt-2 flex gap-2">
                  <Badge variant="secondary">
                    {lastResult.created.insights} insights
                  </Badge>
                  <Badge variant="secondary">
                    {lastResult.created.timeSeries} time series points
                  </Badge>
                  <Badge variant="secondary">
                    {lastResult.created.clients} clients
                  </Badge>
                </div>
              )}
              {lastResult.deleted && (
                <div className="mt-2">
                  <Badge variant="destructive">
                    {lastResult.deleted} records deleted
                  </Badge>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Button 
            onClick={handleSeedData} 
            disabled={isSeeding || isClearing}
            className="flex-1"
          >
            {isSeeding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Seeding Data...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Seed Sample Data
              </>
            )}
          </Button>

          <Button 
            onClick={handleClearData} 
            disabled={isSeeding || isClearing}
            variant="destructive"
            className="flex-1"
          >
            {isClearing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Data
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p className="font-medium">What seeding does:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Creates metrics, revenue, risk, and opportunity insights for existing clients</li>
            <li>Generates 12 months of historical revenue data for charts</li>
            <li>Analyzes client data to identify risks and opportunities</li>
            <li>Provides realistic test data for all dashboard sections</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}