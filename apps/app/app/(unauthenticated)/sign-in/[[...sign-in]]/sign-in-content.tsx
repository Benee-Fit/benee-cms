'use client';

import { SignIn } from '@repo/auth/components/sign-in';

type SignInContentProps = {
  title: string;
  description: string;
};

export function SignInContent({ title, description }: SignInContentProps) {
  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <SignIn />
    </>
  );
}
