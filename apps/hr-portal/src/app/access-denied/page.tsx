'use client';

import { useAuth } from "@clerk/nextjs";
import { APP_ACCESS } from "@repo/auth/permissions";
import Link from "next/link";

export default function AccessDenied() {
  const { sessionClaims, signOut } = useAuth();
  const userRoles = (sessionClaims?.org_role as string[]) || [];
  
  // Check which apps this user can access
  const canAccessMainApp = APP_ACCESS.MAIN_APP.some(role => userRoles.includes(role));
  const canAccessBrokerPortal = APP_ACCESS.BROKER_PORTAL.some(role => userRoles.includes(role));
  
  // Get URLs for other applications based on environment
  const mainAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const brokerUrl = process.env.NEXT_PUBLIC_BROKER_URL || 'http://localhost:3001';
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold">Access Denied</h1>
          <p className="mt-2 text-gray-600">
            You don't have permission to access the HR Portal.
          </p>
        </div>
        
        <div className="space-y-4">
          <h2 className="font-medium text-lg">You can access:</h2>
          
          <div className="space-y-2">
            {canAccessMainApp && (
              <a 
                href={mainAppUrl}
                className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Go to Main Application
              </a>
            )}
            
            {canAccessBrokerPortal && (
              <a 
                href={brokerUrl}
                className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Go to Broker Portal
              </a>
            )}
            
            {!canAccessMainApp && !canAccessBrokerPortal && (
              <p className="text-sm text-gray-500 italic">
                No other application access available for your role.
              </p>
            )}
          </div>
          
          <div className="pt-4">
            <button
              onClick={() => signOut()}
              className="w-full rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Sign out and try another account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
