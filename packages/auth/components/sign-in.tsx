'use client';

import { SignIn as ClerkSignIn } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';

export const SignIn = () => {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect_url');
  
  // If there's a redirect URL, use the callback page to handle the redirect
  const afterSignInUrl = redirectUrl ? `/auth/callback?redirect_url=${encodeURIComponent(redirectUrl)}` : '/dashboard';
  
  return (
    <ClerkSignIn
      appearance={{
        elements: {
          header: 'hidden',
        },
      }}
      signUpUrl="/sign-up"
      afterSignInUrl={afterSignInUrl}
    />
  );
};
