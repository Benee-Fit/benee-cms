'use client';

import { OutstandingQuotes } from '../components/outstanding-quotes';
import { PageLayout } from '../page-layout';

export default function OutstandingQuotesPage() {
  return (
    <PageLayout>
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Outstanding Quotes</h1>
        <OutstandingQuotes />
      </div>
    </PageLayout>
  );
}
