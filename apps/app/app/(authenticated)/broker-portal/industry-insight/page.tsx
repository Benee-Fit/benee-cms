'use client';

import { IndustryInsight } from "../components/industry-insight";

export default function IndustryInsightPage() {
  return (
    <div className="container p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Industry Insight</h1>
      <IndustryInsight />
    </div>
  );
}
