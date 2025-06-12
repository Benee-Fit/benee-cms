import { env } from '@/env';
import { auth } from '@repo/auth/server';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { ClientInsights } from '@repo/broker-portal';

const title = 'Benee-fit Apps';
const description = 'Insurance broker tools and client management platform.';

const CollaborationProvider = dynamic(() =>
  import('./components/collaboration-provider').then(
    (mod) => mod.CollaborationProvider
  )
);

export const metadata: Metadata = {
  title,
  description,
};

const App = async () => {
  const { orgId } = await auth();

  if (!orgId) {
    notFound();
  }

  return (
    <>
      {env.LIVEBLOCKS_SECRET ? (
        <CollaborationProvider orgId={orgId}>
          <ClientInsights />
        </CollaborationProvider>
      ) : (
        <ClientInsights />
      )}
    </>
  );
};

export default App;