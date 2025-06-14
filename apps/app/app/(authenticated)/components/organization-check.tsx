'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@repo/auth/client';

/**
 * Component that checks if a user has completed onboarding
 * If not, redirects them to the onboarding flow
 */
export function OrganizationCheck({ children }: { children: ReactNode }) {
  const { isLoaded: isUserLoaded, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Only proceed when user data is loaded
    if (!isUserLoaded) {
      return;
    }
    
    // Check if user has completed onboarding by looking at their metadata
    const onboardingCompleted = user?.publicMetadata?.onboardingCompleted as boolean;
    
    // If user is authenticated but hasn't completed onboarding, redirect to onboarding
    if (user && !onboardingCompleted) {
      router.push('/onboarding');
    }
  }, [isUserLoaded, user, router]);

  // Check if user needs onboarding
  const onboardingCompleted = user?.publicMetadata?.onboardingCompleted as boolean;
  
  // If we're checking/redirecting, show nothing
  if (isUserLoaded && user && !onboardingCompleted) {
    return null;
  }

  // Otherwise, render children
  return <>{children}</>;
}
