import { authMiddleware, createRouteMatcher } from '@repo/auth/middleware';
import { 
  USER_ROLES,
  PORTAL_ACCESS,
  hasPortalAccess,
  getRoleBasedRedirectUrl,
  type UserRole
} from '@repo/auth/server';
import { NextResponse } from 'next/server';
import type { NextMiddleware } from 'next/server';



// Define public routes
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

// Define protected routes that require specific roles
const requiresAdminOrHigher = createRouteMatcher([
  '/admin(.*)',
  '/settings/organization(.*)',
  '/settings/billing(.*)',
]);

export default authMiddleware(async (auth, req) => {

  
  // Check if route is public
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  // Get auth info
  const { userId, orgRole, redirectToSignIn } = await auth();
  
  // Require authentication
  if (!userId) {
    return redirectToSignIn();
  }
  
  const userRole = orgRole as UserRole | null;
  
  // Check if user has access to main app
  if (!hasPortalAccess(userRole, PORTAL_ACCESS.MAIN_APP)) {
    // Redirect to appropriate portal based on role
    const redirectUrl = getRoleBasedRedirectUrl(userRole);
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }
  
  // Additional role checks for admin routes
  if (requiresAdminOrHigher(req)) {
    const isAdminOrHigher = userRole === USER_ROLES.ADMIN || 
                           userRole === USER_ROLES.MGA || 
                           userRole === USER_ROLES.SENIOR_BROKER;
    
    if (!isAdminOrHigher) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }
  
  return NextResponse.next();
}) as unknown as NextMiddleware;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
