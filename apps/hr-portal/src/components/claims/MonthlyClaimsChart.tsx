"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import { MonthlyClaimsData } from "@/services/claimsService";

interface MonthlyClaimsChartProps {
  data: MonthlyClaimsData[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  onChartClick?: () => void;
}

export function MonthlyClaimsChart({
  data,
  isLoading,
  error,
  onRetry,
  onChartClick,
}: MonthlyClaimsChartProps) {
  if (isLoading) {
    return <LoadingState type="chart" />;
  }

  if (error) {
    return (
      <ErrorState
        title="Error loading monthly claims data"
        message={error.message}
        onRetry={onRetry}
      />
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="p-4">
        <CardTitle className="text-xl">Monthly Claims & Premiums</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[350px]">{/* Set explicit fixed height */}
          <ChartContainer style={{ height: '350px', width: '100%' }}
            config={{
              premiums: {
                label: "Premiums",
                color: "#333333",
              },
              claims: {
                label: "Claims",
                color: "#777777",
              },
            }}
          >
              <BarChart
                width={800}
                height={200}
                data={data}
                margin={{
                  top: 10,
                  right: 0,
                  left: 0,
                  bottom: 5,
                }}
                onClick={() => onChartClick && onChartClick()}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip
                  content={
                    <ChartTooltipContent formatter={(value) => `$${value.toLocaleString()}`} />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="premiums" fill="#333333" cursor="pointer" />
                <Bar dataKey="claims" fill="#777777" cursor="pointer" />
              </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
