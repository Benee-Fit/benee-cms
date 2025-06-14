import '../polyfills';
import { env } from '@/env';
import { ClerkProvider } from '@clerk/nextjs';
import { AppHeader } from '@repo/design-system';
import { secure } from '@repo/security';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';
import { PageLayout } from './components/layout/PageLayout';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Benee-fit Broker Portal',
  description: 'Access your broker tools, analytics, and client management',
};

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  if (env.ARCJET_KEY) {
    await secure(['CATEGORY:PREVIEW']);
  }

  // Define navigation items for the broker portal
  const navItems = [
    { href: 'https://google.ca', label: 'Quoting' },
    { href: '/client-list', label: 'Client List' },
  ];

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <div className="flex min-h-screen flex-col">
            <AppHeader 
              portalName="Benee-fit Broker Portal" 
              navItems={navItems} 
              afterSignOutUrl="/sign-in" 
            />
            <div className="flex-grow">
              <PageLayout>{children}</PageLayout>
            </div>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
