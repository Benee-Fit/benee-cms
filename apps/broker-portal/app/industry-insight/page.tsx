'use client';

import { redirect } from 'next/navigation';

export default function IndustryInsightPage() {
  // Redirect to the first tab by default
  redirect('/industry-insight/performance');

  // This part will not be reached due to the redirect, but Next.js requires a return for components.
  // It can be null or an empty fragment if the redirect is guaranteed.
  return null;
}
