'use client';

import { ClientInsights } from '@/app/components/client-insights';

export default function ClientInsightsPage() {
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">Client Insights</h1>
      <ClientInsights />
    </div>
  );
}
