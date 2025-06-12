'use client';

import { SignedIn, UserButton } from '@repo/auth/client';
import { Button } from './button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from './sheet';
import { Briefcase, Menu } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

export type AppHeaderProps = {
  /**
   * Portal name to be displayed in the header
   */
  portalName: string;
  /**
   * Navigation items to be displayed in the header
   */
  navItems: Array<{ href: string; label: string }>;
  /**
   * URL to redirect to after signing out
   */
  afterSignOutUrl?: string;
  /**
   * Additional elements to render in the header
   */
  additionalElements?: ReactNode;
};

export function AppHeader({ 
  portalName, 
  navItems = [], 
  afterSignOutUrl = '/sign-in',
  additionalElements 
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold text-primary"
        >
          <Briefcase className="h-6 w-6" />
          <span>{portalName}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
          <SignedIn>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
            {additionalElements}
          </SignedIn>
          <div className="ml-4 flex items-center gap-4">
            <UserButton afterSignOutUrl={afterSignOutUrl} />
          </div>
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="grid gap-6 text-lg font-medium mt-6">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-lg font-semibold text-primary mb-4"
                >
                  <Briefcase className="h-6 w-6" />
                  <span>{portalName}</span>
                </Link>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-muted-foreground hover:text-primary"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="pt-4 border-t mt-4 flex items-center justify-between">
                  <span className="text-sm font-medium">Account</span>
                  <UserButton afterSignOutUrl={afterSignOutUrl} />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
