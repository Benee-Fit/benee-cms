'use client';

import { SignedIn, UserButton } from '@repo/auth/client';
import { Button } from './button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from './sheet';
import { Briefcase, Menu, Plus } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

type ActionButtonProps = {
  href: string;
  label: string;
  icon?: ReactNode;
};

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
   * Action buttons to be displayed prominently in the header
   */
  actionButtons?: ActionButtonProps[];
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
  actionButtons = [],
  afterSignOutUrl = '/sign-in',
  additionalElements 
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold text-primary"
          >
            <Briefcase className="h-6 w-6" />
            <span>{portalName}</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
          <SignedIn>
            <nav className="flex items-center space-x-1 lg:space-x-3 mr-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary rounded-md hover:bg-secondary/50"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            
            {/* Action Buttons */}
            {actionButtons.length > 0 && (
              <div className="flex items-center space-x-2 border-l pl-2 ml-2">
                {actionButtons.map((button) => (
                  <Button key={button.href} size="sm" asChild className="h-9">
                    <Link href={button.href}>
                      {button.icon || <Plus className="h-4 w-4 mr-1" />}
                      {button.label}
                    </Link>
                  </Button>
                ))}
              </div>
            )}
            
            {additionalElements}
          </SignedIn>
          <div className="ml-4 flex items-center">
            <UserButton afterSignOutUrl={afterSignOutUrl} />
          </div>
        </div>

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
              <nav className="grid gap-4 text-base font-medium mt-6">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-lg font-semibold text-primary mb-2"
                >
                  <Briefcase className="h-5 w-5" />
                  <span>{portalName}</span>
                </Link>
                
                {/* Action Buttons (mobile) */}
                {actionButtons.length > 0 && (
                  <div className="flex flex-col gap-2 py-2">
                    {actionButtons.map((button) => (
                      <Button key={button.href} size="sm" asChild className="w-full justify-start">
                        <Link href={button.href}>
                          {button.icon || <Plus className="h-4 w-4 mr-2" />}
                          {button.label}
                        </Link>
                      </Button>
                    ))}
                  </div>
                )}
                
                <div className="border-t pt-2 mt-2"></div>
                
                {/* Navigation links (mobile) */}
                <div className="grid gap-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="px-2 py-1.5 text-muted-foreground hover:text-primary hover:bg-secondary/50 rounded-md"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
                
                <div className="pt-4 border-t mt-auto flex items-center justify-between">
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
