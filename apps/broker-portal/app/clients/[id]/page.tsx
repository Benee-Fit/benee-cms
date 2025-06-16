'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '../../page-layout';
import { ClientDetailView } from '../../../components/client-detail-view';

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [client, setClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch detailed client data
  const fetchClientDetail = async (clientId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/clients/${clientId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch client details');
      }
      const data = await response.json();
      setClient(data);
    } catch (error) {
      console.error('Error fetching client details:', error);
      // If client not found or error, redirect to client list
      router.push('/clients');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back to listing
  const handleBackToListing = () => {
    router.push('/clients');
  };

  useEffect(() => {
    if (resolvedParams.id) {
      fetchClientDetail(resolvedParams.id);
    }
  }, [resolvedParams.id]);

  return (
    <PageLayout>
      <ClientDetailView 
        client={client}
        onBack={handleBackToListing}
        isLoading={isLoading}
      />
    </PageLayout>
  );
}