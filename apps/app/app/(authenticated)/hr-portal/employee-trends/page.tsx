import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Employee Trends | HR Portal',
  description: 'Analyze workforce and coverage patterns',
};

export default function EmployeeTrendsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Employee Trends</h1>
      </div>
      
      <div className="rounded-md border border-dashed p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Employee Analytics Dashboard</h2>
        <p className="text-muted-foreground">
          This section will display workforce analytics, coverage patterns, and demographic insights.
        </p>
      </div>
    </div>
  );
}
