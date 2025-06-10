'use client';

import { ClientInsights } from '@/app/components/client-insights';
import { usePageTitle } from '@/app/components/layout/PageTitleContext';
import { useEffect } from 'react';

export default function ClientInsightsPage() {
  const { setTitle } = usePageTitle();
  
  useEffect(() => {
    setTitle('Client Insights');
  }, [setTitle]);

  return (
    <div>
      <ClientInsights />
    </div>
  );
}
