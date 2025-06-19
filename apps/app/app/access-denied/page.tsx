'use client';

import { useAuth } from "@clerk/nextjs";
import { APP_ACCESS } from "@repo/auth/permissions";
import Link from "next/link";
import { Button } from "@repo/design-system/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AccessDenied() {
  const { sessionClaims, signOut } = useAuth();
  const userRoles = (sessionClaims?.org_role as string[]) || [];
  
  // Check which apps this user can access
  const canAccessBrokerPortal = APP_ACCESS.BROKER_PORTAL.some(role => userRoles.includes(role));
  const canAccessHRPortal = APP_ACCESS.HR_PORTAL.some(role => userRoles.includes(role));
  
  // Get URLs for other applications based on environment
  const brokerUrl = process.env.NEXT_PUBLIC_BROKER_URL || 'http://localhost:3001';
  const hrUrl = process.env.NEXT_PUBLIC_HR_URL || 'http://localhost:3002';
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
          <p className="text-gray-500">
            You don't have permission to access this application.
          </p>
        </div>
        
        <div className="space-y-4 pt-4">
          <h2 className="font-medium">You can access:</h2>
          
          <div className="space-y-2">
            {canAccessBrokerPortal && (
              <Button asChild variant="outline" className="w-full justify-start">
                <a href={brokerUrl}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go to Broker Portal
                </a>
              </Button>
            )}
            
            {canAccessHRPortal && (
              <Button asChild variant="outline" className="w-full justify-start">
                <a href={hrUrl}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go to HR Portal
                </a>
              </Button>
            )}
            
            {!canAccessBrokerPortal && !canAccessHRPortal && (
              <p className="text-sm text-gray-500 italic">
                No other application access available for your role.
              </p>
            )}
          </div>
          
          <div className="pt-2">
            <Button
              variant="ghost"
              className="w-full text-gray-500"
              onClick={() => signOut()}
            >
              Sign out and try another account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
