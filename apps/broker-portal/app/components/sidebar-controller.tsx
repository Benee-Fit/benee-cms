'use client';

import { usePathname } from 'next/navigation';
import { useSidebar } from '@repo/design-system/components/ui/sidebar';
import { useEffect } from 'react';

export function SidebarController() {
  const { setOpen } = useSidebar();
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const shouldShowSidebar = !isHomePage && 
    !pathname.includes('/clients') && 
    !pathname.includes('/upload-documents');
  
  // Hide sidebar on home page and certain pages, show it on subpages
  useEffect(() => {
    setOpen(shouldShowSidebar);
  }, [setOpen, shouldShowSidebar]);
  
  return null; // This is a utility component that doesn't render anything
}
