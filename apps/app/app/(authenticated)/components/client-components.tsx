'use client';

import * as React from 'react';
import { OrganizationSwitcher, UserButton, OrganizationProfile } from '@repo/auth/client';
import { useEffect, useState } from 'react';

// Simple placeholder for user button during server rendering
const UserButtonPlaceholder = () => (
  <div className="flex overflow-hidden w-full items-center h-9">
    <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
    <div className="h-4 w-24 bg-muted animate-pulse rounded ml-2" />
  </div>
);

// Simple placeholder for organization switcher during server rendering
const OrgSwitcherPlaceholder = () => (
  <div className="flex overflow-hidden w-full items-center h-9">
    <div className="h-6 w-[160px] bg-muted animate-pulse rounded" />
  </div>
);

// Simple placeholder for organization profile during server rendering
const OrgProfilePlaceholder = () => (
  <div className="w-full">
    <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
    <div className="space-y-3">
      <div className="h-4 w-full bg-muted animate-pulse rounded" />
      <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
      <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
    </div>
  </div>
);

/**
 * Client-side only wrapper for Clerk's UserButton
 */
export function ClientUserButton(props: React.ComponentProps<typeof UserButton>) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Show placeholder during SSR
  if (!isClient) {
    return <UserButtonPlaceholder />;
  }
  
  // Only render the actual component on the client
  return <UserButton {...props} />;
}

/**
 * Client-side only wrapper for Clerk's OrganizationSwitcher
 */
export function ClientOrganizationSwitcher(
  props: React.ComponentProps<typeof OrganizationSwitcher>
) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Show placeholder during SSR
  if (!isClient) {
    return <OrgSwitcherPlaceholder />;
  }
  
  // Only render the actual component on the client
  return <OrganizationSwitcher {...props} />;
}

/**
 * Client-side only wrapper for Clerk's OrganizationProfile
 */
export function ClientOrganizationProfile(
  props: React.ComponentProps<typeof OrganizationProfile>
) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Show placeholder during SSR
  if (!isClient) {
    return <OrgProfilePlaceholder />;
  }
  
  // Only render the actual component on the client with full width styling
  return (
    <div className="w-full">
      <OrganizationProfile 
        {...props}
        appearance={{
          elements: {
            rootBox: 'w-full max-w-none',
            card: 'w-full max-w-none',
            navbar: 'w-full',
            navbarMobileMenuRow: 'w-full',
            organizationProfilePage: 'w-full max-w-none',
            pageScrollBox: 'w-full max-w-none',
            ...props.appearance?.elements
          },
          ...props.appearance
        }}
      />
    </div>
  );
}
