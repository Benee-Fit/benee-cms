import { env } from '@/env';
import { ClerkProvider } from '@clerk/nextjs';
import { secure } from '@repo/security';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';
import { AppHeader } from './components/layout/AppHeader';
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

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <div className="flex min-h-screen flex-col">
            <AppHeader />
            <div className="flex-grow">
              <PageLayout>{children}</PageLayout>
            </div>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
