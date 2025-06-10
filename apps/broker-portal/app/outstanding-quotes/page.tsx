'use client';

import { OutstandingQuotes } from '@/app/components/outstanding-quotes';
import { usePageTitle } from '@/app/components/layout/PageTitleContext';
import { useEffect } from 'react';

export default function OutstandingQuotesPage() {
  const { setTitle } = usePageTitle();
  
  useEffect(() => {
    setTitle('Outstanding Quotes');
  }, [setTitle]);

  return (
    <div>
      <OutstandingQuotes />
    </div>
  );
}
