import { redirect } from 'next/navigation';

// Redirect to main dashboard since broker portal is now the default landing page
export default function BrokerPortalPage() {
  redirect('/');
}