'use client';

import { useAuth } from "@clerk/nextjs";
import { APP_ACCESS } from "../permissions";

type GlobalNavProps = {
  /**
   * Optional custom styling for the navigation container
   */
  className?: string;
  /**
   * Optional styling for each nav link
   */
  linkClassName?: string;
};

/**
 * Global navigation component that shows links based on user's role permissions
 * Can be used across all applications to provide consistent navigation
 */
export function GlobalNav({ className = "", linkClassName = "" }: GlobalNavProps) {
  const { sessionClaims } = useAuth();
  const userRoles = (sessionClaims?.org_role as string[]) || [];
  
  // Ensure roles are in the lowercase format used in permissions.ts
  const normalizedUserRoles = userRoles.map(role => role.toLowerCase().replace(/ /g, '_'));
  
  // Check which applications the user can access
  const canAccessMainApp = APP_ACCESS.MAIN_APP.some(role => normalizedUserRoles.includes(role));
  const canAccessBrokerPortal = APP_ACCESS.BROKER_PORTAL.some(role => normalizedUserRoles.includes(role));
  const canAccessHRPortal = APP_ACCESS.HR_PORTAL.some(role => normalizedUserRoles.includes(role));
  
  // Get application URLs from environment variables, with fallbacks for local development
  const mainAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const brokerUrl = process.env.NEXT_PUBLIC_BROKER_URL || 'http://localhost:3001';
  const hrUrl = process.env.NEXT_PUBLIC_HR_URL || 'http://localhost:3002';
  
  // Default link styling if none provided
  const defaultLinkClass = linkClassName || "text-sm font-medium text-gray-700 hover:text-gray-900 hover:underline px-3 py-2";
  
  return (
    <nav className={`flex items-center space-x-2 ${className}`}>
      {canAccessMainApp && (
        <a href={mainAppUrl} className={defaultLinkClass}>
          Main App
        </a>
      )}
      
      {canAccessBrokerPortal && (
        <a href={brokerUrl} className={defaultLinkClass}>
          Broker Portal
        </a>
      )}
      
      {canAccessHRPortal && (
        <a href={hrUrl} className={defaultLinkClass}>
          HR Portal
        </a>
      )}
    </nav>
  );
}
