'use client';

import { usePathname } from 'next/navigation';
import { useSidebar } from '@repo/design-system/components/ui/sidebar';
import { useEffect } from 'react';

export function SidebarController() {
  const { setOpen } = useSidebar();
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  
  // Hide sidebar on home page, show it on subpages
  useEffect(() => {
    setOpen(!isHomePage);
  }, [setOpen, isHomePage]);
  
  return null; // This is a utility component that doesn't render anything
}
