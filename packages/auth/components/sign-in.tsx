import { SignIn as ClerkSignIn } from '@clerk/nextjs';

export const SignIn = () => {
  return (
    <ClerkSignIn
      appearance={{
        elements: {
          header: 'hidden',
        },
      }}
      path="/sign-in"
      signUpUrl="/sign-up"
      redirectUrl="/api/auth-redirect"
      afterSignInUrl="/api/auth-redirect"
    />
  );
};
