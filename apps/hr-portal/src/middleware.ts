import { NextResponse } from "next/server";
import { clerkMiddleware } from '@clerk/nextjs/server';

// This is the exact pattern Clerk expects for middleware
export default clerkMiddleware(async (auth, req) => {
  // For all routes, check authentication
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