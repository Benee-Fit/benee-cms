"use client";

import { useState } from "react";
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
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import { ClaimDetails } from "./ClaimDetails";
import { 
  DivisionClaimsData, 
  PremiumByDivisionData,
  ClaimsSummary 
} from "@/services/claimsService";

interface DivisionChartsProps {
  divisionData: DivisionClaimsData[];
  premiumByDivisionData: PremiumByDivisionData[];
  summary: ClaimsSummary;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  // Add callback for when a division is clicked to navigate to drilldown
  onDivisionSelect?: (division: string) => void;
}

// Monochrome color scheme - different shades of gray from dark to light
const COLORS = ["#333333", "#555555", "#777777", "#999999", "#BBBBBB"];

export function DivisionCharts({
  divisionData,
  premiumByDivisionData,
  summary,
  isLoading,
  error,
  onRetry,
  onDivisionSelect,
}: DivisionChartsProps) {
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LoadingState type="chart" />
        </div>
        <div className="flex flex-col gap-6">
          <LoadingState type="chart" />
          <LoadingState type="chart" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Error loading division data"
        message={error.message}
        onRetry={onRetry}
      />
    );
  }

  const handleBarClick = (data: any) => {
    const divisionName = data.name;
    setSelectedDivision(divisionName);
    
    // If onDivisionSelect is provided, call it to navigate to drilldown view
    if (onDivisionSelect && divisionName) {
      // Map division names to the expected format
      const formattedName = mapDivisionName(divisionName);
      onDivisionSelect(formattedName);
    } else {
      // Otherwise just open details dialog
      setIsDetailsOpen(true);
    }
  };
  
  // Helper function to map division names to the format expected by the Drilldown component
  const mapDivisionName = (name: string): string => {
    // Map API division names to the ones used in the Drilldown component
    const divisionMap: Record<string, string> = {
      'Division 1': 'Division One',
      'Division 2': 'Division Two',
      'Division 3': 'Division Three',
      'All Divisions': 'All'
    };
    
    return divisionMap[name] || name;
  };

  const handlePieClick = (data: any, index: number) => {
    const divisionName = data.name;
    setSelectedDivision(divisionName);
    
    // Similar navigation logic as handleBarClick
    if (onDivisionSelect && divisionName) {
      const formattedName = mapDivisionName(divisionName);
      onDivisionSelect(formattedName);
    } else {
      setIsDetailsOpen(true);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 items-start lg:grid-cols-3 gap-6">
        {/* Claims & Premiums By Division */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="p-4">
            <CardTitle className="text-xl">Claims & Premiums By Division</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[325px]">
              <ChartContainer style={{ height: '325px', width: '100%' }}
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
                    height={400}
                    data={divisionData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                    onClick={(data) => data && handleBarClick(data.activePayload?.[0]?.payload)}
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
            <p className="text-xs text-muted-foreground mt-2 mb-6 text-center">Click on a division to see detailed claims</p>
          </CardContent>
        </Card>

        {/* Right Side - Quoted Premium */}
        
        <div className="flex flex-col gap-6">
          {/* Quoted Premium */}
          <Card className="shadow-sm">
            <CardHeader className="p-4">
              <CardTitle className="text-xl">Quoted Premium</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col items-center">
              <div className="w-full h-[300px] flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart >
                  <Pie
                    data={[{ name: 'Used', value: summary.premiumUsagePercentage }, { name: 'Remaining', value: 100 - summary.premiumUsagePercentage }]}
                    cx="50%"
                    cy="50%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius="40%"
                    outerRadius="60%"
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#333333" />
                    <Cell fill="#f3f4f6" />
                  </Pie>
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-2xl font-bold"
                  >
                    {summary.premiumUsagePercentage}%
                  </text>
                  <text
                    x="50%"
                    y="58%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-sm text-muted-foreground"
                  >
                    usage
                  </text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Claim Details Dialog */}
      <ClaimDetails 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
        divisionName={selectedDivision || undefined}
      />
    </>
  );
}
