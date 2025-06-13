import dynamic from 'next/dynamic';

// Dynamically import the Outstanding Quotes page from broker-portal app
const OutstandingQuotesPage = dynamic(
  () => import('../../../../../broker-portal/app/outstanding-quotes/page'),
  { ssr: false }
);

export default function BrokerPortalOutstandingQuotes() {
  return <OutstandingQuotesPage />;
}