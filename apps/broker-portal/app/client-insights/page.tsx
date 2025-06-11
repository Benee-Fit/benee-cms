'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientInsightsPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to overview as the default page
    router.replace('/client-insights/overview');
  }, [router]);

  return null;
}
