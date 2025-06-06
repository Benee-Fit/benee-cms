'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { cn } from '@repo/design-system/lib/utils';
import { BarChart, PieChart } from 'recharts';
import { Alert, AlertDescription } from '@repo/design-system/components/ui/alert';
import { InfoIcon } from 'lucide-react';

interface IndustryInsightProps {
  className?: string;
}

export function IndustryInsight({ className }: IndustryInsightProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Industry Insight feature is currently being built. Check back soon for industry-wide analytics and comparisons.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Industry Comparisons</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Industry comparisons will be available in the next update. This will include benchmark data
              across different sectors, company sizes, and regions.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Market Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Market trends analytics will provide insights on premium shifts, carrier market share,
              and emerging product offerings across the industry.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
