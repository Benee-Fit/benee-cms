'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { mainNavItems } from '../../../lib/navigation';
import type { NavItem } from '../../../lib/navigation';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter,
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar
} from '@repo/design-system/components/ui/sidebar';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@repo/design-system/components/ui/collapsible';
import { ChevronDown, Home, Search } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Function to check if a nav item or any of its subitems is active
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
  }, [isActive]);

  // Toggle a collapsible section
  const toggleOpen = (href: string) => {
    setOpenItems(prev => ({
      ...prev,
      [href]: !prev[href]
    }));
  };

  // Close mobile sidebar on navigation
  const handleNavClick = () => {
    setOpenMobile(false);
  };

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const searchParams = new URLSearchParams();
      searchParams.set('search', searchTerm.trim());
      router.push(`/client-list?${searchParams.toString()}`);
      setOpenMobile(false);
      setSearchTerm('');
    }
  };

  return (
    <Sidebar variant="inset" className="top-16">
      <SidebarHeader>
        <Link href="/" onClick={handleNavClick}>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          {mainNavItems.filter(item => item.href !== '/').map((item) => {
            // If no subitems, render a simple menu item
            if (!item.subItems || item.subItems.length === 0) {
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
                    <Link href={item.href} onClick={handleNavClick}>
                      {item.label}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }

            // If has subitems, render a collapsible section
            return (
              <Collapsible
                key={item.href}
                open={openItems[item.href]}
                onOpenChange={() => toggleOpen(item.href)}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={isActive(item)}>
                      <span>{item.label}</span>
                      <ChevronDown
                        className={`ml-auto h-4 w-4 transition-transform duration-200 ${
                          openItems[item.href] ? 'rotate-180' : ''
                        }`}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.subItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.href}>
                          <SidebarMenuSubButton asChild isActive={pathname === subItem.href}>
                            <Link href={subItem.href} onClick={handleNavClick}>
                              {subItem.label}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          })}
        </SidebarMenu>
        
        {/* Search Bar */}
        <div className="mt-4 px-2">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
          </form>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
