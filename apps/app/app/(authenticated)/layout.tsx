import { env } from '@/env';
import { auth, currentUser } from '@repo/auth/server';
import { AppHeader } from '@repo/design-system';
import { NotificationsProvider } from '@repo/notifications/components/provider';
import { secure } from '@repo/security';
import type { ReactNode } from 'react';
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
  { href: '/quote-tool/document-parser', label: 'Quote Tool' },
  { href: '/broker-portal', label: 'Broker Portal' },
  { href: 'https://hr-portal.beneefitapp.com', label: 'HR Portal' }
];

return (
  <NotificationsProvider userId={user.id}>
    <div className="flex min-h-screen flex-col">
      <AppHeader 
        portalName="Benee-fit Apps" 
        navItems={navItems} 
        afterSignOutUrl="/sign-in" 
      />
      <div className="flex-grow p-4">
        <div className="bg-muted/50 flex-1 min-h-[50vh] md:min-h-min rounded-xl p-6">
          {children}
        </div>
      </div>
      <PostHogIdentifier />
    </div>
  </NotificationsProvider>
);
};

export default AppLayout;
