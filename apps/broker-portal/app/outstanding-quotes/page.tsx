'use client';

import { OutstandingQuotes } from "../components/outstanding-quotes";

export default function OutstandingQuotesPage() {
  return (
    <div className="container p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Outstanding Quotes</h1>
      <OutstandingQuotes />
    </div>
  );
}
