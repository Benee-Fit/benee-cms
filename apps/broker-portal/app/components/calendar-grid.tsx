'use client';

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

// Generate mock data for the next 12 months
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

    // Generate random data for demonstration
    return {
      month: monthNames[monthIndex],
      year,
      renewals: Math.floor(Math.random() * 20) + 5, // 5-25 renewals
      headcount: Math.floor(Math.random() * 500) + 200, // 200-700 headcount
      revenue: Math.floor(Math.random() * 100000) + 50000, // $50k-$150k
    };
  });
};

export function CalendarGrid() {
  const calendarData = generateMockData();

  return (
    <div className="space-y-4 p-6 bg-muted/30 rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">12-Month Forecast</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {calendarData.map((month) => (
          <Card
            key={`${month.month}-${month.year}`}
            className="border border-primary/20 h-full"
          >
            <CardHeader className="py-0 px-3 bg-muted/20">
              <CardTitle className="text-lg font-medium">
                {month.month} {month.year}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 border-t">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Renewals</span>
                <span className="font-medium">{month.renewals}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Headcount</span>
                <span className="font-medium">
                  {month.headcount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Revenue</span>
                <span className="font-medium">
                  {formatCurrency(month.revenue)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
