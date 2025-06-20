import { createMetadata } from '@repo/seo/metadata';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';
import { currentUser } from '@repo/auth/server';

const title = 'Welcome back';
const description = 'Enter your details to sign in.';
const SignIn = dynamic(() =>
  import('@repo/auth/components/sign-in').then((mod) => mod.SignIn)
);

export const metadata: Metadata = createMetadata({ title, description });

const SignInPage = async () => {
  // Check if user is already signed in
  const user = await currentUser();
  
  // If user is already authenticated, redirect to dashboard
  if (user) {
    redirect('/dashboard');
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
