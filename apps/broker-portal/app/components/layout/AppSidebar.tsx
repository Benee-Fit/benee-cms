'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { mainNavItems } from '../../../lib/navigation';
import type { NavItem } from '../../../lib/navigation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@repo/design-system/components/ui/collapsible';
import { Button } from '@repo/design-system/components/ui/button';
import { ChevronDown, Home } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

export function AppSidebar() {
  const pathname = usePathname();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  // Function to check if a nav item or any of its subitems is active
  // Memoize the isActive function to prevent unnecessary re-renders
  const isActive = useCallback((item: NavItem): boolean => {
    if (item.href === pathname && item.href !== '/') {
      return true;
    }
    
    return item.subItems?.some((subItem) => 
      pathname === subItem.href || pathname.startsWith(`${subItem.href}/`)
    ) ?? false;
  }, [pathname]);

  // Initialize the open state based on the current path
  useEffect(() => {
    const newOpenItems: Record<string, boolean> = {};
    
    for (const item of mainNavItems) {
      if (item.subItems && item.subItems.length > 0) {
        newOpenItems[item.href] = isActive(item);
      }
    }
    
    setOpenItems(newOpenItems);
  }, [isActive]); // isActive already has pathname in its dependencies

  // Toggle a collapsible section
  const toggleOpen = (href: string) => {
    setOpenItems(prev => ({
      ...prev,
      [href]: !prev[href]
    }));
  };

  return (
    <aside className="w-64 h-[calc(100vh-4rem)] p-4 border-r bg-background text-foreground overflow-y-auto">
      <nav className="flex flex-col space-y-1">
        <Link href="/" className="mb-4">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        {mainNavItems.filter(item => item.href !== '/').map((item) => {
          // If no subitems, render a simple link
          if (!item.subItems || item.subItems.length === 0) {
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                >
                  {item.label}
                </Button>
              </Link>
            );
          }

          // If has subitems, render a collapsible section
          return (
            <Collapsible
              key={item.href}
              open={openItems[item.href]}
              onOpenChange={() => toggleOpen(item.href)}
              className="space-y-1"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant={isActive(item) ? 'secondary' : 'ghost'}
                  className="w-full justify-between"
                >
                  <span>{item.label}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      openItems[item.href] ? 'rotate-180' : ''
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 space-y-1">
                {item.subItems.map((subItem) => (
                  <Link key={subItem.href} href={subItem.href}>
                    <Button
                      variant={pathname === subItem.href ? 'secondary' : 'ghost'}
                      size="sm"
                      className="w-full justify-start text-sm"
                    >
                      {subItem.label}
                    </Button>
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>
    </aside>
  );
}
