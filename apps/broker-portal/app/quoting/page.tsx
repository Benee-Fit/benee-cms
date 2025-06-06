'use client';

import { PageLayout } from '../page-layout';
import { Alert, AlertDescription } from '@repo/design-system/components/ui/alert';
import { InfoIcon } from 'lucide-react';

export default function QuotingPage() {
  return (
    <PageLayout>
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Quoting</h1>
        
        <Alert className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            The quoting functionality is coming soon. This feature will allow you to create and manage quotes for your clients.
          </AlertDescription>
        </Alert>
      </div>
    </PageLayout>
  );
}
