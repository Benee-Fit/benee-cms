'use client';

import { SignUp as ClerkSignUp } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';

export const SignUp = () => {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect_url');
  
  // If there's a redirect URL from another app, use it as the after sign-up URL
  const afterSignUpUrl = redirectUrl || '/';
  
  return (
    <ClerkSignUp
      appearance={{
        elements: {
          header: 'hidden',
        },
      }}
      signInUrl="/sign-in"
      afterSignUpUrl={afterSignUpUrl}
    />
  );
};
