import { createMetadata } from '@repo/seo/metadata';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';
import { currentUser } from '@repo/auth/server';
import { headers } from 'next/headers';

const title = 'Welcome back';
const description = 'Enter your details to sign in.';
const SignIn = dynamic(() =>
  import('@repo/auth/components/sign-in').then((mod) => mod.SignIn)
);

export const metadata: Metadata = createMetadata({ title, description });

const SignInPage = async () => {
  // Check if user is already signed in
  const user = await currentUser();
  
  // If user is already authenticated, show a message or redirect safely
  if (user) {
    // Just render a message for authenticated users
    // This prevents redirect loops by not redirecting at all if they're already signed in
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-8">
        <h1 className="text-2xl font-bold mb-4">Already Signed In</h1>
        <p className="mb-6 text-center text-muted-foreground">
          You're already signed in to your account.
        </p>
        <a 
          href="/dashboard" 
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Go to Dashboard
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <SignIn />
    </>
  );
};

export default SignInPage;
