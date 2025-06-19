import { auth } from '@repo/auth/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get auth data
    const { userId, sessionClaims } = await auth();
    
    // Check if user is authenticated
    if (!userId) {
      // Not authenticated - send to sign-in
      return NextResponse.redirect(new URL('/sign-in', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
    }
    
    // Debug all available session data
    console.log('Session data:', JSON.stringify({
      userId,
      claims: sessionClaims,
    }, null, 2));
    
    // Extract user roles - handle potential structure differences
    let userRoles: string[] = [];
    
    if (sessionClaims?.org_role) {
      // If org_role exists and is an array, use it
      if (Array.isArray(sessionClaims.org_role)) {
        userRoles = sessionClaims.org_role
          .filter(role => typeof role === 'string')
          .map(role => (role as string).toLowerCase().replace(/ /g, '_'))
          .filter(Boolean);
      } 
      // If org_role is a string, convert it to an array
      else if (typeof sessionClaims.org_role === 'string') {
        userRoles = [(sessionClaims.org_role as string).toLowerCase().replace(/ /g, '_')];
      }
    }
    
    console.log('Normalized user roles:', userRoles);
    
    // Check if we have any roles to work with
    if (userRoles.length === 0) {
      console.log('No roles found for user - redirecting to default app');
      // No roles found - default to main app
      return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
    }
    
    // Admin, MGA, Senior Broker stay on main app
    if (userRoles.includes('admin') || userRoles.includes('mga') || userRoles.includes('sr_broker')) {
      console.log('Redirecting to main app');
      return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
    }
    
    // Broker role goes to Broker Portal
    if (userRoles.includes('broker')) {
      console.log('Redirecting to broker portal');
      return NextResponse.redirect(new URL('/', 'http://localhost:3006'));
    }
    
    // HR Manager role goes to HR Portal
    if (userRoles.includes('hr_admin')) {
      console.log('Redirecting to HR portal');
      return NextResponse.redirect(new URL('/', 'http://localhost:9002'));
    }
    
    // Default stays on main app
    console.log('No specific role match - redirecting to default app');
    return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  } catch (error) {
    console.error('Error in auth redirect:', error);
    // On error, redirect to main app
    return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  }
}