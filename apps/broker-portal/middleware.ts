import { NextResponse } from 'next/server';
import { clerkMiddleware } from '@clerk/nextjs/server';

// This is the exact pattern Clerk expects for middleware
export default clerkMiddleware(async (auth, req) => {
  // Check if the route is public (sign-in or sign-up)
  const isPublic =
    req.nextUrl.pathname.startsWith('/sign-in') ||
    req.nextUrl.pathname.startsWith('/sign-up');

  if (isPublic) {
    return NextResponse.next();
  }

  // For non-public routes, protect with authentication
  try {
    await auth.protect();
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