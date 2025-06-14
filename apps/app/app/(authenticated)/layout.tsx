import { env } from '@/env';
import { auth, currentUser } from '@repo/auth/server';
import { AppHeader } from '@repo/design-system';
import { NotificationsProvider } from '@repo/notifications/components/provider';
import { secure } from '@repo/security';
import type { ReactNode } from 'react';
import { OrganizationCheck } from './components/organization-check';
import { PostHogIdentifier } from './components/posthog-identifier';

type AppLayoutProperties = {
  readonly children: ReactNode;
};

const AppLayout = async ({ children }: AppLayoutProperties) => {
  if (env.ARCJET_KEY) {
    await secure(['CATEGORY:PREVIEW']);
  }

  const user = await currentUser();
  const { redirectToSignIn } = await auth();

  if (!user) {
    return redirectToSignIn();
  }

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
    <NotificationsProvider userId={user.id}>
      <OrganizationCheck>
        <div className="flex min-h-screen flex-col">
        <AppHeader
          portalName="Benee-fit Apps"
          navItems={navItems}
          actionButtons={actionButtons}
          afterSignOutUrl="/sign-in"
        />
        <div className="flex-grow p-4">
          <div className="bg-muted/50 flex-1 min-h-[50vh] md:min-h-min rounded-xl p-6">
            {children}
          </div>
        </div>
        <PostHogIdentifier />
      </div>
      </OrganizationCheck>
    </NotificationsProvider>
  );
};

export default AppLayout;
