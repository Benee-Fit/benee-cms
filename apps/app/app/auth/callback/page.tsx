import { currentUser } from '@repo/auth/server';
import { redirect } from 'next/navigation';
import { AuthCallbackClient } from './client';

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: { redirect_url?: string };
}) {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }
  
  const redirectUrl = searchParams.redirect_url;
  
  if (!redirectUrl) {
    redirect('/dashboard');
  }
  
  return <AuthCallbackClient redirectUrl={redirectUrl} />;
}