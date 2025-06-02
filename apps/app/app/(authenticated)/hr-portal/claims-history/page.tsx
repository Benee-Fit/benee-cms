import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Claims History | HR Portal',
  description: 'View and analyze your claims history and data',
};

export default function ClaimsHistoryPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Claims History</h1>
      </div>
      
      <div className="rounded-md border border-dashed p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Claims History Dashboard</h2>
        <p className="text-muted-foreground">
          This section will display your claims history data, analytics, and reports.
        </p>
      </div>
    </div>
  );
}
