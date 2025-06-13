import dynamic from 'next/dynamic';

// Dynamically import the Client Insights page from broker-portal app
const ClientInsightsPage = dynamic(
  () => import('../../../../../broker-portal/app/client-insights/page'),
  { ssr: false }
);

export default function BrokerPortalClientInsights() {
  return <ClientInsightsPage />;
}