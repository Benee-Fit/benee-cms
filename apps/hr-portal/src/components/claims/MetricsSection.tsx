"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import { ClaimsSummary } from "@/services/claimsService";

interface MetricsSectionProps {
  data: ClaimsSummary;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}

export function MetricsSection({
  data,
  isLoading,
  error,
  onRetry,
}: MetricsSectionProps) {
  if (isLoading) {
    return <LoadingState type="metrics" />;
  }

  if (error) {
    return (
      <ErrorState
        title="Error loading metrics data"
        message={error.message}
        onRetry={onRetry}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Premium
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-0 pb-3">
          <p className="text-2xl font-bold">
            ${data.totalPremium.toLocaleString()}
          </p>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Claim
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-0 pb-3">
          <p className="text-2xl font-bold">
            ${data.totalClaim.toLocaleString()}
          </p>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Target Loss Ratio
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-0 pb-3">
          <p className="text-2xl font-bold">{data.targetLossRatio}%</p>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Highest Claim
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-0 pb-3">
          { /* 
          <p className="text-2xl font-bold">
            ${data.highestClaim.toLocaleString()}
          </p>
          */}
          <p className="text-xl font-bold mt-1">
            {data.highestClaimType}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
