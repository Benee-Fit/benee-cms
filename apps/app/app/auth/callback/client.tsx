'use client';

import { useEffect, useState } from 'react';

interface AuthCallbackClientProps {
  redirectUrl: string;
}

export function AuthCallbackClient({ redirectUrl }: AuthCallbackClientProps) {
  const [countdown, setCountdown] = useState(3);
  
  // Determine the portal name based on the redirect URL
  const getPortalName = (url: string) => {
    const brokerUrl = process.env.NEXT_PUBLIC_BROKER_URL || 'http://localhost:3006';
    const hrUrl = process.env.NEXT_PUBLIC_HR_URL || 'http://localhost:9002';
    
    if (url.includes(brokerUrl)) return 'Broker Portal';
    if (url.includes(hrUrl)) return 'HR Portal';
    return 'your application';
  };
  
  const portalName = getPortalName(redirectUrl);
  
  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = redirectUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [redirectUrl]);
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center justify-center space-y-6 p-8">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-semibold text-green-600">Successfully signed in!</h1>
          <p className="text-lg text-muted-foreground">
            Redirecting you to {portalName} in {countdown} seconds...
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-sm text-muted-foreground">Please wait...</span>
        </div>
      </div>
    </div>
  );
}