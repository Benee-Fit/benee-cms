import { redirect } from 'next/navigation';
import { currentUser } from '@repo/auth/server';

export default async function RootPage() {
  const user = await currentUser();
  
  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/sign-in');
  }
}