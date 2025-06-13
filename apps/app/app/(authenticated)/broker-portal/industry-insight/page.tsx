import dynamic from 'next/dynamic';

// Dynamically import the Industry Insight page from broker-portal app
const IndustryInsightPage = dynamic(
  () => import('../../../../../broker-portal/app/industry-insight/page'),
  { ssr: false }
);

export default function BrokerPortalIndustryInsight() {
  return <IndustryInsightPage />;
}