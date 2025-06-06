import { env } from '@/env';
import { ClerkProvider } from '@clerk/nextjs';
import { secure } from '@repo/security';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';
import { AppHeader } from './components/layout/AppHeader';

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
            <main className="flex-grow pt-6">{children}</main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
