import { AppHeader } from '@repo/design-system';
import { HubDashboard } from '../(authenticated)/components/hub-dashboard';

export default function DashboardPage() {
  // Define the navigation items for the app header
  const navItems = [
    { href: 'https://broker-portal.benealytics.store', label: 'Broker Portal' },
    { href: 'https://hr-portal.benealytics.store', label: 'HR Portal' },
  ];

  // Define action buttons for the app header
  const actionButtons = [
    { href: '/quote-tool/document-parser', label: 'New Quote' },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        portalName="Benee-fit Apps"
        navItems={navItems}
        actionButtons={actionButtons}
        afterSignOutUrl="/sign-in"
      />
      <div className="flex-grow p-4">
        <div className="bg-muted/50 flex-1 min-h-[50vh] md:min-h-min rounded-xl p-6">
          <HubDashboard />
        </div>
      </div>
    </div>
  );
}