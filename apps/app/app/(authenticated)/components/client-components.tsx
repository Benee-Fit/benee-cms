'use client';

import * as React from 'react';
import { OrganizationSwitcher, UserButton } from '@repo/auth/client';
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
