'use client';

import { RevenueBreakdown } from "../components/revenue-breakdown";

export default function RevenueBreakdownPage() {
  return (
    <div className="container p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Revenue Breakdown</h1>
      <RevenueBreakdown />
    </div>
  );
}
