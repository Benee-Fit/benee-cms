import { NextResponse } from 'next/server';
import { clerkMiddleware } from '@clerk/nextjs/server';
import { checkRoleAccess } from '@repo/auth/middleware';

// Enhanced middleware with role-based access control
export default clerkMiddleware(async (auth, req) => {
  // Check if the route is public or an access denied page
  const path = req.nextUrl.pathname;
  const isPublic =
    path === '/sign-in' || path.startsWith('/sign-in/') ||
    path === '/sign-up' || path.startsWith('/sign-up/') ||
    path.startsWith('/access-denied') ||
    path.startsWith('/api/auth-redirect') ||
    path.startsWith('/api/health');

  if (isPublic) {
    return NextResponse.next();
  }

  // For non-public routes, protect with authentication
  try {
    await auth.protect();
    
    // Check role-based access - only users with appropriate roles can access this app
    const roleCheck = checkRoleAccess(auth, req, 'BROKER_PORTAL', '/access-denied');
    if (roleCheck) return roleCheck;
    
    return NextResponse.next();
  } catch (error) {
    // Redirect to sign-in if authentication fails
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }
});

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