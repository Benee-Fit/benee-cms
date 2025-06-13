import { auth } from '@repo/auth/server';
import { notFound } from 'next/navigation';
import { HubDashboard } from './components/hub-dashboard';

const App = async () => {
  const { orgId } = await auth();

  if (!orgId) {
    notFound();
  }

  return (
    <>
      <HubDashboard />
    </>
  );
};

export default App;
