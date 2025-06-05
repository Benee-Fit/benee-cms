import './polyfill';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { AppHeader } from '@/components/layout/AppHeader';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@repo/auth/provider';

export const metadata: Metadata = {
  title: 'Benee-fit HR Portal',
  description: 'Manage your benefits with Benee-fit HR Portal',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <AuthProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased">
          <div className="flex min-h-screen flex-col">
            <AppHeader />
            <main className="flex-grow">{children}</main>
            {/* Optional: Add a global footer here */}
            {/* <footer className="py-6 md:px-8 md:py-0 border-t">
              <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                  &copy; {new Date().getFullYear()} Benee-fit HR Portal. All rights reserved.
                </p>
              </div>
            </footer> */}
          </div>
          <Toaster />
        </body>
      </html>
    </AuthProvider>
  );
}
