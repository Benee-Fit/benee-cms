'use client';

import { ClientInsights } from '../components/client-insights';
import { PageLayout } from '../page-layout';

export default function ClientInsightsPage() {
  return (
    <PageLayout>
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Client Insights</h1>
        <ClientInsights />
      </div>
    </PageLayout>
  );
}
