'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientListRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new clients route
    router.replace('/clients');
  }, [router]);

  return null;
}