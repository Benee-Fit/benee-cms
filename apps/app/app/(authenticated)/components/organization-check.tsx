'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganization, useUser } from '@repo/auth/client';

/**
 * Component that checks if a user is part of an organization
 * If not, redirects them to the onboarding flow
 */
export function OrganizationCheck({ children }: { children: ReactNode }) {
  const { organization } = useOrganization();
  const { isLoaded: isUserLoaded, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Only proceed when user data is loaded
    if (!isUserLoaded) {
      return;
    }
    
    // If user is authenticated but doesn't have an organization, redirect to onboarding
    if (user && !organization) {
      router.push('/onboarding');
    }
  }, [isUserLoaded, user, organization, router]);

  // If we're checking/redirecting, show nothing
  if (isUserLoaded && user && !organization) {
    return null;
  }

  // Otherwise, render children
  return <>{children}</>;
}
