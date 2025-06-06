'use client';

import { RevenueBreakdown } from '../components/revenue-breakdown';
import { PageLayout } from '../page-layout';

export default function RevenueBreakdownPage() {
  return (
    <PageLayout>
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Revenue Breakdown</h1>
        <RevenueBreakdown />
      </div>
    </PageLayout>
  );
}
