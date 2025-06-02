'use client';

import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="text-center space-y-6 max-w-md">
            <h1 className="text-5xl font-bold tracking-tight text-primary">Error</h1>
            <h2 className="text-2xl font-semibold">Something went wrong!</h2>
            <p className="text-muted-foreground">
              We apologize for the inconvenience. Please try again or return to the homepage.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              <Button onClick={reset} variant="outline">
                Try Again
              </Button>
              <Button asChild className="gap-2">
                <Link href="/">
                  <Home className="h-4 w-4" />
                  Return to Homepage
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
