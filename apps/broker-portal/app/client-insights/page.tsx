'use client';

import { ClientInsights } from "../components/client-insights";

export default function ClientInsightsPage() {
  return (
    <div className="container p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Client Insights</h1>
      <ClientInsights />
    </div>
  );
}
