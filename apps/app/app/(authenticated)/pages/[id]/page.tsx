import { auth } from '@repo/auth/server';
import { database } from '@repo/database';
import { notFound } from 'next/navigation';
import { Header } from '../../components/header';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface PageProperties {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PageProperties) {
  const pageId = Number.parseInt(params.id, 10);
  
  if (Number.isNaN(pageId)) {
    return {
      title: 'Page Not Found',
    };
  }

  const page = await database.page.findUnique({
    where: { id: pageId },
  });

  return {
    title: page?.name || 'Page',
  };
}

export default async function PageDetail({ params }: PageProperties) {
  const pageId = Number.parseInt(params.id, 10);
  
  if (Number.isNaN(pageId)) {
    notFound();
  }

  const { orgId } = await auth();
  if (!orgId) {
    notFound();
  }

  // Fetch the page by ID
  const page = await database.page.findUnique({
    where: { id: pageId },
  });

  if (!page) {
    notFound();
  }

  // Determine page-specific content based on the page name
  let pageContent: ReactNode;
  switch (page.name) {
    case 'Home':
      pageContent = (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">Home Page</h1>
          <p className="text-muted-foreground">
            This is the main landing page for your application.
          </p>
          <div className="grid gap-4 lg:grid-cols-3 md:grid-cols-2">
            <div className="bg-card border p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium">Featured Content</h3>
              <p className="text-sm text-muted-foreground">
                Highlight your best content or most important features here.
              </p>
            </div>
            <div className="bg-card border p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium">Latest Updates</h3>
              <p className="text-sm text-muted-foreground">
                Keep users informed about what's new in your application.
              </p>
            </div>
            <div className="bg-card border p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium">Getting Started</h3>
              <p className="text-sm text-muted-foreground">
                Help new users understand how to use your application effectively.
              </p>
            </div>
          </div>
        </div>
      );
      break;
    case 'Quote':
      pageContent = (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">Quote Generator</h1>
          <p className="text-muted-foreground">
            Generate and manage quotes for your customers.
          </p>
          <div className="bg-card mt-6 p-6 rounded-lg">
            <blockquote className="border-l-4 border-primary italic pl-4">
              "The best way to predict the future is to create it."
              <footer className="mt-2 text-sm text-muted-foreground">— Peter Drucker</footer>
            </blockquote>
          </div>
          <div className="bg-card border p-4 rounded-lg">
            <h3 className="mb-2 text-lg font-medium">Quote Calculator</h3>
            <div className="space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="service">
                  Service Type
                </label>
                <select
                  id="service"
                  className="bg-background border px-3 py-2 rounded-md"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select a service...
                  </option>
                  <option value="basic">Basic Package</option>
                  <option value="standard">Standard Package</option>
                  <option value="premium">Premium Package</option>
                </select>
              </div>
              
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="quantity">
                  Quantity
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  defaultValue="1"
                  className="bg-background border px-3 py-2 rounded-md"
                />
              </div>
              
              <button
                type="button"
                className="bg-primary hover:bg-primary/90 mt-4 px-4 py-2 rounded-md text-white"
              >
                Calculate Quote
              </button>
            </div>
          </div>
        </div>
      );
      break;
    default:
      pageContent = (
        <div className="space-y-6">
          <h1 className="font-bold text-3xl tracking-tight">{page.name}</h1>
          <p className="text-muted-foreground">
            Content for this page has not been created yet.
          </p>
        </div>
      );
  }

  return (
    <>
      <Header
        pages={['Dashboard', 'Pages']}
        page={page.name}
      >
        <Link
          href="/"
          className="bg-primary font-medium hover:bg-primary/90 inline-flex items-center justify-center px-4 py-2 rounded-md text-primary-foreground text-sm"
        >
          Back to Dashboard
        </Link>
      </Header>
      <div className="container mx-auto py-8">
        {pageContent}
      </div>
    </>
  );
}
