'use client';

import { SignedIn, UserButton } from '@repo/auth/client';
import { Button } from './button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from './sheet';
import { Heart, Menu, Plus, Shield } from 'lucide-react';
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
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-3 text-lg font-bold text-primary group hover:opacity-80 transition-opacity"
          >
            <div className="relative">
              <Shield className="h-7 w-7 text-blue-600" />
              <Heart className="h-3 w-3 text-red-500 absolute top-1 left-2" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                {portalName.split(' ')[0]}
              </span>
              {portalName.split(' ').length > 1 && (
                <span className="text-xs text-muted-foreground font-medium -mt-1">
                  {portalName.split(' ').slice(1).join(' ')}
                </span>
              )}
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
          <SignedIn>
            <nav className="flex items-center space-x-1 lg:space-x-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative px-4 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:text-slate-900 rounded-lg hover:bg-slate-50/80 group"
                >
                  <span className="relative z-10">{item.label}</span>
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </Link>
              ))}
            </nav>
            
            {/* Action Buttons */}
            {actionButtons.length > 0 && (
              <div className="flex items-center space-x-3 border-l border-border/40 pl-6 ml-4">
                {actionButtons.map((button) => (
                  <Button 
                    key={button.href} 
                    size="sm" 
                    asChild 
                    className="h-10 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm transition-all duration-200 hover:shadow-md"
                  >
                    <Link href={button.href}>
                      {button.icon || <Plus className="h-4 w-4 mr-2" />}
                      <span className="font-medium">{button.label}</span>
                    </Link>
                  </Button>
                ))}
              </div>
            )}
            
            {additionalElements}
          </SignedIn>
          <div className="ml-6 flex items-center">
            <div className="p-1 rounded-full bg-slate-50/80 border border-border/40">
              <UserButton afterSignOutUrl={afterSignOutUrl} />
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-3">
          {/* Mobile action button */}
          {actionButtons.length > 0 && (
            <Button 
              size="sm" 
              asChild 
              className="h-9 px-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm"
            >
              <Link href={actionButtons[0].href}>
                {actionButtons[0].icon || <Plus className="h-4 w-4 mr-1" />}
                <span className="hidden xs:inline font-medium">{actionButtons[0].label}</span>
              </Link>
            </Button>
          )}
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 border-border/40">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-border/40 bg-slate-50/50">
                  <Link
                    href="/"
                    className="flex items-center gap-3 text-lg font-bold text-primary group hover:opacity-80 transition-opacity"
                  >
                    <div className="relative">
                      <Shield className="h-6 w-6 text-blue-600" />
                      <Heart className="h-2.5 w-2.5 text-red-500 absolute top-1 left-1.5" />
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                        {portalName.split(' ')[0]}
                      </span>
                      {portalName.split(' ').length > 1 && (
                        <span className="text-xs text-muted-foreground font-medium -mt-1">
                          {portalName.split(' ').slice(1).join(' ')}
                        </span>
                      )}
                    </div>
                  </Link>
                </div>
                
                {/* Navigation Content */}
                <div className="flex-1 p-6">
                  {/* Action Buttons (mobile) */}
                  {actionButtons.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Actions</h3>
                      <div className="flex flex-col gap-2">
                        {actionButtons.map((button) => (
                          <Button 
                            key={button.href} 
                            size="sm" 
                            asChild 
                            className="w-full justify-start h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                          >
                            <Link href={button.href}>
                              {button.icon || <Plus className="h-4 w-4 mr-3" />}
                              <span className="font-medium">{button.label}</span>
                            </Link>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Navigation links (mobile) */}
                  {navItems.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Navigation</h3>
                      <div className="space-y-1">
                        {navItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center px-3 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors group"
                          >
                            <span className="font-medium">{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Footer */}
                <div className="p-6 border-t border-border/40 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Account</span>
                    <div className="p-1 rounded-full bg-white border border-border/40">
                      <UserButton afterSignOutUrl={afterSignOutUrl} />
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
