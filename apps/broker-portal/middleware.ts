import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';
import { authMiddleware } from '@repo/auth/middleware';
import { 
  USER_ROLES,
  PORTAL_ACCESS,
  hasPortalAccess,
  getRoleBasedRedirectUrl,
  type UserRole
} from '@repo/auth/server';

// Create the Clerk middleware instance
const clerkHandler = authMiddleware(async (auth, req) => {
  const { userId, orgRole } = await auth();
  
  // Check if user is authenticated
  if (!userId) {
    // Redirect to main app's sign-in page
    const mainAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const signInUrl = new URL('/sign-in', mainAppUrl);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }
  
  const userRole = orgRole as UserRole | null;
  
  // Check if user has access to broker portal
  if (!hasPortalAccess(userRole, PORTAL_ACCESS.BROKER_PORTAL)) {
    // Redirect to appropriate portal based on role
    const redirectUrl = getRoleBasedRedirectUrl(userRole);
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }
  
  return NextResponse.next();
});

// Export a custom middleware that checks for static files and non-existent routes
export default function middleware(req: NextRequest, event: NextFetchEvent) {
  const { pathname } = req.nextUrl;
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.includes('.') || // Has file extension
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/_next')
  ) {
    return NextResponse.next();
  }
  
  // For all other routes, use Clerk middleware
  return clerkHandler(req, event);
}

// Configure which routes the middleware applies to
export const config = {
  matcher: [
    // Match all routes except for static files
    '/((?!_next/static|_next/image|favicon.ico).*)',

    // Explicitly include important application routes
    '/',
    '/client-insights/:path*',
    '/industry-insight/:path*',
    '/revenue-breakdown/:path*',
    '/outstanding-quotes/:path*',

    // API routes
    '/api/:path*',
  ],
};