"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
  Cell
} from "recharts";
import { ClaimCategory, Division } from "./ClaimsDrilldown";

interface ChartData {
  category: string;
  amount: number;
  claimCount: number;
  percentage: number;
}

interface ClaimCategoryChartProps {
  data: ChartData[];
  selectedCategory: ClaimCategory;
  selectedDivision: Division;
  onCategorySelect?: (category: ClaimCategory) => void;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded-md shadow-md p-3 text-sm">
        <p className="font-semibold">{data.category}</p>
        <p><span className="text-muted-foreground">Amount:</span> ${data.amount.toLocaleString()}</p>
        <p><span className="text-muted-foreground">Claims:</span> {data.claimCount}</p>
        <p><span className="text-muted-foreground">Percentage:</span> {data.percentage}%</p>
      </div>
    );
  }

  return null;
};

export function ClaimCategoryChart({ 
  data, 
  selectedCategory, 
  selectedDivision,
  onCategorySelect
}: ClaimCategoryChartProps) {
  // Data is already filtered in the parent component based on the selected category

  // No longer using dynamic headings

  // Use different shades of gray for subcategories
  const getBarColor = (index: number) => {
    // Monochrome color scheme - different shades of gray from dark to light
    const monochromeColors = ["#1A1A1A", "#333333", "#555555", "#777777", "#999999", "#BBBBBB", "#DDDDDD"];
    return monochromeColors[index % monochromeColors.length];
  };

  // Handle bar click
  const handleBarClick = (data: any, index: number) => {
    if (onCategorySelect && data.category) {
      // Only trigger if we're in Overall view and there's a category to select
      if (selectedCategory === "Overall") {
        onCategorySelect(data.category as ClaimCategory);
      }
    }
  };

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data} 
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          onClick={(data) => data && data.activePayload && handleBarClick(data.activePayload[0].payload, 0)}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="category" 
            tick={{ fontSize: 12 }}
            interval={0}
            angle={0}
            textAnchor="middle"
            height={30}
          />
          <YAxis 
            tickFormatter={(value) => `$${value/1000}k`}
            label={{ value: 'Total $ Claimed', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* No patterns needed */}
          
          <Bar 
            dataKey="amount" 
            name="Amount" 
            radius={[4, 4, 0, 0]}
            fill={selectedCategory === "Overall" ? "#333333" : undefined}
            fillOpacity={0.9}
            cursor="pointer"
          >
            {selectedCategory !== "Overall" && data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getBarColor(index)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
