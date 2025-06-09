'use client';

import { OutstandingQuotes } from '@/app/components/outstanding-quotes';

export default function OutstandingQuotesPage() {
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">Outstanding Quotes</h1>
      <OutstandingQuotes />
    </div>
  );
}
