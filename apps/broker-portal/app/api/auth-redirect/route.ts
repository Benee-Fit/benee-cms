import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export async function GET() {
  const { userId, sessionClaims } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const userRoles = (sessionClaims?.org_role as string[]) || [];
  
  // Broker role stays on broker portal
  if (userRoles.includes('Broker')) {
    redirect('/');
  }
  
  // HR Manager role goes to HR Portal
  if (userRoles.includes('HR Manager')) {
    redirect('http://localhost:9002');
  }
  
  // Admin, MGA, Senior Broker go to Main App
  if (userRoles.includes('Admin') || userRoles.includes('MGA') || userRoles.includes('Senior Broker')) {
    redirect('http://localhost:3000');
  }
  
  // Default to main app
  redirect('http://localhost:3000');
}