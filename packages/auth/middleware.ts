import { clerkMiddleware } from '@clerk/nextjs/server';
import type { NextRequest, NextResponse } from 'next/server';
import { APP_ACCESS } from './permissions';

// Define auth type for consistent usage
type AuthData = {
  userId?: string | null;
  sessionClaims?: Record<string, unknown>;
};

/**
 * Original Clerk middleware for use in apps with simple auth requirements
 */
// Export unmodified Clerk middleware for simple auth
export const authMiddleware = clerkMiddleware;

/**
 * Checks if user has access to the specified app based on their roles.
 * Returns a redirect Response if access is denied, or undefined if access is allowed.
 */
export function checkRoleAccess(
  auth: { userId?: string | null; sessionClaims?: Record<string, unknown> },
  req: NextRequest,
  appName: keyof typeof APP_ACCESS,
  accessDeniedUrl = '/access-denied'
): Response | undefined {
  if (!auth.userId) {
    return undefined;
  }
  const path = new URL(req.url).pathname;
  if (
    path.startsWith('/api/health') || 
    path.startsWith('/access-denied') ||
    path.startsWith('/sign-in') ||
    path.startsWith('/sign-up')
  ) {
    return undefined;
  }
  const rawUserRoles = auth.sessionClaims?.org_role || [];
  // Normalize roles to lowercase with underscores to match permissions.ts format
  const userRoles = Array.isArray(rawUserRoles) 
    ? rawUserRoles.map(role => typeof role === 'string' ? role.toLowerCase().replace(/ /g, '_') : '').filter(Boolean)
    : [];
  const hasAccess = APP_ACCESS[appName].some(role => userRoles.includes(role));
  if (!hasAccess) {
    return Response.redirect(new URL(accessDeniedUrl, req.url));
  }
  return undefined;
}

/**
 * Routes users to their appropriate application based on their role
 * This is used after sign-in to direct users to the right application
 */
export function routeUserByRole(auth: AuthData): string {
  if (!auth.userId) { return '/'; }
  
  const rawUserRoles = auth.sessionClaims?.org_role || [];
  // Normalize roles to lowercase with underscores to match permissions.ts format
  const userRoles = Array.isArray(rawUserRoles) 
    ? rawUserRoles.map(role => typeof role === 'string' ? role.toLowerCase().replace(/ /g, '_') : '').filter(Boolean)
    : [];
  
  // Get URLs from environment variables with fallbacks
  const mainAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const brokerUrl = process.env.NEXT_PUBLIC_BROKER_URL || 'http://localhost:3006';
  const hrUrl = process.env.NEXT_PUBLIC_HR_URL || 'http://localhost:9002';
  
  // Broker role always goes to Broker Portal
  if (userRoles.includes('broker')) {
    return brokerUrl;
  }
  
  // HR Manager role goes to HR Portal
  if (userRoles.includes('hr_admin')) {
    return hrUrl;
  }
  
  // Admin, MGA, Senior Broker go to Main App
  if (userRoles.includes('admin') || userRoles.includes('mga') || userRoles.includes('sr_broker')) {
    return mainAppUrl;
  }
  
  // Default to main app
  return mainAppUrl;
}

/**
 * Creates a middleware for checking if user's role allows access to the app.
 * Role-based auth middleware builder
 * @param appName - The application name to check access for
 * @param accessDeniedUrl - URL to redirect to if access is denied
 * @returns Configured Clerk middleware that checks roles
 */
export function createRoleMiddleware(
  appName: keyof typeof APP_ACCESS,
  accessDeniedUrl = '/access-denied'
) {
  return clerkMiddleware(function(auth, req) {
    return checkRoleAccess(auth, req, appName, accessDeniedUrl);
  });
}
