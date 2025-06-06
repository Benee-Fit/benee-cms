'use client';

import { IndustryInsight } from '../components/industry-insight';
import { PageLayout } from '../page-layout';

export default function IndustryInsightPage() {
  return (
    <PageLayout>
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Industry Insight</h1>
        <IndustryInsight />
      </div>
    </PageLayout>
  );
}
