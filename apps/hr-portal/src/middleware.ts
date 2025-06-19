import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define protected routes
const isProtectedRoute = createRouteMatcher([
  '/',
  '/enrolment(.*)',
  '/dashboard(.*)',
  '/api(.*)',
]);

// This is the exact pattern Clerk expects for middleware
export default clerkMiddleware(async (auth, req) => {
  // Only protect routes that match our protected routes
  if (isProtectedRoute(req)) {
    try {
      await auth.protect();
    } catch {
      // Redirect to main app's sign-in page if authentication fails
      const mainAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const signInUrl = new URL('/sign-in', mainAppUrl);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
  }
  
  // For all other routes, let Next.js handle them (including 404s)
  return NextResponse.next();
});

// Configure which routes the middleware applies to
export const config = {
  matcher: [
    // Match all routes except for static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
    
    // Explicitly include important application routes
    '/',
    '/enrolment/:path*',
    '/dashboard/:path*',
    
    // API routes
    '/api/:path*',
  ],
};