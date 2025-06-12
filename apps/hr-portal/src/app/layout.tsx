import './polyfill';
import type { Metadata } from 'next';
import './globals.css';
import { AppHeader } from '@repo/design-system';
import { Toaster } from "@/components/ui/toaster";
import { ClerkProvider } from '@clerk/nextjs';
import type { ReactNode } from 'react';


export const metadata: Metadata = {
  title: 'Benee-fit HR Portal',
  description: 'Manage your benefits with Benee-fit HR Portal',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  // Define navigation items for the HR portal
  const navItems = [
    { href: '/claims-history', label: 'Claims History' },
    { href: '/employee-trends', label: 'Employee Trends' },
    { href: '/enrolment', label: 'Enrolment' },
    { href: '/document-library', label: 'Document Library' },
  ];
  
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased">
          <div className="flex min-h-screen flex-col">
            <AppHeader
              portalName="Benee-fit HR Portal"
              navItems={navItems}
              afterSignOutUrl="/sign-in"
            />
            <main className="flex-grow">
              {children}
            </main>
            {/* Optional: Add a global footer here */}
            {/* <footer className="py-6 md:px-8 md:py-0 border-t">
              <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                  © {new Date().getFullYear()} Benee-fit HR Portal. All rights reserved.
                </p>
              </div>
            </footer> */}
          </div>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
