import { auth } from '@repo/auth/server';
import { 
  getRoleBasedRedirectUrl, 
  isValidRedirectForRole,
  type UserRole 
} from '@repo/auth/server';
import { redirect } from 'next/navigation';
import { AuthCallbackClient } from './client';

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const { userId, orgRole } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  const userRole = orgRole as UserRole | null;
  const params = await searchParams;
  const requestedRedirectUrl = params.redirect_url;
  
  // Determine the final redirect URL based on user role
  let finalRedirectUrl: string;
  
  if (requestedRedirectUrl && isValidRedirectForRole(userRole, requestedRedirectUrl)) {
    // User has access to the requested URL
    finalRedirectUrl = requestedRedirectUrl;
  } else {
    // Redirect to the highest level portal the user has access to
    finalRedirectUrl = getRoleBasedRedirectUrl(userRole);
  }
  
  // If the final redirect is to the current app, redirect to dashboard
  if (finalRedirectUrl.includes('localhost:3000') || finalRedirectUrl.includes(process.env.NEXT_PUBLIC_APP_URL || '')) {
    redirect('/dashboard');
  }
  
  return <AuthCallbackClient redirectUrl={finalRedirectUrl} />;
}