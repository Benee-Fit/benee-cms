import { NextResponse } from "next/server";
import { authMiddleware, createRouteMatcher } from '@repo/auth/middleware';
import { 
  USER_ROLES,
  PORTAL_ACCESS,
  hasPortalAccess,
  getRoleBasedRedirectUrl,
  type UserRole
} from '@repo/auth/server';

// Define protected routes
const isProtectedRoute = createRouteMatcher([
  '/',
  '/enrolment(.*)',
  '/dashboard(.*)',
  '/api(.*)',
]);

// This is the exact pattern Clerk expects for middleware
export default authMiddleware(async (auth, req) => {
  // Only protect routes that match our protected routes
  if (isProtectedRoute(req)) {
    const { userId, orgRole } = await auth();
    
    // Check if user is authenticated
    if (!userId) {
      // Redirect to main app's sign-in page
      const mainAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const signInUrl = new URL('/sign-in', mainAppUrl);
      
      // Construct the full URL for the redirect
      // IMPORTANT: Use the public URL from env var, NOT the internal request host
      const hrPortalUrl = process.env.NEXT_PUBLIC_HR_PORTAL_URL || 'http://localhost:9002';
      const fullRedirectUrl = new URL(req.nextUrl.pathname + req.nextUrl.search, hrPortalUrl);
      
      signInUrl.searchParams.set('redirect_url', fullRedirectUrl.toString());
      return NextResponse.redirect(signInUrl);
    }
    
    const userRole = orgRole as UserRole | null;
    
    // Check if user has access to HR portal
    if (!hasPortalAccess(userRole, PORTAL_ACCESS.HR_PORTAL)) {
      // Redirect to appropriate portal based on role
      const redirectUrl = getRoleBasedRedirectUrl(userRole);
      return NextResponse.redirect(new URL(redirectUrl, req.url));
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