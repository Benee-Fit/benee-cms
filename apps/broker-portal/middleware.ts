import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';
import { clerkMiddleware } from '@clerk/nextjs/server';

// Create the Clerk middleware instance
const clerkHandler = clerkMiddleware(async (auth, req) => {
  try {
    await auth.protect();
    return NextResponse.next();
  } catch {
    // Redirect to main app's sign-in page if authentication fails
    const mainAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const signInUrl = new URL('/sign-in', mainAppUrl);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }
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