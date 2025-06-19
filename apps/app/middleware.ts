import { authMiddleware } from '@repo/auth/middleware';
import { checkRoleAccess, routeUserByRole } from '@repo/auth/middleware';
import {
  noseconeMiddleware,
  noseconeOptions,
} from '@repo/security/middleware';
import { NextResponse } from 'next/server';

const securityHeaders = noseconeMiddleware(noseconeOptions);

// Enhanced middleware with role-based access control and routing
export default authMiddleware(async (auth, req) => {
  // Check if the route is public
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
    
    // For authenticated users on the root path, redirect based on their role
    if (path === '/') {
      const targetUrl = routeUserByRole(auth);
      const currentUrl = new URL(req.url);
      
      // If the target URL is different from current origin, redirect
      if (!targetUrl.startsWith(currentUrl.origin)) {
        return NextResponse.redirect(targetUrl);
      }
    }
    
    // Check role-based access - only users with appropriate roles can access this app
    const roleCheck = checkRoleAccess(auth, req, 'MAIN_APP', '/access-denied');
    if (roleCheck) return roleCheck;
    
    // Apply security headers
    return securityHeaders();
  } catch (error) {
    // Redirect to sign-in if authentication fails
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
