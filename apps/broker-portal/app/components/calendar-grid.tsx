'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';

// Helper function to format currency values
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Types for the calendar data
type MonthData = {
  month: string;
  year: number;
  renewals: number;
  headcount: number;
  revenue: number;
};

// Generate mock data for the next 12 months using deterministic values
const generateMockData = (): MonthData[] => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Generate data for 12 months starting from current month
  return Array.from({ length: 12 }, (_, index) => {
    const monthIndex = (currentMonth + index) % 12;
    const year = currentYear + Math.floor((currentMonth + index) / 12);

    // Use deterministic values based on month index to avoid hydration mismatch
    const seed = (monthIndex + year) % 12;
    return {
      month: monthNames[monthIndex],
      year,
      renewals: 5 + (seed * 2), // Deterministic: 5-25 renewals
      headcount: 200 + (seed * 45), // Deterministic: 200-695 headcount
      revenue: 50000 + (seed * 8500), // Deterministic: $50k-$143.5k
    };
  });
};

export function CalendarGrid() {
  const [calendarData, setCalendarData] = useState<MonthData[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setCalendarData(generateMockData());
  }, []);

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="w-full bg-muted/30 py-8">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-semibold text-gray-900">12-Month Forecast</h1>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Card key={i} className="bg-card text-card-foreground flex flex-col gap-4 rounded-xl py-0 shadow-sm border border-gray-200 h-full pt-6 animate-pulse">
                <CardHeader className="py-0 px-3">
                  <div className="h-6 bg-gray-200 rounded"></div>
                </CardHeader>
                <CardContent className="p-4 space-y-0 border-t flex flex-col gap-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-muted/30 py-8">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold text-gray-900">12-Month Forecast</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {calendarData.map((month) => (
            <Card
              key={`${month.month}-${month.year}`}
              className="bg-card text-card-foreground flex flex-col gap-4 rounded-xl py-0 shadow-sm border border-gray-200 h-full pt-6"
            >
              <CardHeader className="py-0 px-3">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {month.month} {month.year}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-0 border-t flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Renewals</span>
                  <span className="font-medium text-gray-900">{month.renewals}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Headcount</span>
                  <span className="font-medium text-gray-900">
                    {month.headcount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Revenue</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(month.revenue)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
