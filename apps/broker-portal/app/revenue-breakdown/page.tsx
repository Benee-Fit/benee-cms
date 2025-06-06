import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Revenue Breakdown - Benee-fit Broker Portal',
  description: 'View and analyze your revenue breakdown',
};

export default function RevenueBreakdownPage() {
  redirect('/revenue-breakdown/overview');
  // The code below is unreachable due to the redirect
}
