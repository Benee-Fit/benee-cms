'use client';

import React from 'react';
import { OrganizationSwitcher, UserButton } from '@repo/auth/client';

// Define prop types based on the components
type OrganizationSwitcherProps = React.ComponentProps<typeof OrganizationSwitcher>;
type UserButtonProps = React.ComponentProps<typeof UserButton>;

/**
 * Client-side only wrapper for Clerk's OrganizationSwitcher component
 * This prevents hydration mismatches between server and client rendering
 */
export function ClientOrganizationSwitcher(props: OrganizationSwitcherProps) {
  return <OrganizationSwitcher {...props} />;
}

/**
 * Client-side only wrapper for Clerk's UserButton component
 * This prevents hydration mismatches between server and client rendering
 */
export function ClientUserButton(props: UserButtonProps) {
  return <UserButton {...props} />;
}
