'use client';

import dynamic from 'next/dynamic';

// Dynamically import the Revenue Breakdown page from broker-portal app
const RevenueBreakdownPage = dynamic(
  () => import('../../../../../broker-portal/app/revenue-breakdown/page'),
  { ssr: false }
);

export default function BrokerPortalRevenueBreakdown() {
  return <RevenueBreakdownPage />;
}