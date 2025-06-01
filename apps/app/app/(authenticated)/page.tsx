import { env } from '@/env';
import { auth } from '@repo/auth/server';
import { database } from '@repo/database';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { AvatarStack } from './components/avatar-stack';
import { Cursors } from './components/cursors';
import { Header } from './components/header';

const title = 'Acme Inc';
const description = 'My application.';

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
  const pages = await database.page.findMany();

  const { orgId } = await auth();

  if (!orgId) {
    notFound();
  }

  return (
    <>
      <Header pages={['Dashboard']} page="Pages">
        {env.LIVEBLOCKS_SECRET && (
          <CollaborationProvider orgId={orgId}>
            <AvatarStack />
            <Cursors />
          </CollaborationProvider>
        )}
      </Header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {pages.map((page) => (
            <a 
              href={`/pages/${page.id}`} 
              key={page.id} 
              className="aspect-video flex flex-col items-center justify-center gap-2 rounded-xl bg-muted/50 p-4 transition-colors hover:bg-muted"
            >
              <div className="text-xl font-medium">{page.name}</div>
              <div className="text-sm text-muted-foreground">ID: {page.id}</div>
            </a>
          ))}
        </div>
        <div className="bg-muted/50 flex-1 min-h-[50vh] md:min-h-min rounded-xl" />
      </div>
    </>
  );
};

export default App;
